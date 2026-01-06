-- Migration: 20260105000001_student_onboarding_and_phd_anamnesis.sql
-- Description: Adiciona campos da Anamnese PhD e refina o status de aprovação do aluno.

-- 1. Melhorias na tabela de Coaches
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE public.coaches ADD COLUMN IF NOT EXISTS bio text;

-- 2. Expansão da Anamnese (PhD Level)
ALTER TABLE public.anamnesis
ADD COLUMN IF NOT EXISTS weight_habitual numeric,
ADD COLUMN IF NOT EXISTS weight_max_adult numeric,
ADD COLUMN IF NOT EXISTS weight_min_adult numeric,
ADD COLUMN IF NOT EXISTS weight_variations text,
ADD COLUMN IF NOT EXISTS motivation_level int,
ADD COLUMN IF NOT EXISTS commitment_diet int,
ADD COLUMN IF NOT EXISTS accept_progressive_training boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS training_time_session int,
ADD COLUMN IF NOT EXISTS training_environment text,
ADD COLUMN IF NOT EXISTS sport_specialty text,
ADD COLUMN IF NOT EXISTS sport_level text,
ADD COLUMN IF NOT EXISTS sport_calendar text,
ADD COLUMN IF NOT EXISTS use_hormones text,
ADD COLUMN IF NOT EXISTS food_intolerances text,
ADD COLUMN IF NOT EXISTS daily_pain_scale int,
ADD COLUMN IF NOT EXISTS exercises_pain text,
ADD COLUMN IF NOT EXISTS digestive_alterations text,
ADD COLUMN IF NOT EXISTS evacuation_frequency text,
ADD COLUMN IF NOT EXISTS evacuation_consistency text,
ADD COLUMN IF NOT EXISTS hydration_daily numeric,
ADD COLUMN IF NOT EXISTS other_drinks text,
ADD COLUMN IF NOT EXISTS previous_diets text,
ADD COLUMN IF NOT EXISTS relationship_with_food text,
ADD COLUMN IF NOT EXISTS smoking_frequency text,
ADD COLUMN IF NOT EXISTS smoking_time text,
ADD COLUMN IF NOT EXISTS alcohol_type text,
ADD COLUMN IF NOT EXISTS alcohol_frequency text,
ADD COLUMN IF NOT EXISTS alcohol_quantity text,
ADD COLUMN IF NOT EXISTS non_consumed_foods text,
ADD COLUMN IF NOT EXISTS daily_routine text,
ADD COLUMN IF NOT EXISTS wake_up_time time,
ADD COLUMN IF NOT EXISTS sleep_time time,
ADD COLUMN IF NOT EXISTS sleep_quality text,
ADD COLUMN IF NOT EXISTS stress_factors text,
ADD COLUMN IF NOT EXISTS diet_recall_breakfast text,
ADD COLUMN IF NOT EXISTS diet_recall_snacks text,
ADD COLUMN IF NOT EXISTS diet_recall_lunch text,
ADD COLUMN IF NOT EXISTS diet_recall_dinner text,
ADD COLUMN IF NOT EXISTS diet_recall_supper text,
ADD COLUMN IF NOT EXISTS diet_portion_size text,
ADD COLUMN IF NOT EXISTS supplements_current text,
ADD COLUMN IF NOT EXISTS supplements_previous text,
ADD COLUMN IF NOT EXISTS recent_lab_exams text,
ADD COLUMN IF NOT EXISTS women_cycle text,
ADD COLUMN IF NOT EXISTS women_gestation text,
ADD COLUMN IF NOT EXISTS competition_date date,
ADD COLUMN IF NOT EXISTS training_phase text,
ADD COLUMN IF NOT EXISTS lgpd_accepted boolean DEFAULT false;

-- 3. Atualização do Trigger para status 'pending_approval'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_coach_id uuid;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'coach');
  v_coach_id := (new.raw_user_meta_data->>'coach_id')::uuid;

  IF v_role = 'student' THEN
      -- Se o coach id for nulo, o aluno está se cadastrando sem convite direto (precisa ser vinculado depois ou via link)
      INSERT INTO public.students (id, coach_id, full_name, email, status)
      VALUES (
        new.id,
        v_coach_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Aluno'),
        new.email,
        'pending_approval'
      )
      ON CONFLICT (email) DO UPDATE SET 
        id = EXCLUDED.id,
        status = 'pending_approval',
        coach_id = COALESCE(v_coach_id, students.coach_id);
  ELSE
    INSERT INTO public.coaches (id, name, email)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Coach'),
      new.email
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
