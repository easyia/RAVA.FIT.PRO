-- Migration: Add training_level column to anamnesis table
-- Description: Fixes the data flow gap between frontend and backend for training level

ALTER TABLE public.anamnesis
ADD COLUMN IF NOT EXISTS training_level text;

-- Add available_days for training frequency preference
ALTER TABLE public.anamnesis
ADD COLUMN IF NOT EXISTS available_days text[];

COMMENT ON COLUMN public.anamnesis.training_level IS 'Nível de experiência em musculação: iniciante, intermediario, avancado';
COMMENT ON COLUMN public.anamnesis.available_days IS 'Dias disponíveis para treino (array de strings)';
