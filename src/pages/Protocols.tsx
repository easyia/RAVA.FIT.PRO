import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    Trash2,
    Save,
    ArrowLeft,
    ChevronRight,
    Dumbbell,
    Utensils,
    Clock,
    Edit3,
    X,
    Sparkles,
    Calendar,
    User,
    TrendingUp
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudents, getTrainingPrograms, getMealPlans, saveTrainingProgram, saveMealPlan } from "@/services/studentService";
import { Student } from "@/types/student";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Training Interfaces
interface Exercise {
    id?: string;
    name: string;
    sets: number;
    reps_min: number;
    reps_max: number;
    rest_time: string;
    notes: string;
}

interface Session {
    id?: string;
    division: string;
    name: string;
    exercises: Exercise[];
}

interface TrainingProgram {
    id: string;
    title: string;
    number_weeks: number;
    start_date: string;
    status: string;
    created_at: string;
    training_sessions: any[];
}

interface MealPlan {
    id: string;
    title: string;
    goal: string;
    status: string;
    created_at: string;
    meals: any[];
    total_proteins?: number;
    total_carbs?: number;
    total_fats?: number;
    total_calories?: number;
}

const Protocols = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("training");

    // Edit States
    const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
    const [editingDietId, setEditingDietId] = useState<string | null>(null);
    const [editedSessions, setEditedSessions] = useState<Session[]>([]);
    const [editedMeals, setEditedMeals] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: students, isLoading: loadingStudents } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    const { data: trainingPrograms = [], isLoading: loadingTraining } = useQuery({
        queryKey: ["trainingPrograms", selectedStudent?.id],
        queryFn: () => getTrainingPrograms(selectedStudent!.id),
        enabled: !!selectedStudent
    });

    const { data: mealPlans = [], isLoading: loadingMeals } = useQuery({
        queryKey: ["mealPlans", selectedStudent?.id],
        queryFn: () => getMealPlans(selectedStudent!.id),
        enabled: !!selectedStudent
    });

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Start editing a training program
    const handleEditTraining = (program: TrainingProgram) => {
        setEditingTrainingId(program.id);
        setEditedSessions(program.training_sessions.map((s: any) => ({
            id: s.id,
            division: s.division,
            name: s.name,
            exercises: s.training_exercises?.map((e: any) => ({
                id: e.id,
                name: e.name,
                sets: e.sets,
                reps_min: e.reps_min,
                reps_max: e.reps_max,
                rest_time: e.rest_time || "60",
                notes: e.notes || ""
            })) || []
        })));
    };

    // Add exercise to a session
    const addExerciseToSession = (sessionIndex: number) => {
        const updated = [...editedSessions];
        updated[sessionIndex].exercises.push({
            name: "",
            sets: 3,
            reps_min: 8,
            reps_max: 12,
            rest_time: "60",
            notes: ""
        });
        setEditedSessions(updated);
    };

    // Remove exercise from a session
    const removeExerciseFromSession = (sessionIndex: number, exerciseIndex: number) => {
        const updated = [...editedSessions];
        updated[sessionIndex].exercises.splice(exerciseIndex, 1);
        setEditedSessions(updated);
    };

    // Update exercise field
    const updateExerciseField = (sessionIndex: number, exerciseIndex: number, field: string, value: any) => {
        const updated = [...editedSessions];
        (updated[sessionIndex].exercises[exerciseIndex] as any)[field] = value;
        setEditedSessions(updated);
    };

    // Save edited training to database
    const handleSaveEditedTraining = async () => {
        if (!selectedStudent || !editingTrainingId) return;
        setIsSaving(true);

        try {
            for (const session of editedSessions) {
                if (session.id) {
                    await supabase.from('training_exercises').delete().eq('training_session_id', session.id);

                    if (session.exercises.length > 0) {
                        const exercisesToInsert = session.exercises.map((ex, idx) => ({
                            training_session_id: session.id,
                            name: ex.name,
                            sets: ex.sets,
                            reps_min: ex.reps_min,
                            reps_max: ex.reps_max,
                            rest_time: ex.rest_time,
                            notes: ex.notes,
                            execution_order: idx + 1
                        }));
                        await supabase.from('training_exercises').insert(exercisesToInsert);
                    }
                }
            }

            toast.success("Treino atualizado com sucesso!");
            setEditingTrainingId(null);
            queryClient.invalidateQueries({ queryKey: ["trainingPrograms", selectedStudent.id] });
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao salvar alterações.");
        } finally {
            setIsSaving(false);
        }
    };

    // Start editing a diet
    const handleEditDiet = (plan: MealPlan) => {
        setEditingDietId(plan.id);
        setEditedMeals(plan.meals.map((m: any) => ({
            id: m.id,
            name: m.name,
            time: m.meal_time,
            foods: m.meal_foods?.map((f: any) => ({
                id: f.id,
                name: f.name,
                quantity: f.quantity,
                unit: f.unit,
                notes: f.notes || ""
            })) || []
        })));
    };

    // Add food to a meal
    const addFoodToMeal = (mealIndex: number) => {
        const updated = [...editedMeals];
        updated[mealIndex].foods.push({ name: "", quantity: 0, unit: "g", notes: "" });
        setEditedMeals(updated);
    };

    // Remove food from a meal
    const removeFoodFromMeal = (mealIndex: number, foodIndex: number) => {
        const updated = [...editedMeals];
        updated[mealIndex].foods.splice(foodIndex, 1);
        setEditedMeals(updated);
    };

    // Update food field
    const updateFoodField = (mealIndex: number, foodIndex: number, field: string, value: any) => {
        const updated = [...editedMeals];
        (updated[mealIndex].foods[foodIndex] as any)[field] = value;
        setEditedMeals(updated);
    };

    // Save edited diet
    const handleSaveEditedDiet = async () => {
        if (!selectedStudent || !editingDietId) return;
        setIsSaving(true);

        try {
            for (const meal of editedMeals) {
                if (meal.id) {
                    await supabase.from('meal_foods').delete().eq('meal_id', meal.id);

                    if (meal.foods.length > 0) {
                        const foodsToInsert = meal.foods.map((f: any, idx: number) => ({
                            meal_id: meal.id,
                            name: f.name,
                            quantity: parseFloat(f.quantity) || 0,
                            unit: f.unit,
                            order_index: idx + 1
                        }));
                        await supabase.from('meal_foods').insert(foodsToInsert);
                    }
                }
            }

            toast.success("Dieta atualizada com sucesso!");
            setEditingDietId(null);
            queryClient.invalidateQueries({ queryKey: ["mealPlans", selectedStudent.id] });
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao salvar alterações.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            <div className={cn("transition-all duration-300 min-h-screen pb-20", sidebarCollapsed ? "ml-16" : "ml-60")}>
                <main className="p-8 max-w-6xl mx-auto text-foreground">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Protocolos</h1>
                            <p className="text-muted-foreground">
                                {selectedStudent ? `Visualizando protocolos de ${selectedStudent.name}` : "Selecione um aluno para ver os protocolos"}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {selectedStudent && (
                                <>
                                    <Button variant="outline" onClick={() => setSelectedStudent(null)} className="gap-2">
                                        <ArrowLeft className="w-4 h-4" /> Trocar Aluno
                                    </Button>
                                    <Button onClick={() => navigate('/ia-assistant')} className="gap-2">
                                        <Sparkles className="w-4 h-4" /> Criar com IA
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {!selectedStudent ? (
                        <div className="animate-fade-in space-y-6">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                <Input placeholder="Buscar aluno..." className="pl-10 h-11 bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {loadingStudents ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) :
                                    filteredStudents?.map(student => (
                                        <button key={student.id} onClick={() => setSelectedStudent(student)} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary transition-all text-left group">
                                            <img src={student.avatar} className="w-12 h-12 rounded-full object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{student.name}</h3>
                                                <p className="text-xs text-muted-foreground truncate">{student.goal}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-tertiary" />
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    ) : (
                        <Tabs defaultValue="training" className="animate-fade-in" onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-card p-1">
                                <TabsTrigger value="training" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Dumbbell className="w-4 h-4" /> Treinos ({trainingPrograms.length})
                                </TabsTrigger>
                                <TabsTrigger value="nutrition" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Utensils className="w-4 h-4" /> Dietas ({mealPlans.length})
                                </TabsTrigger>
                            </TabsList>

                            {/* TRAINING TAB */}
                            <TabsContent value="training" className="space-y-6">
                                {loadingTraining ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                    </div>
                                ) : trainingPrograms.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent className="p-12 text-center">
                                            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                                            <h3 className="text-lg font-semibold mb-2">Nenhum protocolo de treino</h3>
                                            <p className="text-muted-foreground mb-6">Crie um treino personalizado usando o Assistente IA.</p>
                                            <Button onClick={() => navigate('/ia-assistant')}>
                                                <Sparkles className="w-4 h-4 mr-2" /> Criar com IA
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-6">
                                        {/* WORKOUT VOLUME CHART */}
                                        {trainingPrograms.length > 0 && (
                                            <Card className="border-border bg-card shadow-lg mb-6">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-primary" /> Volume Semanal Estimado
                                                    </CardTitle>
                                                    <CardDescription className="text-[10px]">Volume total acumulado por agrupamento muscular no protocolo atual</CardDescription>
                                                </CardHeader>
                                                <CardContent className="h-[250px] pt-0">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                                                            (() => {
                                                                const volumes: Record<string, number> = {};
                                                                const latest = trainingPrograms[0];
                                                                latest.training_sessions?.forEach((session: any) => {
                                                                    session.training_exercises?.forEach((ex: any) => {
                                                                        const muscle = session.name || 'Geral';
                                                                        const volume = (ex.sets || 0) * ((ex.reps_min + ex.reps_max) / 2 || 0);
                                                                        volumes[muscle] = (volumes[muscle] || 0) + volume;
                                                                    });
                                                                });
                                                                return Object.entries(volumes).map(([name, value]) => ({ name, value }));
                                                            })()
                                                        }>
                                                            <PolarGrid stroke="#ffffff10" />
                                                            <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                            <PolarRadiusAxis tick={false} axisLine={false} />
                                                            <Radar
                                                                name="Volume"
                                                                dataKey="value"
                                                                stroke="#9b87f5"
                                                                fill="#9b87f5"
                                                                fillOpacity={0.5}
                                                            />
                                                            <RechartsTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }} />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {trainingPrograms.map((program: TrainingProgram) => (
                                            <Card key={program.id} className="overflow-hidden">
                                                <CardHeader className="bg-muted/30 border-b">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-xl">{program.title || 'Sem título'}</CardTitle>
                                                            <CardDescription className="flex items-center gap-4 mt-2">
                                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {program.number_weeks} semanas</span>
                                                                <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>{program.status}</Badge>
                                                            </CardDescription>
                                                        </div>
                                                        {editingTrainingId !== program.id ? (
                                                            <Button variant="outline" size="sm" onClick={() => handleEditTraining(program)}>
                                                                <Edit3 className="w-4 h-4 mr-2" /> Editar
                                                            </Button>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="sm" onClick={() => setEditingTrainingId(null)}>
                                                                    <X className="w-4 h-4 mr-1" /> Cancelar
                                                                </Button>
                                                                <Button size="sm" onClick={handleSaveEditedTraining} disabled={isSaving}>
                                                                    <Save className="w-4 h-4 mr-1" /> Salvar
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-0">
                                                    {editingTrainingId === program.id ? (
                                                        // EDIT MODE
                                                        <div className="divide-y divide-border">
                                                            {editedSessions.map((session, sIdx) => (
                                                                <div key={session.id || sIdx} className="p-6">
                                                                    <div className="flex items-center gap-4 mb-4">
                                                                        <Badge variant="outline" className="text-lg font-bold px-3 py-1">{session.division}</Badge>
                                                                        <span className="font-semibold">{session.name}</span>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        {session.exercises.map((ex, eIdx) => (
                                                                            <div key={ex.id || eIdx} className="grid grid-cols-12 gap-3 items-center bg-muted/30 p-3 rounded-lg">
                                                                                <div className="col-span-12 lg:col-span-4">
                                                                                    <Input
                                                                                        value={ex.name}
                                                                                        onChange={(e) => updateExerciseField(sIdx, eIdx, 'name', e.target.value)}
                                                                                        placeholder="Nome do exercício"
                                                                                        className="bg-background"
                                                                                    />
                                                                                </div>
                                                                                <div className="col-span-3 lg:col-span-1">
                                                                                    <Label className="text-[10px]">Séries</Label>
                                                                                    <Input type="number" value={ex.sets} onChange={(e) => updateExerciseField(sIdx, eIdx, 'sets', parseInt(e.target.value))} className="bg-background" />
                                                                                </div>
                                                                                <div className="col-span-3 lg:col-span-1">
                                                                                    <Label className="text-[10px]">Min</Label>
                                                                                    <Input type="number" value={ex.reps_min} onChange={(e) => updateExerciseField(sIdx, eIdx, 'reps_min', parseInt(e.target.value))} className="bg-background" />
                                                                                </div>
                                                                                <div className="col-span-3 lg:col-span-1">
                                                                                    <Label className="text-[10px]">Max</Label>
                                                                                    <Input type="number" value={ex.reps_max} onChange={(e) => updateExerciseField(sIdx, eIdx, 'reps_max', parseInt(e.target.value))} className="bg-background" />
                                                                                </div>
                                                                                <div className="col-span-3 lg:col-span-2">
                                                                                    <Label className="text-[10px]">Descanso</Label>
                                                                                    <Input value={ex.rest_time} onChange={(e) => updateExerciseField(sIdx, eIdx, 'rest_time', e.target.value)} className="bg-background" />
                                                                                </div>
                                                                                <div className="col-span-10 lg:col-span-2">
                                                                                    <Input value={ex.notes} placeholder="Obs..." onChange={(e) => updateExerciseField(sIdx, eIdx, 'notes', e.target.value)} className="bg-background" />
                                                                                </div>
                                                                                <div className="col-span-2 lg:col-span-1 flex justify-end">
                                                                                    <Button variant="ghost" size="icon" onClick={() => removeExerciseFromSession(sIdx, eIdx)} className="text-destructive hover:text-destructive">
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => addExerciseToSession(sIdx)}>
                                                                            <Plus className="w-4 h-4 mr-2" /> Adicionar Exercício
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        // VIEW MODE
                                                        <div className="divide-y divide-border">
                                                            {program.training_sessions?.map((session: any) => (
                                                                <div key={session.id} className="p-6">
                                                                    <div className="flex items-center gap-4 mb-4">
                                                                        <Badge variant="outline" className="text-lg font-bold px-3 py-1">{session.division}</Badge>
                                                                        <span className="font-semibold">{session.name}</span>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {session.training_exercises?.map((ex: any, eIdx: number) => (
                                                                            <div key={ex.id} className="flex justify-between items-center py-2 px-3 bg-muted/20 rounded-lg">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="text-xs text-muted-foreground w-6">{eIdx + 1}.</span>
                                                                                    <span className="font-medium">{ex.name}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                                    <span>{ex.sets} × {ex.reps_min}-{ex.reps_max}</span>
                                                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ex.rest_time}s</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* NUTRITION TAB */}
                            <TabsContent value="nutrition" className="space-y-6">
                                {loadingMeals ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                    </div>
                                ) : mealPlans.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent className="p-12 text-center">
                                            <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                                            <h3 className="text-lg font-semibold mb-2">Nenhum protocolo de dieta</h3>
                                            <p className="text-muted-foreground mb-6">Crie uma dieta personalizada usando o Assistente IA.</p>
                                            <Button onClick={() => navigate('/ia-diet-assistant')}>
                                                <Sparkles className="w-4 h-4 mr-2" /> Criar com IA
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-6">
                                        {/* DIET MACROS CHART */}
                                        {mealPlans.length > 0 && (
                                            <Card className="border-border bg-card shadow-lg mb-6">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                        <Utensils className="w-4 h-4 text-primary" /> Distribuição de Macronutrientes
                                                    </CardTitle>
                                                    <CardDescription className="text-[10px]">Divisão percentual de Proteínas, Carbos e Gorduras no plano</CardDescription>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <div className="h-[200px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={[
                                                                        { name: 'Proteínas', value: Number(mealPlans[0].total_proteins) || 0, color: '#9b87f5' },
                                                                        { name: 'Carbos', value: Number(mealPlans[0].total_carbs) || 0, color: '#7E69AB' },
                                                                        { name: 'Gorduras', value: Number(mealPlans[0].total_fats) || 0, color: '#6E59A5' },
                                                                    ]}
                                                                    innerRadius={50}
                                                                    outerRadius={70}
                                                                    paddingAngle={5}
                                                                    dataKey="value"
                                                                >
                                                                    <Cell fill="#9b87f5" />
                                                                    <Cell fill="#7E69AB" />
                                                                    <Cell fill="#6E59A5" />
                                                                </Pie>
                                                                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                                        <div className="p-2 bg-muted/20 rounded border border-border text-center">
                                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Proteína</p>
                                                            <p className="text-sm font-bold">{mealPlans[0].total_proteins}g</p>
                                                        </div>
                                                        <div className="p-2 bg-muted/20 rounded border border-border text-center">
                                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Carbo</p>
                                                            <p className="text-sm font-bold">{mealPlans[0].total_carbs}g</p>
                                                        </div>
                                                        <div className="p-2 bg-muted/20 rounded border border-border text-center">
                                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Kcal</p>
                                                            <p className="text-sm font-bold text-primary">{mealPlans[0].total_calories}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {mealPlans.map((plan: MealPlan) => (
                                            <Card key={plan.id} className="overflow-hidden">
                                                <CardHeader className="bg-muted/30 border-b">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-xl">{plan.title || 'Sem título'}</CardTitle>
                                                            <CardDescription className="flex items-center gap-4 mt-2">
                                                                <Badge variant="secondary">{plan.goal || 'Objetivo não definido'}</Badge>
                                                                <Badge variant={plan.status === 'active' ? 'default' : 'outline'}>{plan.status}</Badge>
                                                            </CardDescription>
                                                        </div>
                                                        {editingDietId !== plan.id ? (
                                                            <Button variant="outline" size="sm" onClick={() => handleEditDiet(plan)}>
                                                                <Edit3 className="w-4 h-4 mr-2" /> Editar
                                                            </Button>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="sm" onClick={() => setEditingDietId(null)}>
                                                                    <X className="w-4 h-4 mr-1" /> Cancelar
                                                                </Button>
                                                                <Button size="sm" onClick={handleSaveEditedDiet} disabled={isSaving}>
                                                                    <Save className="w-4 h-4 mr-1" /> Salvar
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-0">
                                                    {editingDietId === plan.id ? (
                                                        // EDIT MODE
                                                        <div className="divide-y divide-border">
                                                            {editedMeals.map((meal, mIdx) => (
                                                                <div key={meal.id || mIdx} className="p-6">
                                                                    <div className="flex items-center gap-4 mb-4">
                                                                        <Badge className="bg-primary">{mIdx + 1}</Badge>
                                                                        <span className="font-semibold">{meal.name}</span>
                                                                        <span className="text-sm text-muted-foreground">{meal.time}</span>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        {meal.foods.map((food: any, fIdx: number) => (
                                                                            <div key={food.id || fIdx} className="grid grid-cols-12 gap-3 items-center bg-muted/30 p-3 rounded-lg">
                                                                                <div className="col-span-12 lg:col-span-5">
                                                                                    <Input
                                                                                        value={food.name}
                                                                                        onChange={(e) => updateFoodField(mIdx, fIdx, 'name', e.target.value)}
                                                                                        placeholder="Nome do alimento"
                                                                                        className="bg-background"
                                                                                    />
                                                                                </div>
                                                                                <div className="col-span-4 lg:col-span-2">
                                                                                    <Input type="number" value={food.quantity} onChange={(e) => updateFoodField(mIdx, fIdx, 'quantity', e.target.value)} placeholder="Qtd" className="bg-background" />
                                                                                </div>
                                                                                <div className="col-span-4 lg:col-span-2">
                                                                                    <Input value={food.unit} onChange={(e) => updateFoodField(mIdx, fIdx, 'unit', e.target.value)} placeholder="Unid" className="bg-background" />
                                                                                </div>
                                                                                <div className="col-span-2 lg:col-span-2">
                                                                                    <Input value={food.notes} placeholder="Obs..." onChange={(e) => updateFoodField(mIdx, fIdx, 'notes', e.target.value)} className="bg-background" />
                                                                                </div>
                                                                                <div className="col-span-2 lg:col-span-1 flex justify-end">
                                                                                    <Button variant="ghost" size="icon" onClick={() => removeFoodFromMeal(mIdx, fIdx)} className="text-destructive hover:text-destructive">
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => addFoodToMeal(mIdx)}>
                                                                            <Plus className="w-4 h-4 mr-2" /> Adicionar Alimento
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        // VIEW MODE
                                                        <div className="divide-y divide-border">
                                                            {plan.meals?.map((meal: any, mIdx: number) => (
                                                                <div key={meal.id} className="p-6">
                                                                    <div className="flex items-center gap-4 mb-4">
                                                                        <Badge className="bg-primary">{mIdx + 1}</Badge>
                                                                        <span className="font-semibold">{meal.name}</span>
                                                                        <span className="text-sm text-muted-foreground">{meal.meal_time}</span>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {meal.meal_foods?.map((food: any, fIdx: number) => (
                                                                            <div key={food.id} className="flex justify-between items-center py-2 px-3 bg-muted/20 rounded-lg">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="text-xs text-muted-foreground w-6">{fIdx + 1}.</span>
                                                                                    <span className="font-medium">{food.name}</span>
                                                                                </div>
                                                                                <span className="text-sm text-muted-foreground">{food.quantity} {food.unit}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Protocols;
