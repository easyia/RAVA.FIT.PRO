# Relatório de Configuração - IA de Dieta (RAVA FIT PRO)

Este documento descreve detalhadamente como a Inteligência Artificial para geração de dietas está configurada no sistema.

## 1. Arquitetura Técnica
- **Localização da Lógica**: A inteligência reside em uma Supabase Edge Function: `supabase/functions/generate-diet/index.ts`.
- **Modelo de IA**: `gpt-4o-mini` (OpenAI).
- **Parâmetros de Geração**:
  - `temperature`: 0.7 (Equilíbrio entre precisão técnica e variedade de alimentos).
  - `response_format`: `json_object` (Garante que a resposta seja sempre um JSON válido).

## 2. Fluxo de Execução
1. O treinador seleciona o aluno no frontend (`AINutritionAssistant.tsx`).
2. O sistema calcula a Taxa Metabólica Basal (TMB) e o Gasto Energético Total (GET) usando as fórmulas de **Mifflin-St Jeor** e **Tinsley**.
3. O treinador define a meta calórica final (Déficit, Manutenção ou Superávit) e ajusta os Macronutrientes.
4. Os dados são enviados para a Edge Function, que busca no banco de dados:
   - Dados de anamnese do aluno.
   - O protocolo de treino mais recente (para sincronizar pré/pós treino).
5. A IA processa o prompt e retorna uma dieta estruturada com 3 opções por refeição.

## 3. System Prompt (A Personalidade da IA)
O prompt de sistema define o papel e as regras que a IA deve seguir:

```text
Você é um Nutricionista Esportivo de ALTO NÍVEL especializado em performance e estética física.
PAPEL:
- Assistir treinadores na criação de planos alimentares (dietas) precisos.
- Fornecer 3 OPÇÕES (variantes) de refeições para cada horário (Opção 1, Opção 2, Opção 3).
- Garantir que as calorias e macros totais sejam respeitados em todas as opções.
- Considerar o protocolo de treino atual do aluno para sugerir refeições pré e pós-treino adequadas.

DADOS ALVO:
- Calorias Alvo: [VALOR] kcal
- Proteínas: [VALOR]g
- Carboidratos: [VALOR]g
- Gorduras: [VALOR]g
```

## 4. Estrutura de Resposta
A IA é instruída a retornar os dados no seguinte formato JSON, o que permite ao sistema renderizar a interface de 3 colunas de forma dinâmica:

```json
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
          { "id": 1, "itens": [...] },
          { "id": 2, "itens": [...] },
          { "id": 3, "itens": [...] }
        ]
      }
    ],
    "justificativa": "string",
    "suplementacao_sugerida": ["string"]
  }
}
```

## 5. Integração com Treino
A IA recebe o detalhamento completo dos exercícios e sessões de treino do aluno via `userPrompt`, permitindo que ela identifique horários de pico de gasto energético e sugira carboidratos de rápida absorção ou proteínas específicas para os momentos estratégicos do dia.

---
*Gerado automaticamente pelo Assistente de Desenvolvimento.*
