import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from '@/components/ui/progress';
import {
    Dumbbell, Utensils, Calendar, TrendingUp, User, Bell, Trophy,
    ChevronRight, Flame, Activity, CheckCircle2, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    mockStudent, mockCoach, mockTrainingProgram, mockMealPlan,
    mockAssessments, mockFeedbacks, mockSubscription, mockCalendarEvents
} from '@/data/mockStudentData';

const StudentPreview = () => {
    const latestAssessment = mockAssessments[mockAssessments.length - 1];
    const prevAssessment = mockAssessments[mockAssessments.length - 2];

    // Calculate progress metrics
    const weightChange = latestAssessment.weight - prevAssessment.weight;
    const fatChange = latestAssessment.body_fat - prevAssessment.body_fat;
    const muscleChange = latestAssessment.muscle_mass - prevAssessment.muscle_mass;

    // Training completion (mock)
    const weeklyTrainings = 5;
    const completedTrainings = 3;
    const trainingProgress = (completedTrainings / weeklyTrainings) * 100;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header - Premium Glassmorphism */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary/50">
                            <AvatarImage src={mockStudent.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                {mockStudent.full_name ? mockStudent.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs text-muted-foreground">Olá,</p>
                            <h1 className="font-bold text-sm">{mockStudent.full_name.split(' ')[0]}</h1>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center font-bold text-primary-foreground">3</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Coach Card - Premium Glow */}
                <Card className="border-0 bg-card overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5" />
                    <CardContent className="p-4 flex items-center gap-4 relative">
                        <Avatar className="w-14 h-14 border-2 border-primary">
                            <AvatarImage src={mockCoach.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                                {mockCoach.name ? mockCoach.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Seu Treinador</p>
                            <h2 className="font-bold text-foreground">{mockCoach.name}</h2>
                            <p className="text-xs text-muted-foreground">{mockCoach.specialty}</p>
                        </div>
                        <Badge className="bg-primary text-primary-foreground">
                            <Trophy className="w-3 h-3 mr-1" /> Gold
                        </Badge>
                    </CardContent>
                </Card>

                {/* Progress Overview - Borderless Cards */}
                <Card className="border-0 bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Sua Evolução
                        </CardTitle>
                        <CardDescription>Últimos 30 dias</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Peso', value: weightChange, suffix: 'kg', positive: weightChange > 0 },
                            { label: 'Gordura', value: fatChange, suffix: '%', positive: fatChange < 0, invert: true },
                            { label: 'Músculo', value: muscleChange, suffix: 'kg', positive: muscleChange > 0 },
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-3 bg-muted/30 rounded-xl">
                                <p className={cn(
                                    'text-xl font-bold',
                                    stat.invert
                                        ? (stat.value < 0 ? 'text-primary' : 'text-destructive')
                                        : (stat.value > 0 ? 'text-primary' : 'text-destructive')
                                )}>
                                    {stat.value > 0 ? '+' : ''}{stat.value.toFixed(1)}{stat.suffix}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Weekly Training Progress - Clean Design */}
                <Card className="border-0 bg-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-primary" />
                                <span className="font-semibold">Treinos da Semana</span>
                            </div>
                            <span className="text-sm text-muted-foreground tabular-nums">{completedTrainings}/{weeklyTrainings}</span>
                        </div>
                        <Progress value={trainingProgress} className="h-2 bg-muted" />
                        <div className="flex justify-between mt-3">
                            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                                        i < completedTrainings
                                            ? 'bg-primary text-primary-foreground'
                                            : i === completedTrainings
                                                ? 'bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                                                : 'bg-muted text-muted-foreground'
                                    )}
                                >
                                    {i < completedTrainings ? <CheckCircle2 className="w-4 h-4" /> : day}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions - Minimal Gradient */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card className="border-0 bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[100px]">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <Dumbbell className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-bold">Meu Treino</h3>
                                <p className="text-xs text-muted-foreground">Treino A hoje</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card className="border-0 bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[100px]">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <Utensils className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-bold">Minha Dieta</h3>
                                <p className="text-xs text-muted-foreground">{mockMealPlan.total_calories} kcal</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Today's Training Preview - Premium Card */}
                <Card className="border-0 bg-card">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Dumbbell className="w-4 h-4 text-primary" />
                                Treino de Hoje
                            </CardTitle>
                            <Badge variant="outline" className="border-primary/50 text-primary">
                                {mockTrainingProgram.training_sessions[0].division}
                            </Badge>
                        </div>
                        <CardDescription>{mockTrainingProgram.training_sessions[0].name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {mockTrainingProgram.training_sessions[0].training_exercises.slice(0, 4).map((ex, i) => (
                            <div key={ex.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm font-medium">{ex.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground tabular-nums">{ex.sets}x{ex.reps_min}-{ex.reps_max}</span>
                            </div>
                        ))}
                        <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                            Iniciar Treino <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Meal Plan Preview - Clean Macros */}
                <Card className="border-0 bg-card">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Utensils className="w-4 h-4 text-primary" />
                                Próxima Refeição
                            </CardTitle>
                            <Badge variant="outline" className="border-primary/50 text-primary">
                                <Clock className="w-3 h-3 mr-1" /> 12:30
                            </Badge>
                        </div>
                        <CardDescription>Almoço</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {mockMealPlan.meals[2].foods.map((food, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span>{food.name}</span>
                                    <span className="text-muted-foreground tabular-nums">{food.quantity}{food.unit}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-border grid grid-cols-4 gap-2 text-center">
                            {[
                                { label: 'Kcal', value: mockMealPlan.total_calories, color: 'text-primary' },
                                { label: 'Prot', value: `${mockMealPlan.total_proteins}g`, color: 'text-red-500' },
                                { label: 'Carb', value: `${mockMealPlan.total_carbs}g`, color: 'text-blue-500' },
                                { label: 'Gord', value: `${mockMealPlan.total_fats}g`, color: 'text-yellow-500' },
                            ].map((macro, i) => (
                                <div key={i}>
                                    <p className={cn('text-lg font-bold', macro.color)}>{macro.value}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{macro.label}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Feedback Prompt - Subtle Glow */}
                <Card className="border-0 bg-card relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
                    <CardContent className="p-4 flex items-center justify-between relative">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Check-in Semanal</h3>
                                <p className="text-xs text-muted-foreground">Como foi sua semana?</p>
                            </div>
                        </div>
                        <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                            Responder
                        </Button>
                    </CardContent>
                </Card>

                {/* Footer Navigation - Glassmorphism */}
                <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50">
                    <div className="max-w-md mx-auto flex justify-around py-3">
                        {[
                            { icon: Dumbbell, label: 'Treino', active: false },
                            { icon: Utensils, label: 'Dieta', active: false },
                            { icon: User, label: 'Home', active: true },
                            { icon: Calendar, label: 'Agenda', active: false },
                            { icon: TrendingUp, label: 'Evolução', active: false },
                        ].map((item, i) => (
                            <button
                                key={i}
                                className={cn(
                                    'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors',
                                    item.active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Spacer for fixed footer */}
                <div className="h-20" />
            </main>

            {/* Demo Badge */}
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50">
                <Badge className="bg-destructive text-destructive-foreground">
                    🎬 MODO PREVIEW - DADOS DEMONSTRATIVOS
                </Badge>
            </div>
        </div>
    );
};

export default StudentPreview;
