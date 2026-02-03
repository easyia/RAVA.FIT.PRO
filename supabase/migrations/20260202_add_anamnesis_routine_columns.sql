-- Migration to add dedicated columns for routine details in anamnesis table
-- Resolves data extraction issues from overloaded schedule_availability field

ALTER TABLE public.anamnesis 
ADD COLUMN IF NOT EXISTS daily_routine text,
ADD COLUMN IF NOT EXISTS wake_up_time text,
ADD COLUMN IF NOT EXISTS sleep_time text;

COMMENT ON COLUMN public.anamnesis.daily_routine IS 'Descrição da rotina diária do aluno';
COMMENT ON COLUMN public.anamnesis.wake_up_time IS 'Horário que o aluno costuma acordar';
COMMENT ON COLUMN public.anamnesis.sleep_time IS 'Horário que o aluno costuma dormir';
