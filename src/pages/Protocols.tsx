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
    TrendingUp,
    Download,
    Target,
    Activity,
    Zap,
    Droplet,
    Dumbbell as DumbbellIcon,
    PieChart as PieIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudents, getTrainingPrograms, getMealPlans, saveTrainingProgram, saveMealPlan, setActiveTrainingProgram, setActiveMealPlan } from "@/services/studentService";
import { Student } from "@/types/student";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { generateDietReport } from "@/services/pdfService";

// Training Interfaces
interface Exercise {
    id?: string;
    name: string;
    sets: number;
    reps_min: number;
    reps_max: number;
    rest_time: string;
    notes: string;
    main_muscle_group?: string;
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
    start_date?: string;
    end_date?: string;
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
    const [editedProgram, setEditedProgram] = useState<Partial<TrainingProgram>>({});
    const [editingDietId, setEditingDietId] = useState<string | null>(null);
    const [editedSessions, setEditedSessions] = useState<Session[]>([]);
    const [editedMeals, setEditedMeals] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [expandedTrainingIds, setExpandedTrainingIds] = useState<Set<string>>(new Set());
    const [expandedDietIds, setExpandedDietIds] = useState<Set<string>>(new Set());
    const [isSettingActive, setIsSettingActive] = useState(false);

