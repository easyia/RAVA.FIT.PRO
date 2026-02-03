-- =====================================================================
-- COMPREHENSIVE ANAMNESIS SCHEMA FIX
-- =====================================================================
-- This migration consolidates all missing columns to ensure the 
-- anamnesis table matches the frontend form fields.
-- Run this ONCE in Supabase SQL Editor.
-- =====================================================================

-- 1. Core Training Columns
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS training_level text;
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS available_days text[];

-- 2. Ergogenics/Supplements Columns
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS uses_ergogenics boolean DEFAULT false;
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS uses_ergogenics_details text;

-- 3. Routine & Schedule Columns (NEW - fixes 400 error)
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS daily_routine text;
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS wake_up_time text;
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS sleep_time text;

-- 4. Other potentially missing columns
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS surgeries text;
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS goal_deadline text;

-- 5. Students table - ensure phone column exists
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone text;

-- =====================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================
COMMENT ON COLUMN public.anamnesis.training_level IS 'Nível de experiência: iniciante, intermediario, avancado, atleta';
COMMENT ON COLUMN public.anamnesis.daily_routine IS 'Descrição da rotina diária do aluno (trabalho/estudo)';
COMMENT ON COLUMN public.anamnesis.wake_up_time IS 'Horário que o aluno costuma acordar (HH:MM)';
COMMENT ON COLUMN public.anamnesis.sleep_time IS 'Horário que o aluno costuma dormir (HH:MM)';

-- Verify by listing columns (optional - just for checking)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'anamnesis' ORDER BY ordinal_position;
