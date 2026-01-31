import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ChevronDown,
    Check,
    MoreHorizontal,
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useWorkoutSessionStore, WorkoutSetExecution } from '@/stores/useWorkoutSessionStore';

// =============================================
// TYPES
// =============================================

export interface ExercisePrescription {
    id: string;
    name: string;
    sets: number;
    reps_min: number;
    reps_max: number;
    rest_time: string;
    notes?: string;
    video_url?: string;
    main_muscle_group?: string;
}

interface ActiveExerciseCardProps {
    exercise: ExercisePrescription;
    exerciseIndex: number;
}

// =============================================
// COMPONENT
// =============================================

export function ActiveExerciseCard({ exercise, exerciseIndex }: ActiveExerciseCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Store
    const { currentExerciseLogs, logSet, completeSet } = useWorkoutSessionStore();
    const setLogs = currentExerciseLogs[exercise.id] || [];

    // Handlers
    const handleWeightChange = (setIndex: number, value: string) => {
        logSet(exercise.id, setIndex, { weight: parseFloat(value) || 0 });
    };

    const handleRepsChange = (setIndex: number, value: string) => {
        logSet(exercise.id, setIndex, { reps: parseInt(value) || 0 });
    };

    const handleRpeChange = (setIndex: number, value: number) => {
        logSet(exercise.id, setIndex, { rpe: value });
    };

    const handleRirChange = (setIndex: number, value: number) => {
        logSet(exercise.id, setIndex, { rir: value });
    };

    const handleCompleteSet = (setIndex: number) => {
        const restTime = parseInt(exercise.rest_time) || 60;
        completeSet(exercise.id, setIndex, restTime);
    };

    // Calculate completion
    const completedSets = setLogs.filter((s) => s.completed).length;
    const totalSets = exercise.sets;
    const isFullyCompleted = completedSets === totalSets;

    return (
        <Card
            className={cn(
                'overflow-hidden transition-all duration-300 border-0 shadow-none',
                isFullyCompleted ? 'bg-card/50' : 'bg-card'
            )}
        >
            {/* Header - Accordion */}
            <CardHeader
                className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Exercise Number - Circle */}
                        <div
                            className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                                isFullyCompleted
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted/50 text-muted-foreground'
                            )}
                        >
                            {isFullyCompleted ? <Check className="w-5 h-5" /> : exerciseIndex + 1}
                        </div>

                        {/* Exercise Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-foreground truncate">
                                {exercise.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {exercise.main_muscle_group && `${exercise.main_muscle_group} • `}
                                {exercise.sets} Séries • {exercise.reps_min}-{exercise.reps_max} reps
                            </p>
                        </div>
                    </div>

                    {/* Progress & Toggle */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground tabular-nums">
                            {completedSets}/{totalSets}
                        </span>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        </motion.div>
                    </div>
                </div>
            </CardHeader>

            {/* Sets List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CardContent className="px-5 pb-5 pt-0">
                            <div className="space-y-2">
                                {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                                    const setLog: WorkoutSetExecution = setLogs[setIndex] || {
                                        setNumber: setIndex + 1,
                                        weight: 0,
                                        reps: 0,
                                        rpe: null,
                                        rir: null,
                                        completed: false,
                                        completedAt: null,
                                    };

                                    return (
                                        <div
                                            key={setIndex}
                                            className={cn(
                                                'flex items-center gap-4 py-3 px-4 rounded-xl transition-all',
                                                setLog.completed
                                                    ? 'opacity-50'
                                                    : 'bg-muted/30 hover:bg-muted/40'
                                            )}
                                        >
                                            {/* Set Number */}
                                            <span className="text-sm font-bold text-muted-foreground w-6 tabular-nums">
                                                {setIndex + 1}
                                            </span>

                                            {/* Weight Input - Borderless */}
                                            <div className="flex items-center gap-1.5 flex-1">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    placeholder="0"
                                                    value={setLog.weight || ''}
                                                    onChange={(e) => handleWeightChange(setIndex, e.target.value)}
                                                    disabled={false}
                                                    className={cn(
                                                        'w-16 bg-transparent text-xl font-bold text-foreground text-center',
                                                        'border-0 outline-none focus:ring-0 placeholder:text-muted-foreground/40',
                                                        '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                                    )}
                                                />
                                                <span className="text-xs text-muted-foreground font-medium">kg</span>
                                            </div>

                                            {/* Reps Input - Borderless */}
                                            <div className="flex items-center gap-1.5 flex-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder={`${exercise.reps_min}`}
                                                    value={setLog.reps || ''}
                                                    onChange={(e) => handleRepsChange(setIndex, e.target.value)}
                                                    disabled={false}
                                                    className={cn(
                                                        'w-12 bg-transparent text-xl font-bold text-foreground text-center',
                                                        'border-0 outline-none focus:ring-0 placeholder:text-muted-foreground/40',
                                                        '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                                    )}
                                                />
                                                <span className="text-xs text-muted-foreground font-medium">reps</span>
                                            </div>

                                            {/* Advanced Options Popover */}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        disabled={false}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-3" align="end">
                                                    <div className="space-y-4">
                                                        {/* RPE */}
                                                        <div>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                                                RPE (Esforço)
                                                            </p>
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                {[6, 7, 8, 9, 10].map((v) => (
                                                                    <button
                                                                        key={v}
                                                                        onClick={() => handleRpeChange(setIndex, v)}
                                                                        className={cn(
                                                                            'w-9 h-9 rounded-lg text-sm font-bold transition-all',
                                                                            setLog.rpe === v
                                                                                ? 'bg-primary text-primary-foreground'
                                                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                                                        )}
                                                                    >
                                                                        {v}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* RIR */}
                                                        <div>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                                                RIR (Reserva)
                                                            </p>
                                                            <div className="flex gap-1.5 flex-wrap">
                                                                {[0, 1, 2, 3, 4, 5].map((v) => (
                                                                    <button
                                                                        key={v}
                                                                        onClick={() => handleRirChange(setIndex, v)}
                                                                        className={cn(
                                                                            'w-9 h-9 rounded-lg text-sm font-bold transition-all',
                                                                            setLog.rir === v
                                                                                ? 'bg-primary text-primary-foreground'
                                                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                                                        )}
                                                                    >
                                                                        {v}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            {/* Complete Button - Circle */}
                                            <button
                                                onClick={() => handleCompleteSet(setIndex)}
                                                className={cn(
                                                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                                                    setLog.completed
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10'
                                                )}
                                            >
                                                <Check
                                                    className={cn(
                                                        'w-5 h-5 transition-all',
                                                        setLog.completed ? 'opacity-100' : 'opacity-0'
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Notes */}
                            {exercise.notes && (
                                <p className="text-sm text-muted-foreground mt-4 italic">
                                    💡 {exercise.notes}
                                </p>
                            )}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

export default ActiveExerciseCard;
