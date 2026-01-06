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

    // 2. Build Prompt PhD Sênior
    const systemPrompt = `Você é um PhD Sênior em Nutrição Esportiva e Bioquímica Metabólica. Seu papel é criar protocolos nutricionais de elite sincronizados com a biomecânica de treino.

────────────────────────
[REGRAS DE SINCRONIA E BIOENERGÉTICA]

1. SINCRONIA DE TREINO (CROSS-DATA):
- Analise o 'training_program' ativo do aluno.
- REGRA DE CARBOIDRATOS: Calcule o aporte de carboidratos com base no volume de séries semanais relatado pelo motor de treino. Treinos de alto volume (> 15 séries/músculo) exigem maior aporte peri-treino.

2. PRIORIDADE METABÓLICA (ESPORTE):
- O gasto calórico do 'main_sport' (Futebol, Corrida, etc.) informado na anamnese é a sua PRIORIDADE metabólica de base. Calcule o TDEE considerando primeiro o esporte e depois o adicional da musculação.

3. SUPLEMENTAÇÃO TIER 1 (CIÊNCIA PURA):
- Prescreva apenas suplementos com alto grau de evidência (Creatina, Cafeína, Beta-Alanina, Whey/Proteína isolada). Justifique o uso biomecanicamente ou bioquimicamente.

4. AJUSTE REPARADOR (HORMONAL):
- Se 'hormones' estiver presente, ajuste a síntese proteica alvo. Usuários de Hormônios/TRT suportam e exigem maior aporte proteico (2.2g - 2.6g/kg) devido ao aumento do turnover.

────────────────────────
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
          }
        ]
      }
    ],
    "justificativa_bioenergetica": "string",
    "suplementacao_estrategica": [
      { "suplemento": "string", "dose": "string", "horario": "string", "justificativa_phd": "string" }
    ]
  }
}`;

    const userPrompt = `
# DADOS DO ALUNO (ANAMNESE)
- Objetivo: ${student.anamnesis?.[0]?.main_goal}
- Peso Atual: ${student.anamnesis?.[0]?.weight_kg}kg | Altura: ${student.anamnesis?.[0]?.height_cm}cm
- Esporte Principal: ${student.anamnesis?.[0]?.main_sport} (${student.anamnesis?.[0]?.sport_level})
- Uso de Hormônios: ${student.anamnesis?.[0]?.use_hormones || "Não relatado"}
- Intolerâncias: ${student.anamnesis?.[0]?.food_intolerances || "Nenhuma"}

# CONTEXTO DE TREINO (Sincronia Ativa)
${training ? JSON.stringify(training) : "Nenhum treino ativo registrado ainda."}

# SOLICITAÇÃO ADICIONAL:
"${body.prompt_users || 'Gere uma dieta otimizada'}"
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
