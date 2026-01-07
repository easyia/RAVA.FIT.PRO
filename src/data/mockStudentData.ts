// Mock data for student preview/demo purposes
// This file contains realistic sample data for presenting the app to personal trainers

export const mockStudent = {
    id: 'preview-student-001',
    full_name: 'Carlos Eduardo Silva',
    email: 'carlos.demo@fitpro.com',
    phone: '(11) 99876-5432',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=faces',
    birth_date: '1992-03-15',
    sex: 'Masculino',
    status: 'active',
    classification: 'gold',
    service_type: 'presencial',
    coach_id: 'demo-coach',
    legal_consent_at: '2025-12-01T10:00:00Z',
    terms_accepted_at: '2025-12-01T10:00:00Z',
    created_at: '2025-12-01T10:00:00Z',
};

export const mockCoach = {
    id: 'demo-coach',
    name: 'Prof. Anderson Lima',
    email: 'anderson@fitpro.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
    specialty: 'Hipertrofia e Performance',
    bio: 'Especialista em transformação corporal com mais de 10 anos de experiência.',
};

export const mockAnamnesis = {
    id: 'anamnesis-001',
    student_id: 'preview-student-001',
    main_goal: 'Hipertrofia',
    secondary_goal: 'Definição muscular',
    weight_kg: 82,
    height_cm: 178,
    training_level: 'Intermediário',
    medical_conditions: 'Nenhuma',
    medications: 'Nenhum',
    diet_habits: 'Alimentação equilibrada, 4 refeições por dia',
    sleep_pattern: '7-8 horas por noite',
    stress_level: 'Moderado',
    uses_ergogenics: true,
    uses_ergogenics_details: 'Creatina 5g/dia, Whey Protein pós-treino',
};

export const mockTrainingProgram = {
    id: 'program-001',
    student_id: 'preview-student-001',
    coach_id: 'demo-coach',
    title: 'Hipertrofia Fase 2 - Intensificação',
    number_weeks: 8,
    start_date: '2026-01-06',
    status: 'active',
    training_sessions: [
        {
            id: 'session-a',
            division: 'A',
            name: 'Peito, Ombro e Tríceps',
            training_exercises: [
                { id: 'ex-1', name: 'Supino Reto com Barra', sets: 4, reps_min: 8, reps_max: 10, rest_time: '90s', main_muscle_group: 'Peitoral' },
                { id: 'ex-2', name: 'Supino Inclinado com Halteres', sets: 3, reps_min: 10, reps_max: 12, rest_time: '60s', main_muscle_group: 'Peitoral' },
                { id: 'ex-3', name: 'Crucifixo na Polia', sets: 3, reps_min: 12, reps_max: 15, rest_time: '45s', main_muscle_group: 'Peitoral' },
                { id: 'ex-4', name: 'Desenvolvimento com Halteres', sets: 4, reps_min: 8, reps_max: 10, rest_time: '90s', main_muscle_group: 'Deltóide' },
                { id: 'ex-5', name: 'Elevação Lateral', sets: 3, reps_min: 12, reps_max: 15, rest_time: '45s', main_muscle_group: 'Deltóide' },
                { id: 'ex-6', name: 'Tríceps Corda', sets: 3, reps_min: 10, reps_max: 12, rest_time: '60s', main_muscle_group: 'Tríceps' },
            ]
        },
        {
            id: 'session-b',
            division: 'B',
            name: 'Costas e Bíceps',
            training_exercises: [
                { id: 'ex-7', name: 'Puxada Frontal', sets: 4, reps_min: 8, reps_max: 10, rest_time: '90s', main_muscle_group: 'Dorsal' },
                { id: 'ex-8', name: 'Remada Curvada', sets: 4, reps_min: 8, reps_max: 10, rest_time: '90s', main_muscle_group: 'Dorsal' },
                { id: 'ex-9', name: 'Remada Unilateral', sets: 3, reps_min: 10, reps_max: 12, rest_time: '60s', main_muscle_group: 'Dorsal' },
                { id: 'ex-10', name: 'Rosca Direta com Barra', sets: 3, reps_min: 10, reps_max: 12, rest_time: '60s', main_muscle_group: 'Bíceps' },
                { id: 'ex-11', name: 'Rosca Martelo', sets: 3, reps_min: 12, reps_max: 15, rest_time: '45s', main_muscle_group: 'Bíceps' },
            ]
        },
        {
            id: 'session-c',
            division: 'C',
            name: 'Pernas e Glúteos',
            training_exercises: [
                { id: 'ex-12', name: 'Agachamento Livre', sets: 4, reps_min: 8, reps_max: 10, rest_time: '120s', main_muscle_group: 'Quadríceps' },
                { id: 'ex-13', name: 'Leg Press 45°', sets: 4, reps_min: 10, reps_max: 12, rest_time: '90s', main_muscle_group: 'Quadríceps' },
                { id: 'ex-14', name: 'Cadeira Extensora', sets: 3, reps_min: 12, reps_max: 15, rest_time: '60s', main_muscle_group: 'Quadríceps' },
                { id: 'ex-15', name: 'Mesa Flexora', sets: 4, reps_min: 10, reps_max: 12, rest_time: '60s', main_muscle_group: 'Posterior' },
                { id: 'ex-16', name: 'Stiff', sets: 3, reps_min: 10, reps_max: 12, rest_time: '90s', main_muscle_group: 'Posterior' },
                { id: 'ex-17', name: 'Panturrilha no Leg Press', sets: 4, reps_min: 15, reps_max: 20, rest_time: '45s', main_muscle_group: 'Panturrilha' },
            ]
        }
    ]
};

