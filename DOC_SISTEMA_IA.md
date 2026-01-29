# DOC_SISTEMA_IA.md — Documentação Técnica Completa do Sistema de IA

> **Versão:** 1.0.0  
> **Data:** 28/01/2026  
> **Autor:** Arquiteto de Software Sênior (Análise de Código)

---

## 1. Stack Tecnológica

### 1.1. API de Modelo de Linguagem (LLM)

| Componente | Tecnologia |
|------------|------------|
| **Provedor** | OpenAI |
| **Modelo** | `gpt-4o-mini` |
| **Temperatura** | `0.7` |
| **Formato de Resposta** | JSON Estruturado (`response_format: { type: "json_object" }`) |

**Observação técnica:** Não utilizamos LangChain, Anthropic ou frameworks de orquestração. A integração é feita via chamadas HTTP diretas à API REST da OpenAI.

### 1.2. Backend (Edge Functions)

| Componente | Tecnologia |
|------------|------------|
| **Runtime** | Deno (via Supabase Edge Functions) |
| **HTTP Server** | `https://deno.land/std@0.168.0/http/server.ts` |
| **Cliente Supabase** | `@supabase/supabase-js@2` (via esm.sh) |

**Funções Implementadas:**
```
supabase/functions/
├── generate-training/index.ts  (Geração de Treino)
├── generate-diet/index.ts      (Geração de Dieta)
├── analyze-movement/           (Análise de Movimento - Placeholder)
├── analyze-posture/            (Análise Postural - Placeholder)
├── extract-file-content/       (Extração de Conteúdo de Arquivos)
└── student-chat/               (Chat Estudante)
```

### 1.3. Variáveis de Ambiente Necessárias

```bash
OPENAI_API_KEY          # Chave de API da OpenAI
SUPABASE_URL            # URL do projeto Supabase
SUPABASE_SERVICE_ROLE_KEY  # Chave de serviço Supabase (acesso administrativo)
```

### 1.4. Frontend

| Componente | Tecnologia |
|------------|------------|
| **Framework** | React 18 + Vite |
| **Data Fetching** | TanStack Query (React Query) |
| **Invocação de Funções** | `supabase.functions.invoke()` |
| **Cálculos Nutricionais** | `src/utils/nutritionCalculations.ts` (Mifflin-St Jeor, Tinsley) |

---

## 2. Fluxo Lógico (Workflow)

### 2.1. Diagrama Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                                 │
│                                                                         │
│  ┌──────────────────────┐        ┌──────────────────────┐              │
│  │ AITrainingAssistant  │───────▶│ AINutritionAssistant │              │
│  │    (Treino)          │  APÓS  │      (Dieta)         │              │
│  │                      │ SALVAR │                      │              │
│  └──────────────────────┘        └──────────────────────┘              │
│           │                              │                              │
│           ▼                              ▼                              │
│  supabase.functions.invoke()    supabase.functions.invoke()            │
└─────────────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS (Deno)                       │
│                                                                         │
│  ┌──────────────────────┐        ┌──────────────────────┐              │
│  │   generate-training  │        │    generate-diet     │              │
│  │                      │        │                      │              │
│  │  1. Busca Student    │        │  1. Busca Student    │              │
│  │  2. Busca Dieta      │        │  2. Busca TREINO     │◀── DEPENDÊNCIA
│  │  3. Busca Postural   │        │  3. Chama OpenAI     │              │
│  │  4. Busca Feedback   │        │  4. Retorna JSON     │              │
│  │  5. Busca Arquivos   │        └──────────────────────┘              │
│  │  6. Monta Prompt     │                                              │
│  │  7. Chama OpenAI     │                                              │
│  │  8. Salva Conversa   │                                              │
│  └──────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          OPENAI API                                     │
│            Endpoint: https://api.openai.com/v1/chat/completions        │
│            Modelo: gpt-4o-mini | Formato: JSON Object                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Fluxo Detalhado — Geração de Treino (`generate-training`)

**Passo a Passo:**

1. **Entrada do Usuário (Frontend)**
   - Treinador seleciona um aluno
   - Treinador escreve um prompt livre (ex: "Monte um treino de hipertrofia para iniciante com condromalácia")
   - Opcionalmente, anexa arquivos de contexto (PDFs, artigos científicos)

