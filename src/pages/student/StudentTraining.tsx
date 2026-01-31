import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTrainingPrograms } from "@/services/studentService";
import { saveMultipleWorkoutLogs } from "@/services/workoutLogService";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
    Dumbbell,
    Calendar,
    Clock,
    Info,
    Play,
    Square,
    Loader2,
    Trophy
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

// Workout execution components
import { useWorkoutSessionStore } from "@/stores/useWorkoutSessionStore";
import { ActiveExerciseCard, ExercisePrescription } from "@/components/training/ActiveExerciseCard";
import { GlobalWorkoutTimer } from "@/components/training/GlobalWorkoutTimer";
import { RestTimerOverlay } from "@/components/training/RestTimerOverlay";
import { WorkoutLogInsert } from "@/types/supabase";

export default function StudentTraining() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Store
    const { activeWorkoutId, currentExerciseLogs, startWorkout, endWorkout } = useWorkoutSessionStore();

    // Fetch training programs
    const { data: programs, isLoading } = useQuery({
        queryKey: ['myTraining', user?.id],
        queryFn: () => getTrainingPrograms(user?.id!),
        enabled: !!user?.id
    });

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const activeProgram = programs?.[0];

    // No program state
    if (!activeProgram) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                    <Dumbbell className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-bold mb-2">Sem Treino Ativo</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Seu coach ainda não prescreveu um programa de treino para você. Fique atento!
                </p>
            </div>
        );
    }

    // Get selected session for workout execution
    const selectedSession = activeProgram.training_sessions?.find(
        (s: any) => s.id === selectedSessionId
    );

    // Handle start workout
    const handleStartWorkout = (session: any) => {
        const exercises = session.training_exercises?.map((ex: any) => ({
            id: ex.id,
            sets: ex.sets
        })) || [];

        setSelectedSessionId(session.id);
        startWorkout(session.id, exercises);
    };

    // Handle end workout confirmation
    const handleEndWorkoutClick = () => {
        setShowEndConfirm(true);
    };

    // Handle confirmed end workout - save data
    const handleConfirmEndWorkout = async () => {
        if (!user?.id || !selectedSession) return;

        setIsSaving(true);

        try {
            // Build logs from store data
            const logs: WorkoutLogInsert[] = [];

            selectedSession.training_exercises?.forEach((exercise: any) => {
                const setLogs = currentExerciseLogs[exercise.id];
                if (setLogs && setLogs.length > 0) {
                    logs.push({
                        student_id: user.id,
                        training_session_id: selectedSessionId || undefined,
                        exercise_id: exercise.id,
                        exercise_name: exercise.name,
                        sets_data: setLogs,
                    });
                }
            });

            // Save to database
            if (logs.length > 0) {
                await saveMultipleWorkoutLogs(logs);
            }

            // Success!
            toast({
                title: "🏆 Treino Salvo!",
                description: "Parabéns! Seu treino foi registrado com sucesso.",
            });

            // Clear state
            endWorkout();
            setSelectedSessionId(null);
            setShowEndConfirm(false);

        } catch (error: any) {
            console.error("[StudentTraining] Error saving workout:", error);
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: error.message || "Não foi possível salvar o treino. Tente novamente.",
            });
            // Don't clear state on error - user can retry
        } finally {
            setIsSaving(false);
        }
    };

    // If we have an active workout, show execution view
    if (activeWorkoutId && selectedSession) {
        // Calculate progress
        const totalExercises = selectedSession.training_exercises?.length || 0;
        const completedExercises = selectedSession.training_exercises?.filter((ex: any) => {
            const logs = currentExerciseLogs[ex.id];
            return logs && logs.every((s) => s.completed);
        }).length || 0;

        return (
            <div className="space-y-6 pb-32">
                {/* Workout Execution Header */}
                <header className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge
                                variant="outline"
                                className="border-green-500/50 text-green-500 bg-green-500/5 uppercase tracking-widest text-[10px] animate-pulse"
                            >
                                Treino em Andamento
                            </Badge>
                            <GlobalWorkoutTimer />
                        </div>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleEndWorkoutClick}
                            className="gap-2"
                        >
                            <Square className="w-4 h-4" />
                            Encerrar
                        </Button>
                    </div>

                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase">
                            {selectedSession.name}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Treino {selectedSession.division} • {completedExercises}/{totalExercises} exercícios completos
                        </p>
                    </div>
                </header>

                {/* Exercise Cards */}
                <div className="space-y-4">
                    {selectedSession.training_exercises?.map((exercise: any, idx: number) => {
                        const exercisePrescription: ExercisePrescription = {
                            id: exercise.id,
                            name: exercise.name,
                            sets: exercise.sets,
                            reps_min: exercise.reps_min,
                            reps_max: exercise.reps_max,
                            rest_time: exercise.rest_time || "60",
                            notes: exercise.notes,
                            video_url: exercise.video_url,
                            main_muscle_group: exercise.main_muscle_group
                        };

                        return (
                            <motion.div
                                key={exercise.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <ActiveExerciseCard
                                    exercise={exercisePrescription}
                                    exerciseIndex={idx}
                                />
                            </motion.div>
                        );
                    })}
                </div>

                {/* Info Banner */}
                <div className="p-4 rounded-xl bg-status-info/10 border border-status-info/20 flex gap-3">
                    <Info className="w-5 h-5 text-status-info shrink-0" />
                    <p className="text-[10px] text-status-info-foreground leading-relaxed">
                        Use os campos para registrar peso, repetições, RPE e RIR de cada série.
                        Clique no ✓ para marcar como completa e iniciar o timer de descanso.
                    </p>
                </div>

                {/* Rest Timer Overlay */}
                <RestTimerOverlay />

                {/* End Workout Confirmation Dialog */}
                <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-amber-500" />
                                </div>
                                <AlertDialogTitle className="text-xl">Encerrar Treino?</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription>
                                Seu progresso será salvo automaticamente.
                                Você completou <strong>{completedExercises}</strong> de <strong>{totalExercises}</strong> exercícios.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSaving}>Continuar Treino</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmEndWorkout}
                                disabled={isSaving}
                                className="bg-amber-500 hover:bg-amber-600 text-black"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    "Salvar e Encerrar"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    // Default: Session Selection View
    return (
        <div className="space-y-6 pb-24">
            <header className="space-y-1">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5 uppercase tracking-widest text-[10px]">
                        Programa Ativo
                    </Badge>
                </div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">{activeProgram.title}</h1>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {activeProgram.number_weeks} Semanas</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Início: {new Date(activeProgram.start_date).toLocaleDateString()}</span>
                </div>
            </header>

            <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Selecione uma Sessão para Iniciar
                </h2>

                {activeProgram.training_sessions?.map((session: any, idx: number) => (
                    <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="bg-card dark:bg-zinc-900/80 backdrop-blur-xl border border-border dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl">
                            <CardHeader className="p-5 border-b border-border dark:border-white/5 bg-muted/30 dark:bg-gradient-to-r dark:from-white/5 dark:to-transparent">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                                                    Treino {session.division}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                <Dumbbell className="w-3 h-3" />
                                                {session.training_exercises?.length || 0} Ex
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground dark:text-white leading-tight tracking-tight">
                                            {session.name}
                                        </h3>
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={() => handleStartWorkout(session)}
                                        className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                                    >
                                        <Play className="w-4 h-4" />
                                        Iniciar
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4">
                                <div className="flex flex-wrap gap-2">
                                    {session.training_exercises?.slice(0, 5).map((exercise: any) => (
                                        <Badge
                                            key={exercise.id}
                                            variant="secondary"
                                            className="text-[10px] font-medium"
                                        >
                                            {exercise.name}
                                        </Badge>
                                    ))}
                                    {session.training_exercises?.length > 5 && (
                                        <Badge variant="outline" className="text-[10px]">
                                            +{session.training_exercises.length - 5} mais
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="p-4 rounded-xl bg-status-info/10 border border-status-info/20 flex gap-3">
                <Info className="w-5 h-5 text-status-info shrink-0" />
                <p className="text-[10px] text-status-info-foreground leading-relaxed">
                    Clique em "Iniciar" para começar a registrar seu treino com controle de séries, pesos e descanso.
                </p>
            </div>
        </div>
    );
}
