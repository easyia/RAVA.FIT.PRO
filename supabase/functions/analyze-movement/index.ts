import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeMovementRequest {
    assessment_id: string;
    video_url: string;
    frame_data: string; // Base64 image of current frame
    timestamp: number;
    exercise_name: string;
    annotations?: any[];
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
        const body: AnalyzeMovementRequest = await req.json();

        // System Prompt: PhD em Biomecânica Aplicada
        const systemPrompt = `Você é um PhD Sênior em Biomecânica do Exercício com 30+ anos de experiência em análise técnica de movimentos de musculação.

────────────────────────
[PROTOCOLO DE ANÁLISE BIOMECÂNICA]

1. AMPLITUDE DE MOVIMENTO (ROM):
- Verificar se o Limite Mecânico de Alongamento (LML) está sendo atingido
- Identificar se há encurtamento do ROM por fadiga ou compensações
- Avaliar se a amplitude está alinhada com o objetivo (hipertrofia = ROM completo, força = parcial estratégico)

2. ESTABILIDADE PROXIMAL:
- Avaliar se há perda de neutralidade da coluna (lordose/cifose excessiva)
- Detectar compensações com músculos sinergistas (ex: trapézio superior em elevações laterais)
- Identificar movimentos laterais indesejados (plano frontal/transversal)

3. TEMPO SOB TENSÃO (TUT):
- Estimar a cadência (ex: 3-1-2 para hipertrofia, 1-0-explosive para força)
- Verificar se há perda de tensão contínua (lock-out prematuro)
- Avaliar relação excêntrica:concêntrica

4. COMPENSAÇÕES PATOLÓGICAS:
- Valgo/Varo dinâmico de joelhos
- Arco plantar colapsando (pronação excessiva)
- Rotação interna excessiva de ombros (impingement risk)

────────────────────────
FORMATO DE RESPOSTA (JSON):
{
  "technical_issues": [
    {
      "type": "string (ex: 'ROM incompleto', 'Estabilidade proximal comprometida')",
      "severity": "leve" | "moderado" | "grave",
      "description": "string (descrição técnica do problema)",
      "biomechanical_rationale": "string (explicação PhD da causa do problema)",
      "correction": "string (correção técnica específica)",
      "injury_risk": "baixo" | "médio" | "alto"
    }
  ],
  "overall_quality": "excelente" | "bom" | "aceitável" | "inadequado",
  "recommendations": "string (recomendações gerais para próximas sessões)"
} (Responda APENAS o JSON)`;

        const userPrompt = `Analise este frame de execução do exercício: ${body.exercise_name}

Timestamp: ${body.timestamp.toFixed(2)}s

${body.annotations && body.annotations.length > 0 ? `
Marcações do Coach:
${JSON.stringify(body.annotations)}
` : ''}

Avalie a técnica biomecânica identificando:
1. Qualidade do ROM
2. Estabilidade proximal
3. Compensações visíveis
4. Risco de lesão`;

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
                                    url: body.frame_data,
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

        // Update Assessment with Movement Analysis
        const { error: updateError } = await supabase
            .from("physical_assessments")
            .update({
                execution_analysis: {
                    exercise_name: body.exercise_name,
                    timestamp: body.timestamp,
                    video_url: body.video_url,
                    analysis: analysis,
                    annotations: body.annotations,
                    analyzed_at: new Date().toISOString()
                },
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
