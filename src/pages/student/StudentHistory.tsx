import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getLogsByDateRange } from '@/services/workoutLogService';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Dumbbell,
    Clock,
    Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WorkoutLog } from '@/types/supabase';

// =============================================
// HELPERS
// =============================================

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getMonthDays(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add padding days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
        const date = new Date(year, month, -i);
        days.push(date);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
    }

    // Add padding days for next month to complete the grid
    const endPadding = 42 - days.length; // 6 rows x 7 days
    for (let i = 1; i <= endPadding; i++) {
        days.push(new Date(year, month + 1, i));
    }

    return days;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
}

function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

// =============================================
// COMPONENT
// =============================================

export default function StudentHistory() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Calculate date range for query (entire month with padding)
    const startDate = useMemo(() => {
        const d = new Date(year, month, 1);
        d.setDate(d.getDate() - 7); // Include previous week for padding
        return d.toISOString();
    }, [year, month]);

    const endDate = useMemo(() => {
        const d = new Date(year, month + 1, 7); // Include next week for padding
        return d.toISOString();
    }, [year, month]);

    // Fetch logs for the month
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['workoutHistory', user?.id, startDate, endDate],
        queryFn: () => getLogsByDateRange(user!.id, startDate, endDate),
        enabled: !!user?.id,
    });

    // Get days with workouts
    const workoutDays = useMemo(() => {
        const days = new Set<string>();
        logs.forEach((log) => {
            const date = new Date(log.created_at);
            days.add(date.toDateString());
        });
        return days;
    }, [logs]);

    // Get logs for selected date
    const selectedDayLogs = useMemo(() => {
        if (!selectedDate) return [];
        return logs.filter((log) => {
            const logDate = new Date(log.created_at);
            return isSameDay(logDate, selectedDate);
        });
    }, [logs, selectedDate]);

    // Group selected day logs by session
    const sessionSummaries = useMemo(() => {
        const sessions: Record<string, {
            sessionName: string;
            exercises: WorkoutLog[];
            totalVolume: number;
            totalSets: number;
        }> = {};

        selectedDayLogs.forEach((log) => {
            const sessionId = log.training_session_id || 'unknown';
            if (!sessions[sessionId]) {
                sessions[sessionId] = {
                    sessionName: log.exercise_name || 'Treino',
                    exercises: [],
                    totalVolume: 0,
                    totalSets: 0,
                };
            }

            sessions[sessionId].exercises.push(log);

            // Calculate volume from sets_data
            if (Array.isArray(log.sets_data)) {
                log.sets_data.forEach((set: any) => {
                    if (set.completed && set.weight && set.reps) {
                        sessions[sessionId].totalVolume += set.weight * set.reps;
                        sessions[sessionId].totalSets++;
                    }
                });
            }
        });

        return Object.values(sessions);
    }, [selectedDayLogs]);

    // Navigation
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const days = getMonthDays(year, month);
    const today = new Date();

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <header className="space-y-2">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    Visualize seus treinos realizados
                </p>
            </header>

            {/* Calendar Card */}
            <Card className="border-0 bg-card">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPreviousMonth}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="text-center">
                            <CardTitle className="text-lg">
                                {MONTHS[month]} {year}
                            </CardTitle>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={goToToday}
                                className="text-xs text-muted-foreground p-0 h-auto"
                            >
                                Ir para hoje
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNextMonth}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Days Header */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <div
                                        key={day}
                                        className="text-center text-xs font-medium text-muted-foreground py-2"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {days.map((date, idx) => {
                                    const isCurrentMonth = date.getMonth() === month;
                                    const hasWorkout = workoutDays.has(date.toDateString());
                                    const isToday = isSameDay(date, today);
                                    const isSelected = selectedDate && isSameDay(date, selectedDate);

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedDate(date)}
                                            className={cn(
                                                'relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all',
                                                isCurrentMonth
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground/40',
                                                isSelected && 'bg-primary/20 ring-2 ring-primary',
                                                isToday && !isSelected && 'bg-muted',
                                                !isSelected && 'hover:bg-muted/50'
                                            )}
                                        >
                                            <span className="text-sm font-medium">
                                                {date.getDate()}
                                            </span>
                                            {hasWorkout && (
                                                <div
                                                    className={cn(
                                                        'absolute bottom-1 w-1.5 h-1.5 rounded-full',
                                                        'bg-primary shadow-[0_0_6px_2px_rgba(34,197,94,0.5)]'
                                                    )}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Selected Day Details */}
            <AnimatePresence mode="wait">
                {selectedDate && (
                    <motion.div
                        key={selectedDate.toDateString()}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="border-0 bg-card">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Dumbbell className="w-4 h-4 text-primary" />
                                    {selectedDate.toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                    })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sessionSummaries.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p className="text-sm">Nenhum treino neste dia</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {sessionSummaries.map((session, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-muted/30 rounded-xl space-y-3"
                                            >
                                                {/* Session Header */}
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-foreground">
                                                        {session.exercises[0]?.exercise_name || 'Treino'}
                                                    </h3>
                                                    <Badge variant="outline" className="text-primary border-primary/50">
                                                        {session.totalSets} séries
                                                    </Badge>
                                                </div>

                                                {/* Session Stats */}
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Dumbbell className="w-4 h-4" />
                                                        <span>
                                                            {session.totalVolume >= 1000
                                                                ? `${(session.totalVolume / 1000).toFixed(1)}t`
                                                                : `${session.totalVolume}kg`
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs">
                                                            {session.exercises.length} exercícios
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Exercise List */}
                                                <div className="border-t border-border/50 pt-3 space-y-2">
                                                    {session.exercises.map((exercise, exIdx) => (
                                                        <div
                                                            key={exIdx}
                                                            className="flex items-center justify-between text-sm"
                                                        >
                                                            <span className="text-foreground/80">
                                                                {exercise.exercise_name}
                                                            </span>
                                                            <span className="text-muted-foreground tabular-nums">
                                                                {Array.isArray(exercise.sets_data)
                                                                    ? `${exercise.sets_data.filter((s: any) => s.completed).length} séries`
                                                                    : ''
                                                                }
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
