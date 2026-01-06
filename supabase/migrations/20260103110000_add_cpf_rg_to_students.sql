-- Migration to add CPF and RG to students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS rg TEXT;
