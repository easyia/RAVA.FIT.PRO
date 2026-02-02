import { supabase } from "@/lib/supabase";
import { Student } from "@/types/student";

export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      anamnesis (
        main_goal
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching students:", error.message);
    return [];
  }

  return (data || []).map(s => ({
    id: s.id,
    name: s.full_name,
    email: s.email,
    phone: s.phone,
    avatar: s.avatar_url,
    goal: (s.anamnesis?.[0]?.main_goal as any) || 'condicionamento',
    status: s.status === 'active' ? 'ativo' : s.status === 'inactive' ? 'inativo' : s.status === 'pending_approval' ? 'pendente' : 'ativo',
    classification: s.classification || 'bronze',
    serviceType: s.service_type || 'online',
    progress: 0,
    completedTasks: 0,
    totalTasks: 0,
    startDate: s.created_at,
    nextSession: '-',
    lastSession: '-',
  }));
}

export async function getPendingApprovalsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_approval');

  if (error) return 0;
  return count || 0;
}

export async function getActiveStudents(): Promise<Student[]> {
  const students = await getStudents();
  return students.filter(s => s.status === 'ativo' || s.status === 'pendente');
}

export async function uploadFile(file: File, bucket: string = 'avatars'): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id || 'public';

  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error(`Erro no upload (${bucket}):`, uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadAvatar(file: File): Promise<string> {
  return uploadFile(file, 'avatars');
}

export async function fetchContextFiles(): Promise<{ id: string, name: string }[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('context_files')
    .select('id, name')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching context files:", error.message);
    return [];
  }

  return data || [];
}

const cleanData = (data: Record<string, any>) => {
  const cleaned: Record<string, any> = {};
  Object.keys(data).forEach(key => {
    if (Array.isArray(data[key])) {
      cleaned[key] = data[key];
    } else {
      cleaned[key] = data[key] === "" ? null : data[key];
    }
  });
  return cleaned;
};

export async function createStudent(rawFormData: any): Promise<any> {
  const formData = cleanData(rawFormData);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Usuário não autenticado");

  // 1. Inserir na tabela 'students'
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert({
      coach_id: userData.user.id,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      birth_date: formData.birth_date,
      sex: formData.sex,
      cpf: formData.cpf,
      rg: formData.rg,
      profession: formData.profession,
      marital_status: formData.marital_status,
      emergency_contact: formData.emergency_contact,
      emergency_phone: formData.emergency_phone,
      avatar_url: formData.avatar_url,
      classification: formData.classification || 'bronze',
      service_type: formData.service_type || 'online',
      status: 'active'
    })
    .select()
    .single();

  if (studentError) {
    console.error("Erro ao inserir aluno:", studentError);
    throw studentError;
  }

  // 2. Inserir na tabela 'anamnesis'
  const { error: anamnesisError } = await supabase
    .from('anamnesis')
    .insert({
      student_id: student.id,
      medical_conditions: formData.medical_conditions,
      surgeries: formData.surgeries,
      medications: formData.medications,
      family_history: formData.family_history,
      injuries: formData.injuries,
      allergies: formData.allergies,
      diet_habits: formData.diet_habits,
      alcohol_use: formData.alcohol_use,
      sleep_pattern: formData.sleep_pattern,
      physical_activity_history: formData.physical_activity_history,
      stress_level: formData.stress_level,
      weight_kg: (formData.weight_kg && !isNaN(parseFloat(formData.weight_kg))) ? parseFloat(formData.weight_kg) : null,
      height_cm: (formData.height_cm && !isNaN(parseFloat(formData.height_cm))) ? parseFloat(formData.height_cm) : null,
      postural_assessment: formData.postural_assessment,
      mobility_assessment: formData.mobility_assessment,
      strength_assessment: formData.strength_assessment,
      main_goal: formData.primary_goal,
      secondary_goal: formData.secondary_goal,
      goal_deadline: formData.goal_deadline,
      motivation_barriers: formData.motivation_barriers,
      training_preferences: formData.training_preferences,
      equipment_availability: formData.equipment_availability,
      schedule_availability: Array.isArray(formData.available_days) ? formData.available_days.join(',') : formData.schedule_availability,
      par_q_result: formData.par_q_result,
      contraindications: formData.contraindications,
      initial_training_frequency: formData.training_frequency,
      training_level: formData.training_level,
      uses_ergogenics: formData.uses_ergogenics === 'true',
      uses_ergogenics_details: formData.uses_ergogenics_details
    });

  if (anamnesisError) {
    console.error("Erro detalhado ao inserir anamnese:", {
      message: anamnesisError.message,
      details: anamnesisError.details,
      hint: anamnesisError.hint,
      code: anamnesisError.code
    });
    throw anamnesisError;
  }

  return student;
}

