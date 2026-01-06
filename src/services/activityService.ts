import { Activity, CalendarEvent } from "@/types/activity";
import { supabase } from "@/lib/supabase";

export async function getRecentActivities(): Promise<Activity[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Buscar novas avaliações
  const { data: assessments } = await supabase
    .from('physical_assessments')
    .select(`
      id,
      assessment_date,
      student_id,
      students!inner (
        full_name,
        avatar_url,
        coach_id
      )
    `)
    .eq('students.coach_id', user.id)
    .order('assessment_date', { ascending: false })
    .limit(5);

  // 2. Buscar novos alunos aguardando aprovação (Anamnese concluída)
  const { data: newStudents } = await supabase
    .from('students')
    .select(`
      id,
      full_name,
      avatar_url,
      updated_at,
      status
    `)
    .eq('coach_id', user.id)
    .eq('status', 'pending_approval')
    .order('updated_at', { ascending: false })
    .limit(5);

  // 3. Buscar mensagens dos alunos
  const { data: messages } = await supabase
    .from('student_messages')
    .select(`
      id,
      content,
      created_at,
      student_id,
      students!inner (
        full_name,
        avatar_url,
        coach_id
      )
    `)
    .eq('students.coach_id', user.id)
    .eq('sender_type', 'student')
    .order('created_at', { ascending: false })
    .limit(5);

  const activities: Activity[] = [];

  if (assessments) {
    activities.push(...assessments.map((a: any) => ({
      id: `assessment-${a.id}`,
      studentId: a.student_id,
      studentName: a.students?.full_name || 'Desconhecido',
      studentAvatar: a.students?.avatar_url || '',
      message: `Realizou uma nova avaliação física`,
      time: a.assessment_date,
      type: 'assessment' as const
    })));
  }

  if (newStudents) {
    activities.push(...newStudents.map((s: any) => ({
      id: `anamnesis-${s.id}`,
      studentId: s.id,
      studentName: s.full_name,
      studentAvatar: s.avatar_url || '',
      message: `Concluiu a anamnese e aguarda aprovação`,
      time: s.updated_at,
      type: 'anamnesis' as const
    })));
  }

  if (messages) {
    activities.push(...messages.map((m: any) => ({
      id: `message-${m.id}`,
      studentId: m.student_id,
      studentName: m.students?.full_name || 'Desconhecido',
      studentAvatar: m.students?.avatar_url || '',
      message: m.content,
      time: m.created_at,
      type: 'message' as const
    })));
  }

  // Ordenar tudo por tempo decrescente e limitar
  return activities
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('calendar_events')
    .select('event_date, student_id, type')
    .eq('coach_id', user.id);

  if (error) {
    console.error("Erro ao buscar eventos:", error);
    return [];
  }

  return data.map(e => ({
    date: e.event_date,
    studentId: e.student_id,
    type: e.type as 'session' | 'assessment'
  }));
}

export async function scheduleNextAssessment(studentId: string, date: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { error } = await supabase
    .from('calendar_events')
    .insert({
      coach_id: user.id,
      student_id: studentId,
      title: 'Próxima Avaliação Física',
      event_date: date,
      type: 'assessment'
    });

  if (error) throw error;
}
