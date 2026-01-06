import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzePostureRequest {
    coach_id: string;
    student_id: string;
    assessment_id: string;
    photo_url: string; // URL da foto já hospedada no Supabase Storage
    photo_view: 'front' | 'back' | 'left_side' | 'right_side';
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
        const body: AnalyzePostureRequest = await req.json();

        // System Prompt: Fisioterapeuta PhD Sênior
        const systemPrompt = `Você é um Fisioterapeuta Esportivo PhD Sênior especializado em Análise Postural Biomecânica.

────────────────────────
[PROTOCOLO DE ANÁLISE VISUAL]

1. DESVIOS POSTURAIS (DETECTAR E CLASSIFICAR):
- Desníveis de Ombros (elevação unilateral, rotação interna/externa)
- Projeção de Cabeça (anteriorização cervical)
- Desvios de Pelve (anteversão, retroversão, obliquidade)
- Rotação de Tronco (escoliose funcional ou estrutural)
- Valgo/Varo de Joelhos
- Arco Plantar (pronação excessiva, supinação)

2. SEVERIDADE (CLASSIFICAR):
- Leve: Desalinhamento < 5 graus ou < 1cm
- Moderado: Desalinhamento 5-15 graus ou 1-3cm
- Severo: Desalinhamento > 15 graus ou > 3cm

3. IMPACTO FUNCIONAL:
- Identifique quais padrões de movimento podem ser comprometidos
- Sugira zonas de exclusão de torque (articulações a evitar sobrecarga)

────────────────────────
FORMATO DE RESPOSTA (JSON):
{
  "desvios_detectados": [
    {
      "tipo": "string (ex: 'desnivel_ombros', 'projecao_cabeca')",
      "descricao": "string",
      "severidade": "leve" | "moderado" | "severo",
      "lado_afetado": "esquerdo" | "direito" | "bilateral",
      "impacto_funcional": "string (ex: 'Limitação em abdução de ombro', 'Sobrecarga lombar')"
    }
  ],
  "recomendacoes_treino": "string (Sugestões de exercícios corretivos ou adaptações)",
  "zonas_exclusao": ["string (ex: 'Desenvolvimento militar', 'Agachamento profundo')"]
} (Responda APENAS o JSON)`;

        const userPrompt = `Analise esta foto postural (${body.photo_view}) e identifique desvios biomecânicos.

Foto URL: ${body.photo_url}

Se a imagem mostrar uma pessoa em posição anatômica padrão, avalie:
- Simetria e alinhamento
- Desvios visíveis
- Compensações posturais`;

        // Call OpenAI Vision API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: userPrompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: body.photo_url,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 1500,
            }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || "OpenAI API Error");

        const analysis = JSON.parse(result.choices[0].message.content);

        // Update Assessment with AI Results
        const { error: updateError } = await supabase
            .from("physical_assessments")
            .update({
                postural_deviations: analysis.desvios_detectados,
                ai_analysis_summary: JSON.stringify(analysis),
                ai_model_used: result.model,
                updated_at: new Date().toISOString()
            })
            .eq("id", body.assessment_id);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({ success: true, analysis }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
