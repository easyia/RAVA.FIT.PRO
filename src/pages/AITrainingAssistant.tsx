import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Upload, FileText, CheckCircle2, AlertCircle, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getStudents, getCoachProfile } from '@/services/studentService';
import { supabase } from '@/lib/supabase';

// Interfaces for the AI response structure
interface WorkoutProgram {
    titulo: string;
    objetivo: string;
    nivel: string;
    duracao_semanas: number;
    frequencia_semanal: number;
    tipo_divisao: string;
    observacoes_gerais: string;
}

interface Adaptation {
    lesao: string;
    exercicios_evitados: string[];
    substituicoes: string[];
    cuidados: string;
}

interface Exercise {
    nome: string;
    grupo_muscular: string;
    series: number;
    repeticoes: string;
    descanso_segundos: number;
    tecnica?: string;
    observacoes?: string;
    adaptacao_lesao?: boolean;
}

interface WorkoutSession {
    nome: string;
    dia_semana_sugerido: string;
    foco: string;
    exercicios: Exercise[];
}

interface Progression {
    tipo: string;
    descricao: string;
    marcos: { semana: number; mudanca: string }[];
}

interface AIResponse {
    programa_treino: WorkoutProgram;
    adaptacoes_lesoes: Adaptation[];
    treinos: WorkoutSession[];
    progressao: Progression;
    justificativa: {
        escolha_exercicios: string;
        volume_intensidade: string;
        periodizacao: string;
        adaptacoes: string;
    };
    proximos_passos: string;
}

