-- Create meal_logs table
CREATE TABLE IF NOT EXISTS public.meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
    meal_name TEXT NOT NULL,
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- Policies for meal_logs
CREATE POLICY "Students can manage their own meal logs"
ON public.meal_logs FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Coaches can view meal logs of their students"
ON public.meal_logs FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE coach_id = (SELECT auth.uid())
    )
);

-- Create storage bucket for meals (if storage schema exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('meals', 'meals', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'meals' );

CREATE POLICY "Student Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'meals' 
    AND (storage.foldername(name))[2] = auth.uid()::text
);
