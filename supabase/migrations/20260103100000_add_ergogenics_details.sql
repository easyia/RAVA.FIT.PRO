-- Migration to add extra details to anamnesis
ALTER TABLE public.anamnesis 
ADD COLUMN IF NOT EXISTS uses_ergogenics_details TEXT;
