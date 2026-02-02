import { create } from 'zustand';

// =============================================
// TYPES
// =============================================

/**
 * Individual set execution data during workout
 */
export interface WorkoutSetExecution {
    setNumber: number;
    weight: number;
    reps: number;
    rpe: number | null;
    rir: number | null;
    completed: boolean;
    completedAt: string | null;
}

/**
 * Partial data for updating a set
 */
export interface SetUpdateData {
    weight?: number;
    reps?: number;
    rpe?: number | null;
    rir?: number | null;
}

/**
 * Workout Session Store State
 */
interface WorkoutSessionState {
    // State
    activeWorkoutId: string | null;
    elapsedTime: number; // Total workout time in seconds
    isResting: boolean;
    restTimeRemaining: number; // Rest timer countdown in seconds
    currentExerciseLogs: Record<string, WorkoutSetExecution[]>; // Key: exerciseId

    // Actions
    startWorkout: (workoutId: string, exercises: { id: string; sets: number }[]) => void;
    endWorkout: () => void;
    logSet: (exerciseId: string, setIndex: number, data: SetUpdateData) => void;
    completeSet: (exerciseId: string, setIndex: number, restTime: number) => void;
    tickTimer: () => void;
    skipRest: () => void;
}

// =============================================
// STORE
// =============================================

export const useWorkoutSessionStore = create<WorkoutSessionState>((set, get) => ({
    // Initial State
    activeWorkoutId: null,
    elapsedTime: 0,
    isResting: false,
    restTimeRemaining: 0,
    currentExerciseLogs: {},

    /**
     * Start a new workout session
     * Initializes empty logs for each exercise with the prescribed number of sets
     */
    startWorkout: (workoutId, exercises) => {
        const logs: Record<string, WorkoutSetExecution[]> = {};

        exercises.forEach((exercise) => {
            logs[exercise.id] = Array.from({ length: exercise.sets }, (_, i) => ({
                setNumber: i + 1,
                weight: 0,
                reps: 0,
                rpe: null,
                rir: null,
                completed: false,
                completedAt: null,
            }));
        });

        set({
            activeWorkoutId: workoutId,
            elapsedTime: 0,
            isResting: false,
            restTimeRemaining: 0,
            currentExerciseLogs: logs,
        });
    },

    /**
     * End the current workout and reset state
     */
    endWorkout: () => {
        set({
            activeWorkoutId: null,
            elapsedTime: 0,
            isResting: false,
            restTimeRemaining: 0,
            currentExerciseLogs: {},
        });
    },

    /**
     * Log/update set data (weight, reps, rpe, rir)
     */
    logSet: (exerciseId, setIndex, data) => {
        const logs = get().currentExerciseLogs;
        const exerciseLogs = logs[exerciseId];

        if (!exerciseLogs || !exerciseLogs[setIndex]) return;

        const updatedSet = {
            ...exerciseLogs[setIndex],
            ...data,
        };

        set({
            currentExerciseLogs: {
                ...logs,
                [exerciseId]: [
                    ...exerciseLogs.slice(0, setIndex),
                    updatedSet,
                    ...exerciseLogs.slice(setIndex + 1),
                ],
            },
        });
    },

    /**
     * Toggle set completion - mark as complete and start rest timer, or unmark if already complete
     */
    completeSet: (exerciseId, setIndex, restTime) => {
        const logs = get().currentExerciseLogs;
        const exerciseLogs = logs[exerciseId];

        if (!exerciseLogs || !exerciseLogs[setIndex]) return;

        const currentSet = exerciseLogs[setIndex];
        const isCurrentlyCompleted = currentSet.completed;

        const updatedSet: WorkoutSetExecution = {
            ...currentSet,
            completed: !isCurrentlyCompleted,
            completedAt: isCurrentlyCompleted ? null : new Date().toISOString(),
        };

        set({
            currentExerciseLogs: {
                ...logs,
                [exerciseId]: [
                    ...exerciseLogs.slice(0, setIndex),
                    updatedSet,
                    ...exerciseLogs.slice(setIndex + 1),
                ],
            },
            // Only start rest timer when completing (not when uncompleting)
            isResting: !isCurrentlyCompleted && restTime > 0,
            restTimeRemaining: !isCurrentlyCompleted ? restTime : get().restTimeRemaining,
        });
    },

    /**
     * Called every second to update timers
     * - Increments total elapsed time
     * - Decrements rest timer if resting
     */
    tickTimer: () => {
        const { isResting, restTimeRemaining } = get();

        set((state) => ({
            elapsedTime: state.elapsedTime + 1,
            restTimeRemaining: isResting ? Math.max(0, restTimeRemaining - 1) : 0,
            isResting: isResting && restTimeRemaining > 0,
        }));
    },

    /**
     * Skip the rest timer
     */
    skipRest: () => {
        set({
            isResting: false,
            restTimeRemaining: 0,
        });
    },
}));
