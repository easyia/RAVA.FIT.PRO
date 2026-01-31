import { useMemo } from 'react';
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
    XCircle
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

// =============================================
// DATA FETCHING
// =============================================

async function getStudentDetails(studentId: string) {
    const { data, error } = await supabase
        .from('students')
        .select(`
            *,
            coach:profiles!students_coach_id_fkey(full_name, avatar_url),
            anamnesis(*)
        `)
        .eq('id', studentId)
        .single();

    if (error) throw error;
    return data;
}

async function getStudentTrainingPrograms(studentId: string) {
    const { data } = await supabase
        .from('training_programs')
        .select(`
            *,
            training_sessions(*)
        `)
        .eq('student_id', studentId)
        .eq('is_active', true)
        .limit(1);

    return data?.[0] || null;
}

async function getStudentMealPlans(studentId: string) {
    const { data } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_active', true)
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
        const weeklyTrainings = trainingProgram?.training_sessions?.length || 5;

        return {
            workoutsThisWeek: thisWeekDays.size,
            weeklyTarget: weeklyTrainings,
            weeklyVolume,
            monthlyConsistency: consistency
        };
    }, [workoutLogs, trainingProgram]);

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
    if (loadingStudent) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-bold mb-2">Aluno não encontrado</h2>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
            </div>
        );
    }

    const isActive = student.status === 'active';
    const lastActivity = workoutLogs[0]?.created_at
        ? format(new Date(workoutLogs[0].created_at), "dd 'de' MMMM", { locale: ptBR })
        : 'Sem atividade recente';

    return (
        <div className="space-y-6 pb-8">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar
            </Button>

            {/* Header Card */}
            <Card className="border-0 bg-gradient-to-br from-card to-card/80 overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <Avatar className="w-24 h-24 rounded-2xl border-2 border-border">
                            <AvatarImage src={student.avatar_url} className="object-cover" />
                            <AvatarFallback className="rounded-2xl text-3xl font-bold bg-primary/10 text-primary">
                                {student.full_name?.charAt(0)?.toUpperCase() || 'A'}
                            </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold tracking-tight truncate">
                                    {student.full_name}
                                </h1>
                                <Badge
                                    variant="outline"
                                    isActive
                                            ? 'border-amber-500/50 text-amber-500 bg-amber-500/10'
                                : 'border-zinc-500/50 text-zinc-500 bg-zinc-500/10'
                                    )}
                                >
                                {isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {student.email && (
                                <span className="flex items-center gap-1.5">
                                    <Mail className="w-4 h-4" />
                                    {student.email}
                                </span>
                            )}
                            {student.phone && (
                                <span className="flex items-center gap-1.5">
                                    <Phone className="w-4 h-4" />
                                    {student.phone}
                                </span>
                            )}
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Última atividade: <strong className="text-foreground">{lastActivity}</strong></span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

            {/* KPI Cards */ }
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Workouts This Week */}
        <Card className="border-0 bg-card">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Treinos na Semana</p>
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground tabular-nums">
                        {kpis.workoutsThisWeek}
                    </span>
                    <span className="text-lg text-muted-foreground">/ {kpis.weeklyTarget}</span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.min((kpis.workoutsThisWeek / kpis.weeklyTarget) * 100, 100)}%` }}
                    />
                </div>
            </CardContent>
        </Card>

        {/* Weekly Volume */}
        <Card className="border-0 bg-card">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Volume Semanal</p>
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground tabular-nums">
                        {kpis.weeklyVolume >= 1000
                            ? `${(kpis.weeklyVolume / 1000).toFixed(1)}`
                            : kpis.weeklyVolume
                        }
                    </span>
                    <span className="text-lg text-muted-foreground">
                        {kpis.weeklyVolume >= 1000 ? 'ton' : 'kg'}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Peso × Repetições totais
                </p>
            </CardContent>
        </Card>

        {/* Monthly Consistency */}
        <Card className="border-0 bg-card">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Assiduidade Mensal</p>
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground tabular-nums">
                        {kpis.monthlyConsistency}
                    </span>
                    <span className="text-lg text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Últimas 4 semanas ativas
                </p>
            </CardContent>
        </Card>
    </div>

    {/* Volume Chart */ }
    <Card className="border-0 bg-card">
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Evolução do Volume de Treino
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Últimas 4 semanas (Peso × Reps)
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="h-[200px]">
            {chartData.some(d => d.volume > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="week"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#71717a' }}
                        />
                        <YAxis hide />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const value = payload[0].value as number;
                                    return (
                                        <div className="bg-popover border border-border p-2 rounded-lg shadow-lg">
                                            <p className="text-xs text-muted-foreground">Semana {payload[0].payload.week}</p>
                                            <p className="text-sm font-bold">
                                                {value >= 1000 ? `${(value / 1000).toFixed(1)} ton` : `${value} kg`}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="volume"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#volumeGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                    <Activity className="w-12 h-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">
                        Sem dados de treino nas últimas 4 semanas
                    </p>
                </div>
            )}
        </CardContent>
    </Card>

    {/* Content Tabs */ }
    <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
            <TabsTrigger value="training">Treinos</TabsTrigger>
            <TabsTrigger value="diet">Dieta</TabsTrigger>
            <TabsTrigger value="anamnesis">Anamnese</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="mt-4">
            <Card className="border-0 bg-card">
                <CardHeader>
                    <CardTitle className="text-base">Programa de Treino Ativo</CardTitle>
                </CardHeader>
                <CardContent>
                    {trainingProgram ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">{trainingProgram.name}</span>
                                <Badge variant="outline" className="text-primary border-primary/50">
                                    {trainingProgram.training_sessions?.length || 0} sessões
                                </Badge>
                            </div>
                            {trainingProgram.training_sessions?.map((session: any, idx: number) => (
                                <div key={session.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                                        {idx + 1}
                                    </span>
                                    <span className="text-sm font-medium">{session.name}</span>
                                    <Badge variant="outline" className="ml-auto text-xs">
                                        {session.division}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum programa de treino ativo
                        </p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="diet" className="mt-4">
            <Card className="border-0 bg-card">
                <CardHeader>
                    <CardTitle className="text-base">Plano Alimentar</CardTitle>
                </CardHeader>
                <CardContent>
                    {mealPlan ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-2xl font-bold text-foreground">{mealPlan.total_calories || '-'}</p>
                                    <p className="text-xs text-muted-foreground">kcal/dia</p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-2xl font-bold text-foreground">{mealPlan.total_protein || '-'}g</p>
                                    <p className="text-xs text-muted-foreground">proteína</p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-2xl font-bold text-foreground">{mealPlan.meals?.length || '-'}</p>
                                    <p className="text-xs text-muted-foreground">refeições</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum plano alimentar ativo
                        </p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="anamnesis" className="mt-4">
            <Card className="border-0 bg-card">
                <CardHeader>
                    <CardTitle className="text-base">Anamnese</CardTitle>
                </CardHeader>
                <CardContent>
                    {student.anamnesis?.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                                <span className="text-sm">Anamnese preenchida</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Última atualização: {format(new Date(student.anamnesis[0].created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/cadastro/${id}`)}
                            >
                                Ver detalhes completos
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <XCircle className="w-5 h-5" />
                            <span className="text-sm">Anamnese não preenchida</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
            <Card className="border-0 bg-card">
                <CardHeader>
                    <CardTitle className="text-base">Assinatura</CardTitle>
                </CardHeader>
                <CardContent>
                    {subscription ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Status</span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        subscription.status === 'active'
                                            ? 'border-amber-500/50 text-amber-500'
                                            : 'border-amber-500/50 text-amber-500'
                                    )}
                                >
                                    {subscription.status === 'active' ? 'Ativa' : subscription.status}
                                </Badge>
                            </div>
                            {subscription.plan_name && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Plano</span>
                                    <span className="text-sm font-medium">{subscription.plan_name}</span>
                                </div>
                            )}
                            {subscription.price && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Valor</span>
                                    <span className="text-sm font-bold">
                                        R$ {subscription.price.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma assinatura encontrada
                        </p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
        </div >
    );
}
