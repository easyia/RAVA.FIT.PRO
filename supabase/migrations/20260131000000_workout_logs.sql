-- =============================================
-- WORKOUT LOGS TABLE
-- Tracks individual exercise execution data during workout sessions
-- =============================================

CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    training_session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL,
    exercise_id UUID REFERENCES public.training_exercises(id) ON DELETE SET NULL,
    
    -- Exercise reference (fallback if exercise_id is null or exercise was deleted)
    exercise_name TEXT NOT NULL,
    
    -- JSONB array containing set-by-set execution data
    -- Structure: [{ setNumber, weight, reps, rpe, rir, completed, completedAt }, ...]
    sets_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries by student
CREATE INDEX IF NOT EXISTS idx_workout_logs_student_id ON public.workout_logs(student_id);

-- Create index for queries by session
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_id ON public.workout_logs(training_session_id);

-- Create index for queries by date
CREATE INDEX IF NOT EXISTS idx_workout_logs_created_at ON public.workout_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own logs
CREATE POLICY "Students can view own workout logs"
ON public.workout_logs
FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE id = (SELECT auth.uid())
    )
);

-- Policy: Students can insert their own logs
CREATE POLICY "Students can insert own workout logs"
ON public.workout_logs
FOR INSERT
TO authenticated
WITH CHECK (
    student_id IN (
        SELECT id FROM public.students WHERE id = (SELECT auth.uid())
    )
);

-- Policy: Students can update their own logs
CREATE POLICY "Students can update own workout logs"
ON public.workout_logs
FOR UPDATE
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE id = (SELECT auth.uid())
    )
);

-- Policy: Coaches can view logs of their students
CREATE POLICY "Coaches can view student workout logs"
ON public.workout_logs
FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE coach_id = (SELECT auth.uid())
    )
);

-- Add comment describing the table
COMMENT ON TABLE public.workout_logs IS 'Stores exercise execution logs with set-by-set data including weight, reps, RPE, and RIR';
COMMENT ON COLUMN public.workout_logs.sets_data IS 'JSONB array: [{ setNumber: int, weight: number, reps: number, rpe: number|null, rir: number|null, completed: boolean, completedAt: string|null }]';
