/**
 * Supabase Database Types
 * Custom interfaces for tables and JSONB structures
 */

// =============================================
// WORKOUT LOGS
// =============================================

/**
 * Individual set execution data stored in sets_data JSONB array
 */
export interface SetLogEntry {
    /** 1-indexed set number */
    setNumber: number;
    /** Weight used in kg */
    weight: number;
    /** Actual reps performed */
    reps: number;
    /** Rate of Perceived Exertion (1-10 scale) */
    rpe: number | null;
    /** Reps in Reserve (0-5 scale) */
    rir: number | null;
    /** Whether the set was completed */
    completed: boolean;
    /** ISO timestamp when set was marked complete */
    completedAt: string | null;
}

/**
 * Workout log row from the workout_logs table
 */
export interface WorkoutLog {
    id: string;
    student_id: string;
    training_session_id: string | null;
    exercise_id: string | null;
    exercise_name: string;
    sets_data: SetLogEntry[];
    created_at: string;
    updated_at: string;
}

/**
 * Insert payload for creating a new workout log
 */
export interface WorkoutLogInsert {
    student_id: string;
    training_session_id?: string | null;
    exercise_id?: string | null;
    exercise_name: string;
    sets_data: SetLogEntry[];
}

/**
 * Update payload for modifying an existing workout log
 */
export interface WorkoutLogUpdate {
    sets_data?: SetLogEntry[];
    updated_at?: string;
}
