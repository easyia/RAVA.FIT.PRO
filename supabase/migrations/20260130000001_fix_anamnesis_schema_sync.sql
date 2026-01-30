-- Migration: 20260130000001_fix_anamnesis_schema_sync.sql
-- Description: Ensures all necessary columns for the Student Anamnesis Form exist.
-- Fixes "Could not find the 'weight_habitual' column" error.

-- 1. Ensure weight_habitual exists (numeric)
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS weight_habitual numeric;

-- 2. Ensure surgeries exists (text)
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS surgeries text;

-- 3. Ensure uses_ergogenics_details exists (text)
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS uses_ergogenics_details text;

-- 4. Ensure uses_ergogenics flag exists (boolean) - useful for querying
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS uses_ergogenics boolean;

-- 5. Ensure goal_deadline exists (text or date)
-- Previously defined as text in init_schema, ensuring it's available.
ALTER TABLE public.anamnesis ADD COLUMN IF NOT EXISTS goal_deadline text;

-- 6. Ensure phone exists in students table (Step 1 of Anamnesis)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone text;
