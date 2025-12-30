-- 1. COACHES
CREATE TABLE coaches (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own profile" 
ON coaches FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Coaches can update their own profile" 
ON coaches FOR UPDATE 
USING (auth.uid() = id);

-- 2. STUDENTS
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  birth_date date,
  sex text,
  phone text,
  email text,
  profession text,
  marital_status text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach accesses own students"
ON students FOR ALL
USING (auth.uid() = coach_id);

-- 3. ANAMNESIS
CREATE TABLE anamnesis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- Histórico de Saúde
  medical_conditions text,
  surgeries text,
  medications text,
  family_history text,
  injuries text,
  allergies text,
  -- Hábitos de Vida
  diet_habits text,
  alcohol_use text,
  sleep_pattern text,
  physical_activity_history text,
  stress_level text,
  -- Composição Corporal
  weight_kg numeric,
  height_cm numeric,
  bmi numeric,
  body_fat_percentage numeric,
  lean_mass numeric,
  fat_mass numeric,
  -- Postural / Funcional
  postural_assessment text,
  mobility_assessment text,
  strength_assessment text,
  balance_coordination text,
  -- Objetivos
  main_goal text,
  secondary_goal text,
  goal_deadline text,
  motivation_barriers text,
  -- Preferências / Limitações
  training_preferences text,
  equipment_availability text,
  schedule_availability text,
  physical_limitations text,
  -- Risco
  par_q_result text,
  contraindications text,
  supervision_level text,
  -- Plano inicial
  initial_training_frequency text,
  initial_training_type text,
  initial_nutrition_notes text,
  short_term_goals text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE anamnesis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach accesses students anamnesis"
ON anamnesis FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = anamnesis.student_id 
    AND students.coach_id = auth.uid()
  )
);

-- 4. TRAINING PROGRAMS
CREATE TABLE training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES coaches(id),
  number_weeks int,
  sessions_per_week int,
  max_exercises_per_session int,
  start_date date,
  status text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach accesses own training programs"
ON training_programs FOR ALL
USING (auth.uid() = coach_id);

-- 5. TRAINING SESSIONS
CREATE TABLE training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_program_id uuid NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  division text, -- A, B, C
  name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach accesses training sessions"
ON training_sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM training_programs
    WHERE training_programs.id = training_sessions.training_program_id
    AND training_programs.coach_id = auth.uid()
  )
);

-- 6. TRAINING EXERCISES
CREATE TABLE training_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  execution_order int,
  sets int,
  reps_min int,
  reps_max int,
  main_muscle_group text,
  intensity_methods text,
  rest_time text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach accesses training exercises"
ON training_exercises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM training_sessions
    JOIN training_programs ON training_programs.id = training_sessions.training_program_id
    WHERE training_sessions.id = training_exercises.training_session_id
    AND training_programs.coach_id = auth.uid()
  )
);

-- 7. MEAL PLANS
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES coaches(id),
  title text NOT NULL,
  goal text,
  total_calories int,
  total_proteins numeric,
  total_carbs numeric,
  total_fats numeric,
  prescription_date date,
  status text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach accesses own meal plans"
ON meal_plans FOR ALL
USING (auth.uid() = coach_id);

-- 8. MEALS
CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  name text NOT NULL,
  meal_time time,
  type text,
  proteins_g numeric,
  carbs_g numeric,
  fats_g numeric,
  calories int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach accesses meals"
ON meals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meals.meal_plan_id
    AND meal_plans.coach_id = auth.uid()
  )
);

-- 9. MEAL FOODS
CREATE TABLE meal_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric,
  unit text,
  order_index int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach accesses meal foods"
ON meal_foods FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meals
    JOIN meal_plans ON meal_plans.id = meals.meal_plan_id
    WHERE meals.id = meal_foods.meal_id
    AND meal_plans.coach_id = auth.uid()
  )
);

-- 10. MEAL SUBSTITUTIONS
CREATE TABLE meal_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_food_id uuid NOT NULL REFERENCES meal_foods(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric,
  unit text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach accesses meal substitutions"
ON meal_substitutions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM meal_foods
    JOIN meals ON meals.id = meal_foods.meal_id
    JOIN meal_plans ON meal_plans.id = meals.meal_plan_id
    WHERE meal_foods.id = meal_substitutions.meal_food_id
    AND meal_plans.coach_id = auth.uid()
  )
);
