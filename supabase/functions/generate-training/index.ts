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

    // 2. Fetch Context Files
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

    // 3. Build Prompt
    const systemPrompt = `Você é um agente especialista em prescrição de treinos de musculação e condicionamento físico.
PAPEL:
- Assistir educadores físicos profissionais na criação de protocolos de treino personalizados
- Baseado em evidências científicas e boas práticas da área
- Considerar sempre limitações, lesões e objetivos individuais
- Fornecer justificativas claras para cada decisão

DIRETRIZES DE PRESCRIÇÃO:
1. SEMPRE considere as limitações físicas e lesões do aluno
2. Adapte exercícios quando necessário (nunca prescreva algo perigoso)
3. Volume e intensidade devem ser apropriados ao nível do aluno
4. Progressão deve ser gradual e mensurável
5. Inclua aquecimento e alongamento quando relevante
6. Explique o PORQUÊ de cada escolha

FORMATO DE RESPOSTA (JSON):
{
  "programa_treino": {
    "titulo": "string",
    "objetivo": "string",
    "nivel": "string",
    "duracao_semanas": number,
    "frequencia_semanal": number,
    "tipo_divisao": "string",
    "observacoes_gerais": "string"
  },
  "adaptacoes_lesoes": [
    { "lesao": "string", "exercicios_evitados": ["string"], "substituicoes": ["string"], "cuidados": "string" }
  ],
  "treinos": [
    {
      "nome": "string",
      "dia_semana_sugerido": "string",
      "foco": "string",
      "exercicios": [
        { "nome": "string", "grupo_muscular": "string", "series": number, "repeticoes": "string", "descanso_segundos": number, "tecnica": "string", "observacoes": "string", "adaptacao_lesao": boolean }
      ]
    }
  ],
  "progressao": { "tipo": "string", "descricao": "string", "marcos": [{ "semana": number, "mudanca": "string" }] },
  "justificativa": { "escolha_exercicios": "string", "volume_intensidade": "string", "periodizacao": "string", "adaptacoes": "string" },
  "proximos_passos": "string"
}`;

    const userPrompt = `
# SOLICITAÇÃO
${body.prompt_users}

# DADOS DO ALUNO
- Nome: ${student.full_name}
- Idade: ${student.age || 'N/A'} (Data nasc: ${student.birth_date})
- Sexo: ${student.sex}
- Nível: ${student.anamnesis?.[0]?.xp_level || "iniciante"}
- Objetivo: ${student.anamnesis?.[0]?.main_goal}
- Frequência: ${student.anamnesis?.[0]?.initial_training_frequency}x/semana

## ANAMNESE
### Lesões/Limitações
${student.anamnesis?.[0]?.injuries || "Nenhuma"}
${student.anamnesis?.[0]?.medical_conditions || "Nenhuma"}
### Observações
${student.anamnesis?.[0]?.motivation_barriers || "Nenhuma"}

# CONTEXTO
${contextContent || "Nenhum arquivo"}

# PARÂMETROS
${JSON.stringify(body.parameters || {}, null, 2)}
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

    // 5. Call OpenAI
    const startTime = Date.now();
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
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
