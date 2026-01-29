import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateTrainingRequest {
  coach_id: string; // Renamed from educador_id
  student_id: string; // Renamed from aluno_id
  prompt_users: string; // Renamed from prompt_educador
  parameters?: {
    periodization?: string;
    intensification_methods?: string[];
    workout_split?: string;
  };
  context_file_ids?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    const body: GenerateTrainingRequest = await req.json();

    // 1. Fetch Student Data
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select(`
        *,
        anamnesis(*)
      `)
      .eq("id", body.student_id)
      .single();

    if (studentError) throw new Error("Student not found");

    // 2. Fetch Latest Meal Plan (Synchronization)
    const { data: latestDiet } = await supabase
      .from("meal_plans")
      .select("*, meals(*, meal_foods(*))")
      .eq("student_id", body.student_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2.5 Fetch Latest Postural Analysis (AI Vision Feedback Loop)
    const { data: posturalData } = await supabase
      .from("physical_assessments")
      .select("postural_deviations, ai_analysis_summary")
      .eq("student_id", body.student_id)
      .not("postural_deviations", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2.6 Fetch Last Weekly Feedback (Check-in Loop)
    const { data: lastFeedback } = await supabase
      .from("weekly_feedbacks")
      .select("*")
      .eq("student_id", body.student_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch Context Files
    let contextContent = "";
    if (body.context_file_ids && body.context_file_ids.length > 0) {
      const { data: files } = await supabase
        .from("context_files")
        .select("name, extracted_content")
        .in("id", body.context_file_ids);

      if (files) {
        contextContent = files
          .map((f) => `## ${f.name}\n${f.extracted_content}`)
          .join("\n\n");
      }
    }

    // 4. Build Prompt PhD Sênior
    const systemPrompt = `Você é um PhD Sênior com mais de 30 anos de experiência internacional em Biomecânica de Alta Performance e Fisiologia do Exercício. Seu objetivo é gerar protocolos de elite que maximizem a tensão mecânica preservando a integridade articular.

────────────────────────
[REGRAS DE SINCRONIA E INTELIGÊNCIA]

1. SINCRONIA NUTRICIONAL (CROSS-DATA):
- Analise os dados da dieta ativa do aluno (se fornecida).
- CASO NÃO HAJA DIETA ("Nenhuma dieta ativa registrada ainda"): 
  a) Você DEVE falar apenas sobre como a nutrição DEVERÁ ser ajustada no futuro.
  b) Use termos como "deve ser planejado", "será necessário", "espera-se".
  c) PROIBIDO usar frases como "A dieta está alinhada", "O plano alimentar garante", "A dieta proporciona".
  d) Exemplo correto: "Para o objetivo de emagrecimento, a dieta deverá priorizar um déficit calórico controlado para suportar este volume de treino."
- REGRA DE DÉFICIT: Se o aluno estiver em déficit calórico ou com objetivo de Emagrecimento, reduza o volume séries e mantenha a INTENSIDADE.

2. GESTÃO DE DOR E LESÃO:
- Verifique a 'pain_scale'. Se > 3, identifique a articulação/exercício afetado.
- AÇÃO: Gere automaticamente uma JUSTIFICATIVA de "Zona de Exclusão de Torque" para essa articulação, alterando o exercício ou reduzindo o ROM.

3. ESPECIFICIDADE DE ESPORTE:
- Se 'main_sport' for de alto impacto (Futebol, Corrida), reduza o volume de membros inferiores para evitar sobrecarga excessiva.

4. CAPACIDADE RECUPERATIVA (HORMONAL) - PRIORIDADE MÁXIMA:
- SE o campo 'uses_ergogenics' for 'true' (Verdadeiro), você DEVE OBRIGATORIAMENTE:
  a) IGNORAR qualquer rótulo de 'iniciante' para volume de treino e prescrição de carga.
  b) Tratar o usuário como INTERMEDIÁRIO/AVANÇADO na capacidade de recuperação.
  c) Prescrever volume 20-30% maior do que para um não-hormonizado.
  d) Mencionar explicitamente a modulação hormonal na justificativa.
  e) Usar os detalhes fornecidos em 'ergogenics_details' para contextualizar o suporte à recuperação.
- Hormonizados podem e devem treinar com maior volume e frequência.

5. FREQUÊNCIA E VOLUME:
- Você DEVE gerar EXATAMENTE a quantidade de treinos (Treino A, B, C...) correspondente à 'Frequência Semanal' informada (ex: se 5x, gere A, B, C, D e E).
- Cada treino deve ter um foco claro e ser distribuído nos dias disponíveis.

6. CHECK-IN SEMANAL (DELOAD AUTOMÁTICO):
- Verifique os dados de Feedback Semanal.
- REGRA DELOAD: Se 'fatigue_level' > 8 E 'sleep_quality' < 5, você DEVE gerar uma "Semana de Deload" (Volume/Intensidade reduzidos em 40%). Indique isso no título.
- Se 'has_pain' = true e 'pain_intensity' > 5, EVITE exercícios na região indicada.

7. TAXONOMIA DE GRUPOS MUSCULARES (ESTRITO):
- Ao definir o campo 'grupo_muscular' de cada exercício, você deve usar ESTRITAMENTE um dos seguintes valores (sem acentos para evitar duplicidade):
  * Peito
  * Costas
  * Ombros
  * Pernas (engloba Quadríceps e Posteriores para simplificar o gráfico)
  * Gluteos
  * Biceps
  * Triceps
  * Core (Abdominais e Lombar)
  * Cardio
  * Mobilidade
- Se o exercício for composto (ex: Agachamento), classifique pelo motor primário (Pernas). Se for isolado (ex: Rosca), use o específico (Biceps).
- Proibido usar outros nomes como 'Posteriores', 'Isquiotibiais', 'Femoral', 'Lombar', 'Abdominais', etc. Use apenas a lista acima.

────────────────────────
FORMATO DE RESPOSTA (JSON):
{
  "programa_treino": {
    "titulo": "string",
    "objetivo": "string",
    "nivel": "string",
    "duracao_semanas": number,
    "frequencia_semanal": number,
    "tipo_divisao": "string",
    "observacoes_gerais": "string (Inclua Racional PhD e Sincronia Dieta-Treino)"
  },
  "adaptacoes_lesoes": [
    { "lesao": "string", "exercicios_evitados": ["string"], "substituicoes": ["string"], "cuidados": "string", "racional_dor": "string (Se pain_scale > 3)" }
  ],
  "treinos": [
    {
      "nome": "string",
      "dia_semana_sugerido": "string",
      "foco": "string",
      "exercicios": [
        { "nome": "string", "grupo_muscular": "string", "series": number, "repeticoes": "string", "descanso_segundos": number, "tecnica": "string", "observacoes": "string (Setup biomecânico)", "adaptacao_lesao": boolean }
      ]
    }
  ],
  "justificativa": { 
    "escolha_exercicios": "string", 
    "volume_intensidade": "string", 
    "sincronia_nutricional": "string",
    "racional_hormonal": "string (Caso use hormônios, explique o ajuste de volume/recuperação aqui. Caso contrário, deixe vazio ou null)"
  },
  "progressao": {
    "tipo": "string (ex: Carga, Volume, Densidade)",
    "descricao": "string",
    "marcos": [
      { "semana": number, "mudanca": "string" }
    ]
  }
} (Responda APENAS o JSON)`;

    const userPrompt = `
# SOLICITAÇÃO DO TREINADOR
"${body.prompt_users}"

# DADOS DO ALUNO (ANAMNESE INTEGRADA)
- Nome: ${student.full_name}
- Sexo: ${student.sex} | Idade: ${student.birth_date ? (new Date().getFullYear() - new Date(student.birth_date).getFullYear()) : 'N/A'}
- Nível de Experiência em Musculação: ${student.anamnesis?.[0]?.training_level || 'Não informado'}
- Esporte/Modalidade: ${student.anamnesis?.[0]?.sport_specialty || 'Nenhum'}
- Nível Esportivo: ${student.anamnesis?.[0]?.sport_level || 'N/A'}
- Escala de Dor Diária: ${student.anamnesis?.[0]?.daily_pain_scale || 0}/10
- Lesões/Dores: ${student.anamnesis?.[0]?.injuries || "Nenhuma"}
- Frequência Semanal Desejada: ${student.anamnesis?.[0]?.initial_training_frequency || "Não informado"}x por semana
- Dias Disponíveis e Rotina: ${student.anamnesis?.[0]?.schedule_availability || "Não informado"}
- Uso de Ergogênicos/Hormônios: ${student.anamnesis?.[0]?.uses_ergogenics ? "Sim" : "Não"}
- Detalhes Ergogênicos: ${student.anamnesis?.[0]?.uses_ergogenics_details || "Nenhum"}
- Objetivo Principal: ${student.anamnesis?.[0]?.main_goal}

# CONTEXTO NUTRICIONAL (Sincronia Ativa)
${latestDiet ? JSON.stringify(latestDiet) : "Nenhuma dieta ativa registrada ainda."}

# ANÁLISE POSTURAL (IA Vision PhD)
${posturalData ? `
Desvios Detectados: ${JSON.stringify(posturalData.postural_deviations)}
AÇÃO OBRIGATÓRIA: Adapte exercícios que possam agravar estes desvios. Priorize corretivos e mobilidade.
` : "Nenhuma análise postural registrada ainda."}

# FEEDBACK SEMANAL (Último Check-in)
${lastFeedback ? `
- Cansaço: ${lastFeedback.fatigue_level}/10 | Sono: ${lastFeedback.sleep_quality}/10
- Dor: ${lastFeedback.has_pain ? `Sim (${lastFeedback.pain_location}, nível ${lastFeedback.pain_intensity}/10)` : "Não"}
- Observação Aluno: "${lastFeedback.load_perception}"
` : "Nenhum check-in recente."}

# CONTEXTO ADICIONAL (Arquivos)
${contextContent || "Nenhum arquivo adicional anexado."}
    `;

    // 4. Create Conversation Record
    const { data: conversation, error: convError } = await supabase
      .from("ai_conversations")
      .insert({
        coach_id: body.coach_id,
        student_id: body.student_id,
        request_type: "treino_completo",
        prompt_educator: body.prompt_users,
        parameters_requested: body.parameters,
        context_file_ids: body.context_file_ids,
        student_data_snapshot: student,
        status: "processando",
      })
      .select()
      .single();

    if (convError) throw convError;

    // 5. Call OpenAI (Using gpt-4o-mini for 10x speed and excellent quality for this task)
    const startTime = Date.now();
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
    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(result.error?.message || "OpenAI API Error");
    }

    const generatedWorkout = JSON.parse(result.choices[0].message.content);

    // 6. Update Conversation
    await supabase
      .from("ai_conversations")
      .update({
        ai_response: result.choices[0].message.content,
        generated_workout: generatedWorkout,
        model_used: result.model,
        tokens_used: result.usage.total_tokens,
        response_time_ms: duration,
        status: "concluido",
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversation.id,
        workout: generatedWorkout,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
