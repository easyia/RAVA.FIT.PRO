import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Utensils,
    Sparkles,
    Calculator,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowRight,
    SearchX,
    Dumbbell,
    PieChart
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    getStudents,
    getStudentDetails,
    getTrainingPrograms,
    saveMealPlan,
    getCoachProfile
} from '@/services/studentService';
import {
    calculateMifflin,
    calculateTinsleyTotal,
    calculateTinsleyLBM,
    calculateMacros
} from '@/utils/nutritionCalculations';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

const AINutritionAssistant = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [naf, setNaf] = useState(1.2);
    const [targetKcal, setTargetKcal] = useState(0);
    const [generatedDiet, setGeneratedDiet] = useState<any>(null);
    const navigate = useNavigate();

    // Data Fetching
    const { data: students = [] } = useQuery({
        queryKey: ['students'],
        queryFn: getStudents,
    });

    const { data: studentDetails } = useQuery({
        queryKey: ['studentDetails', selectedStudentId],
        queryFn: () => getStudentDetails(selectedStudentId),
        enabled: !!selectedStudentId
    });

    const { data: trainingPrograms = [] } = useQuery({
        queryKey: ['trainingPrograms', selectedStudentId],
        queryFn: () => getTrainingPrograms(selectedStudentId),
        enabled: !!selectedStudentId
    });

    const { data: coach } = useQuery({
        queryKey: ['coachProfile'],
        queryFn: getCoachProfile,
    });

    const hasTraining = trainingPrograms.length > 0;
    const anamnesis = studentDetails?.anamnesis?.[0];

    // TMB Calculations
    const calculations = useMemo(() => {
        if (!anamnesis) return null;
        const params = {
            weight: anamnesis.weight_kg || 70,
            height: anamnesis.height_cm || 170,
            age: studentDetails.birth_date ? (new Date().getFullYear() - new Date(studentDetails.birth_date).getFullYear()) : 30,
            sex: studentDetails.sex === 'masculino' ? 'male' : 'female' as any,
            bodyFat: anamnesis.body_fat_percentage,
            activityLevel: naf
        };

        const mifflin = calculateMifflin(params);
        const get = mifflin * naf;

        return {
            mifflin,
            tinsleyTotal: calculateTinsleyTotal(params.weight),
            tinsleyLBM: anamnesis.body_fat_percentage ? calculateTinsleyLBM(params.weight, anamnesis.body_fat_percentage) : 0,
            get
        };
    }, [anamnesis, naf, studentDetails]);

    useEffect(() => {
        if (calculations && targetKcal === 0) {
            setTargetKcal(Math.round(calculations.get));
        }
    }, [calculations]);

    const macros = useMemo(() => {
        if (!anamnesis || targetKcal === 0) return null;
        return calculateMacros(targetKcal, anamnesis.weight_kg || 70, anamnesis.main_goal);
    }, [targetKcal, anamnesis]);

    const handleGenerateDiet = async () => {
        if (!selectedStudentId || !hasTraining) {
            toast.error('O aluno precisa ter um protocolo de treino antes da dieta.');
            return;
        }

        setIsGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-diet', {
                body: {
                    coach_id: coach?.id,
                    student_id: selectedStudentId,
                    target_calories: targetKcal,
                    macros: {
                        p: Math.round(macros?.protein.grams || 0),
                        c: Math.round(macros?.carbs.grams || 0),
                        f: Math.round(macros?.fats.grams || 0)
                    }
                }
            });

            if (error) throw error;
            if (data.success) {
                setGeneratedDiet(data.diet);
                toast.success('Dieta gerada com 3 opções por refeição!');
            }
        } catch (error: any) {
            toast.error('Erro ao gerar dieta: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDiet = async () => {
        if (!generatedDiet || !selectedStudentId) return;
        setIsSaving(true);
        try {
            // Save as a meal plan (flattening to Option 1 for default, 
            // but we could extend schema. For now, saving as requested)
            const planToSave = {
                title: generatedDiet.titulo,
                goal: generatedDiet.objetivo,
                meals: generatedDiet.refeicoes.map((m: any) => ({
                    name: m.nome,
                    time: m.horario,
                    // By default saving option 1, in a real scenario we'd save all substitutions
                    foods: m.opcoes[0].itens.map((i: any) => ({
                        name: i.alimento,
                        quantity: i.quantidade,
                        unit: i.unidade,
                        notes: `Alternativas: ${m.opcoes[1].itens[0].alimento} ou ${m.opcoes[2].itens[0].alimento}`
                    }))
                }))
            };

            await saveMealPlan(selectedStudentId, planToSave);
            toast.success('Protocolo de Dieta salvo com sucesso!');
            navigate('/protocolos');
        } catch (error) {
            toast.error('Erro ao salvar dieta.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            <div className={cn("transition-all duration-300 min-h-screen", sidebarCollapsed ? "ml-16" : "ml-60")}>
                <main className="p-8">
                    <DashboardHeader title="Assistente de Nutrição IA" showSearch={false} />

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
                        {/* Config Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Calculator className="w-5 h-5 text-primary" /> Parâmetros
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Aluno</Label>
                                        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {students.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {studentDetails && (
                                        <div className={cn(
                                            "p-4 rounded-lg border flex flex-col gap-2 transition-all",
                                            hasTraining ? "bg-primary/5 border-primary/20" : "bg-status-error/5 border-status-error/20"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status Treino</span>
                                                {hasTraining ? (
                                                    <Badge className="bg-primary text-white">Pronto</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Pendente</Badge>
                                                )}
                                            </div>
                                            {!hasTraining && (
                                                <p className="text-[10px] text-status-error leading-tight">
                                                    * É obrigatório ter um protocolo de treino criado antes de gerar a dieta.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {calculations && (
                                        <div className="space-y-4 pt-4 border-t border-border">
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase text-muted-foreground">NAF (Nível de Atividade)</Label>
                                                <Select value={naf.toString()} onValueChange={(v) => setNaf(parseFloat(v))}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1.2">Sedentário (1.2)</SelectItem>
                                                        <SelectItem value="1.375">Leve (1.375)</SelectItem>
                                                        <SelectItem value="1.55">Moderado (1.55)</SelectItem>
                                                        <SelectItem value="1.725">Intenso (1.725)</SelectItem>
                                                        <SelectItem value="1.9">Atleta (1.9)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase text-muted-foreground">Meta Diária (Kcal)</Label>
                                                <Input
                                                    type="number"
                                                    value={targetKcal}
                                                    onChange={(e) => setTargetKcal(parseInt(e.target.value))}
                                                    className="font-bold text-lg text-primary"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full gap-2 h-12 shadow-button"
                                        disabled={!hasTraining || isGenerating}
                                        onClick={handleGenerateDiet}
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Gerar 3 Menus com IA
                                    </Button>
                                </CardContent>
                            </Card>

                            {calculations && (
                                <Card className="bg-muted/30 border-dashed">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Estimativas TMB</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs space-y-2">
                                        <div className="flex justify-between"><span>Mifflin-St Jeor:</span> <strong>{Math.round(calculations.mifflin)} kcal</strong></div>
                                        <div className="flex justify-between"><span>Tinsley (Total):</span> <strong>{Math.round(calculations.tinsleyTotal)} kcal</strong></div>
                                        {calculations.tinsleyLBM > 0 && <div className="flex justify-between"><span>Tinsley (LBM):</span> <strong>{Math.round(calculations.tinsleyLBM)} kcal</strong></div>}
                                        <div className="flex justify-between pt-2 border-t border-border mt-2 font-bold text-primary">
                                            <span>GET (Gasto Estimado):</span>
                                            <span>{Math.round(calculations.get)} kcal</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Main Interaction Area */}
                        <div className="lg:col-span-3">
                            {!selectedStudentId ? (
                                <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <Utensils className="w-8 h-8 text-primary" />
                                    </div>
                                    <h2 className="text-xl font-semibold mb-2">Preparar Protocolo de Dieta</h2>
                                    <p className="text-muted-foreground text-center max-w-sm">
                                        Selecione um aluno para analisar as necessidades energéticas e gerar os cardápios personalizados.
                                    </p>
                                </div>
                            ) : !generatedDiet ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border-border">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Análise de Macronutrientes</CardTitle>
                                            <CardDescription>Distribuição sugerida para o objetivo</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {macros && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                                            <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Carboidratos</p>
                                                            <p className="text-xl font-bold">{Math.round(macros.carbs.grams)}g</p>
                                                            <p className="text-[10px] text-muted-foreground">{Math.round(macros.carbs.percentage)}%</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                                            <p className="text-[10px] uppercase font-bold text-red-500 mb-1">Proteínas</p>
                                                            <p className="text-xl font-bold">{Math.round(macros.protein.grams)}g</p>
                                                            <p className="text-[10px] text-muted-foreground">{Math.round(macros.protein.percentage)}%</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                                            <p className="text-[10px] uppercase font-bold text-amber-500 mb-1">Gorduras</p>
                                                            <p className="text-xl font-bold">{Math.round(macros.fats.grams)}g</p>
                                                            <p className="text-[10px] text-muted-foreground">{Math.round(macros.fats.percentage)}%</p>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-muted/30 rounded-lg flex items-center gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex justify-between text-xs font-medium">
                                                                <span>Déficit/Superávit Calórico</span>
                                                                <span className={cn(
                                                                    "font-bold",
                                                                    (targetKcal - (calculations?.get || 0)) > 0 ? "text-status-success" : "text-status-error"
                                                                )}>
                                                                    {targetKcal - Math.round(calculations?.get || 0)} kcal
                                                                </span>
                                                            </div>
                                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary"
                                                                    style={{ width: `${Math.min((targetKcal / 4000) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <PieChart className="w-8 h-8 text-primary/40" />
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Protocolo de Treino Atual</CardTitle>
                                            <CardDescription>Essencial para o timing nutricional</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {hasTraining ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl">
                                                        <Dumbbell className="w-8 h-8 text-primary" />
                                                        <div>
                                                            <p className="text-sm font-bold">{trainingPrograms[0].title}</p>
                                                            <p className="text-xs text-muted-foreground">{trainingPrograms[0].number_weeks} semanas • Frequência Alta</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        <p>Refeições pré e pós-treino serão otimizadas para este protocolo de {trainingPrograms[0].training_sessions.length} divisões.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center bg-status-error/5 border border-dashed border-status-error/20 rounded-xl space-y-4">
                                                    <AlertCircle className="w-12 h-12 text-status-error mx-auto opacity-50" />
                                                    <p className="text-sm font-medium">Nenhum treino ativo encontrado.</p>
                                                    <Button variant="outline" size="sm" onClick={() => navigate('/ia-assistant')}>Criar Treino Agora</Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                                    {/* Excel-style Result Header */}
                                    <div className="flex justify-between items-center bg-card p-6 rounded-2xl border-b-4 border-primary shadow-sm">
                                        <div>
                                            <h2 className="text-2xl font-bold">{generatedDiet.titulo}</h2>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="secondary">{generatedDiet.objetivo}</Badge>
                                                <Badge variant="outline">{targetKcal} kcal/dia</Badge>
                                            </div>
                                        </div>
                                        <Button onClick={handleSaveDiet} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                            Finalizar Protocolo
                                        </Button>
                                    </div>

                                    {/* 3 Options Tabs */}
                                    <Tabs defaultValue="ref-0" className="w-full">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm font-bold text-muted-foreground uppercase">Estrutura de Refeições</span>
                                            <div className="flex gap-2 p-1 bg-muted rounded-lg">
                                                <div className="px-3 py-1 bg-background text-[10px] font-bold rounded shadow-sm">OPÇÃO 1</div>
                                                <div className="px-3 py-1 text-[10px] font-bold opacity-50">OPÇÃO 2</div>
                                                <div className="px-3 py-1 text-[10px] font-bold opacity-50">OPÇÃO 3</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {generatedDiet.refeicoes.map((meal: any, mIdx: number) => (
                                                <Card key={mIdx} className="overflow-hidden border-border bg-card/50">
                                                    <div className="bg-muted/40 px-6 py-3 flex justify-between items-center border-b border-border">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                                {mIdx + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold">{meal.nome}</h4>
                                                                <span className="text-xs text-muted-foreground">{meal.horario}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-border">
                                                            {[0, 1, 2].map(optIdx => (
                                                                <div key={optIdx} className={cn(
                                                                    "p-6 space-y-4",
                                                                    optIdx === 0 ? "bg-primary/5" : "bg-transparent"
                                                                )}>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Opção {optIdx + 1}</span>
                                                                    </div>
                                                                    <ul className="space-y-3">
                                                                        {meal.opcoes[optIdx].itens.map((item: any, iIdx: number) => (
                                                                            <li key={iIdx} className="flex justify-between items-start text-sm border-b border-border/20 pb-2 last:border-0">
                                                                                <div className="flex-1">
                                                                                    <p className="font-medium">{item.alimento}</p>
                                                                                    <p className="text-[10px] text-muted-foreground">{item.quantidade}{item.unidade}</p>
                                                                                </div>
                                                                                <div className="text-right text-[10px] text-muted-foreground flex flex-col gap-0.5">
                                                                                    <span>P: {item.prot}g</span>
                                                                                    <span>C: {item.carb}g</span>
                                                                                    <span>G: {item.gord}g</span>
                                                                                </div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </Tabs>

                                    {/* Justification Footer */}
                                    <Card className="border-dashed bg-muted/20">
                                        <CardContent className="p-6">
                                            <div className="flex gap-4">
                                                <Sparkles className="w-10 h-10 text-primary opacity-50" />
                                                <div className="space-y-2">
                                                    <h4 className="font-bold">Estratégia Nutricional Apex</h4>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {generatedDiet.justificativa}
                                                    </p>
                                                    <div className="flex gap-2 pt-2">
                                                        {generatedDiet.suplementacao_sugerida.map((sup: string, sIdx: number) => (
                                                            <Badge key={sIdx} variant="outline" className="bg-background">{sup}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AINutritionAssistant;
