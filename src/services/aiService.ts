import { supabase } from "@/lib/supabase";
import {
    getStudentDetails,
    getTrainingPrograms,
    getMealPlans,
    getPhysicalAssessments
} from "./studentService";

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function getStudentFullContext(studentId: string) {
    const [details, programs, mealPlans, assessments] = await Promise.all([
        getStudentDetails(studentId),
        getTrainingPrograms(studentId),
        getMealPlans(studentId),
        getPhysicalAssessments(studentId)
    ]);

    const activeProgram = programs && programs.length > 0 ? programs[0] : null;
    const activeMealPlan = mealPlans && mealPlans.length > 0 ? mealPlans[0] : null;
    const lastAssessment = assessments && assessments.length > 0 ? assessments[0] : null;
    const anamnesis = details?.anamnesis?.[0];

    let context = `Você é o FIT Assistant, o treinador de IA de alta performance do ecossistema FIT PRO.
Sua missão é ajudar o aluno com base EXCLUSIVA na ficha dele.

DADOS DO ALUNO:
- Nome: ${details?.full_name || 'Aluno'}
- Sexo: ${details?.sex || 'Não informado'}
- Objetivo Principal: ${anamnesis?.main_goal || 'Não definido'}
- Condições Médicas: ${anamnesis?.medical_conditions || 'Nenhuma'}
- Lesões: ${anamnesis?.injuries || 'Nenhuma'}

PROTOCOLO DE TREINO ATUAL:
${activeProgram ? `
Título: ${activeProgram.title || 'Treino Atual'}
Sessões: ${activeProgram.training_sessions?.map((s: any) => `
- Treino ${s.division || ''}: ${s.name || ''} (${s.training_exercises?.length || 0} exercícios)`).join('')}
` : 'Nenhum treino ativo no momento.'}

PROTOCOLO DE DIETA ATUAL:
${activeMealPlan ? `
Título: ${activeMealPlan.title || 'Dieta Atual'}
Meta: ${activeMealPlan.total_calories || 0} kcal (P: ${activeMealPlan.total_proteins || 0}g, C: ${activeMealPlan.total_carbs || 0}g, G: ${activeMealPlan.total_fats || 0}g)
Refeições: ${activeMealPlan.meals?.map((m: any) => `
- ${m.name || 'Refeição'} (${m.meal_time || ''}): ${m.meal_foods?.map((f: any) => f.name).join(', ') || 'Nenhum alimento cadastrado'}`).join('')}
` : 'Nenhuma dieta ativa no momento.'}

ÚLTIMA AVALIAÇÃO FÍSICA:
${lastAssessment ? `
Data: ${lastAssessment.assessment_date ? new Date(lastAssessment.assessment_date).toLocaleDateString() : 'N/A'}
Peso: ${lastAssessment.weight || 0}kg
Gordura corporal: ${lastAssessment.body_fat || 0}%
Massa muscular: ${lastAssessment.muscle_mass || 0}kg
` : 'Nenhuma avaliação realizada ainda.'}

INSTRUÇÕES:
1. Seja motivador, técnico (Elite) e direto.
2. Se o aluno perguntar algo fora do contexto, tente relacionar com a saúde e performance dele.
3. SEMPRE use os dados acima para personalizar a resposta.
4. Se ele perguntar sobre substituição de alimentos, use a meta de macros dele como base.
`;

    return context;
}

export async function sendStudentChatMessage(studentId: string, messages: ChatMessage[]) {
    const context = await getStudentFullContext(studentId);

    // Add context as system message at the beginning
    const fullMessages = [
        { role: 'system', content: context },
        ...messages
    ];

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase.functions.invoke('student-chat', {
        body: { messages: fullMessages },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) {
        console.error("Erro na chamada da IA:", error);
        throw error;
    }
    return data;
}

export async function sendMessageToCoach(studentId: string, coachId: string, content: string) {
    const { error } = await supabase
        .from('student_messages')
        .insert({
            student_id: studentId,
            coach_id: coachId,
            content: content,
            sender_type: 'student'
        });

    if (error) throw error;
}

export async function getChatMessages(studentId: string, coachId: string) {
    const { data, error } = await supabase
        .from('student_messages')
        .select('*')
        .eq('student_id', studentId)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}

export async function sendMessageFromCoach(studentId: string, coachId: string, content: string) {
    const { error } = await supabase
        .from('student_messages')
        .insert({
            student_id: studentId,
            coach_id: coachId,
            content: content,
            sender_type: 'coach'
        });

    if (error) throw error;
}

export async function getCoachChats(coachId: string) {
    const { data, error } = await supabase
        .from('student_messages')
        .select(`
            student_id,
            content,
            created_at,
            sender_type,
            students!inner (
                full_name,
                avatar_url
            )
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by student_id to get latest message per student
    const chatsMap = new Map();
    data.forEach((m: any) => {
        if (!chatsMap.has(m.student_id)) {
            chatsMap.set(m.student_id, {
                studentId: m.student_id,
                studentName: m.students?.full_name,
                studentAvatar: m.students?.avatar_url,
                lastMessage: m.content,
                lastTime: m.created_at,
                senderType: m.sender_type
            });
        }
    });

    return Array.from(chatsMap.values());
}
