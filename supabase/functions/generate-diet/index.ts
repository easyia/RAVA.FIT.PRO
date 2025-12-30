import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateDietRequest {
  coach_id: string;
  student_id: string;
  target_calories: number;
  macros: {
    p: number;
    c: number;
    f: number;
  };
  prompt_users?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    const body: GenerateDietRequest = await req.json();

    // 1. Fetch Student Data & Latest Training
    const { data: student } = await supabase
      .from("students")
      .select("*, anamnesis(*)")
      .eq("id", body.student_id)
      .single();

    const { data: training } = await supabase
      .from("training_programs")
      .select("*, training_sessions(*, training_exercises(*))")
      .eq("student_id", body.student_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!training) {
        // We still allow generating diet, but the user requested strict workflow. 
        // Although the UI handles this, the AI should know.
    }

    // 2. Build Prompt
    const systemPrompt = `Você é um Nutricionista Esportivo de ELTO NÍVEL especializado em performance e estética física.
PAPEL:
- Assistir treinadores na criação de planos alimentares (dietas) precisos.
- Fornecer 3 OPÇÕES (variantes) de refeições para cada horário (Opção 1, Opção 2, Opção 3).
- Garantir que as calorias e macros totais sejam respeitados em todas as opções.
- Considerar o protocolo de treino atual do aluno para sugerir refeições pré e pós-treino adequadas.

DADOS ALVO:
- Calorias Alvo: ${body.target_calories} kcal
- Proteínas: ${body.macros.p}g
- Carboidratos: ${body.macros.c}g
- Gorduras: ${body.macros.f}g

FORMATO DE RESPOSTA (JSON):
{
  "dieta": {
    "titulo": "string",
    "objetivo": "string",
    "total_calories": number,
    "total_protein": number,
    "total_carbs": number,
    "total_fats": number,
    "refeicoes": [
      {
        "nome": "string",
        "horario": "string",
        "opcoes": [
          {
             "id": 1,
             "itens": [
                { "alimento": "string", "quantidade": number, "unidade": "string", "carb": number, "prot": number, "gord": number }
             ]
          },
          { "id": 2, "itens": [...] },
          { "id": 3, "itens": [...] }
        ]
      }
    ],
    "justificativa": "string",
    "suplementacao_sugerida": ["string"]
  }
}`;

    const userPrompt = `
# DADOS DO ALUNO
- Objetivo: ${student.anamnesis?.[0]?.main_goal}
- Peso: ${student.anamnesis?.[0]?.weight_kg}kg
- Treino Atual: ${training ? training.title : 'Nenhum definido'}
- Detalhes do Treino: ${training ? JSON.stringify(training.training_sessions) : 'N/A'}

# SOLICITAÇÃO ADICIONAL:
"${body.prompt_users || 'Gere uma dieta equilibrada com 3 variações por refeição'}"
    `;

    // 3. Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "OpenAI API Error");

    const generatedDiet = JSON.parse(result.choices[0].message.content);

    return new Response(
      JSON.stringify({ success: true, diet: generatedDiet.dieta }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
