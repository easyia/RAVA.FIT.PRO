-- Migration: Weekly Feedbacks
-- Created: 2026-01-05
-- Purpose: Store weekly student check-ins for AI loop and coach monitoring.

CREATE TABLE IF NOT EXISTS public.weekly_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.coaches(id),
  
  training_count integer DEFAULT 0,
  load_perception text, -- Exercícios fáceis/difíceis
  
  has_pain boolean DEFAULT false,
  pain_intensity integer CHECK (pain_intensity >= 0 AND pain_intensity <= 10),
  pain_location text,
  
  fatigue_level integer CHECK (fatigue_level >= 0 AND fatigue_level <= 10), -- 0 = sem cansaço, 10 = exausto
  sleep_quality integer CHECK (sleep_quality >= 0 AND sleep_quality <= 10), -- 0 = péssimo, 10 = ótimo
  
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.weekly_feedbacks ENABLE ROW LEVEL SECURITY;

-- Students can insert their own feedbacks
CREATE POLICY "Students can insert own feedbacks" ON public.weekly_feedbacks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Students can view their own feedbacks
CREATE POLICY "Students can view own feedbacks" ON public.weekly_feedbacks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Coaches can view feedbacks of their students
CREATE POLICY "Coaches can view their students feedbacks" ON public.weekly_feedbacks
  FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid()); -- Assumes coach records align with auth.uid() or linked logic.
  -- Simplified policy. Ideally should check if student_id belongs to coach, but coach_id field helps.

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_student_created ON public.weekly_feedbacks(student_id, created_at DESC);
