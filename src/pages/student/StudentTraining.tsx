import { useAuth } from "@/hooks/useAuth";
import { getTrainingPrograms } from "@/services/studentService";
import { useQuery } from "@tanstack/react-query";
import {
    Dumbbell,
    Calendar,
    Clock,
    ChevronRight,
    Info,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function StudentTraining() {
    const { user } = useAuth();
    const { data: programs, isLoading } = useQuery({
        queryKey: ['myTraining', user?.id],
        queryFn: () => getTrainingPrograms(user?.id!),
        enabled: !!user?.id
    });

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const activeProgram = programs?.[0]; // Pega o programa mais recente

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

    return (
        <div className="space-y-6 pb-24">
            <header className="space-y-1">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5 uppercase tracking-widest text-[10px]">Programa Ativo</Badge>
                </div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">{activeProgram.title}</h1>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {activeProgram.number_weeks} Semanas</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Início: {new Date(activeProgram.start_date).toLocaleDateString()}</span>
                </div>
            </header>

            <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sessões de Treino</h2>
                {activeProgram.training_sessions?.map((session: any, idx: number) => (
                    <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="bg-card dark:bg-zinc-900/80 backdrop-blur-xl border border-border dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl">
                            <CardHeader className="p-5 border-b border-border dark:border-white/5 bg-muted/30 dark:bg-gradient-to-r dark:from-white/5 dark:to-transparent">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
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
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border dark:divide-white/5">
                                    {session.training_exercises?.map((exercise: any, exIdx: number) => (
                                        <div key={exercise.id} className="p-5 flex items-center gap-5 hover:bg-muted/50 dark:hover:bg-white/5 transition-all cursor-pointer group active:bg-muted dark:active:bg-white/10">
                                            <span className="text-2xl font-black text-amber-500 dark:text-amber-500/40 w-8 text-center tabular-nums leading-none transition-colors group-hover:dark:text-amber-500">
                                                {String(exIdx + 1).padStart(2, '0')}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-foreground dark:text-zinc-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{exercise.name}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 bg-muted dark:bg-white/5 px-2.5 py-1 rounded-full border border-border dark:border-white/5">
                                                        {exercise.sets} Séries
                                                    </span>
                                                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 bg-muted dark:bg-white/5 px-2.5 py-1 rounded-full border border-border dark:border-white/5">
                                                        {exercise.reps_min}-{exercise.reps_max} Reps
                                                    </span>
                                                    {exercise.rest_time && (
                                                        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                                                            <Clock className="w-3 h-3 text-amber-500" /> {exercise.rest_time}s
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center group-hover:bg-amber-600 dark:group-hover:bg-amber-500 group-hover:text-white dark:group-hover:text-black transition-all shadow-sm">
                                                <ChevronRight className="w-4 h-4 text-muted-foreground dark:text-zinc-300 group-hover:text-white dark:group-hover:text-black" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="p-4 rounded-xl bg-status-info/10 border border-status-info/20 flex gap-3">
                <Info className="w-5 h-5 text-status-info shrink-0" />
                <p className="text-[10px] text-status-info-foreground leading-relaxed">
                    Clique em um exercício para ver a análise biomecânica e orientações de execução PhD.
                </p>
            </div>
        </div>
    );
}
