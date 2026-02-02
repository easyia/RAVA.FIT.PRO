import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    ArrowLeft,
    Dumbbell,
    TrendingUp,
    Calendar,
    User,
    Mail,
    Phone,
    Clock,
    Activity,
    Loader2,
    CheckCircle2,
    XCircle,
    Eye,
    Camera,
    ChevronRight,
    Search,
    Utensils,
    Flame,
    Beef,
    Wheat,
    Droplets,
    Settings
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { getLogsByDateRange } from '@/services/workoutLogService';
import { getMealLogs } from '@/services/mealLogService';
import { cn } from '@/lib/utils';

// =============================================
// DATA FETCHING
// =============================================

async function getStudentDetails(studentId: string) {
    // 1. Fetch student and anamnesis
    const { data: student, error } = await supabase
        .from('students')
        .select(`
            *,
            anamnesis(*)
        `)
        .eq('id', studentId)
        .single();

    if (error) throw error;

    if (student && student.coach_id) {
        const { data: coach } = await supabase
            .from('coaches')
            .select('name, avatar_url')
            .eq('id', student.coach_id)
            .single();

        if (coach) {
            (student as any).coach = { full_name: coach.name, avatar_url: coach.avatar_url };
        }
    }

    return student;
}

async function getStudentTrainingPrograms(studentId: string) {
    const { data } = await supabase
        .from('training_programs')
        .select(`
            *,
            *,
            training_sessions(*, training_exercises(*))
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .limit(1);

    return data?.[0] || null;
}

async function getStudentMealPlans(studentId: string) {
    const { data } = await supabase
        .from('meal_plans')
        .select('*, meals(*)')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .limit(1);

    return data?.[0] || null;
}

async function getStudentSubscription(studentId: string) {
    const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1);

    return data?.[0] || null;
}

// =============================================
// COMPONENT
// =============================================

export default function StudentDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<any>(null);

    // Fetch student details
    const { data: student, isLoading: loadingStudent } = useQuery({
        queryKey: ['studentDetails', id],
        queryFn: () => getStudentDetails(id!),
        enabled: !!id
    });

    // Fetch training program
    const { data: trainingProgram } = useQuery({
        queryKey: ['studentTraining', id],
        queryFn: () => getStudentTrainingPrograms(id!),
        enabled: !!id
    });

    // Fetch meal plan
    const { data: mealPlan } = useQuery({
        queryKey: ['studentMealPlan', id],
        queryFn: () => getStudentMealPlans(id!),
        enabled: !!id
    });

    // Fetch subscription
    const { data: subscription } = useQuery({
        queryKey: ['studentSubscription', id],
        queryFn: () => getStudentSubscription(id!),
        enabled: !!id
    });

    // Fetch 4 weeks of workout logs for chart
    const fourWeeksAgo = useMemo(() => {
        const date = subWeeks(new Date(), 4);
        return startOfWeek(date, { weekStartsOn: 1 }).toISOString();
    }, []);

    const now = useMemo(() => new Date().toISOString(), []);

    const { data: workoutLogs = [] } = useQuery({
        queryKey: ['studentWorkoutLogs', id, fourWeeksAgo, now],
        queryFn: () => getLogsByDateRange(id!, fourWeeksAgo, now),
        enabled: !!id
    });

    // Fetch meal logs for the last 7 days
    const sevenDaysAgo = useMemo(() => subWeeks(new Date(), 1).toISOString(), []);
    const { data: mealLogs = [] } = useQuery({
        queryKey: ['studentMealLogs', id, sevenDaysAgo, now],
        queryFn: () => getMealLogs(id!, 50),
        enabled: !!id
    });

    // Calculate KPIs
    const kpis = useMemo(() => {
        const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

        // Workouts this week
        const thisWeekDays = new Set<string>();
        let weeklyVolume = 0;

        workoutLogs.forEach(log => {
            const logDate = new Date(log.created_at);

            if (logDate >= thisWeekStart && logDate <= thisWeekEnd) {
                thisWeekDays.add(logDate.toLocaleDateString('pt-BR'));

                if (Array.isArray(log.sets_data)) {
                    log.sets_data.forEach((set: any) => {
                        if (set.completed && set.weight && set.reps) {
                            weeklyVolume += set.weight * set.reps;
                        }
                    });
                }
            }
        });

        // Monthly consistency (last 4 weeks)
        const totalWeeks = 4;
        const weeksWithWorkout = new Set<string>();
        workoutLogs.forEach(log => {
            const logDate = new Date(log.created_at);
            const weekKey = format(startOfWeek(logDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            weeksWithWorkout.add(weekKey);
        });

        const consistency = Math.round((weeksWithWorkout.size / totalWeeks) * 100);

        // Fix meal count: unique names
        const uniqueMealCount = mealPlan?.meals ? new Set(mealPlan.meals.map((m: any) => m.name)).size : 0;
        const weeklyTrainings = trainingProgram?.training_sessions?.length || 5;

        return {
            workoutsThisWeek: thisWeekDays.size,
            weeklyTarget: weeklyTrainings,
            weeklyVolume,
            monthlyConsistency: consistency,
            uniqueMealCount
        };
    }, [workoutLogs, trainingProgram, mealPlan]);

    // Weekly volume chart data
    const chartData = useMemo(() => {
        const weeks: { week: string; volume: number }[] = [];

        for (let i = 3; i >= 0; i--) {
            const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
            const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
            const weekLabel = format(weekStart, 'dd/MM');

            let weekVolume = 0;
            workoutLogs.forEach(log => {
                const logDate = new Date(log.created_at);
                if (logDate >= weekStart && logDate <= weekEnd) {
                    if (Array.isArray(log.sets_data)) {
                        log.sets_data.forEach((set: any) => {
                            if (set.completed && set.weight && set.reps) {
                                weekVolume += set.weight * set.reps;
                            }
                        });
                    }
                }
            });

            weeks.push({ week: weekLabel, volume: weekVolume });
        }

        return weeks;
    }, [workoutLogs]);

    // Loading state
    // =============================================
    // RENDER
    // =============================================

    if (loadingStudent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center bg-background p-4">
                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                    <User className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Aluno não encontrado</h2>
                <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Lista
                </Button>
            </div>
        );
    }

    const isActive = student.status === 'active';
    const lastActivity = workoutLogs[0]?.created_at
        ? format(new Date(workoutLogs[0].created_at), "dd 'de' MMMM", { locale: ptBR })
        : 'Sem atividade recente';

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Top Navigation */}
            <div className="border-b border-border/40 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="gap-2 text-muted-foreground hover:text-foreground font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Button>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            VISÃO DO TREINADOR
                        </Badge>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">

                {/* 1. HERO SECTION */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <User className="w-64 h-64" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent pointer-events-none" />

                    <div className="relative z-10 p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-amber-600 rounded-[2rem] opacity-75 blur group-hover:opacity-100 transition duration-1000"></div>
                            <Avatar className="w-32 h-32 rounded-[1.8rem] border-4 border-background relative shadow-xl">
                                <AvatarImage src={student.avatar_url} className="object-cover" />
                                <AvatarFallback className="rounded-[1.8rem] text-4xl font-bold bg-muted text-muted-foreground">
                                    {student.full_name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shadow-lg",
                                isActive ? "bg-emerald-500" : "bg-zinc-500"
                            )}>
                                {isActive ? <CheckCircle2 className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />}
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">
                                    {student.full_name}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground font-medium">
                                    {student.email && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/50 border border-border/50">
                                            <Mail className="w-3.5 h-3.5" /> {student.email}
                                        </span>
                                    )}
                                    {student.phone && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/50 border border-border/50">
                                            <Phone className="w-3.5 h-3.5" /> {student.phone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 mb-1">Status</p>
                                    <Badge
                                        variant="outline"
                                        className={cn("px-4 py-1 text-xs font-bold uppercase tracking-wider", isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20")}
                                    >
                                        {isActive ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                                <div className="w-px h-8 bg-border/60 hidden md:block" />
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 mb-1">Última Atividade</p>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span className="font-bold text-sm">{lastActivity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button onClick={() => navigate(`/cadastro/${id}`)} variant="outline" className="h-12 px-6 rounded-xl border-primary/20 hover:bg-primary/5 text-primary hover:text-primary font-bold">
                                Editar Perfil
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. KPI GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-card to-card/50 border-border/40 hover:border-primary/20 transition-all duration-300 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                            <Dumbbell className="w-24 h-24" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center ring-1 ring-orange-500/20">
                                    <Dumbbell className="w-5 h-5 text-orange-500" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frequência</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black">{kpis.workoutsThisWeek}</span>
                                <span className="text-sm font-bold text-muted-foreground">/ {kpis.weeklyTarget} treinos</span>
                            </div>
                            <div className="mt-3 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min((kpis.workoutsThisWeek / kpis.weeklyTarget) * 100, 100)}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-card to-card/50 border-border/40 hover:border-primary/20 transition-all duration-300 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume Semanal</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black">
                                    {kpis.weeklyVolume >= 1000 ? (kpis.weeklyVolume / 1000).toFixed(1) : kpis.weeklyVolume}
                                </span>
                                <span className="text-sm font-bold text-muted-foreground">
                                    {kpis.weeklyVolume >= 1000 ? 'toneladas' : 'kg'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-card to-card/50 border-border/40 hover:border-primary/20 transition-all duration-300 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                            <Calendar className="w-24 h-24" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center ring-1 ring-violet-500/20">
                                    <Calendar className="w-5 h-5 text-violet-500" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assiduidade</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black">{kpis.monthlyConsistency}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Média das últimas 4 semanas</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-card to-card/50 border-border/40 hover:border-primary/20 transition-all duration-300 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                            <User className="w-24 h-24" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                                    <User className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plano</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xl font-black truncate">{subscription?.plan_name || 'Sem plano'}</span>
                                <Badge variant="secondary" className="w-fit text-[10px] uppercase font-bold">{subscription?.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. MAIN CONTENT TABS */}
                <Tabs defaultValue="training" className="w-full">
                    <div className="flex justify-center mb-8">
                        <TabsList className="h-12 p-1 bg-card/60 backdrop-blur-md border border-border/50 rounded-full shadow-lg">
                            <TabsTrigger value="training" className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Treinos</TabsTrigger>
                            <TabsTrigger value="diet" className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Nutrição</TabsTrigger>
                            <TabsTrigger value="anamnesis" className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Anamnese</TabsTrigger>
                            <TabsTrigger value="financial" className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Financeiro</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="training" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Chart */}
                            <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-primary" /> Volume de Treino
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    {chartData.some(d => d.volume > 0) ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#aaa', fontWeight: 600 }} dy={10} />
                                                <YAxis hide />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const value = payload[0].value as number;
                                                            return (
                                                                <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl shadow-2xl">
                                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">{payload[0].payload.week}</p>
                                                                    <p className="text-lg font-black text-white">
                                                                        {value >= 1000 ? `${(value / 1000).toFixed(1)} ton` : `${value} kg`}
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Area type="monotone" dataKey="volume" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#volumeGradient)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center">
                                            <Activity className="w-12 h-12 text-muted-foreground/20 mb-3" />
                                            <p className="text-sm text-muted-foreground font-medium">Sem dados recentes</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Active Program Details */}
                            <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl h-full flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                                            <Dumbbell className="w-4 h-4 text-amber-500" />
                                            Programa Ativo
                                        </CardTitle>
                                        {trainingProgram && (
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
                                                Em Andamento
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    {trainingProgram ? (
                                        <div className="space-y-6 flex-1 flex flex-col">
                                            <div>
                                                <h3 className="text-2xl font-black text-white leading-tight">{trainingProgram.title}</h3>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                                                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                                        <span className="text-xs font-bold text-zinc-300">{trainingProgram.number_weeks} Semanas</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                                                        <Dumbbell className="w-3.5 h-3.5 text-zinc-400" />
                                                        <span className="text-xs font-bold text-zinc-300">{trainingProgram.training_sessions?.length || 0} Sessões/Semana</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 flex-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pl-1">Estrutura do Treino</p>
                                                <div className="space-y-2">
                                                    {trainingProgram.training_sessions?.map((session: any) => (
                                                        <div
                                                            key={session.id}
                                                            className="group flex items-center gap-4 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer"
                                                            onClick={() => setSelectedSession(session)}
                                                        >
                                                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-colors">
                                                                <span className="text-sm font-black text-amber-500">{session.division}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-sm text-zinc-200 truncate group-hover:text-white transition-colors">{session.name}</p>
                                                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide group-hover:text-amber-500/70 transition-colors">
                                                                    Ver exercícios
                                                                </p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full h-12 font-bold text-black bg-amber-500 hover:bg-amber-600 rounded-xl uppercase tracking-wide gap-2 mt-auto shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all"
                                                onClick={() => navigate('/protocolos')}
                                            >
                                                <Settings className="w-4 h-4" />
                                                Gerenciar Programa
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                                            <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
                                                <Dumbbell className="w-8 h-8 text-zinc-700" />
                                            </div>
                                            <h3 className="text-lg font-bold text-zinc-300 mb-1">Nenhum treino ativo</h3>
                                            <p className="text-xs text-zinc-500 max-w-[200px] mb-6">O aluno não possui um programa de treino ativo no momento.</p>
                                            <Button onClick={() => navigate('/protocolos')} className="bg-amber-500 text-black font-bold hover:bg-amber-600">
                                                Criar Novo Programa
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="diet" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-sm font-black uppercase tracking-wider">Resumo Nutricional</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {mealPlan ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 rounded-2xl bg-background/50 border border-border/50 text-center">
                                                <p className="text-4xl font-black text-primary mb-1">{mealPlan.total_calories}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Calorias Diárias</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-background/50 border border-border/50 text-center">
                                                <p className="text-4xl font-black text-red-500 mb-1">{mealPlan.total_proteins}g</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Proteína</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-background/50 border border-border/50 text-center">
                                                <p className="text-4xl font-black text-amber-500 mb-1">{mealPlan.total_carbs}g</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Carbos</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-background/50 border border-border/50 text-center">
                                                <p className="text-4xl font-black text-cyan-500 mb-1">{mealPlan.total_fats}g</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gorduras</p>
                                            </div>
                                            <div className="col-span-2 p-4 rounded-2xl bg-background/50 border border-border/50 flex justify-between items-center">
                                                <span className="text-sm font-bold opacity-70">Refeições ao dia</span>
                                                <span className="text-xl font-black">{kpis.uniqueMealCount}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground">Sem plano alimentar ativo</p>
                                        </div>
                                    )}

                                    {/* Recent Meal Logs */}
                                    {mealLogs.length > 0 && (
                                        <div className="mt-8 space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registro de Atividades</h4>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[8px] font-black uppercase bg-primary/10 text-primary border-primary/20">Feed Visual</Badge>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {mealLogs.slice(0, 4).map((log: any) => (
                                                    <div
                                                        key={log.id}
                                                        className="group aspect-square rounded-2xl bg-background/40 border border-border/50 overflow-hidden relative cursor-pointer"
                                                        onClick={() => log.photo_url && setSelectedPhoto(log.photo_url)}
                                                    >
                                                        {log.photo_url ? (
                                                            <img src={log.photo_url} alt={log.meal_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-500/5">
                                                                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1 opacity-40" />
                                                                <span className="text-[8px] font-black uppercase text-emerald-500/60">Sem Foto</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="text-[10px] font-black text-white uppercase truncate">{log.meal_name}</p>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Clock className="w-2.5 h-2.5 text-zinc-400" />
                                                                <span className="text-[8px] text-zinc-400 font-bold">{format(new Date(log.created_at), "HH:mm")}</span>
                                                            </div>
                                                        </div>
                                                        {log.photo_url && (
                                                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                                                                <Camera className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Scrollable list for older logs if needed */}
                                            {mealLogs.length > 4 && (
                                                <div className="space-y-1 mt-4">
                                                    {mealLogs.slice(4, 8).map((log: any) => (
                                                        <div key={log.id} className="flex items-center justify-between p-2 rounded-xl bg-background/20 text-[10px] border border-border/30">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", log.photo_url ? "bg-primary" : "bg-emerald-500")} />
                                                                <span className="font-bold text-foreground/70">{log.meal_name}</span>
                                                            </div>
                                                            <span className="text-muted-foreground font-medium">{format(new Date(log.created_at), "HH:mm '·' dd/MM")}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Second Column: Detailed Meal Plan */}
                            <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
                                <CardHeader className="border-b border-border/40 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-black uppercase tracking-wider">Protocolo de Refeições</CardTitle>
                                        <Button size="sm" variant="outline" className="text-[10px] font-black uppercase h-7 gap-2" onClick={() => navigate('/nutricao')}>
                                            <Search className="w-3 h-3" />
                                            Ver Detalhes
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 overflow-auto max-h-[700px]">
                                    {mealPlan?.meals ? (
                                        <div className="divide-y divide-border/20">
                                            {(() => {
                                                const groups: Record<string, any[]> = {};
                                                mealPlan.meals.forEach((m: any) => {
                                                    const key = m.name;
                                                    if (!groups[key]) groups[key] = [];
                                                    groups[key].push(m);
                                                });

                                                return Object.entries(groups).map(([name, options]: [string, any[]], idx) => (
                                                    <div key={idx} className="p-5 hover:bg-white/[0.02] transition-colors relative">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-4 text-emerald-500">
                                                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                                    <Utensils className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black text-sm uppercase tracking-tighter italic text-white">{name}</h4>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">{options[0].meal_time}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Multiple Options Display */}
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {options.map((opt, optIdx) => (
                                                                <div key={opt.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 group/opt">
                                                                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Opção {optIdx + 1}</span>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-[9px] font-bold tabular-nums text-primary">{Math.round(opt.meal_foods?.reduce((acc: number, f: any) => acc + (f.calories || 0), 0) || 0)} kcal</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        {opt.meal_foods?.map((food: any, fIdx: number) => (
                                                                            <div key={fIdx} className="flex items-center justify-between text-xs px-1">
                                                                                <div className="flex items-center gap-2 max-w-[70%]">
                                                                                    <div className="w-1 h-1 rounded-full bg-zinc-600 group-hover/opt:bg-emerald-500 transition-colors" />
                                                                                    <span className="text-zinc-300 truncate font-medium">{food.name}</span>
                                                                                </div>
                                                                                <span className="font-black text-primary tabular-nums text-[10px]">{food.quantity}<span className="text-[8px] opacity-70 ml-0.5 uppercase">{food.unit}</span></span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="p-16 text-center">
                                            <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center mx-auto mb-6">
                                                <Utensils className="w-8 h-8 text-muted-foreground/30" />
                                            </div>
                                            <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Plano não configurado</p>
                                            <Button variant="ghost" className="mt-4 text-xs font-black uppercase text-primary tracking-widest" onClick={() => navigate('/nutricao')}>Ir para Nutrição</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="anamnesis" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-wider">Histórico de Anamnese</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {student.anamnesis?.length > 0 ? (
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-background/80 to-background border border-border/50">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Anamnese Completa</h3>
                                                <p className="text-xs text-muted-foreground">Preenchida em {format(new Date(student.anamnesis[0].created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                                            </div>
                                        </div>
                                        <Button onClick={() => navigate(`/cadastro/${id}`)} className="w-full font-bold">
                                            Ver Respostas Completas
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground mb-4">Anamnese não preenchida ainda.</p>
                                        <Button variant="outline">Solicitar Anamnese</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="financial" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-wider">Situação Financeira</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {subscription ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                                            <span className="text-sm text-muted-foreground font-medium">Plano Atual</span>
                                            <span className="font-bold text-lg">{subscription.plan_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                                            <span className="text-sm text-muted-foreground font-medium">Valor Mensal</span>
                                            <span className="font-bold text-lg">R$ {subscription.price?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/50">
                                            <span className="text-sm text-muted-foreground font-medium">Status</span>
                                            <Badge className={cn("uppercase", subscription.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500')}>
                                                {subscription.status === 'active' ? 'Regular' : subscription.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">Nenhuma assinatura vinculada.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Photo Preview Modal */}
            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="max-w-xl p-0 overflow-hidden bg-zinc-950 border-white/10">
                    <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
                        <DialogTitle className="text-white font-black italic uppercase tracking-tighter">Visualização da Refeição</DialogTitle>
                    </DialogHeader>
                    {selectedPhoto && (
                        <div className="aspect-square w-full relative group">
                            <img
                                src={selectedPhoto}
                                alt="Refeição Anderson"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                        </div>
                    )}
                    <div className="p-4 bg-zinc-900 flex justify-between items-center border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Verificado em Anderson Araújo</span>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedPhoto(null)}
                            className="text-[10px] font-black uppercase tracking-widest"
                        >
                            Fechar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Workout Session Detail Modal */}
            <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
                <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 p-0 overflow-hidden text-white">
                    <DialogHeader className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-white/10">
                        <DialogTitle className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <span className="text-2xl font-black text-amber-500">{selectedSession?.division}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedSession?.name}</h3>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Detalhes do Treino</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-black/40">
                        {selectedSession?.training_exercises && selectedSession.training_exercises.length > 0 ? (
                            selectedSession.training_exercises.map((exercise: any, idx: number) => (
                                <div key={exercise.id} className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-[10px] font-bold text-zinc-500 border border-white/5 shrink-0">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-base text-zinc-200">{exercise.exercise_name || "Exercício sem nome"}</h4>
                                            {exercise.technique && (
                                                <Badge variant="outline" className="text-[9px] uppercase tracking-wider bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                    {exercise.technique}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center">
                                                <span className="text-[9px] uppercase font-bold text-zinc-600">Séries</span>
                                                <span className="text-sm font-bold text-white">{exercise.sets || "--"}</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center">
                                                <span className="text-[9px] uppercase font-bold text-zinc-600">Reps</span>
                                                <span className="text-sm font-bold text-white">{exercise.reps || "--"}</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center">
                                                <span className="text-[9px] uppercase font-bold text-zinc-600">Descanso</span>
                                                <span className="text-sm font-bold text-white">{exercise.rest_time ? `${exercise.rest_time}s` : "--"}</span>
                                            </div>
                                        </div>

                                        {exercise.observation && (
                                            <div className="mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-500/80 text-xs italic">
                                                "{exercise.observation}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Dumbbell className="w-12 h-12 mb-3 opacity-20" />
                                <p>Nenhum exercício cadastrado nesta sessão.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-zinc-900 border-t border-white/10 flex justify-end">
                        <Button onClick={() => setSelectedSession(null)} variant="secondary" className="font-bold uppercase tracking-wide">
                            Fechar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
