-- Migration: Consolidate Physical Assessments - AI & Symmetrograph Integration
-- Created: 2026-01-05
-- Purpose: Add AI postural analysis and symmetrograph data columns to existing table

ALTER TABLE public.physical_assessments
ADD COLUMN IF NOT EXISTS postural_deviations jsonb,
ADD COLUMN IF NOT EXISTS ai_analysis_summary text,
ADD COLUMN IF NOT EXISTS ai_model_used text,
ADD COLUMN IF NOT EXISTS symmetrograph_data jsonb;

-- Add helpful comment
COMMENT ON COLUMN public.physical_assessments.postural_deviations IS 'AI Vision PhD analysis results (array of detected postural deviations)';
COMMENT ON COLUMN public.physical_assessments.ai_analysis_summary IS 'Technical summary from AI analysis';
COMMENT ON COLUMN public.physical_assessments.ai_model_used IS 'AI model identifier (e.g., gpt-4o)';
COMMENT ON COLUMN public.physical_assessments.symmetrograph_data IS 'Coach manual annotations (grid config, drawings, lines, circles)';
