-- Migration: Add execution analysis field for biomechanical video analysis
-- Created: 2026-01-05

ALTER TABLE public.physical_assessments
ADD COLUMN IF NOT EXISTS execution_analysis jsonb;

COMMENT ON COLUMN public.physical_assessments.execution_analysis IS 'Biomechanical movement analysis from video (annotations, AI feedback, technical issues)';