2. **Payload Enviado para a Edge Function**
   ```typescript
   {
     coach_id: string,       // UUID do treinador autenticado
     student_id: string,     // UUID do aluno selecionado
     prompt_users: string,   // Prompt livre do treinador
     context_file_ids?: string[]  // IDs opcionais de arquivos anexados
   }
   ```

3. **Processamento na Edge Function**
   - **Busca Dados do Aluno:** `students` + `anamnesis` (lesões, hormônios, esporte, objetivo)
   - **Busca Dieta Ativa:** `meal_plans` mais recente (para sincronia nutricional)
   - **Busca Análise Postural:** `physical_assessments` com desvios posturais
   - **Busca Feedback Semanal:** `weekly_feedbacks` (fadiga, sono, dor)
   - **Busca Arquivos de Contexto:** `context_files` pelo array de IDs

4. **Montagem do Prompt**
   - System Prompt com regras de PhD Sênior (ver Seção 3)
   - User Prompt com dados coletados e solicitação do treinador

5. **Chamada à OpenAI**
   - Modelo: `gpt-4o-mini`
   - `response_format: { type: "json_object" }`
   - Temperatura: `0.7`

6. **Persistência**
   - Cria registro em `ai_conversations` com status "processando"
   - Atualiza com `generated_workout`, `tokens_used`, `response_time_ms`, status "concluido"

7. **Resposta ao Frontend**
   ```json
   {
     "success": true,
     "conversation_id": "uuid",
     "workout": { /* JSON estruturado do treino */ }
   }
   ```

### 2.3. Fluxo Detalhado — Geração de Dieta (`generate-diet`)

**Passo a Passo:**

1. **Entrada do Usuário (Frontend)**
   - Treinador seleciona um aluno
   - Sistema calcula automaticamente TMB e GET usando equações científicas
   - Treinador ajusta calorias alvo e macros (proteína, carbo, gordura)

2. **Payload Enviado para a Edge Function**
   ```typescript
   {
     coach_id: string,
     student_id: string,
     target_calories: number,  // Calorias alvo calculadas
     macros: {
       p: number,  // Proteína em gramas
       c: number,  // Carboidrato em gramas
       f: number   // Gordura em gramas
     },
     prompt_users?: string  // Instruções adicionais opcionais
   }
   ```

3. **Processamento na Edge Function**
   - **Busca Dados do Aluno:** `students` + `anamnesis`
   - **Busca Treino Ativo:** `training_programs` mais recente (para sincronia)
   - Se não houver treino, a função ainda executa, mas a IA é informada da ausência

4. **Chamada à OpenAI**
   - System Prompt com regras de PhD Sênior em Nutrição (ver Seção 3)
   - User Prompt com dados coletados e parâmetros nutricionais

5. **Resposta ao Frontend**
   ```json
   {
     "success": true,
     "diet": { /* JSON estruturado da dieta */ }
   }
   ```

### 2.4. Dependência Técnica: Por que Dieta só após Treino?

**Implementação no Frontend (`AINutritionAssistant.tsx`):**

```typescript
// Linha 104
const hasTraining = trainingPrograms.length > 0;

// Linha 147-150
const handleGenerateDiet = async () => {
    if (!selectedStudentId || !hasTraining) {
        toast.error('O aluno precisa ter um protocolo de treino antes da dieta.');
        return;
    }
    // ...
};
```

**Razão Técnica:**
- A IA de Dieta utiliza o `training_program` ativo como contexto para calcular:
  - Volume semanal de séries (afeta aporte de carboidratos)
  - Frequência de treino (afeta TDEE total)
- Sem esse dado, a IA opera "no escuro" sobre demanda energética do treino

**Verificação no Backend (`generate-diet/index.ts`):**

```typescript
// Linhas 51-54
if (!training) {
  // We still allow generating diet, but the user requested strict workflow. 
  // Although the UI handles this, the AI should know.
}
```

**Conclusão:** O bloqueio é apenas no FRONTEND. O backend permite gerar dieta sem treino (a IA recebe "Nenhum treino ativo"), mas a UX força o fluxo correto.

