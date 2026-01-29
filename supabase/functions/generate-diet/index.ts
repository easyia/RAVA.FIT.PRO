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

1. RESPEITO AOS ALVOS (OBRIGATÓRIO):
- Você DEVE gerar a dieta respeitando EXATAMENTE os alvos de Calorias e Macros fornecidos no prompt (P: ${body.macros.p}g, C: ${body.macros.c}g, G: ${body.macros.f}g, Total: ${body.target_calories}kcal).
- Não altere estes valores a menos que seja para um ajuste de margem de erro de < 5% para encaixar os alimentos.

2. SINCRONIA DE TREINO (CROSS-DATA):
- Analise o 'training_program' ativo do aluno fornecido abaixo.
- Distribua os carboidratos priorizando as refeições pré e pós-treino com base nos horários sugeridos.
- Justifique como a dieta suporta o volume e a intensidade do treino atual.

3. PRIORIDADE METABÓLICA (ESPORTE):
- Considere o gasto calórico do esporte informado na anamnese ('sport_specialty').
- O aporte de micronutrientes e eletrólitos deve considerar a taxa de sudorese e desgaste do esporte.

4. SUPLEMENTAÇÃO TIER 1 (CIÊNCIA PURA):
- Prescreva apenas suplementos com alto grau de evidência (Creatina, Cafeína, Beta-Alanina, Whey/Proteína isolada).

5. AJUSTE REPARADOR (HORMONAL):
- Verifique o campo 'uses_ergogenics'. Se for 'true', você DEVE considerar o aumento da síntese proteica (alvo proteico já deve estar refletido nos macros fornecidos pelo coach, mas use o racional para justificar).

6. LÓGICA DE EQUIVALÊNCIA E INDEPENDÊNCIA (CRÍTICO):
- Cada refeição DEVE conter obrigatoriamente EXATAMENTE 3 OPÇÕES INDEPENDENTES (Menu A, Menu B, Menu C).
- INDEPENDÊNCIA: Cada 'Opção' deve ser uma refeição COMPLETA por si só, contendo todos os macros (Proteína, Carbo, Gordura). JAMAIS divida os nutrientes entre as opções.
- EQUIVALÊNCIA: Se a refeição alvo tem X calorias, a Opção 1 deve ter ~X kcal, a Opção 2 deve ter ~X kcal e a Opção 3 deve ter ~X kcal. O erro de colocar apenas um ingrediente em uma opção é terminantemente proibido.
- VARIEDADE: Troque as fontes de proteína e carbo entre as opções (ex: Opção 1 Frango, Opção 2 Carne, Opção 3 Peixe/Ovo).

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
        "nome": "string (ex: Almoço)",
        "horario": "string",
        "opcoes": [
          {
            "id": 1,
            "nome_da_opcao": "string (ex: Opção Frango Padrão)",
            "itens": [
              { "alimento": "string", "quantidade": number, "unidade": "string", "carb": number, "prot": number, "gord": number }
            ]
          },
          {
            "id": 2,
            "nome_da_opcao": "string (ex: Opção Carne Vermelha)",
            "itens": [
              { "alimento": "string", "quantidade": number, "unidade": "string", "carb": number, "prot": number, "gord": number }
            ]
          },
          {
            "id": 3,
            "nome_da_opcao": "string (ex: Opção Peixe/Ovos)",
            "itens": [
              { "alimento": "string", "quantidade": number, "unidade": "string", "carb": number, "prot": number, "gord": number }
            ]
          }
        ]
      }
    ],
    "justificativa_bioenergetica": "string (Explique como as 3 opções mantêm a equivalência e suportam o treino)",
    "suplementacao_estrategica": [
      { "suplemento": "string", "dose": "string", "horario": "string", "justificativa_phd": "string" }
    ]
  }
} (Responda APENAS o JSON)`;

    const userPrompt = `
# ALVOS NUTRICIONAIS (DEFINIDOS PELO COACH)
- Calorias Alvo: ${body.target_calories} kcal
- Proteínas: ${body.macros.p}g
- Carboidratos: ${body.macros.c}g
- Gorduras: ${body.macros.f}g

# DADOS DO ALUNO (ANAMNESE)
- Objetivo: ${student.anamnesis?.[0]?.main_goal}
- Peso Atual: ${student.anamnesis?.[0]?.weight_kg}kg | Altura: ${student.anamnesis?.[0]?.height_cm}cm
- Esporte Principal: ${student.anamnesis?.[0]?.sport_specialty || "Não informado"}
- Uso de Hormônios: ${student.anamnesis?.[0]?.uses_ergogenics ? "Sim" : "Não"}
- Detalhes Hormonais: ${student.anamnesis?.[0]?.uses_ergogenics_details || "Nenhum"}
- Intolerâncias: ${student.anamnesis?.[0]?.non_consumed_foods || "Nenhuma relatada"}

# CONTEXTO DE TREINO (Sincronia Ativa)
${training ? `Programa: ${training.title}
Objetivo Treino: ${training.goal}
Sessões de Treino: ${JSON.stringify(training.training_sessions.map((s: any) => ({ nome: s.name, foco: s.focus })))}` : "Nenhum treino ativo registrado ainda."}

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