const AITrainingAssistant = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedWorkout, setGeneratedWorkout] = useState<AIResponse | null>(null);

    const { data: students = [] } = useQuery({
        queryKey: ['students'],
        queryFn: getStudents,
    });

    const { data: coach } = useQuery({
        queryKey: ['coachProfile'],
        queryFn: getCoachProfile,
    });



    const generateWorkout = async () => {
        if (!selectedStudentId) {
            toast.error('Selecione um aluno primeiro.');
            return;
        }
        if (!prompt) {
            toast.error('Descreva o que você precisa.');
            return;
        }

        setIsGenerating(true);

        try {
            const { data, error } = await supabase.functions.invoke('generate-training', {
                body: {
                    coach_id: coach?.id,
                    student_id: selectedStudentId,
                    prompt_users: prompt,
                }
            });

            if (error) {
                console.error("Supabase function error:", error);
                throw error;
            }

            if (data.success) {
                setGeneratedWorkout(data.workout);
                toast.success('Treino gerado com sucesso!');
            } else {
                throw new Error(data.error || 'Erro desconhecido na geração do treino.');
            }

        } catch (error: any) {
            console.error("Error generating workout:", error);

            let errorMessage = 'Erro ao gerar treino. Tente novamente.';

            // Tentar extrair mensagem de erro da resposta da Edge Function
            if (error instanceof Error && error.message) {
                errorMessage = error.message;
            }
            // Se for um erro da função (customizado)
            if (error && typeof error === 'object' && 'cause' in error) {
                // @ts-ignore
                errorMessage = error.cause?.message || errorMessage;
            }

            toast.error(`Erro: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div
                className={cn(
                    "transition-all duration-300 ease-out min-h-screen",
                    sidebarCollapsed ? "ml-16" : "ml-60"
                )}
            >
                <main className="p-8">
                    <DashboardHeader
                        title="Assistente IA"
                        showSearch={false}
                        actions={
                            <Button disabled variant="outline" className="gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span>Beta v1.0</span>
                            </Button>
                        }
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                        {/* Left Column: Input */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-border bg-card shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                        Configuração
                                    </CardTitle>
                                    <CardDescription>
                                        Defina os parâmetros para a IA
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">

                                    {/* Student Selector */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Aluno</label>
                                        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um aluno..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {students.map((student) => (
                                                    <SelectItem key={student.id} value={student.id}>
                                                        {student.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Prompt Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">O que você precisa?</label>
                                        <Textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder='Ex: "Monte um treino de hipertrofia para iniciante, 3x por semana, focando em glúteos. O aluno tem condromalácia."'
                                            className="min-h-[150px] resize-none"
                                        />
                                    </div>

                                    {/* Context Files (Placeholder) */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Contexto Adicional (Opcional)</label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-xs text-muted-foreground">
                                                Arraste arquivos PDF ou clique para selecionar
                                            </p>
                                        </div>
                                    </div>

                                    {/* Generate Button */}
                                    <Button
                                        className="w-full h-12 text-lg font-medium shadow-button relative overflow-hidden group"
                                        onClick={generateWorkout}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Gerando...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                                                <span>Gerar Treino com IA</span>
                                            </div>
                                        )}
                                    </Button>

                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Output */}
                        <div className="lg:col-span-2 space-y-6">
                            {generatedWorkout ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                    {/* Overview Card */}
                                    <Card className="border-primary/20 bg-card shadow-md overflow-hidden">
                                        <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-2xl">{generatedWorkout.programa_treino.titulo}</CardTitle>
                                                    <CardDescription className="flex items-center gap-2 mt-2">
                                                        <Badge variant="secondary">{generatedWorkout.programa_treino.objetivo}</Badge>
                                                        <Badge variant="outline">{generatedWorkout.programa_treino.nivel}</Badge>
                                                        <Badge variant="outline">{generatedWorkout.programa_treino.frequencia_semanal}x/Semana</Badge>
                                                    </CardDescription>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Salvar Protocolo
                                                </Button>
                                            </div>
                                        </CardHeader>

                                        {/* Adaptations Alert */}
                                        {generatedWorkout.adaptacoes_lesoes.length > 0 && (
                                            <div className="px-6 pb-4">
                                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                                                    <h4 className="text-amber-500 font-semibold flex items-center gap-2 mb-2">
                                                        <AlertCircle className="w-4 h-4" /> Adaptações para Lesões
                                                    </h4>
                                                    {generatedWorkout.adaptacoes_lesoes.map((adapt, idx) => (
                                                        <div key={idx} className="text-sm text-amber-500/90 ml-6">
                                                            <p><span className="font-medium">Lesão:</span> {adapt.lesao}</p>
                                                            <p><span className="font-medium">Evitados:</span> {adapt.exercicios_evitados.join(", ")}</p>
                                                            <p><span className="font-medium">Substituições:</span> {adapt.substituicoes.join(", ")}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </Card>

                                    {/* Workouts */}
                                    <div className="grid gap-6">
                                        {generatedWorkout.treinos.map((session, index) => (
                                            <Card key={index} className="border-border bg-card">
                                                <CardHeader className="bg-muted/30">
                                                    <div className="flex justify-between items-center">
                                                        <CardTitle className="text-lg font-semibold text-primary">
                                                            {session.nome}
                                                        </CardTitle>
                                                        <Badge className="bg-surface text-foreground">{session.dia_semana_sugerido}</Badge>
                                                    </div>
                                                    <CardDescription>Foco: {session.foco}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="pt-6">
                                                    <div className="space-y-4">
                                                        {session.exercicios.map((ex, exIdx) => (
                                                            <div key={exIdx} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                                    {exIdx + 1}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <h4 className="font-medium text-foreground">{ex.nome}</h4>
                                                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                                                            <span>{ex.series} séries</span>
                                                                            <span>{ex.repeticoes} reps</span>
                                                                            <span>{ex.descanso_segundos}s</span>
                                                                        </div>
                                                                    </div>
                                                                    {ex.observacoes && (
                                                                        <p className="text-xs text-muted-foreground mt-1">💡 {ex.observacoes}</p>
                                                                    )}
                                                                    {ex.adaptacao_lesao && (
                                                                        <Badge variant="outline" className="mt-2 text-[10px] border-amber-500/50 text-amber-500">
                                                                            Adaptado
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Justification & Progression */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader><CardTitle className="text-lg">Justificativa da IA</CardTitle></CardHeader>
                                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                                <p><strong className="text-foreground">Escolhas:</strong> {generatedWorkout.justificativa.escolha_exercicios}</p>
                                                <p><strong className="text-foreground">Volume:</strong> {generatedWorkout.justificativa.volume_intensidade}</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader><CardTitle className="text-lg">Progressão Sugerida</CardTitle></CardHeader>
                                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                                <p><strong className="text-foreground">{generatedWorkout.progressao.tipo}:</strong> {generatedWorkout.progressao.descricao}</p>
                                                <ul className="list-disc list-inside space-y-1 mt-2">
                                                    {generatedWorkout.progressao.marcos.map((marco, m) => (
                                                        <li key={m}>Semana {marco.semana}: {marco.mudanca}</li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>

                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/10 border-2 border-dashed border-border rounded-xl">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <Bot className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Assistente IA Apex</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        Selecione um aluno e descreva o que você precisa. Nossa IA analisará o histórico e anamnese para criar um treino personalizado em segundos.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AITrainingAssistant;