export const mockMealPlan = {
    id: 'meal-001',
    student_id: 'preview-student-001',
    coach_id: 'demo-coach',
    title: 'Dieta Hipercalórica - Ganho de Massa',
    goal: 'Hipertrofia',
    total_calories: 2800,
    total_proteins: 180,
    total_carbs: 320,
    total_fats: 85,
    status: 'active',
    meals: [
        {
            id: 'meal-1',
            name: 'Café da Manhã',
            meal_time: '07:00',
            foods: [
                { name: 'Ovos mexidos', quantity: 4, unit: 'unidades' },
                { name: 'Pão integral', quantity: 2, unit: 'fatias' },
                { name: 'Banana', quantity: 1, unit: 'unidade' },
                { name: 'Pasta de amendoim', quantity: 30, unit: 'g' },
            ]
        },
        {
            id: 'meal-2',
            name: 'Lanche da Manhã',
            meal_time: '10:00',
            foods: [
                { name: 'Whey Protein', quantity: 30, unit: 'g' },
                { name: 'Aveia', quantity: 40, unit: 'g' },
                { name: 'Morango', quantity: 100, unit: 'g' },
            ]
        },
        {
            id: 'meal-3',
            name: 'Almoço',
            meal_time: '12:30',
            foods: [
                { name: 'Frango grelhado', quantity: 200, unit: 'g' },
                { name: 'Arroz branco', quantity: 150, unit: 'g' },
                { name: 'Feijão', quantity: 80, unit: 'g' },
                { name: 'Brócolis', quantity: 100, unit: 'g' },
                { name: 'Azeite', quantity: 1, unit: 'colher' },
            ]
        },
        {
            id: 'meal-4',
            name: 'Pré-Treino',
            meal_time: '15:30',
            foods: [
                { name: 'Batata doce', quantity: 200, unit: 'g' },
                { name: 'Frango desfiado', quantity: 100, unit: 'g' },
            ]
        },
        {
            id: 'meal-5',
            name: 'Pós-Treino',
            meal_time: '18:00',
            foods: [
                { name: 'Whey Protein', quantity: 40, unit: 'g' },
                { name: 'Dextrose', quantity: 30, unit: 'g' },
                { name: 'Creatina', quantity: 5, unit: 'g' },
            ]
        },
        {
            id: 'meal-6',
            name: 'Jantar',
            meal_time: '20:00',
            foods: [
                { name: 'Carne vermelha magra', quantity: 180, unit: 'g' },
                { name: 'Arroz', quantity: 120, unit: 'g' },
                { name: 'Salada verde', quantity: 150, unit: 'g' },
            ]
        },
        {
            id: 'meal-7',
            name: 'Ceia',
            meal_time: '22:00',
            foods: [
                { name: 'Caseína', quantity: 30, unit: 'g' },
                { name: 'Amendoim', quantity: 20, unit: 'g' },
            ]
        }
    ]
};

