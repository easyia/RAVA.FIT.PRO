import { supabase } from "@/lib/supabase";
import { WorkoutLog, WorkoutLogInsert } from "@/types/supabase";

// =============================================
// WORKOUT LOG SERVICE
// Handles persistence of workout execution data
// =============================================

/**
 * Save a workout session log to the database
 * @param logData - The workout log data to insert
 * @returns The inserted workout log or throws error
 */
export async function saveWorkoutSession(logData: WorkoutLogInsert): Promise<WorkoutLog> {
    const { data, error } = await supabase
        .from('workout_logs')
        .insert(logData)
        .select()
        .single();

    if (error) {
        console.error("[workoutLogService] Error saving workout log:", error);
        throw new Error(error.message || "Erro ao salvar o treino");
    }

    return data;
}

/**
 * Save multiple exercise logs for a workout session
 * @param logs - Array of workout logs to insert
 * @returns Array of inserted logs or throws error
 */
export async function saveMultipleWorkoutLogs(logs: WorkoutLogInsert[]): Promise<WorkoutLog[]> {
    if (logs.length === 0) return [];

    const { data, error } = await supabase
        .from('workout_logs')
        .insert(logs)
        .select();

    if (error) {
        console.error("[workoutLogService] Error saving workout logs:", error);
        throw new Error(error.message || "Erro ao salvar os logs do treino");
    }

    return data || [];
}

/**
 * Get workout logs for a student
 * @param studentId - The student ID
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Array of workout logs
 */
export async function getWorkoutLogs(studentId: string, limit = 50): Promise<WorkoutLog[]> {
    const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[workoutLogService] Error fetching workout logs:", error);
        throw new Error(error.message || "Erro ao buscar logs de treino");
    }

    return data || [];
}

/**
 * Get workout logs for a specific training session
 * @param sessionId - The training session ID
 * @returns Array of workout logs for that session
 */
export async function getWorkoutLogsBySession(sessionId: string): Promise<WorkoutLog[]> {
    const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('training_session_id', sessionId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("[workoutLogService] Error fetching session logs:", error);
        throw new Error(error.message || "Erro ao buscar logs da sessão");
    }

    return data || [];
}