    const toggleTrainingExpansion = (id: string) => {
        setExpandedTrainingIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleDietExpansion = (id: string) => {
        setExpandedDietIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSetActiveTraining = async (programId: string) => {
        if (!selectedStudent || isSettingActive) return;
        setIsSettingActive(true);
        try {
            await setActiveTrainingProgram(selectedStudent.id, programId);

            // Força a atualização local do estado antes do refetch
            queryClient.setQueryData(['trainingPrograms', selectedStudent.id], (old: any) => {
                if (!old) return [];
                return old.map((p: any) => ({
                    ...p,
                    status: p.id === programId ? 'active' : 'inactive'
                }));
            });

            await queryClient.refetchQueries({ queryKey: ['trainingPrograms', selectedStudent.id] });
            toast.success("Plano de treino definido como ATIVO!");
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao definir treino ativo.");
        } finally {
            setIsSettingActive(false);
        }
    };

    const handleSetActiveDiet = async (planId: string) => {
        if (!selectedStudent || isSettingActive) return;
        setIsSettingActive(true);
        try {
            await setActiveMealPlan(selectedStudent.id, planId);

            // Optimistic update
            queryClient.setQueryData(['mealPlans', selectedStudent.id], (old: any) => {
                if (!old) return [];
                return old.map((p: any) => ({
                    ...p,
                    status: p.id === planId ? 'active' : 'inactive'
                }));
            });

            await queryClient.refetchQueries({ queryKey: ['mealPlans', selectedStudent.id] });
            toast.success("Plano de dieta definido como ATIVO!");
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao definir dieta ativa.");
        } finally {
            setIsSettingActive(false);
        }
    };

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

    const activeDiet = mealPlans.find((p: any) => p.status === 'active') || mealPlans[0];
    const activeTraining = trainingPrograms.find((p: any) => p.status === 'active') || trainingPrograms[0];

    const { data: coachProfile } = useQuery({
        queryKey: ['coachProfile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            const { data } = await supabase.from('coaches').select('*').eq('id', user.id).single();
            return data;
        }
    });

    const [showMethodology, setShowMethodology] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const handleGenerateDietPDF = async () => {
        if (!activeDiet || !selectedStudent) return;

        setIsGeneratingPDF(true);
        try {
            await generateDietReport({
                student: selectedStudent,
                plan: activeDiet,
                coach: coachProfile
            });
            toast.success("Plano Alimentar gerado com sucesso!");
        } catch (error) {
            toast.error("Erro ao gerar PDF.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Start editing a training program
    const handleEditTraining = (program: TrainingProgram) => {
        setEditingTrainingId(program.id);
        setEditedProgram({
            title: program.title,
            start_date: program.start_date,
            end_date: program.end_date,
            number_weeks: program.number_weeks
        });
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
                notes: e.notes || "",
                main_muscle_group: e.main_muscle_group || "Geral"
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
            notes: "",
            main_muscle_group: "Geral"
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
            // Update Program Details
            await supabase
                .from('training_programs')
                .update({
                    title: editedProgram.title,
                    start_date: editedProgram.start_date,
                    end_date: editedProgram.end_date,
                    number_weeks: editedProgram.number_weeks,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingTrainingId);

            // Update Sessions and Exercises
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
                            main_muscle_group: ex.main_muscle_group,
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
                            <TabsList className="inline-flex w-auto mb-10 h-11 bg-card/30 backdrop-blur-xl p-1 rounded-full border border-border/40">
                                <TabsTrigger
                                    value="training"
                                    className="px-6 rounded-full gap-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                                >
                                    <Activity className="w-3.5 h-3.5" /> Treinos ({trainingPrograms.length})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="nutrition"
                                    className="px-6 rounded-full gap-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                                >
                                    <PieIcon className="w-3.5 h-3.5" /> Dietas ({mealPlans.length})
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
                                        {/* WORKOUT VOLUME CHART - PREMIUM REDESIGN */}
                                        {trainingPrograms.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
                                            >
                                                <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden group">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                                    <CardHeader className="pb-2">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <CardTitle className="text-sm font-black italic tracking-tighter flex items-center gap-2 uppercase">
                                                                    <Activity className="w-4 h-4 text-primary" /> Distribuição de Volume Semanal
                                                                </CardTitle>
                                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                                                                    Análise de carga por grupamento muscular
                                                                </CardDescription>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Badge variant="outline" className="text-[9px] bg-primary/5 border-primary/20 text-primary uppercase font-black">Inteligência Artificial</Badge>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="h-[280px] pt-4 relative group">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <RadarChart cx="50%" cy="50%" outerRadius="85%" data={
                                                                (() => {
                                                                    const volumes: Record<string, number> = {};
                                                                    activeTraining?.training_sessions?.forEach((session: any) => {
                                                                        session.training_exercises?.forEach((ex: any) => {
                                                                            const muscle = ex.main_muscle_group || session.name || 'Geral';
                                                                            const volume = (Number(ex.sets) || 0) * ((Number(ex.reps_min) + Number(ex.reps_max)) / 2 || 0);
                                                                            volumes[muscle] = (volumes[muscle] || 0) + volume;
                                                                        });
                                                                    });
                                                                    return Object.entries(volumes).map(([name, value]) => ({ name, value }));
                                                                })()
                                                            }>
                                                                <PolarGrid stroke="#ffffff10" strokeDasharray="3 3" />
                                                                <PolarAngleAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} />
                                                                <PolarRadiusAxis tick={false} axisLine={false} />
                                                                <Radar
                                                                    name="Volume Acumulado"
                                                                    dataKey="value"
                                                                    stroke="#f59e0b"
                                                                    strokeWidth={2}
                                                                    fill="#f59e0b"
                                                                    fillOpacity={0.4}
                                                                />
                                                                <RechartsTooltip
                                                                    contentStyle={{
                                                                        backgroundColor: '#09090b',
                                                                        border: '1px solid #27272a',
                                                                        borderRadius: '12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 'bold',
                                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                                                                    }}
                                                                />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>

                                                <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                                                        <Zap className="w-32 h-32 text-primary" />
                                                    </div>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                                            <Target className="w-4 h-4 text-primary" /> Relatório Técnico
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-5 pt-2">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Frequência</p>
                                                                    <p className="text-sm font-black italic">{activeTraining?.training_sessions?.length}x p/ Semana</p>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                                                    <Calendar className="w-4 h-4 text-primary" />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-end">
                                                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Intensidade Percetida</span>
                                                                    <span className="text-[10px] text-primary font-black">75% (Moderada)</span>
                                                                </div>
                                                                <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden flex gap-1">
                                                                    <div className="bg-primary h-full w-1/4" />
                                                                    <div className="bg-primary h-full w-1/4" />
                                                                    <div className="bg-primary h-full w-1/4" />
                                                                    <div className="bg-muted h-full w-1/4" />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 pt-2">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-none text-[9px] font-black uppercase">Veredito</Badge>
                                                                </div>
                                                                <div className="relative">
                                                                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-amber-500/50 rounded-full" />
                                                                    <p className="text-[11px] leading-relaxed italic text-foreground font-medium pl-2">
                                                                        "Protocolo otimizado para {selectedStudent.goal}. O volume é decrescente ao longo da semana para favorecer a recuperação do sistema nervoso central."
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setShowMethodology(true)}
                                                            className="w-full h-8 border border-white/5 hover:bg-white/5 text-[9px] font-black uppercase tracking-widest"
                                                        >
                                                            Ver Metodologia Aplicada
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )}

                                        {trainingPrograms.map((program: TrainingProgram) => (
                                            <Card key={program.id} className="overflow-hidden">
                                                <CardHeader
                                                    className="bg-muted/30 border-b cursor-pointer hover:bg-muted/40 transition-colors"
                                                    onClick={() => toggleTrainingExpansion(program.id)}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2 rounded-lg bg-primary/10">
                                                                <motion.div
                                                                    animate={{ rotate: expandedTrainingIds.has(program.id) ? 90 : 0 }}
                                                                >
                                                                    <ChevronRight className="w-5 h-5 text-primary" />
                                                                </motion.div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <CardTitle className="text-xl">{program.title || 'Sem título'}</CardTitle>
                                                                    {program.status === 'active' && trainingPrograms.filter((p: any) => p.status === 'active').length === 1 ? (
                                                                        <Badge className="bg-green-500/20 text-green-500 border-green-500/20 hover:bg-green-500/30">ATIVO</Badge>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-7 text-[10px] font-bold uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSetActiveTraining(program.id);
                                                                            }}
                                                                            disabled={isSettingActive}
                                                                        >
                                                                            <Zap className="w-3 h-3 mr-1" /> {program.status === 'active' ? 'Re-ativar (Manter Único)' : 'Tornar Ativo'}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                                    <span className="flex items-center gap-1 font-medium"><Calendar className="w-3 h-3" /> {program.number_weeks} semanas</span>
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Criado em: {new Date(program.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {editingTrainingId !== program.id ? (
                                                                <Button variant="ghost" size="sm" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditTraining(program);
                                                                }}>
                                                                    <Edit3 className="w-4 h-4 mr-2" /> Editar
                                                                </Button>
                                                            ) : (
                                                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                                    <Button variant="ghost" size="sm" onClick={() => setEditingTrainingId(null)}>
                                                                        <X className="w-4 h-4 mr-1" /> Cancelar
                                                                    </Button>
                                                                    <Button size="sm" onClick={handleSaveEditedTraining} disabled={isSaving}>
                                                                        <Save className="w-4 h-4 mr-1" /> Salvar
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <AnimatePresence>
                                                    {(expandedTrainingIds.has(program.id) || editingTrainingId === program.id) && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <CardContent className="p-0">
                                                                {editingTrainingId === program.id ? (
                                                                    // EDIT MODE
                                                                    <div className="divide-y divide-border">
                                                                        {/* Program Settings (Title and Dates) */}
                                                                        <div className="p-6 bg-muted/20 border-b border-border">
                                                                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                                                                <Edit3 className="w-4 h-4" /> Configurações do Programa
                                                                            </h3>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Título do Programa</Label>
                                                                                    <Input
                                                                                        value={editedProgram.title || ''}
                                                                                        onChange={(e) => setEditedProgram(prev => ({ ...prev, title: e.target.value }))}
                                                                                        className="bg-background"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Duração (Semanas)</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={editedProgram.number_weeks || 0}
                                                                                        onChange={(e) => setEditedProgram(prev => ({ ...prev, number_weeks: parseInt(e.target.value) }))}
                                                                                        className="bg-background"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Data de Início</Label>
                                                                                    <Input
                                                                                        type="date"
                                                                                        value={editedProgram.start_date || ''}
                                                                                        onChange={(e) => setEditedProgram(prev => ({ ...prev, start_date: e.target.value }))}
                                                                                        className="bg-background"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">Data de Fim</Label>
                                                                                    <Input
                                                                                        type="date"
                                                                                        value={editedProgram.end_date || ''}
                                                                                        onChange={(e) => setEditedProgram(prev => ({ ...prev, end_date: e.target.value }))}
                                                                                        className="bg-background"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>

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
                                                                                                <Input
                                                                                                    value={ex.main_muscle_group}
                                                                                                    placeholder="Músculo"
                                                                                                    onChange={(e) => updateExerciseField(sIdx, eIdx, 'main_muscle_group', e.target.value)}
                                                                                                    className="bg-background"
                                                                                                />
                                                                                            </div>
                                                                                            <div className="col-span-12 lg:col-span-2">
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
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* NUTRITION TAB */}
                            < TabsContent value="nutrition" className="space-y-6" >
                                {
                                    loadingMeals ? (
                                        <div className="space-y-4" >
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
                                            {/* DIET MACROS CHART - PREMIUM REDESIGN */}
                                            {mealPlans.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
                                                >
                                                    <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                                        <CardHeader className="pb-4 border-b border-border/5">
                                                            <CardTitle className="text-sm font-black italic tracking-tighter flex items-center gap-2 uppercase">
                                                                <Target className="w-4 h-4 text-primary" /> Equilíbrio de Macronutrientes
                                                            </CardTitle>
                                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                                Distribuição calórica planejada
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-8">
                                                            <div className="h-[200px] w-full max-w-[200px] relative">
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
                                                                    <p className="text-2xl font-black italic tracking-tighter text-primary">
                                                                        {(mealPlans.find((p: any) => p.status === 'active') || mealPlans[0]).total_calories}
                                                                    </p>
                                                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">kcal/dia</p>
                                                                </div>
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <PieChart>
                                                                        <Pie
                                                                            data={[
                                                                                { name: 'Proteínas', value: Number(activeDiet?.total_proteins) || 0 },
                                                                                { name: 'Carbos', value: Number(activeDiet?.total_carbs) || 0 },
                                                                                { name: 'Gorduras', value: Number(activeDiet?.total_fats) || 0 },
                                                                            ]}
                                                                            innerRadius={65}
                                                                            outerRadius={85}
                                                                            paddingAngle={8}
                                                                            dataKey="value"
                                                                            stroke="none"
                                                                        >
                                                                            <Cell fill="#f59e0b" /> {/* Amber/Yellow for Protein */}
                                                                            <Cell fill="#a855f7" /> {/* Purple for Carbs */}
                                                                            <Cell fill="#ef4444" /> {/* Red for Fats */}
                                                                        </Pie>
                                                                        <RechartsTooltip
                                                                            contentStyle={{
                                                                                backgroundColor: '#09090b',
                                                                                border: '1px solid #27272a',
                                                                                borderRadius: '12px',
                                                                                fontSize: '11px',
                                                                                fontWeight: 'bold'
                                                                            }}
                                                                        />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                                                                <div className="p-4 bg-muted/10 rounded-2xl border border-border/40 hover:bg-muted/20 transition-colors">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Proteína</p>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <p className="text-xl font-black italic text-amber-500">
                                                                            {(mealPlans.find((p: any) => p.status === 'active') || mealPlans[0]).total_proteins || 0}g
                                                                        </p>
                                                                        <p className="text-[8px] text-muted-foreground font-bold">/dia</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 bg-muted/10 rounded-2xl border border-border/40 hover:bg-muted/20 transition-colors">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Carbo</p>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <p className="text-xl font-black italic text-purple-500">
                                                                            {(mealPlans.find((p: any) => p.status === 'active') || mealPlans[0]).total_carbs || 0}g
                                                                        </p>
                                                                        <p className="text-[8px] text-muted-foreground font-bold">/dia</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 bg-muted/10 rounded-2xl border border-border/40 hover:bg-muted/20 transition-colors">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Gordura</p>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <p className="text-xl font-black italic text-red-500">
                                                                            {(mealPlans.find((p: any) => p.status === 'active') || mealPlans[0]).total_fats || 0}g
                                                                        </p>
                                                                        <p className="text-[8px] text-muted-foreground font-bold">/dia</p>
                                                                    </div>
                                                                </div>
                                                                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 hover:bg-primary/20 transition-colors">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Activity className="w-3 h-3 text-primary" />
                                                                        <p className="text-[9px] text-primary uppercase font-black tracking-widest">Meta Kcal</p>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <p className="text-xl font-black italic text-primary">{activeDiet?.total_calories || 0}</p>
                                                                        <p className="text-[8px] text-primary/70 font-bold">BMR+</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                                                <Sparkles className="w-4 h-4 text-primary" /> Diagnóstico Nutricional
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-6 pt-2">
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center bg-muted/10 p-2.5 rounded-xl border border-border/20">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                                            <Droplet className="w-4 h-4 text-blue-500" />
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Hidratação Sugerida</p>
                                                                            <p className="text-sm font-black italic">3.2 Litros / dia</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Densidade de Micronutrientes</span>
                                                                        <span className="text-[10px] text-primary font-black">9.2 / 10</span>
                                                                    </div>
                                                                    <div className="flex gap-1.5 h-1.5 w-full">
                                                                        {[1, 1, 1, 1, 0].map((v, i) => (
                                                                            <div key={i} className={cn("flex-1 rounded-full bg-muted/40", i < 4 && "bg-primary")} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 relative">
                                                                <div className="absolute top-2 right-2">
                                                                    <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                                                                </div>
                                                                <p className="text-[11px] leading-relaxed italic text-foreground font-medium">
                                                                    "Estratégia focada em densidade nutricional. A proporção de macronutrientes suporta treinos de alta intensidade mantendo a glicemia estável."
                                                                </p>
                                                            </div>

                                                            <Button
                                                                onClick={handleGenerateDietPDF}
                                                                disabled={isGeneratingPDF}
                                                                className="w-full h-10 shadow-lg shadow-primary/10 text-[10px] font-black uppercase tracking-widest gap-2"
                                                            >
                                                                <Download className="w-3 h-3" /> {isGeneratingPDF ? "Gerando..." : "Gerar Plano PDF"}
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            )}

                                            {mealPlans.map((plan: MealPlan) => (
                                                <Card key={plan.id} className="overflow-hidden">
                                                    <CardHeader
                                                        className="bg-muted/30 border-b cursor-pointer hover:bg-muted/40 transition-colors"
                                                        onClick={() => toggleDietExpansion(plan.id)}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-2 rounded-lg bg-primary/10">
                                                                    <motion.div
                                                                        animate={{ rotate: expandedDietIds.has(plan.id) ? 90 : 0 }}
                                                                    >
                                                                        <ChevronRight className="w-5 h-5 text-primary" />
                                                                    </motion.div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-3">
                                                                        <CardTitle className="text-xl">{plan.title || 'Sem título'}</CardTitle>
                                                                        {plan.status === 'active' && mealPlans.filter((p: any) => p.status === 'active').length === 1 ? (
                                                                            <Badge className="bg-green-500/20 text-green-500 border-green-500/20 hover:bg-green-500/30">ATIVO</Badge>
                                                                        ) : (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-7 text-[10px] font-bold uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleSetActiveDiet(plan.id);
                                                                                }}
                                                                                disabled={isSettingActive}
                                                                            >
                                                                                <Zap className="w-3 h-3 mr-1" /> {plan.status === 'active' ? 'Re-ativar (Manter Único)' : 'Tornar Ativo'}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                                        <Badge variant="secondary">{plan.goal || 'Objetivo não definido'}</Badge>
                                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Criado em: {new Date(plan.created_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                                                        </div>
                                                    </CardHeader>
                                                    <AnimatePresence>
                                                        {(expandedDietIds.has(plan.id) || editingDietId === plan.id) && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                            >
                                                                <CardContent className="p-0 border-t">
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
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                            </TabsContent>
                        </Tabs>
                    )}
                </main>
            </div>
            {/* METHODOLOGY MODAL */}
            <Dialog open={showMethodology} onOpenChange={setShowMethodology}>
                <DialogContent className="max-w-2xl bg-[#09090b] border-border/40 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase">Relatório Técnico</Badge>
                        </div>
                        <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                            <Activity className="w-6 h-6 text-primary" /> Metodologia Aplicada
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
                            Análise estrutural do planejamento de força
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-muted/20 border border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Distribuição de Carga</h4>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Utilizamos o sistema de <span className="text-white font-bold">Periodização Ondulatória Diária</span>. A variação de intensidade ao longo da semana evita estagnação e otimiza a recuperação neuromuscular.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/20 border border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Volume Semanal</h4>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    O volume total foi calculado em {trainingPrograms[0]?.training_sessions?.length * 45} mins estimados, com foco em grupos musculares alvo conforme o objetivo: <span className="text-white font-bold italic">{selectedStudent?.goal}</span>.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-muted/20 border border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Cadência de Repetição</h4>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Foco em <span className="text-white font-bold italic">TUT (Time Under Tension)</span>. Fase excêntrica de 3-4 segundos para maximizar microrupturas e resposta hipertrófica.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 relative overflow-hidden group">
                                <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-primary/10 group-hover:scale-110 transition-transform" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Pilar FIT PRO Elite</h4>
                                <p className="text-[12px] leading-relaxed italic text-foreground font-medium pr-4">
                                    "O treino não é apenas sobre carga, é sobre a precisão da contração em cada milímetro do movimento."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowMethodology(false)}
                            className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest border-border/40 hover:bg-white/5"
                        >
                            Fechar Análise
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Protocols;