export const mockAssessments = [
    {
        id: 'assessment-1',
        student_id: 'preview-student-001',
        assessment_date: '2025-11-01',
        weight: 78.5,
        height: 178,
        bmi: 24.8,
        body_fat: 18.2,
        muscle_mass: 32.1,
        chest: 98,
        waist: 82,
        hip: 96,
        abdomen: 84,
        arm_right_contracted: 35,
        arm_left_contracted: 34.5,
        thigh_right_medial: 56,
        thigh_left_medial: 55.5,
        calf_right: 38,
        calf_left: 37.5,
        abdominal_fold: 18,
        suprailiac_fold: 14,
        triceps_fold: 12,
        subscapular_fold: 16,
    },
    {
        id: 'assessment-2',
        student_id: 'preview-student-001',
        assessment_date: '2025-12-01',
        weight: 80.2,
        height: 178,
        bmi: 25.3,
        body_fat: 17.5,
        muscle_mass: 33.8,
        chest: 100,
        waist: 81,
        hip: 97,
        abdomen: 83,
        arm_right_contracted: 36,
        arm_left_contracted: 35.5,
        thigh_right_medial: 57,
        thigh_left_medial: 56.5,
        calf_right: 38.5,
        calf_left: 38,
        abdominal_fold: 16,
        suprailiac_fold: 12,
        triceps_fold: 11,
        subscapular_fold: 14,
    },
    {
        id: 'assessment-3',
        student_id: 'preview-student-001',
        assessment_date: '2026-01-05',
        weight: 82.0,
        height: 178,
        bmi: 25.9,
        body_fat: 16.8,
        muscle_mass: 35.2,
        chest: 102,
        waist: 80,
        hip: 98,
        abdomen: 82,
        arm_right_contracted: 37,
        arm_left_contracted: 36.5,
        thigh_right_medial: 58,
        thigh_left_medial: 57.5,
        calf_right: 39,
        calf_left: 38.5,
        abdominal_fold: 14,
        suprailiac_fold: 10,
        triceps_fold: 10,
        subscapular_fold: 12,
        postural_notes: 'Leve anteriorização de ombros, melhora significativa na estabilização do core.',
        general_notes: 'Excelente evolução! Ganho de 3.1kg de massa magra e redução de 1.4% de gordura em 2 meses.',
    }
];

export const mockFeedbacks = [
    {
        id: 'feedback-1',
        student_id: 'preview-student-001',
        created_at: '2025-12-08',
        training_count: 5,
        fatigue_level: 6,
        sleep_quality: 7,
        has_pain: false,
        load_perception: 'Treinos estão bem desafiadores, conseguindo progredir carga.',
    },
    {
        id: 'feedback-2',
        student_id: 'preview-student-001',
        created_at: '2025-12-15',
        training_count: 4,
        fatigue_level: 7,
        sleep_quality: 6,
        has_pain: true,
        pain_location: 'Ombro direito',
        pain_intensity: 3,
        load_perception: 'Semana mais pesada, senti um desconforto leve no ombro.',
    },
    {
        id: 'feedback-3',
        student_id: 'preview-student-001',
        created_at: '2025-12-22',
        training_count: 5,
        fatigue_level: 5,
        sleep_quality: 8,
        has_pain: false,
        load_perception: 'Melhor semana! Me senti muito bem nos treinos.',
    },
    {
        id: 'feedback-4',
        student_id: 'preview-student-001',
        created_at: '2025-12-29',
        training_count: 4,
        fatigue_level: 4,
        sleep_quality: 8,
        has_pain: false,
        load_perception: 'Semana de deload foi perfeita para recuperar.',
    },
    {
        id: 'feedback-5',
        student_id: 'preview-student-001',
        created_at: '2026-01-05',
        training_count: 5,
        fatigue_level: 6,
        sleep_quality: 7,
        has_pain: false,
        load_perception: 'Voltando com tudo! Motivação em alta para 2026.',
    }
];

export const mockSubscription = {
    id: 'sub-001',
    student_id: 'preview-student-001',
    plan_id: 'plan-gold',
    status: 'active',
    start_date: '2025-12-01',
    end_date: '2026-02-28',
    payment_day: 5,
    contract_accepted_at: '2025-12-01T10:00:00Z',
    plan: {
        id: 'plan-gold',
        name: 'Plano Gold - Acompanhamento Completo',
        price: 350,
        type: 'recurring',
        duration_months: 3,
    }
};

export const mockCalendarEvents = [
    { id: 'ev-1', title: 'Treino A - Peito/Ombro/Tríceps', date: '2026-01-06', type: 'training' },
    { id: 'ev-2', title: 'Treino B - Costas/Bíceps', date: '2026-01-07', type: 'training' },
    { id: 'ev-3', title: 'Treino C - Pernas', date: '2026-01-08', type: 'training' },
    { id: 'ev-4', title: 'Descanso Ativo', date: '2026-01-09', type: 'rest' },
    { id: 'ev-5', title: 'Treino A - Peito/Ombro/Tríceps', date: '2026-01-10', type: 'training' },
    { id: 'ev-6', title: 'Check-in Semanal', date: '2026-01-12', type: 'checkin' },
];
