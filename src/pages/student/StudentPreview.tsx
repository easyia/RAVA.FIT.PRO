import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from '@/components/ui/progress';
import {
    Dumbbell, Utensils, Calendar, TrendingUp, User, Bell, Trophy,
    ChevronRight, Flame, Moon, Activity, CheckCircle2, Clock
} from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-amber-500/50">
                            <AvatarImage src={mockStudent.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-amber-500 text-black font-bold">
                                {mockStudent.full_name ? mockStudent.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs text-gray-400">Olá,</p>
                            <h1 className="font-bold text-sm">{mockStudent.full_name.split(' ')[0]}</h1>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[10px] flex items-center justify-center font-bold">3</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Coach Card */}
                <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="w-14 h-14 border-2 border-amber-500">
                            <AvatarImage src={mockCoach.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-amber-500 text-black font-bold text-xl">
                                {mockCoach.name ? mockCoach.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-xs text-amber-200/80 uppercase tracking-wider">Seu Treinador</p>
                            <h2 className="font-bold text-white">{mockCoach.name}</h2>
                            <p className="text-xs text-gray-300">{mockCoach.specialty}</p>
                        </div>
                        <Badge className="bg-amber-500 text-black">
                            <Trophy className="w-3 h-3 mr-1" /> Gold
                        </Badge>
                    </CardContent>
                </Card>

                {/* Progress Overview */}
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            Sua Evolução
                        </CardTitle>
                        <CardDescription>Últimos 30 dias</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-gray-900/50 rounded-xl">
                            <p className={`text-xl font-bold ${weightChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase">Peso</p>
                        </div>
                        <div className="text-center p-3 bg-gray-900/50 rounded-xl">
                            <p className={`text-xl font-bold ${fatChange < 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {fatChange > 0 ? '+' : ''}{fatChange.toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase">Gordura</p>
                        </div>
                        <div className="text-center p-3 bg-gray-900/50 rounded-xl">
                            <p className={`text-xl font-bold ${muscleChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {muscleChange > 0 ? '+' : ''}{muscleChange.toFixed(1)}kg
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase">Músculo</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Training Progress */}
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-400" />
                                <span className="font-semibold">Treinos da Semana</span>
                            </div>
                            <span className="text-sm text-gray-400">{completedTrainings}/{weeklyTrainings}</span>
                        </div>
                        <Progress value={trainingProgress} className="h-2 bg-gray-700" />
                        <div className="flex justify-between mt-3">
                            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
                                <div
                                    key={i}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < completedTrainings
                                        ? 'bg-green-500 text-white'
                                        : i === completedTrainings
                                            ? 'bg-amber-500 text-black animate-pulse'
                                            : 'bg-gray-700 text-gray-500'
                                        }`}
                                >
                                    {i < completedTrainings ? <CheckCircle2 className="w-4 h-4" /> : day}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30 cursor-pointer hover:border-blue-400/50 transition-all">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[100px]">
                            <Dumbbell className="w-8 h-8 text-blue-400 mb-2" />
                            <h3 className="font-bold">Meu Treino</h3>
                            <p className="text-xs text-gray-400">Treino A hoje</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30 cursor-pointer hover:border-green-400/50 transition-all">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[100px]">
                            <Utensils className="w-8 h-8 text-green-400 mb-2" />
                            <h3 className="font-bold">Minha Dieta</h3>
                            <p className="text-xs text-gray-400">{mockMealPlan.total_calories} kcal</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Today's Training Preview */}
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Dumbbell className="w-4 h-4 text-blue-400" />
                                Treino de Hoje
                            </CardTitle>
                            <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                                {mockTrainingProgram.training_sessions[0].division}
                            </Badge>
                        </div>
                        <CardDescription>{mockTrainingProgram.training_sessions[0].name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {mockTrainingProgram.training_sessions[0].training_exercises.slice(0, 4).map((ex, i) => (
                            <div key={ex.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm">{ex.name}</span>
                                </div>
                                <span className="text-xs text-gray-400">{ex.sets}x{ex.reps_min}-{ex.reps_max}</span>
                            </div>
                        ))}
                        <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
                            Iniciar Treino <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Meal Plan Preview */}
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Utensils className="w-4 h-4 text-green-400" />
                                Próxima Refeição
                            </CardTitle>
                            <Badge variant="outline" className="border-green-500/50 text-green-400">
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
                                    <span className="text-gray-400">{food.quantity}{food.unit}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-700 grid grid-cols-4 gap-2 text-center">
                            <div>
                                <p className="text-lg font-bold text-amber-400">{mockMealPlan.total_calories}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Kcal</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-red-400">{mockMealPlan.total_proteins}g</p>
                                <p className="text-[10px] text-gray-500 uppercase">Prot</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-blue-400">{mockMealPlan.total_carbs}g</p>
                                <p className="text-[10px] text-gray-500 uppercase">Carb</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-yellow-400">{mockMealPlan.total_fats}g</p>
                                <p className="text-[10px] text-gray-500 uppercase">Gord</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Feedback Prompt */}
                <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Check-in Semanal</h3>
                                <p className="text-xs text-gray-400">Como foi sua semana?</p>
                            </div>
                        </div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            Responder
                        </Button>
                    </CardContent>
                </Card>

                {/* Footer Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800">
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
                                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${item.active
                                    ? 'text-amber-400'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
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
                <Badge className="bg-red-600 text-white animate-pulse">
                    🎬 MODO PREVIEW - DADOS DEMONSTRATIVOS
                </Badge>
            </div>
        </div>
    );
};

export default StudentPreview;
