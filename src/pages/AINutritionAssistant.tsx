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
import { Slider } from '@/components/ui/slider';
import {
    Utensils,
    Sparkles,
    Calculator,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Dumbbell,
    PieChart,
    Info,
    Edit3,
    Plus,
    Trash2
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
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const AINutritionAssistant = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [naf, setNaf] = useState(1.55);
    const [calorieAdjustment, setCalorieAdjustment] = useState(0); // Positive = surplus, Negative = deficit
    const [generatedDiet, setGeneratedDiet] = useState<any>(null);
    const [isEditingMacros, setIsEditingMacros] = useState(false);
    const [customMacros, setCustomMacros] = useState({ p: 0, c: 0, f: 0 });
    const [studentSearch, setStudentSearch] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Sync from Training Assistant
    useEffect(() => {
        if (location.state?.studentId) {
            setSelectedStudentId(location.state.studentId);
        }
        if (location.state?.workoutSync) {
            toast.info("Contexto do treino recebido! A IA sincronizará a dieta com o planejamento de treino.", {
                icon: <Dumbbell className="w-4 h-4 text-primary" />,
                duration: 5000
            });
        }
    }, [location.state]);

    // Data Fetching
    const { data: students = [] } = useQuery({
        queryKey: ['students'],
        queryFn: getStudents,
    });

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
    }, [students, studentSearch]);

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
        if (!anamnesis || !studentDetails) return null;

        const weight = anamnesis.weight_kg || 70;
        const height = anamnesis.height_cm || 170;
        const birthDate = studentDetails.birth_date ? new Date(studentDetails.birth_date) : null;
        const age = birthDate ? (new Date().getFullYear() - birthDate.getFullYear()) : 30;
        const sex = studentDetails.sex === 'masculino' ? 'male' : 'female';
        const bodyFat = anamnesis.body_fat_percentage;

        const params = { weight, height, age, sex: sex as 'male' | 'female', bodyFat, activityLevel: naf };

        const mifflin = calculateMifflin(params);
        const tinsleyTotal = calculateTinsleyTotal(weight);
        const tinsleyLBM = bodyFat ? calculateTinsleyLBM(weight, bodyFat) : 0;
        const get = mifflin * naf;

        return { mifflin, tinsleyTotal, tinsleyLBM, get, weight, height, age, sex, bodyFat };
    }, [anamnesis, naf, studentDetails]);

    // Calculate final target based on GET + adjustment
    const targetKcal = useMemo(() => {
        if (!calculations) return 0;
        return Math.round(calculations.get) + calorieAdjustment;
    }, [calculations, calorieAdjustment]);

    const macros = useMemo(() => {
        if (!anamnesis || !calculations) return null;
        const finalKcal = Math.round(calculations.get) + calorieAdjustment;
        if (finalKcal <= 0) return null;
        const calc = calculateMacros(finalKcal, anamnesis.weight_kg || 70, anamnesis.main_goal);
        setCustomMacros({
            p: Math.round(calc.protein.grams),
            c: Math.round(calc.carbs.grams),
            f: Math.round(calc.fats.grams)
        });
        return calc;
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
                        p: customMacros.p,
                        c: customMacros.c,
                        f: customMacros.f
                    }
                }
            });

            if (error) throw error;
            if (data.success) {
                setGeneratedDiet(data.diet);
                toast.success('Dieta gerada com 3 opções por refeição!');
            } else {
                throw new Error(data.error || 'Erro desconhecido');
            }
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao gerar dieta: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDiet = async () => {
        if (!generatedDiet || !selectedStudentId) return;
        setIsSaving(true);
        try {
            const planToSave = {
                title: generatedDiet.titulo,
                goal: generatedDiet.objetivo,
                total_calories: targetKcal,
                total_proteins: customMacros.p,
                total_carbs: customMacros.c,
                total_fats: customMacros.f,
                meals: generatedDiet.refeicoes.flatMap((m: any) =>
                    m.opcoes.map((opt: any, optIdx: number) => ({
                        name: m.nome,
                        time: m.horario,
                        type: `Opção ${optIdx + 1}`,
                        foods: opt.itens.map((i: any) => ({
                            name: i.alimento,
                            quantity: i.quantidade,
                            unit: i.unidade
                        }))
                    }))
                )
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

    const nafDescriptions: Record<string, string> = {
        "1.2": "Sedentário: Trabalho de escritório, pouca ou nenhuma atividade física.",
        "1.375": "Leve: Exercícios leves 1-3 dias/semana.",
        "1.55": "Moderado: Exercícios moderados 3-5 dias/semana.",
        "1.725": "Intenso: Exercícios intensos 6-7 dias/semana.",
        "1.9": "Atleta: Treinos muito intensos, 2x ao dia ou trabalho físico pesado."
    };

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background">
                <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

                <div className={cn("transition-all duration-300 min-h-screen", sidebarCollapsed ? "ml-16" : "ml-60")}>
                    <main className="p-8">
                        <DashboardHeader title="Assistente de Nutrição IA" showSearch={false} />

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
                            {/* Sidebar Config */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Student Selection */}
                                <Card className="border-border shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Utensils className="w-4 h-4 text-primary" /> Configuração da Dieta
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <div className="space-y-2">
                                            <Label>Aluno</Label>
                                            <div className="relative">
                                                <Input
                                                    placeholder="🔍 Pesquisar pelo nome..."
                                                    value={studentSearch}
                                                    onChange={(e) => setStudentSearch(e.target.value)}
                                                    className="mb-2 h-9 text-xs border-dashed"
                                                />
                                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder={studentSearch ? `Resultados para "${studentSearch}"` : "Selecione um aluno..."} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredStudents.length > 0 ? (
                                                            filteredStudents.map(s => (
                                                                <SelectItem key={s.id} value={s.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        <img src={s.avatar} className="w-5 h-5 rounded-full" />
                                                                        {s.name}
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-muted-foreground">
                                                                Nenhum aluno encontrado
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {studentDetails && (
                                            <div className={cn(
                                                "p-4 rounded-xl border flex flex-col gap-3 transition-all",
                                                hasTraining ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"
                                            )}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                        <Dumbbell className="w-3 h-3" /> Treino
                                                    </span>
                                                    {hasTraining ? (
                                                        <Badge className="bg-primary text-white text-[10px]">Ativo</Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="text-[10px]">Pendente</Badge>
                                                    )}
                                                </div>
                                                {hasTraining ? (
                                                    <p className="text-sm font-medium">{trainingPrograms[0].title || 'Sem título'}</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-destructive">Esse aluno não possui treino. Crie um primeiro.</p>
                                                        <Button size="sm" variant="outline" onClick={() => navigate('/ia-assistant')}>
                                                            Criar Treino com IA
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* TMB Calculator */}
                                {calculations && (
                                    <Card className="border-border shadow-sm">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Calculator className="w-4 h-4 text-primary" /> Cálculo Energético
                                                </CardTitle>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p className="text-xs"><strong>TMB</strong> = Taxa Metabólica Basal (calorias em repouso)<br /><strong>GET</strong> = Gasto Energético Total (TMB × NAF)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                            <CardDescription className="text-xs">
                                                Dados: {calculations.weight}kg, {calculations.height}cm, {calculations.age} anos, {calculations.sex === 'male' ? 'M' : 'F'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-5">
                                            {/* TMB Results */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">TMB (Mifflin)</p>
                                                    <p className="text-lg font-bold">{Math.round(calculations.mifflin)} <span className="text-xs font-normal">kcal</span></p>
                                                </div>
                                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                                    <p className="text-[10px] text-primary uppercase font-bold">GET Estimado</p>
                                                    <p className="text-lg font-bold text-primary">{Math.round(calculations.get)} <span className="text-xs font-normal">kcal</span></p>
                                                </div>
                                            </div>

                                            {/* NAF Slider */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs">NAF (Nível de Atividade Física)</Label>
                                                    <Badge variant="secondary" className="font-mono">{naf}</Badge>
                                                </div>
                                                <Slider
                                                    value={[naf]}
                                                    onValueChange={(v) => setNaf(v[0])}
                                                    min={1.2}
                                                    max={1.9}
                                                    step={0.175}
                                                    className="cursor-pointer"
                                                />
                                                <p className="text-[10px] text-muted-foreground italic">
                                                    {nafDescriptions[naf.toString()] || nafDescriptions["1.55"]}
                                                </p>
                                            </div>

                                            {/* Déficit/Superávit */}
                                            <div className="space-y-3 pt-4 border-t border-border">
                                                <div className="flex justify-between items-center">
                                                    <Label className="font-bold">Ajuste Calórico</Label>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">
                                                            <p className="text-xs">Valores negativos = déficit (perda de peso). Valores positivos = superávit (ganho de massa).</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Button
                                                        variant={calorieAdjustment === -500 ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCalorieAdjustment(-500)}
                                                        className="text-xs"
                                                    >
                                                        -500 kcal
                                                    </Button>
                                                    <Button
                                                        variant={calorieAdjustment === 0 ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCalorieAdjustment(0)}
                                                        className="text-xs"
                                                    >
                                                        Manutenção
                                                    </Button>
                                                    <Button
                                                        variant={calorieAdjustment === 300 ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCalorieAdjustment(300)}
                                                        className="text-xs"
                                                    >
                                                        +300 kcal
                                                    </Button>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <Input
                                                        type="number"
                                                        value={calorieAdjustment}
                                                        onChange={(e) => setCalorieAdjustment(parseInt(e.target.value) || 0)}
                                                        className="font-bold text-center h-10"
                                                        placeholder="Ex: -300 ou +500"
                                                    />
                                                    <span className="text-xs text-muted-foreground shrink-0">kcal</span>
                                                </div>
                                                <div className={cn(
                                                    "p-3 rounded-lg text-center font-bold text-lg",
                                                    calorieAdjustment > 0 ? "bg-green-500/10 text-green-500" :
                                                        calorieAdjustment < 0 ? "bg-orange-500/10 text-orange-500" :
                                                            "bg-muted text-muted-foreground"
                                                )}>
                                                    Meta: {targetKcal} kcal/dia
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Macros Editor */}
                                {macros && (
                                    <Card className="border-border shadow-sm">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-base">Macronutrientes</CardTitle>
                                                <Button variant="ghost" size="sm" onClick={() => setIsEditingMacros(!isEditingMacros)}>
                                                    <Edit3 className="w-3 h-3 mr-1" /> {isEditingMacros ? 'Fechar' : 'Editar'}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className={cn("p-3 rounded-xl text-center transition-all", isEditingMacros ? "bg-red-500/10 ring-1 ring-red-500/30" : "bg-red-500/5")}>
                                                    <p className="text-[10px] text-red-500 uppercase font-bold mb-1">Proteínas</p>
                                                    {isEditingMacros ? (
                                                        <Input type="number" value={customMacros.p} onChange={(e) => setCustomMacros({ ...customMacros, p: parseInt(e.target.value) || 0 })} className="h-8 text-center font-bold" />
                                                    ) : (
                                                        <p className="text-xl font-bold">{customMacros.p}g</p>
                                                    )}
                                                </div>
                                                <div className={cn("p-3 rounded-xl text-center transition-all", isEditingMacros ? "bg-blue-500/10 ring-1 ring-blue-500/30" : "bg-blue-500/5")}>
                                                    <p className="text-[10px] text-blue-500 uppercase font-bold mb-1">Carboidratos</p>
                                                    {isEditingMacros ? (
                                                        <Input type="number" value={customMacros.c} onChange={(e) => setCustomMacros({ ...customMacros, c: parseInt(e.target.value) || 0 })} className="h-8 text-center font-bold" />
                                                    ) : (
                                                        <p className="text-xl font-bold">{customMacros.c}g</p>
                                                    )}
                                                </div>
                                                <div className={cn("p-3 rounded-xl text-center transition-all", isEditingMacros ? "bg-amber-500/10 ring-1 ring-amber-500/30" : "bg-amber-500/5")}>
                                                    <p className="text-[10px] text-amber-500 uppercase font-bold mb-1">Gorduras</p>
                                                    {isEditingMacros ? (
                                                        <Input type="number" value={customMacros.f} onChange={(e) => setCustomMacros({ ...customMacros, f: parseInt(e.target.value) || 0 })} className="h-8 text-center font-bold" />
                                                    ) : (
                                                        <p className="text-xl font-bold">{customMacros.f}g</p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-center text-muted-foreground">
                                                Total: {(customMacros.p * 4) + (customMacros.c * 4) + (customMacros.f * 9)} kcal
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Generate Button */}
                                {calculations && (
                                    <Button
                                        className="w-full h-14 text-lg font-bold shadow-button gap-3"
                                        disabled={!hasTraining || isGenerating}
                                        onClick={handleGenerateDiet}
                                    >
                                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        {isGenerating ? 'Gerando Cardápios...' : 'Gerar 3 Menus com IA'}
                                    </Button>
                                )}
                            </div>

                            {/* Main Content Area */}
                            <div className="lg:col-span-8">
                                {!selectedStudentId ? (
                                    <div className="h-[70vh] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                            <Utensils className="w-10 h-10 text-primary" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-3">Assistente de Nutrição IA</h2>
                                        <p className="text-muted-foreground text-center max-w-md">
                                            Selecione um aluno na barra lateral para calcular as necessidades energéticas e gerar cardápios personalizados com 3 opções de substituição.
                                        </p>
                                    </div>
                                ) : !generatedDiet ? (
                                    <div className="h-[70vh] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-gradient-to-b from-primary/5 to-transparent">
                                        <PieChart className="w-16 h-16 text-primary/30 mb-6" />
                                        <h3 className="text-xl font-semibold mb-2">Pronto para Gerar</h3>
                                        <p className="text-muted-foreground text-center max-w-sm mb-6">
                                            Ajuste os parâmetros de TMB e macros na barra lateral e clique em "Gerar 3 Menus com IA".
                                        </p>
                                        {!hasTraining && (
                                            <Badge variant="destructive" className="animate-pulse">⚠️ Crie um treino antes</Badge>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Header */}
                                        <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
                                            <div>
                                                <h2 className="text-2xl font-bold">{generatedDiet.titulo}</h2>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="secondary">{generatedDiet.objetivo}</Badge>
                                                    <Badge variant="outline">{targetKcal} kcal/dia</Badge>
                                                </div>
                                            </div>
                                            <Button onClick={handleSaveDiet} disabled={isSaving} size="lg">
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                Salvar Protocolo
                                            </Button>
                                        </div>

                                        {/* Meals Grid */}
                                        <div className="space-y-4">
                                            {generatedDiet.refeicoes?.map((meal: any, mIdx: number) => (
                                                <Card key={mIdx} className="overflow-hidden">
                                                    <div className="bg-muted/30 px-6 py-4 flex justify-between items-center border-b">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                                                                {mIdx + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold">{meal.nome}</h4>
                                                                <span className="text-xs text-muted-foreground">{meal.horario}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
                                                            {[0, 1, 2].map(optIdx => (
                                                                <div key={optIdx} className={cn(
                                                                    "p-5 space-y-3",
                                                                    optIdx === 0 ? "bg-primary/5" : ""
                                                                )}>
                                                                    <Badge variant={optIdx === 0 ? "default" : "outline"} className="mb-2">
                                                                        Opção {optIdx + 1}
                                                                    </Badge>
                                                                    <ul className="space-y-2">
                                                                        {meal.opcoes?.[optIdx]?.itens?.map((item: any, iIdx: number) => (
                                                                            <li key={iIdx} className="flex justify-between text-sm">
                                                                                <span>{item.alimento} <span className="text-muted-foreground text-xs">({item.quantidade}{item.unidade})</span></span>
                                                                                <span className="text-xs text-muted-foreground">P:{item.prot}g C:{item.carb}g G:{item.gord}g</span>
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

                                        {/* Justification & Supplements */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            {generatedDiet.justificativa_bioenergetica && (
                                                <Card className="bg-muted/30 border-dashed">
                                                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-primary" /> Bioenergética Elite
                                                    </CardTitle></CardHeader>
                                                    <CardContent>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">{generatedDiet.justificativa_bioenergetica}</p>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {generatedDiet.suplementacao_estrategica?.length > 0 && (
                                                <Card className="border-primary/20 bg-primary/5">
                                                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 text-primary">
                                                        <Calculator className="w-4 h-4" /> Suplementação Elite
                                                    </CardTitle></CardHeader>
                                                    <CardContent className="space-y-3">
                                                        {generatedDiet.suplementacao_estrategica.map((sup: any, sIdx: number) => (
                                                            <div key={sIdx} className="p-2 bg-background/50 rounded-lg border border-primary/10">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="font-bold text-xs">{sup.suplemento}</span>
                                                                    <Badge variant="outline" className="text-[10px]">{sup.dose} - {sup.horario}</Badge>
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground italic">{sup.justificativa_elite}</p>
                                                            </div>
                                                        ))}
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default AINutritionAssistant;