---

## 3. Engenharia de Prompt e Regras

### 3.1. System Prompt — Geração de Treino

**Persona:**
> "Você é um PhD Sênior com mais de 30 anos de experiência internacional em Biomecânica de Alta Performance e Fisiologia do Exercício."

**Regras de Ouro (Literalmente do Código):**

#### 1. SINCRONIA NUTRICIONAL (CROSS-DATA)
```
- Analise os dados da dieta ativa do aluno (se fornecida).
- REGRA DE DÉFICIT: Se o aluno estiver em déficit calórico severo 
  (ex: objetivo de Emagrecimento/Cutting), você DEVE reduzir o 
  volume total de séries e priorizar a manutenção da INTENSIDADE 
  (carga) para preservar massa magra.
```

#### 2. GESTÃO DE DOR E LESÃO
```
- Verifique a 'pain_scale'. Se > 3, identifique a articulação/exercício afetado.
- AÇÃO: Gere automaticamente uma JUSTIFICATIVA de "Zona de Exclusão de Torque" 
  para essa articulação, alterando o exercício ou reduzindo o ROM.
```

#### 3. ESPECIFICIDADE DE ESPORTE
```
- Se 'main_sport' for de alto impacto (Futebol, Corrida), reduza o volume 
  de membros inferiores para evitar sobrecarga excessiva.
```

#### 4. CAPACIDADE RECUPERATIVA (HORMONAL)
```
- Ajuste Volume/Intensidade/Proteína se 'hormones' (TRT, Anticoncepcional) 
  estiverem presentes. Hormonizados suportam volume 20-30% maior.
```

#### 5. CHECK-IN SEMANAL (DELOAD AUTOMÁTICO)
```
- Verifique os dados de Feedback Semanal.
- REGRA DELOAD: Se 'fatigue_level' > 8 E 'sleep_quality' < 5, você DEVE 
  gerar uma "Semana de Deload" (Volume/Intensidade reduzidos em 40%). 
  Indique isso no título.
- Se 'has_pain' = true e 'pain_intensity' > 5, EVITE exercícios na região indicada.
```

### 3.2. System Prompt — Geração de Dieta

**Persona:**
> "Você é um PhD Sênior em Nutrição Esportiva e Bioquímica Metabólica."

**Regras de Ouro (Literalmente do Código):**

#### 1. SINCRONIA DE TREINO (CROSS-DATA)
```
- Analise o 'training_program' ativo do aluno.
- REGRA DE CARBOIDRATOS: Calcule o aporte de carboidratos com base no 
  volume de séries semanais relatado pelo motor de treino. 
  Treinos de alto volume (> 15 séries/músculo) exigem maior aporte peri-treino.
```

#### 2. PRIORIDADE METABÓLICA (ESPORTE)
```
- O gasto calórico do 'main_sport' (Futebol, Corrida, etc.) informado na 
  anamnese é a sua PRIORIDADE metabólica de base. 
  Calcule o TDEE considerando primeiro o esporte e depois o adicional da musculação.
```

#### 3. SUPLEMENTAÇÃO TIER 1 (CIÊNCIA PURA)
```
- Prescreva apenas suplementos com alto grau de evidência 
  (Creatina, Cafeína, Beta-Alanina, Whey/Proteína isolada). 
  Justifique o uso biomecanicamente ou bioquimicamente.
```

#### 4. AJUSTE REPARADOR (HORMONAL)
```
- Se 'hormones' estiver presente, ajuste a síntese proteica alvo. 
  Usuários de Hormônios/TRT suportam e exigem maior aporte proteico 
  (2.2g - 2.6g/kg) devido ao aumento do turnover.
```

### 3.3. Cálculos Nutricionais no Frontend

**Localização:** `src/utils/nutritionCalculations.ts`

#### Equação de Mifflin-St Jeor (TMB)
```typescript
// Homens: (9.99 * peso) + (6.25 * altura) - (4.92 * idade) + 5
// Mulheres: (9.99 * peso) + (6.25 * altura) - (4.92 * idade) - 161
const base = (9.99 * weight) + (6.25 * height) - (4.92 * age);
return sex === 'male' ? base + 5 : base - 161;
```

