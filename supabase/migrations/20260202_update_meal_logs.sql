-- Add modified_foods to meal_logs
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS modified_foods JSONB;
