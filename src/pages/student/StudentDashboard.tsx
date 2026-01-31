import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getMyActiveSubscription } from "@/services/financeService";
import { StudentContractCard } from "@/components/legal/StudentContractCard";
import { WeeklyCheckinModal } from "@/components/student/WeeklyCheckinModal";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import {
    getStudentProfile,
    getPhysicalAssessments,
    getCoachDetailsPublic,
    getTrainingPrograms,
    getMealPlans
} from "@/services/studentService";
import { getWeeklyLogs } from "@/services/workoutLogService";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dumbbell,
    Utensils,
    Calendar,
    TrendingUp,
    ClipboardCheck,
    Hourglass,
    ArrowRight,
    ShieldAlert,
    Video,
    Play,
    Trophy,
    Flame,
    CheckCircle2,
    ChevronRight,
    Clock,
    User,
    Activity,
    Bell,
    MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameDay,
    isToday,
    parseISO,
    differenceInDays
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLastFeedback } from "@/services/feedbackService";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from 'recharts';
import { StudentDetailsModal } from '@/components/dashboard/StudentDetailsModal';
import { StudentChatModal } from '@/components/student/StudentChatModal';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [isCheckinOpen, setIsCheckinOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { data: subscription, refetch: refetchSub } = useQuery({
        queryKey: ['mySubscription', user?.id],
        queryFn: getMyActiveSubscription,
        enabled: !!user?.id
    });

    const { data: assessments } = useQuery({
        queryKey: ['myAssessments', user?.id],
        queryFn: () => getPhysicalAssessments(user?.id!),
        enabled: !!user?.id
    });

    const { data: profile } = useQuery({
        queryKey: ['studentProfile', user?.id],
        queryFn: () => getStudentProfile(user?.id!),
        enabled: !!user?.id
    });

    const { data: coach } = useQuery({
        queryKey: ['coachDetails', profile?.coach_id],
        queryFn: () => getCoachDetailsPublic(profile?.coach_id!),
        enabled: !!profile?.coach_id
    });

    const { data: trainingPrograms } = useQuery({
        queryKey: ['myTrainingPrograms', user?.id],
        queryFn: () => getTrainingPrograms(user?.id!),
        enabled: !!user?.id
    });

    const { data: mealPlans } = useQuery({
        queryKey: ['myMealPlans', user?.id],
        queryFn: () => getMealPlans(user?.id!),
        enabled: !!user?.id
    });

    const { data: lastFeedback } = useQuery({
        queryKey: ['lastFeedback', user?.id],
        queryFn: () => getLastFeedback(user?.id!),
        enabled: !!user?.id
    });

    const { data: weeklyLogs = [] } = useQuery({
        queryKey: ['weeklyLogs', user?.id],
        queryFn: () => getWeeklyLogs(user?.id!),
        enabled: !!user?.id
    });

    const navigate = useNavigate();
    const loading = !profile;
    const latestAssessment = assessments?.[0];
    const prevAssessment = assessments?.[1];

    const weightChange = latestAssessment && prevAssessment
        ? latestAssessment.weight - prevAssessment.weight
        : 0;
    const fatChange = latestAssessment && prevAssessment
        ? (latestAssessment.body_fat || 0) - (prevAssessment.body_fat || 0)
        : 0;
    const muscleChange = latestAssessment && prevAssessment
        ? (latestAssessment.muscle_mass || 0) - (prevAssessment.muscle_mass || 0)
        : 0;

    // Calendar logic
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Começa na Segunda (S)
    const weekDays = eachDayOfInterval({
        start: weekStart,
        end: endOfWeek(today, { weekStartsOn: 1 })
    });

    // Training completion - Use real workout_logs data
    const activeProgram = trainingPrograms?.[0];
    const weeklyTrainings = activeProgram?.training_sessions?.length || 0;

    // Build set of days with workouts from real logs
    const workoutDaysSet = new Set<number>();
    weeklyLogs.forEach(log => {
        const logDate = new Date(log.created_at);
        const dayOfWeek = logDate.getDay();
        // Convert to Monday-based index (0=Mon, 6=Sun)
        const mondayBasedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        workoutDaysSet.add(mondayBasedIndex);
    });

    const completedTrainings = workoutDaysSet.size;
    const trainingProgress = weeklyTrainings > 0 ? (completedTrainings / weeklyTrainings) * 100 : 0;

    const dayOfWeekIndex = today.getDay();
    const ptDayIndex = dayOfWeekIndex === 0 ? 6 : dayOfWeekIndex - 1;

    const todayTraining = activeProgram?.training_sessions?.[ptDayIndex % (activeProgram?.training_sessions?.length || 1)];
    const currentMealPlan = mealPlans?.[0];
    const nextMeal = currentMealPlan?.meals?.[0]; // Simplificado por enquanto

    const chartData = assessments?.map(a => ({
        date: format(new Date(a.created_at), 'dd/MM'),
        weight: a.weight,
        fat: a.body_fat || 0,
        muscle: a.muscle_mass || 0
    })).reverse() || [];

    // Real Notifications Logic
    const realNotifications = [];
    const now = new Date();

    if (activeProgram && differenceInDays(now, new Date(activeProgram.created_at)) <= 7) {
        realNotifications.push({
            id: 'training',
            title: 'Novo Treino Disponível! 🏋️',
            message: 'Seu coach prescreveu um novo protocolo.',
            time: format(new Date(activeProgram.created_at), "eeee", { locale: ptBR }),
            path: '/aluno/treino'
        });
    }

    if (currentMealPlan && differenceInDays(now, new Date(currentMealPlan.created_at)) <= 7) {
        realNotifications.push({
            id: 'diet',
            title: 'Nova Dieta Prescrita! 🥗',
            message: 'Seu novo plano alimentar já está pronto.',
            time: format(new Date(currentMealPlan.created_at), "eeee", { locale: ptBR }),
            path: '/aluno/dieta'
        });
    }

    if (latestAssessment && differenceInDays(now, new Date(latestAssessment.created_at)) <= 7) {
        realNotifications.push({
            id: 'assessment',
            title: 'Nova Avaliação Adicionada! 📏',
            message: 'Confira os resultados da sua última análise.',
            time: format(new Date(latestAssessment.created_at), "eeee", { locale: ptBR }),
            action: () => window.scrollTo({ top: 800, behavior: 'smooth' })
        });
    }

    if (subscription && !subscription.contract_accepted_at) {
        realNotifications.push({
            id: 'contract',
            title: 'Contrato Pendente! 📝',
            message: 'Clique para assinar seu termo de compromisso.',
            time: 'Ação Necessária',
            action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        });
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Hourglass className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasAnamnesis = profile?.anamnesis && profile.anamnesis.length > 0;
    const isPending = profile?.status === "pending_approval";

    if (!hasAnamnesis) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-card border border-border/50 p-8 rounded-3xl shadow-2xl max-w-sm"
                >
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ClipboardCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Complete seu Perfil</h2>
                    <p className="text-muted-foreground mb-8 text-sm">
                        Para que seu coach possa prescrever seu treino e dieta personalizada, precisamos conhecer seu histórico completo.
                    </p>
                    <Button
                        className="w-full h-12 rounded-xl font-bold"
                        onClick={() => navigate("/aluno/onboarding-interface")}
                    >
                        Iniciar Anamnese
                        <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (isPending) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
                <div className="bg-status-warning/10 border border-status-warning/20 p-8 rounded-3xl max-w-sm">
                    <ShieldAlert className="w-12 h-12 text-status-warning mx-auto mb-6" />
                    <h2 className="text-xl font-bold mb-2">Aguardando Aprovação</h2>
                    <p className="text-muted-foreground text-sm">
                        Seu perfil foi enviado com sucesso! Seu coach está analisando seus dados para liberar seu acesso total.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {profile && (
                <WeeklyCheckinModal
                    studentId={user?.id!}
                    coachId={profile.coach_id}
                    open={isCheckinOpen}
                    onOpenChange={setIsCheckinOpen}
                />
            )}

            {/* Header Greeting */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-xs text-muted-foreground">Bem-vindo de volta,</p>
                    <h1 className="text-2xl font-bold">{profile?.full_name?.split(' ')[0]}! 👋</h1>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative w-10 h-10 rounded-2xl hover:bg-primary/10 transition-all active:scale-90 group border-none shadow-none"
                        >
                            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            {realNotifications.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(255,167,38,0.5)] border-2 border-background" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/50 shadow-2xl rounded-3xl mt-2">
                        <div className="p-4 border-b border-border/50 bg-muted/30">
                            <h4 className="font-bold text-sm">Notificações</h4>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {realNotifications.length > 0 ? (
                                realNotifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            if (n.path) navigate(n.path);
                                            if (n.action) n.action();
                                        }}
                                        className="p-4 border-b border-border/10 hover:bg-muted/50 transition-colors cursor-pointer group"
                                    >
                                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{n.title}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                                        <p className="text-[8px] text-primary font-bold mt-2 uppercase tracking-wider">{n.time}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">Tudo em dia! Nenhuma notificação nova.</p>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Coach Card - Minimal Design */}
            {coach && (
                <Card className="bg-card/60 backdrop-blur-xl border-border/40 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    <CardContent className="p-4 flex items-center gap-4 relative z-10">
                        <div className="relative">
                            <Avatar className="w-14 h-14 rounded-xl shadow-sm border border-border/50">
                                <AvatarImage src={coach.avatar_url || ""} className="object-cover" />
                                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xl">
                                    {coach.full_name ? coach.full_name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">Seu Coach</p>
                            <h2 className="font-bold text-base leading-tight truncate">{coach.full_name || coach.name}</h2>
                            <p className="text-[11px] text-muted-foreground font-medium truncate">{coach.specialty || "Personal Trainer"}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsChatOpen(true)}
                            className="h-9 w-9 rounded-xl border border-border/50 hover:bg-primary/10 hover:border-primary/30"
                        >
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Evolution Overview */}
            <Card className="bg-card/40 backdrop-blur-xl border-border/50 premium-shadow">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" /> Sua Evolução
                        </CardTitle>
                        <CardDescription className="text-[10px]">Resultados consolidados</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => navigate("/aluno/perfil")}>
                        Histórico Completo
                    </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm">
                        <p className={cn("text-base font-black tracking-tight", weightChange > 0 ? 'text-emerald-500' : 'text-rose-500')}>
                            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Peso</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm">
                        <p className={cn("text-base font-black tracking-tight", fatChange <= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                            {fatChange > 0 ? '+' : ''}{fatChange.toFixed(1)}%
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Gordura</p>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm">
                        <p className={cn("text-base font-black tracking-tight", muscleChange >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                            {muscleChange > 0 ? '+' : ''}{muscleChange.toFixed(1)}kg
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Músculo</p>
                    </div>
                </CardContent>
            </Card>

            {/* Weekly Training Progress */}
            <Card
                className="bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden premium-shadow cursor-pointer active:scale-[0.98] transition-all group"
                onClick={() => navigate("/aluno/historico")}
            >
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
                            </div>
                            <div>
                                <span className="font-bold text-sm block">Progresso Semanal</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Ver histórico</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">{completedTrainings} / {weeklyTrainings}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-3 bg-muted/40 rounded-full overflow-hidden border border-border/20">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${trainingProgress}%` }}
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                            />
                        </div>
                        <div className="flex justify-between items-center bg-muted/20 p-2 rounded-2xl border border-border/20">
                            {weekDays?.map((day, i) => {
                                const hasWorkout = workoutDaysSet.has(i);
                                const isDayToday = isToday(day);

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-9 h-9 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all duration-300",
                                            hasWorkout
                                                ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 scale-110'
                                                : isDayToday
                                                    ? 'bg-muted/60 text-foreground ring-2 ring-primary/50'
                                                    : 'bg-muted/40 text-muted-foreground border border-border/30'
                                        )}
                                    >
                                        {hasWorkout ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            format(day, 'EEEEE', { locale: ptBR }).toUpperCase()
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card
                    className="bg-gradient-to-br from-orange-500 to-amber-600 border-none cursor-pointer group premium-shadow overflow-hidden relative active:scale-95 transition-all duration-300"
                    onClick={() => navigate("/aluno/treino")}
                >
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Dumbbell size={100} color="white" />
                    </div>
                    <CardHeader className="p-5 pb-2 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20 shadow-lg">
                            <Dumbbell className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-lg font-black text-white">Meu Treino</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 relative z-10">
                        <p className="text-[10px] text-white/80 font-bold flex items-center gap-1 uppercase tracking-widest">
                            {todayTraining ? todayTraining.division : "Ver tudo"}
                            <ChevronRight className="w-3 h-3" />
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none cursor-pointer group premium-shadow overflow-hidden relative active:scale-95 transition-all duration-300"
                    onClick={() => navigate("/aluno/dieta")}
                >
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Utensils size={100} color="white" />
                    </div>
                    <CardHeader className="p-5 pb-2 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20 shadow-lg">
                            <Utensils className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-lg font-black text-white">Minha Dieta</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 relative z-10">
                        <p className="text-[10px] text-white/80 font-bold flex items-center gap-1 uppercase tracking-widest">
                            {currentMealPlan ? `${currentMealPlan.total_calories} Kcal` : "Ver plano"}
                            <ChevronRight className="w-3 h-3" />
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Insights / Feedback */}
            <Card className="bg-gradient-to-br from-violet-600 to-indigo-700 border-none shadow-2xl shadow-indigo-500/20 overflow-hidden relative group active:scale-[0.98] transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <Activity size={120} color="white" />
                </div>
                <CardContent className="p-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                            <Activity className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg text-white tracking-tight leading-none">Check-in</h3>
                            <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em] mt-1.5">Acompanhamento Semanal</p>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        onClick={() => setIsCheckinOpen(true)}
                        className="bg-white text-indigo-700 hover:bg-white/90 font-black px-6 text-xs h-11 rounded-xl shadow-xl transition-transform active:scale-95"
                    >
                        RESPONDER
                    </Button>
                </CardContent>
            </Card>

            {/* Minimalist Evolution Chart */}
            <Card className="bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden premium-shadow">
                <CardHeader className="pb-0 border-none p-5">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground/80">
                            <TrendingUp className="w-4 h-4 text-emerald-500" /> Tendência de Evolução
                        </CardTitle>
                        <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">PROJETADO</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 h-[220px] w-full mt-2">
                    {chartData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass-card-dark p-3 rounded-2xl shadow-2xl border-white/10">
                                                    <p className="text-[10px] text-white/60 font-medium mb-1 uppercase tracking-widest">{payload[0].payload.date}</p>
                                                    <p className="text-base font-black text-white">{payload[0].value} <span className="text-[10px] font-bold text-white/50">KG</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="var(--primary)"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorPrimary)"
                                    animationDuration={2500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center opacity-20">
                                <Activity className="w-6 h-6" />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium max-w-[200px] leading-relaxed">
                                Seu gráfico de evolução será gerado automaticamente após a sua <span className="text-primary font-bold">próxima avaliação física</span>.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Legal / Subscription Status */}
            {subscription && (
                <div className="px-1">
                    <StudentContractCard
                        subscription={subscription}
                        studentName={profile?.full_name}
                        coachName={coach?.full_name || "Seu Treinador"}
                        onSigned={refetchSub}
                    />
                </div>
            )}

            <StudentDetailsModal
                studentId={user?.id}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />

            {coach && (
                <StudentChatModal
                    open={isChatOpen}
                    onOpenChange={setIsChatOpen}
                    studentId={user?.id!}
                    coachId={profile?.coach_id}
                    coachName={coach.full_name || coach.name}
                    coachAvatar={coach.avatar_url}
                />
            )}
        </div>
    );
}
