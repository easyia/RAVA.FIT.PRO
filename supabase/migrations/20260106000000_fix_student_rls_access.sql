
-- 1. Permite que o aluno veja seu próprio perfil
CREATE POLICY "Student can view own profile"
ON students FOR SELECT
USING (auth.uid() = id);

-- 2. Permite que o aluno veja sua própria anamnese
CREATE POLICY "Student can view own anamnesis"
ON anamnesis FOR SELECT
USING (student_id = auth.uid());

-- 3. Permite que o aluno veja seus programas de treino
CREATE POLICY "Student can view own training programs"
ON training_programs FOR SELECT
USING (student_id = auth.uid());

-- 4. Permite que o aluno veja suas sessões de treino
CREATE POLICY "Student can view own training sessions"
ON training_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM training_programs
    WHERE training_programs.id = training_sessions.training_program_id
    AND training_programs.student_id = auth.uid()
  )
);

-- 5. Permite que o aluno veja seus exercícios
CREATE POLICY "Student can view own training exercises"
ON training_exercises FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM training_sessions
    JOIN training_programs ON training_programs.id = training_sessions.training_program_id
    WHERE training_sessions.id = training_exercises.training_session_id
    AND training_programs.student_id = auth.uid()
  )
);

-- 6. Permite que o aluno veja seus planos alimentares
CREATE POLICY "Student can view own meal plans"
ON meal_plans FOR SELECT
USING (student_id = auth.uid());

-- 7. Permite que o aluno veja suas refeições
CREATE POLICY "Student can view own meals"
ON meals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meals.meal_plan_id
    AND meal_plans.student_id = auth.uid()
  )
);

-- 8. Permite que o aluno veja os alimentos das refeições
CREATE POLICY "Student can view own meal foods"
ON meal_foods FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meals
    JOIN meal_plans ON meal_plans.id = meals.meal_plan_id
    WHERE meals.id = meal_foods.meal_id
    AND meal_plans.student_id = auth.uid()
  )
);

-- 9. Permite que o aluno veja as substituições
CREATE POLICY "Student can view own meal substitutions"
ON meal_substitutions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meal_foods
    JOIN meals ON meals.id = meal_foods.meal_id
    JOIN meal_plans ON meal_plans.id = meals.meal_plan_id
    WHERE meal_foods.id = meal_substitutions.meal_food_id
    AND meal_plans.student_id = auth.uid()
  )
);

-- 10. Permite que o aluno veja o perfil do seu coach
CREATE POLICY "Student can view their coach profile"
ON coaches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE students.coach_id = coaches.id
    AND students.id = auth.uid()
  )
);
