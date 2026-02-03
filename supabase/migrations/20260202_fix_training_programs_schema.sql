-- Migration to fix missing columns in training_programs table
-- Added by AI Assistant to resolve PGRST204 error

ALTER TABLE public.training_programs 
ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.training_programs 
ADD COLUMN IF NOT EXISTS end_date date;

COMMENT ON COLUMN public.training_programs.title IS 'O título descritivo do programa de treino';
COMMENT ON COLUMN public.training_programs.end_date IS 'Data prevista para o fim do protocolo de treino';