#### Equação de Tinsley (Peso Total)
```typescript
// GET = (24.8 * peso) + 10
return (24.8 * weight) + 10;
```

#### Equação de Tinsley (Massa Magra)
```typescript
// GET = (25.3 * LBM) + 284
const lbm = weight * (1 - bodyFat / 100);
return (25.3 * lbm) + 284;
```

#### Cálculo de Macros por Objetivo
```typescript
// Emagrecimento: P=2.2g/kg, G=0.7g/kg
// Hipertrofia: P=2.0g/kg, G=1.0g/kg
// Condicionamento (default): P=2.0g/kg, G=0.8g/kg
// Carboidrato = (Calorias Alvo - Proteína - Gordura) / 4
```

---

## 4. Estrutura de Dados

### 4.1. Tabelas Principais

#### `training_programs` (Programa de Treino)
```sql
CREATE TABLE training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  coach_id uuid NOT NULL REFERENCES coaches(id),
  title text,                -- Título gerado pela IA
  number_weeks int,          -- Duração em semanas
  sessions_per_week int,
  start_date date,
  status text,               -- 'active', 'completed', etc.
  created_at timestamptz DEFAULT now()
);
```

#### `training_sessions` (Sessões/Divisões)
```sql
CREATE TABLE training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_program_id uuid NOT NULL REFERENCES training_programs(id),
  division text,             -- A, B, C, etc.
  name text,                 -- "Peito e Tríceps"
  created_at timestamptz DEFAULT now()
);
```

#### `training_exercises` (Exercícios)
```sql
CREATE TABLE training_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid NOT NULL REFERENCES training_sessions(id),
  name text NOT NULL,        -- Nome do exercício
  execution_order int,       -- Ordem de execução
  sets int,                  -- Número de séries
  reps_min int,              -- Repetições mínimas
  reps_max int,              -- Repetições máximas
  main_muscle_group text,    -- Grupo muscular principal
  intensity_methods text,    -- Drop-set, Rest-pause, etc.
  rest_time text,            -- Tempo de descanso
  notes text,                -- Observações biomecânicas
  created_at timestamptz DEFAULT now()
);
```

#### `meal_plans` (Plano Alimentar)
```sql
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id),
  coach_id uuid NOT NULL REFERENCES coaches(id),
  title text NOT NULL,
  goal text,                 -- Objetivo (emagrecimento, hipertrofia)
  total_calories int,
  total_proteins numeric,
  total_carbs numeric,
  total_fats numeric,
  prescription_date date,
  status text,
  created_at timestamptz DEFAULT now()
);
```

#### `meals` (Refeições)
```sql
CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id),
  name text NOT NULL,        -- "Café da Manhã"
  meal_time time,            -- Horário sugerido
  type text,                 -- "Opção 1", "Opção 2"
  created_at timestamptz DEFAULT now()
);
```

#### `meal_foods` (Alimentos)
```sql
CREATE TABLE meal_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id),
  name text NOT NULL,        -- Nome do alimento
  quantity numeric,
  unit text,                 -- g, ml, unidade
  order_index int,
  created_at timestamptz DEFAULT now()
);
```

### 4.2. Tabelas de IA e Contexto

#### `ai_conversations` (Histórico de Conversas com IA)
```sql
CREATE TABLE ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id),
  student_id uuid REFERENCES students(id),
  
  request_type text,            -- 'treino_completo', 'ajuste_protocolo'
  prompt_educator text NOT NULL, -- Prompt original do treinador
  parameters_requested jsonb,    -- Parâmetros adicionais
  context_file_ids uuid[],       -- Arquivos de contexto usados
  
  student_data_snapshot jsonb,   -- Snapshot dos dados do aluno
  
  ai_response text,              -- Resposta bruta da IA (string JSON)
  generated_workout jsonb,       -- Workout parseado como JSONB
  
  model_used text,               -- 'gpt-4o-mini'
  tokens_used integer,
  response_time_ms integer,
  
  status text,                   -- 'processando', 'concluido', 'erro'
  error_message text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `context_files` (Biblioteca de Arquivos de Contexto)
```sql
CREATE TABLE context_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id),
  
  name text NOT NULL,
  type text,                     -- 'pdf', 'txt', 'md'
  size_bytes integer,
  storage_path text NOT NULL,
  
  category text,                 -- 'artigo_cientifico', 'diretriz_treino'
  tags text[],
  description text,
  
  extracted_content text,        -- Conteúdo extraído para prompt
  is_processed boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 4.3. Formato de Saída da IA

