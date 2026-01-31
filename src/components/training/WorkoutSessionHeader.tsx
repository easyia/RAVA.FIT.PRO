import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Dumbbell, RotateCcw } from 'lucide-react';
import { useWorkoutSessionStore } from '@/stores/useWorkoutSessionStore';
import { cn } from '@/lib/utils';

// =============================================
// HELPERS
// =============================================

/**
 * Format seconds to HH:MM:SS or MM:SS
 */
function formatDuration(totalSeconds: number): string {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// =============================================
// COMPONENT
// =============================================

interface WorkoutSessionHeaderProps {
    sessionName: string;
    sessionDivision?: string;
    onReset?: () => void;
}

export function WorkoutSessionHeader({
    sessionName,
    sessionDivision,
    onReset
}: WorkoutSessionHeaderProps) {
    const { elapsedTime, currentExerciseLogs } = useWorkoutSessionStore();

    // Calculate total volume (weight × reps for all completed sets)
    const totalVolume = useMemo(() => {
        let volume = 0;
        Object.values(currentExerciseLogs).forEach((setLogs) => {
            setLogs.forEach((set) => {
                if (set.completed && set.weight > 0 && set.reps > 0) {
                    volume += set.weight * set.reps;
                }
            });
        });
        return volume;
    }, [currentExerciseLogs]);

    // Count completed sets
    const completedSets = useMemo(() => {
        let count = 0;
        Object.values(currentExerciseLogs).forEach((setLogs) => {
            setLogs.forEach((set) => {
                if (set.completed) count++;
            });
        });
        return count;
    }, [currentExerciseLogs]);

    return (
        <Card className="border-0 bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4">
                {/* Session Title */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">
                            {sessionName}
                        </h1>
                        {sessionDivision && (
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                Treino {sessionDivision}
                            </p>
                        )}
                    </div>
                    {onReset && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reiniciar
                        </Button>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Duration */}
                    <div className="text-center p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-mono font-bold text-foreground tracking-tight">
                            {formatDuration(elapsedTime)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                            Duração
                        </p>
                    </div>

                    {/* Volume */}
                    <div className="text-center p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Dumbbell className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                            {totalVolume >= 1000
                                ? `${(totalVolume / 1000).toFixed(1)}k`
                                : totalVolume.toLocaleString()
                            }
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                            Volume (kg)
                        </p>
                    </div>

                    {/* Completed Sets */}
                    <div className="text-center p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-primary text-sm">✓</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                            {completedSets}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                            Séries
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default WorkoutSessionHeader;