export async function getStudentDetails(studentId: string): Promise<any> {
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      anamnesis (*)
    `)
    .eq('id', studentId)
    .single();

  if (studentError) throw studentError;

  return student;
}

export const acceptLegalTerms = async (studentId: string) => {
  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from("students")
    .update({
      legal_consent_at: timestamp,
      terms_accepted_at: timestamp,
      updated_at: timestamp
    })
    .eq("id", studentId);

  if (error) throw error;
};

export async function getStudentProfile(studentId: string): Promise<any> {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      anamnesis (id)
    `)
    .eq('id', studentId)
    .single();

  if (error) throw error;
  return data;
}

export async function getTrainingPrograms(studentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('training_programs')
    .select(`
      *,
      training_sessions (
        *,
        training_exercises (*)
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMealPlans(studentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      meals (
        *,
        meal_foods (
          *,
          meal_substitutions (*)
        )
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
export async function saveTrainingProgram(studentId: string, program: any): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Não autenticado");

  // 0. Desativar treinos anteriores (Exclusividade)
  await supabase
    .from('training_programs')
    .update({ status: 'inactive' })
    .eq('student_id', studentId);

  // 1. Criar programa
  const { data: newProgram, error: progError } = await supabase
    .from('training_programs')
    .insert({
      student_id: studentId,
      coach_id: userData.user.id,
      title: program.title,
      number_weeks: program.weeks,
      start_date: program.startDate,
      end_date: program.endDate,
      status: 'active'
    })
    .select()
    .single();

  if (progError) throw progError;

  // 2. Criar sessões e exercícios
  for (const session of program.sessions) {
    const { data: newSession, error: sessError } = await supabase
      .from('training_sessions')
      .insert({
        training_program_id: newProgram.id,
        division: session.division,
        name: session.name
      })
      .select()
      .single();

    if (sessError) throw sessError;

    if (session.exercises.length > 0) {
      const exercisesToInsert = session.exercises.map((ex: any, idx: number) => ({
        training_session_id: newSession.id,
        name: ex.name,
        sets: ex.sets,
        reps_min: ex.reps_min,
        reps_max: ex.reps_max,
        rest_time: ex.rest_time?.toString(),
        notes: ex.notes,
        main_muscle_group: ex.main_muscle_group,
        execution_order: idx + 1
      }));

      const { error: exError } = await supabase
        .from('training_exercises')
        .insert(exercisesToInsert);

      if (exError) throw exError;
    }
  }
}

export async function setActiveTrainingProgram(studentId: string, programId: string): Promise<void> {
  // 1. Desativar todos os programas do aluno
  const { error: deactivateError } = await supabase
    .from('training_programs')
    .update({ status: 'inactive' })
    .eq('student_id', studentId);

  if (deactivateError) {
    console.error('Erro ao desativar programas:', deactivateError);
    throw deactivateError;
  }

  // 2. Ativar o programa selecionado
  const { error: activateError } = await supabase
    .from('training_programs')
    .update({ status: 'active' })
    .eq('id', programId);

  if (activateError) {
    console.error('Erro ao ativar programa:', activateError);
    throw activateError;
  }
}

export async function setActiveMealPlan(studentId: string, planId: string): Promise<void> {
  // 1. Desativar todos os planos do aluno
  const { error: deactivateError } = await supabase
    .from('meal_plans')
    .update({ status: 'inactive' })
    .eq('student_id', studentId);

  if (deactivateError) {
    console.error('Erro ao desativar planos de dieta:', deactivateError);
    throw deactivateError;
  }

  // 2. Ativar o plano selecionado
  const { error: activateError } = await supabase
    .from('meal_plans')
    .update({ status: 'active' })
    .eq('id', planId);

  if (activateError) {
    console.error('Erro ao ativar plano de dieta:', activateError);
    throw activateError;
  }
}

export async function saveMealPlan(studentId: string, plan: any): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Não autenticado");

  // Helper to sanitize time string to HH:MM
  const sanitizeTime = (timeStr: string) => {
    if (!timeStr) return "08:00";
    // Match first occurrence of HH:MM or HH:MM:SS
    const match = timeStr.match(/(\d{1,2}:\d{2}(:\d{2})?)/);
    if (match) {
      let time = match[1];
      if (time.length === 4) time = "0" + time; // Ensure HH:MM
      return time;
    }
    // Fallback if it's just a number like "8"
    const hourMatch = timeStr.match(/(\d{1,2})/);
    if (hourMatch) {
      const hour = hourMatch[1].padStart(2, '0');
      return `${hour}:00`;
    }
    return "08:00";
  };

  // 0. Desativar dietas anteriores (Exclusividade)
  await supabase
    .from('meal_plans')
    .update({ status: 'inactive' })
    .eq('student_id', studentId);

  // 1. Criar plano
  const { data: newPlan, error: planError } = await supabase
    .from('meal_plans')
    .insert({
      student_id: studentId,
      coach_id: userData.user.id,
      title: plan.title,
      goal: plan.goal,
      total_calories: Math.round(Number(plan.total_calories || 0)),
      total_proteins: Number(plan.total_proteins || 0),
      total_carbs: Number(plan.total_carbs || 0),
      total_fats: Number(plan.total_fats || 0),
      status: 'active'
    })
    .select()
    .single();

  if (planError) throw planError;

  // 2. Criar refeições e alimentos
  for (const meal of plan.meals) {
    const { data: newMeal, error: mealError } = await supabase
      .from('meals')
      .insert({
        meal_plan_id: newPlan.id,
        name: meal.name,
        meal_time: sanitizeTime(meal.time),
        type: meal.type
      })
      .select()
      .single();

    if (mealError) throw mealError;

    if (meal.foods && meal.foods.length > 0) {
      const foodsToInsert = meal.foods.map((food: any, idx: number) => ({
        meal_id: newMeal.id,
        name: food.name,
        quantity: food.quantity ? parseFloat(food.quantity) : 0,
        unit: food.unit,
        order_index: idx + 1
      }));

      const { error: foodError } = await supabase
        .from('meal_foods')
        .insert(foodsToInsert);

      if (foodError) throw foodError;
    }
  }
}

export async function updateStudentStatus(studentId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .update({ status })
    .eq('id', studentId);

  if (error) throw error;
}

export async function deleteStudent(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  if (error) throw error;
}

export async function updateStudent(studentId: string, rawData: any): Promise<void> {
  const data = cleanData(rawData);
  const { error: studentError } = await supabase
    .from('students')
    .update({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      birth_date: data.birth_date,
      sex: data.sex,
      cpf: data.cpf,
      rg: data.rg,
      profession: data.profession,
      marital_status: data.marital_status,
      emergency_contact: data.emergency_contact,
      emergency_phone: data.emergency_phone,
      avatar_url: data.avatar_url,
      classification: data.classification,
      service_type: data.service_type
    })
    .eq('id', studentId);

  if (studentError) {
    console.error("Erro detalhado ao atualizar aluno:", {
      message: studentError.message,
      details: studentError.details,
      code: studentError.code
    });
    throw studentError;
  }

  // Atualizar anamnese
  const { error: anamnesisError } = await supabase
    .from('anamnesis')
    .update({
      medical_conditions: data.medical_conditions,
      surgeries: data.surgeries,
      medications: data.medications,
      family_history: data.family_history,
      injuries: data.injuries,
      allergies: data.allergies,
      diet_habits: data.diet_habits,
      alcohol_use: data.alcohol_use,
      sleep_pattern: data.sleep_pattern,
      physical_activity_history: data.physical_activity_history,
      stress_level: data.stress_level,
      weight_kg: (data.weight_kg && !isNaN(parseFloat(data.weight_kg))) ? parseFloat(data.weight_kg) : null,
      height_cm: (data.height_cm && !isNaN(parseFloat(data.height_cm))) ? parseFloat(data.height_cm) : null,
      postural_assessment: data.postural_assessment,
      mobility_assessment: data.mobility_assessment,
      strength_assessment: data.strength_assessment,
      main_goal: data.primary_goal,
      secondary_goal: data.secondary_goal,
      goal_deadline: data.goal_deadline,
      motivation_barriers: data.motivation_barriers,
      training_preferences: data.training_preferences,
      equipment_availability: data.equipment_availability,
      schedule_availability: Array.isArray(data.available_days) ? data.available_days.join(',') : data.schedule_availability,
      par_q_result: data.par_q_result,
      contraindications: data.contraindications,
      initial_training_frequency: data.training_frequency,
      training_level: data.training_level,
      uses_ergogenics: data.uses_ergogenics === 'true',
      uses_ergogenics_details: data.uses_ergogenics_details
    })
    .eq('student_id', studentId);

  if (anamnesisError) {
    console.error("Erro detalhado ao atualizar anamnese:", {
      message: anamnesisError.message,
      details: anamnesisError.details,
      code: anamnesisError.code
    });
  }
}

export async function getDashboardStats(): Promise<any> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const coachId = userData.user.id;

  // Datas para comparação
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // 1. Total de Alunos
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coachId);

  // 2. Alunos Ativos
  const { count: activeStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coachId)
    .eq('status', 'active');

  // 3. Anamneses Pendentes (Alunos sem registro na tabela anamnesis)
  const { data: allStudents } = await supabase
    .from('students')
    .select('id')
    .eq('coach_id', coachId);

  const studentIds = allStudents?.map(s => s.id) || [];

  const { data: anamnesisData } = await supabase
    .from('anamnesis')
    .select('student_id')
    .in('student_id', studentIds);

  const studentIdsWithAnamnesis = new Set(anamnesisData?.map(a => a.student_id));
  const pendingAnamnesis = studentIds.filter(id => !studentIdsWithAnamnesis.has(id)).length;

  // 4. Protocolos Este Mês vs Mês Passado
  const { count: trainingThisMonth } = await supabase
    .from('training_programs')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coachId)
    .gte('created_at', startOfMonth.toISOString());

  const { count: mealThisMonth } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coachId)
    .gte('created_at', startOfMonth.toISOString());

  const protocolsThisMonth = (trainingThisMonth || 0) + (mealThisMonth || 0);

  // Mês Passado (para tendência)
  const { count: trainingPrevMonth } = await supabase
    .from('training_programs')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coachId)
    .gte('created_at', startOfPreviousMonth.toISOString())
    .lte('created_at', endOfPreviousMonth.toISOString());

  const { count: mealPrevMonth } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coachId)
    .gte('created_at', startOfPreviousMonth.toISOString())
    .lte('created_at', endOfPreviousMonth.toISOString());

  const protocolsPrevMonth = (trainingPrevMonth || 0) + (mealPrevMonth || 0);

  const calcTrend = (current: number, prev: number | null | undefined) => {
    if (current === 0) return null;
    if (prev === undefined || prev === null || prev === 0) return null;
    const diff = ((current - prev) / prev) * 100;
    if (Math.abs(diff) < 0.1) return null; // Consider non-significant changes as null
    return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
  };

  // Cálculos para tendências dos outros cards
  // Total Alunos Mês Passado
  const { count: totalStudentsPrevMonth } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coachId)
    .lte('created_at', endOfPreviousMonth.toISOString());

  // Alunos Ativos Mês Passado (aproximação baseada em data de criação)
  const { count: activeStudentsPrevMonth } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coachId)
    .eq('status', 'active')
    .lte('created_at', endOfPreviousMonth.toISOString());

  // Anamneses Pendentes Mês Passado
  const { data: studentsPrevMonth } = await supabase
    .from('students')
    .select('id')
    .eq('coach_id', coachId)
    .lte('created_at', endOfPreviousMonth.toISOString());

  const studentIdsPrevMonth = studentsPrevMonth?.map(s => s.id) || [];
  const { data: anamnesisPrevMonthData } = await supabase
    .from('anamnesis')
    .select('student_id')
    .in('student_id', studentIdsPrevMonth)
    .lte('created_at', endOfPreviousMonth.toISOString());

  const studentIdsWithAnamnesisPrevMonth = new Set(anamnesisPrevMonthData?.map(a => a.student_id));
  const pendingAnamnesisPrevMonth = studentIdsPrevMonth.filter(id => !studentIdsWithAnamnesisPrevMonth.has(id)).length;

  return {
    totalStudents: totalStudents || 0,
    activeStudents: activeStudents || 0,
    pendingAnamnesis,
    protocolsThisMonth,
    trends: {
      totalStudents: calcTrend(totalStudents || 0, totalStudentsPrevMonth),
      activeStudents: calcTrend(activeStudents || 0, activeStudentsPrevMonth),
      pendingAnamnesis: calcTrend(pendingAnamnesis, pendingAnamnesisPrevMonth),
      protocols: calcTrend(protocolsThisMonth, protocolsPrevMonth)
    }
  };
}
export async function getCoachProfile(): Promise<any> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  if (error) {
    console.error("Error fetching coach profile:", error.message);
    return null;
  }

  return data;
}

export async function getCoachDetailsPublic(coachId: string): Promise<any> {
  const { data, error } = await supabase.rpc('get_public_coach_profile', { p_coach_id: coachId });

  if (error) {
    console.error("Error fetching coach public profile:", error.message);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

export async function updateCoachProfile(data: any): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Não autenticado");

  const { error } = await supabase
    .from('coaches')
    .upsert({
      id: userData.user.id,
      name: data.name,
      email: userData.user.email,
      avatar_url: data.avatar_url,
      phone: data.phone,
      specialty: data.specialty,
      bio: data.bio
    });

  if (error) throw error;
}

export async function createPhysicalAssessment(data: any): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Não autenticado");

  const { error } = await supabase
    .from('physical_assessments')
    .insert({
      student_id: data.student_id,
      coach_id: userData.user.id,
      assessment_date: data.assessment_date,
      weight: data.weight,
      height: data.height,
      bmi: data.bmi,
      body_fat: data.body_fat,
      muscle_mass: data.muscle_mass,
      circumferences: data.circumferences,
      postural_notes: data.postural_notes,
      functional_notes: data.functional_notes,
      general_notes: data.general_notes,
      front_photo_url: data.front_photo_url,
      left_side_photo_url: data.left_side_photo_url,
      right_side_photo_url: data.right_side_photo_url,
      back_photo_url: data.back_photo_url,
      video_url: data.video_url,
      videos: data.videos || [],
      neck: data.neck,
      shoulder: data.shoulder,
      chest: data.chest,
      waist: data.waist,
      abdomen: data.abdomen,
      hip: data.hip,
      arm_right_relaxed: data.arm_right_relaxed,
      arm_left_relaxed: data.arm_left_relaxed,
      arm_right_contracted: data.arm_right_contracted,
      arm_left_contracted: data.arm_left_contracted,
      thigh_right_proximal: data.thigh_right_proximal,
      thigh_left_proximal: data.thigh_left_proximal,
      thigh_right_medial: data.thigh_right_medial,
      thigh_left_medial: data.thigh_left_medial,
      thigh_right_distal: data.thigh_right_distal,
      thigh_left_distal: data.thigh_left_distal,
      calf_right: data.calf_right,
      calf_left: data.calf_left,
      chest_fold: data.chest_fold,
      midaxillary_fold: data.midaxillary_fold,
      triceps_fold: data.triceps_fold,
      subscapular_fold: data.subscapular_fold,
      abdominal_fold: data.abdominal_fold,
      suprailiac_fold: data.suprailiac_fold,
      thigh_fold: data.thigh_fold,
      mobility_notes: data.mobility_notes,
      rm_notes: data.rm_notes
    });

  if (error) throw error;
}

export async function getPhysicalAssessments(studentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('physical_assessments')
    .select('*')
    .eq('student_id', studentId)
    .order('assessment_date', { ascending: false });

  if (error) throw error;
  return data || [];
}
export async function updatePhysicalAssessment(assessmentId: string, data: any): Promise<void> {
  const { error } = await supabase
    .from('physical_assessments')
    .update({
      assessment_date: data.assessment_date,
      weight: data.weight,
      height: data.height,
      bmi: data.bmi,
      body_fat: data.body_fat,
      muscle_mass: data.muscle_mass,
      circumferences: data.circumferences,
      postural_notes: data.postural_notes,
      functional_notes: data.functional_notes,
      general_notes: data.general_notes,
      front_photo_url: data.front_photo_url,
      left_side_photo_url: data.left_side_photo_url,
      right_side_photo_url: data.right_side_photo_url,
      back_photo_url: data.back_photo_url,
      video_url: data.video_url,
      videos: data.videos || [],
      neck: data.neck,
      shoulder: data.shoulder,
      chest: data.chest,
      waist: data.waist,
      abdomen: data.abdomen,
      hip: data.hip,
      arm_right_relaxed: data.arm_right_relaxed,
      arm_left_relaxed: data.arm_left_relaxed,
      arm_right_contracted: data.arm_right_contracted,
      arm_left_contracted: data.arm_left_contracted,
      thigh_right_proximal: data.thigh_right_proximal,
      thigh_left_proximal: data.thigh_left_proximal,
      thigh_right_medial: data.thigh_right_medial,
      thigh_left_medial: data.thigh_left_medial,
      thigh_right_distal: data.thigh_right_distal,
      thigh_left_distal: data.thigh_left_distal,
      calf_right: data.calf_right,
      calf_left: data.calf_left,
      chest_fold: data.chest_fold,
      midaxillary_fold: data.midaxillary_fold,
      triceps_fold: data.triceps_fold,
      subscapular_fold: data.subscapular_fold,
      abdominal_fold: data.abdominal_fold,
      suprailiac_fold: data.suprailiac_fold,
      thigh_fold: data.thigh_fold,
      mobility_notes: data.mobility_notes,
      rm_notes: data.rm_notes
    })
    .eq('id', assessmentId);

  if (error) throw error;
}

export async function deletePhysicalAssessment(assessmentId: string): Promise<void> {
  const { error } = await supabase
    .from('physical_assessments')
    .delete()
    .eq('id', assessmentId);

  if (error) throw error;
}