#### Resposta da Geração de Treino (JSON)
```json
{
  "programa_treino": {
    "titulo": "Hipertrofia Full Stack - Fase 1",
    "objetivo": "Hipertrofia",
    "nivel": "Intermediário",
    "duracao_semanas": 8,
    "frequencia_semanal": 4,
    "tipo_divisao": "Upper/Lower",
    "observacoes_gerais": "Racional PhD..."
  },
  "adaptacoes_lesoes": [
    {
      "lesao": "Condromalácia Patelar",
      "exercicios_evitados": ["Leg Extension", "Agachamento Profundo"],
      "substituicoes": ["Leg Press 45°", "Agachamento Parcial"],
      "cuidados": "Evitar flexão > 90°",
      "racional_dor": "Zona de Exclusão de Torque..."
    }
  ],
  "treinos": [
    {
      "nome": "Treino A - Upper Push",
      "dia_semana_sugerido": "Segunda-feira",
      "foco": "Peito, Ombro, Tríceps",
      "exercicios": [
        {
          "nome": "Supino Reto",
          "grupo_muscular": "Peitoral Maior",
          "series": 4,
          "repeticoes": "8-12",
          "descanso_segundos": 90,
          "tecnica": "Cadência 3010",
          "observacoes": "Retração escapular completa",
          "adaptacao_lesao": false
        }
      ]
    }
  ],
  "justificativa": {
    "escolha_exercicios": "Biomecânica explicada...",
    "volume_intensidade": "Fisiologia explicada...",
    "sincronia_nutricional": "Sincronia com dieta..."
  },
  "progressao": {
    "tipo": "Sobrecarga Progressiva",
    "descricao": "Aumento de 2.5kg/semana...",
    "marcos": [
      { "semana": 4, "mudanca": "Aumentar 1 série por exercício" }
    ]
  }
}
```

#### Resposta da Geração de Dieta (JSON)
```json
{
  "dieta": {
    "titulo": "Dieta Hipercalórica - Hipertrofia",
    "objetivo": "Ganho de Massa",
    "total_calories": 2800,
    "total_protein": 180,
    "total_carbs": 350,
    "total_fats": 80,
    "refeicoes": [
      {
        "nome": "Café da Manhã",
        "horario": "07:00",
        "opcoes": [
          {
            "id": 1,
            "itens": [
              { "alimento": "Ovos Inteiros", "quantidade": 4, "unidade": "unidades", "carb": 2, "prot": 24, "gord": 20 },
              { "alimento": "Aveia", "quantidade": 100, "unidade": "g", "carb": 66, "prot": 17, "gord": 7 }
            ]
          }
        ]
      }
    ],
    "justificativa_bioenergetica": "Aporte proteico distribuído...",
    "suplementacao_estrategica": [
      { "suplemento": "Creatina Monoidratada", "dose": "5g", "horario": "Pós-Treino", "justificativa_phd": "Aumento de ATP..." }
    ]
  }
}
```

---

## 5. Pontos de Atenção para Stakeholders

### 5.1. Dependências Operacionais
- **OpenAI API**: Custos por token consumido (gpt-4o-mini é custo-efetivo)
- **Supabase Edge Functions**: Cold start pode adicionar latência inicial

### 5.2. Limitações Atuais
- Geração de Dieta não persiste histórico em `ai_conversations` (diferente de Treino)
- Não há validação de intolerantâncias alimentares no prompt de dieta (presente na anamnese, mas não enforced)
- Arquivos de contexto dependem de extração manual (`extracted_content`)

### 5.3. Próximos Passos Sugeridos
1. Unificar persistência de histórico para ambas as IAs
2. Implementar validação de restrições alimentares no prompt
3. Automatizar extração de conteúdo de PDFs com OCR

---

**Fim do Documento**
