-- Migration for AI Agent functionality
-- Creates tables for storing AI conversations and context files

-- Table: context_files (Library of files for context)
CREATE TABLE IF NOT EXISTS public.context_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  type text, -- 'pdf', 'txt', 'md', 'docx'
  size_bytes integer,
  storage_path text NOT NULL,
  
  category text CHECK (category IN ('artigo_cientifico', 'diretriz_treino', 'ficha_exemplo', 'metodologia', 'outro')),
  tags text[],
  description text,
  
  extracted_content text,
  is_processed boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: ai_conversations (History of AI generations)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  
  request_type text CHECK (request_type IN ('treino_completo', 'ajuste_protocolo', 'sugestao_exercicio', 'periodizacao')),
  
  prompt_educator text NOT NULL,
  parameters_requested jsonb,
  
  context_file_ids uuid[], -- Array of IDs from context_files
  
  student_data_snapshot jsonb,
  
  ai_response text,
  generated_workout jsonb,
  
  model_used text,
  tokens_used integer,
  response_time_ms integer,
  
  status text CHECK (status IN ('processando', 'concluido', 'erro')) DEFAULT 'processando',
  error_message text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_context_files_coach ON public.context_files(coach_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_coach ON public.ai_conversations(coach_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_student ON public.ai_conversations(student_id);

-- RLS Policies
ALTER TABLE public.context_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach manages own context files"
  ON public.context_files FOR ALL
  USING (auth.uid() = coach_id);

CREATE POLICY "Coach manages own conversations"
  ON public.ai_conversations FOR ALL
  USING (auth.uid() = coach_id);
