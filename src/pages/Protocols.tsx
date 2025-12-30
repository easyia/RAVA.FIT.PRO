import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    ClipboardList
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStudents, saveTrainingProgram, saveMealPlan } from "@/services/studentService";
import { Student } from "@/types/student";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Training Interfaces
interface Exercise {
    name: string;
    sets: number;
    reps_min: number;
    reps_max: number;
    rest_time: string;
    notes: string;
}

interface Session {
    id: string;
    division: string;
    name: string;
    exercises: Exercise[];
}

// Nutrition Interfaces
interface FoodItem {
    id: string;
    name: string;
    quantity: string;
    unit: string;
    notes: string;
}

interface Meal {
    id: string;
    name: string;
    time: string;
    foods: FoodItem[];
}

const Protocols = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("training");
    const [isSaving, setIsSaving] = useState(false);

    // Training Form State
    const [trainingTitle, setTrainingTitle] = useState("");
    const [trainingStart, setTrainingStart] = useState("");
    const [trainingWeeks, setTrainingWeeks] = useState(4);
    const [sessions, setSessions] = useState<Session[]>([
        { id: "1", division: "A", name: "Superior", exercises: [] }
    ]);

    // Nutrition Form State
    const [nutritionTitle, setNutritionTitle] = useState("");
    const [nutritionGoal, setNutritionGoal] = useState("");
    const [meals, setMeals] = useState<Meal[]>([
        { id: "1", name: "Café da Manhã", time: "08:00", foods: [] }
    ]);

    const { data: students, isLoading } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Training Actions
    const addSession = () => {
        const nextDivision = String.fromCharCode(65 + sessions.length);
        setSessions([...sessions, { id: Math.random().toString(), division: nextDivision, name: "", exercises: [] }]);
    };

    const addExercise = (sessionId: string) => {
        setSessions(sessions.map(s => s.id === sessionId ?
            { ...s, exercises: [...s.exercises, { name: "", sets: 3, reps_min: 8, reps_max: 12, rest_time: "60s", notes: "" }] } : s
        ));
    };

    const removeExercise = (sessionId: string, exerciseIndex: number) => {
        setSessions(sessions.map(s => s.id === sessionId ?
            { ...s, exercises: s.exercises.filter((_, i) => i !== exerciseIndex) } : s
        ));
    };

    // Nutrition Actions
    const addMeal = () => {
        setMeals([...meals, { id: Math.random().toString(), name: "", time: "", foods: [] }]);
    };

    const addFood = (mealId: string) => {
        setMeals(meals.map(m => m.id === mealId ?
            { ...m, foods: [...m.foods, { id: Math.random().toString(), name: "", quantity: "", unit: "g", notes: "" }] } : m
        ));
    };

    const removeFood = (mealId: string, foodId: string) => {
        setMeals(meals.map(m => m.id === mealId ?
            { ...m, foods: m.foods.filter(f => f.id !== foodId) } : m
        ));
    };

    const handleSaveTraining = async () => {
        if (!selectedStudent || !trainingTitle) {
            toast.error("Preencha o título do programa de treino.");
            return;
        }

        setIsSaving(true);
        try {
            await saveTrainingProgram(selectedStudent.id, {
                title: trainingTitle,
                weeks: trainingWeeks,
                startDate: trainingStart,
                sessions
            });

            toast.success("Plano de treino salvo!", {
                description: `Vinculado a ${selectedStudent.name}.`
            });

            setSelectedStudent(null);
            setTrainingTitle("");
        } catch (error: any) {
            console.error("Erro ao salvar treino:", error);
            toast.error("Erro ao salvar treino.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNutrition = async () => {
        if (!selectedStudent || !nutritionTitle) {
            toast.error("Preencha o título do plano alimentar.");
            return;
        }

        setIsSaving(true);
        try {
            await saveMealPlan(selectedStudent.id, {
                title: nutritionTitle,
                goal: nutritionGoal,
                meals
            });

            toast.success("Plano alimentar salvo!", {
                description: `Vinculado a ${selectedStudent.name}.`
            });

            setSelectedStudent(null);
            setNutritionTitle("");
            setNutritionGoal("");
        } catch (error: any) {
            console.error("Erro ao salvar dieta:", error);
            toast.error("Erro ao salvar dieta.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            <div className={cn("transition-all duration-300 min-h-screen pb-20", sidebarCollapsed ? "ml-16" : "ml-60")}>
                <main className="p-8 max-w-5xl mx-auto text-foreground">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-h1 mb-2">Protocolos Profissionais</h1>
                            <p className="text-muted-foreground">
                                {selectedStudent ? `Prescrevendo para ${selectedStudent.name}` : "Selecione um aluno para começar"}
                            </p>
                        </div>
                        {selectedStudent && (
                            <Button variant="outline" onClick={() => setSelectedStudent(null)} className="gap-2">
                                <ArrowLeft className="w-4 h-4" /> Trocar Aluno
                            </Button>
                        )}
                    </div>

                    {!selectedStudent ? (
                        <div className="animate-fade-in space-y-6">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                <Input placeholder="Buscar aluno..." className="pl-10 h-11 bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) :
                                    filteredStudents?.map(student => (
                                        <button key={student.id} onClick={() => setSelectedStudent(student)} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary transition-all text-left group">
                                            <img src={student.avatar} className="w-12 h-12 rounded-full object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{student.name}</h3>
                                                <p className="text-xs text-muted-foreground truncate">{student.email}</p>
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
                                    <Dumbbell className="w-4 h-4" /> Treinamento
                                </TabsTrigger>
                                <TabsTrigger value="nutrition" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Utensils className="w-4 h-4" /> Alimentação
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="training" className="space-y-8">
                                <div className="card-elevated p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <Label>Título do Programa</Label>
                                        <Input value={trainingTitle} onChange={(e) => setTrainingTitle(e.target.value)} placeholder="Ex: Hipertrofia Fase 1" className="mt-1.5 bg-sidebar" />
                                    </div>
                                    <div>
                                        <Label>Data de Início</Label>
                                        <Input type="date" value={trainingStart} onChange={(e) => setTrainingStart(e.target.value)} className="mt-1.5 bg-sidebar" />
                                    </div>
                                    <div>
                                        <Label>Duração (Semanas)</Label>
                                        <Input type="number" value={trainingWeeks} onChange={(e) => setTrainingWeeks(Number(e.target.value))} className="mt-1.5 bg-sidebar" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {sessions.map((session, sIdx) => (
                                        <div key={session.id} className="card-elevated border-l-4 border-l-primary overflow-hidden">
                                            <div className="p-6 bg-muted/30 border-b border-border flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">{session.division}</div>
                                                    <Input placeholder="Nome da Sessão" className="bg-transparent border-none text-lg font-semibold h-10 px-0 focus-visible:ring-0" value={session.name} onChange={(e) => {
                                                        const ns = [...sessions]; ns[sIdx].name = e.target.value; setSessions(ns);
                                                    }} />
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => setSessions(sessions.filter(s => s.id !== session.id))} className="text-tertiary hover:text-status-error"><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                {session.exercises.map((ex, eIdx) => (
                                                    <div key={eIdx} className="grid grid-cols-12 gap-4 items-end bg-sidebar/40 p-4 rounded-lg border border-border/50">
                                                        <div className="col-span-12 lg:col-span-4"><Label className="text-[10px] uppercase text-tertiary">Exercício</Label><Input value={ex.name} onChange={(e) => { const ns = [...sessions]; ns[sIdx].exercises[eIdx].name = e.target.value; setSessions(ns); }} className="bg-sidebar mt-1" /></div>
                                                        <div className="col-span-4 lg:col-span-1"><Label className="text-[10px] uppercase text-tertiary">Séries</Label><Input type="number" value={ex.sets} onChange={(e) => { const ns = [...sessions]; ns[sIdx].exercises[eIdx].sets = Number(e.target.value); setSessions(ns); }} className="bg-sidebar mt-1" /></div>
                                                        <div className="col-span-4 lg:col-span-1"><Label className="text-[10px] uppercase text-tertiary">Min</Label><Input type="number" value={ex.reps_min} onChange={(e) => { const ns = [...sessions]; ns[sIdx].exercises[eIdx].reps_min = Number(e.target.value); setSessions(ns); }} className="bg-sidebar mt-1" /></div>
                                                        <div className="col-span-4 lg:col-span-1"><Label className="text-[10px] uppercase text-tertiary">Max</Label><Input type="number" value={ex.reps_max} onChange={(e) => { const ns = [...sessions]; ns[sIdx].exercises[eIdx].reps_max = Number(e.target.value); setSessions(ns); }} className="bg-sidebar mt-1" /></div>
                                                        <div className="col-span-6 lg:col-span-2"><Label className="text-[10px] uppercase text-tertiary">Descanso</Label><Input value={ex.rest_time} onChange={(e) => { const ns = [...sessions]; ns[sIdx].exercises[eIdx].rest_time = e.target.value; setSessions(ns); }} className="bg-sidebar mt-1" /></div>
                                                        <div className="col-span-4 lg:col-span-2"><Input value={ex.notes} placeholder="Obs..." className="bg-sidebar" onChange={(e) => { const ns = [...sessions]; ns[sIdx].exercises[eIdx].notes = e.target.value; setSessions(ns); }} /></div>
                                                        <div className="col-span-2 lg:col-span-1 flex justify-end"><Button variant="ghost" size="icon" onClick={() => removeExercise(session.id, eIdx)} className="text-tertiary hover:text-status-error"><Trash2 className="w-4 h-4" /></Button></div>
                                                    </div>
                                                ))}
                                                <Button variant="outline" className="w-full border-dashed" onClick={() => addExercise(session.id)}><Plus className="w-4 h-4 mr-2" /> Adicionar Exercício</Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button onClick={addSession} className="w-full py-8 border-2 border-dashed border-border bg-sidebar hover:bg-surface-hover hover:border-primary/50 text-foreground transition-all flex flex-col gap-2 items-center justify-center h-auto rounded-xl">
                                        <Plus className="w-6 h-6 text-primary" /> <strong>Adicionar Nova Sessão de Treino</strong>
                                    </Button>

                                    <div className="flex justify-end pt-6">
                                        <Button size="lg" className="bg-primary hover:bg-primary/90 h-12 px-8 min-w-[200px] shadow-button" onClick={handleSaveTraining} disabled={isSaving}>
                                            {isSaving ? "Salvando..." : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" /> Salvar Treino
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="nutrition" className="space-y-8">
                                <div className="card-elevated p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label>Título do Plano Alimentar</Label>
                                        <Input value={nutritionTitle} onChange={(e) => setNutritionTitle(e.target.value)} placeholder="Ex: Dieta para Cutting" className="mt-1.5 bg-sidebar" />
                                    </div>
                                    <div>
                                        <Label>Objetivo Estratégico</Label>
                                        <Input value={nutritionGoal} onChange={(e) => setNutritionGoal(e.target.value)} placeholder="Ex: Redução de Percentual de Gordura" className="mt-1.5 bg-sidebar" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {meals.map((meal, mIdx) => (
                                        <div key={meal.id} className="card-elevated border-l-4 border-l-accent overflow-hidden">
                                            <div className="p-6 bg-muted/30 border-b border-border flex items-center justify-between">
                                                <div className="flex gap-4 flex-1">
                                                    <div className="w-2/3">
                                                        <Label className="text-xs text-tertiary">Nome da Refeição</Label>
                                                        <Input value={meal.name} onChange={(e) => { const nm = [...meals]; nm[mIdx].name = e.target.value; setMeals(nm); }} placeholder="Ex: Almoço" className="bg-transparent border-none text-lg font-semibold h-8 px-0 focus-visible:ring-0" />
                                                    </div>
                                                    <div className="w-1/3">
                                                        <Label className="text-xs text-tertiary">Horário</Label>
                                                        <Input type="time" value={meal.time} onChange={(e) => { const nm = [...meals]; nm[mIdx].time = e.target.value; setMeals(nm); }} className="bg-transparent border-none h-8 px-0 focus-visible:ring-0" />
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => setMeals(meals.filter(m => m.id !== meal.id))} className="text-tertiary hover:text-status-error"><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                            <div className="p-6 space-y-3">
                                                {meal.foods.map((food, fIdx) => (
                                                    <div key={food.id} className="flex gap-4 items-center bg-sidebar/30 p-3 rounded-lg border border-border/20">
                                                        <div className="flex-1"><Input value={food.name} placeholder="Nome do Alimento" className="bg-sidebar" onChange={(e) => { const nm = [...meals]; nm[mIdx].foods[fIdx].name = e.target.value; setMeals(nm); }} /></div>
                                                        <div className="w-24"><Input value={food.quantity} placeholder="Qtd" className="bg-sidebar text-center" onChange={(e) => { const nm = [...meals]; nm[mIdx].foods[fIdx].quantity = e.target.value; setMeals(nm); }} /></div>
                                                        <div className="w-20"><Input value={food.unit} placeholder="Unid" className="bg-sidebar text-center" onChange={(e) => { const nm = [...meals]; nm[mIdx].foods[fIdx].unit = e.target.value; setMeals(nm); }} /></div>
                                                        <div className="w-32"><Input value={food.notes} placeholder="Obs..." className="bg-sidebar" onChange={(e) => {
                                                            const nm = [...meals]; nm[mIdx].foods[fIdx].notes = e.target.value; setMeals(nm);
                                                        }} /></div>
                                                        <Button variant="ghost" size="icon" onClick={() => removeFood(meal.id, food.id)} className="text-tertiary hover:text-status-error"><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                ))}
                                                <Button variant="outline" className="w-full border-dashed" onClick={() => addFood(meal.id)}><Plus className="w-4 h-4 mr-2" /> Adicionar Alimento</Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button onClick={addMeal} className="w-full py-8 border-2 border-dashed border-border bg-sidebar hover:bg-surface-hover hover:border-accent/50 text-foreground transition-all flex flex-col gap-2 items-center justify-center h-auto rounded-xl">
                                        <Utensils className="w-6 h-6 text-accent" /> <strong>Adicionar Nova Refeição</strong>
                                    </Button>

                                    <div className="flex justify-end pt-6">
                                        <Button size="lg" className="bg-accent hover:bg-accent/90 h-12 px-8 min-w-[200px] shadow-button" onClick={handleSaveNutrition} disabled={isSaving}>
                                            {isSaving ? "Salvando..." : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" /> Salvar Dieta
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <div className="flex justify-end gap-3 mt-12 pb-10">
                                <Button variant="outline" size="lg" onClick={() => setSelectedStudent(null)}>Cancelar</Button>
                            </div>
                        </Tabs>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Protocols;
