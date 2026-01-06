import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Upload, FileText, CheckCircle2, AlertCircle, Bot, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getStudents, getCoachProfile, saveTrainingProgram, uploadFile, getStudentDetails } from '@/services/studentService';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

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
    adaptacoes_lesoes: (Adaptation & { racional_dor?: string })[];
    treinos: WorkoutSession[];
    justificativa: {
        escolha_exercicios: string;
        volume_intensidade: string;
        sincronia_nutricional: string;
    };
    progressao: Progression;
}

const AITrainingAssistant = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedWorkout, setGeneratedWorkout] = useState<AIResponse | null>(null);
    const [studentSearch, setStudentSearch] = useState('');

    const { data: students = [] } = useQuery({
        queryKey: ['students'],
        queryFn: getStudents,
    });

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
    }, [students, studentSearch]);

    const { data: coach } = useQuery({
        queryKey: ['coachProfile'],
        queryFn: getCoachProfile,
    });

    const selectedStudent = students.find(s => s.id === selectedStudentId);
    const { data: studentFullDetails } = useQuery({
        queryKey: ['studentDetails', selectedStudentId],
        queryFn: () => getStudentDetails(selectedStudentId),
        enabled: !!selectedStudentId
    });




    const navigate = useNavigate();
    const [contextFiles, setContextFiles] = useState<{ id: string, name: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadFile(file, 'context_files');
            // Insert into context_files table
            const { data: fileRecord, error } = await supabase
                .from('context_files')
                .insert({
                    name: file.name,
                    storage_path: url,
                    type: file.name.split('.').pop(),
                    extracted_content: `[URL]: ${url}`
                })
                .select()
                .single();

            if (error) throw error;

            setContextFiles(prev => [...prev, { id: fileRecord.id, name: fileRecord.name }]);
            toast.success('Arquivo adicionado ao contexto!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar arquivo.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProtocol = async () => {
        if (!generatedWorkout || !selectedStudentId) return;
        setIsSaving(true);
        try {
            const programToSave = {
                weeks: generatedWorkout.programa_treino.duracao_semanas,
                startDate: new Date().toISOString().split('T')[0],
                title: generatedWorkout.programa_treino.titulo,
                sessions: generatedWorkout.treinos.map(t => ({
                    name: t.nome,
                    division: t.foco,
                    exercises: t.exercicios.map(e => ({
                        name: e.nome,
                        sets: e.series,
                        reps_min: e.repeticoes.includes('-') ? parseInt(e.repeticoes.split('-')[0]) : parseInt(e.repeticoes) || 0,
                        reps_max: e.repeticoes.includes('-') ? parseInt(e.repeticoes.split('-')[1]) : parseInt(e.repeticoes) || 0,
                        rest_time: e.descanso_segundos,
                        notes: e.observacoes || (e.adaptacao_lesao ? 'Adaptado' : ''),
                        main_muscle_group: e.grupo_muscular || "Geral"
                    }))
                }))
            };

            await saveTrainingProgram(selectedStudentId, programToSave);
            toast.success('Treino salvo e atribuído! Redirecionando para planejamento nutricional...', {
                duration: 3000
            });

            // Auto redirect to nutrition after successful save
            setTimeout(() => {
                navigate('/ia-diet-assistant', {
                    state: {
                        studentId: selectedStudentId,
                        workoutSync: generatedWorkout.justificativa.sincronia_nutricional
                    }
                });
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditExercise = (sessionIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
        if (!generatedWorkout) return;
        const newWorkout = { ...generatedWorkout };
        // @ts-ignore
        newWorkout.treinos[sessionIndex].exercicios[exerciseIndex][field] = value;
        setGeneratedWorkout(newWorkout);
    };

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
                    context_file_ids: contextFiles.map(f => f.id)
                }
            });

            if (error) {
                console.error("Supabase function error:", error);
                throw error;
            }

            if (data.success) {
                setGeneratedWorkout(data.workout);
                toast.success('Treino gerado! Revise o protocolo abaixo e clique em "Prescrever" para salvar e ir para a Dieta.', {
                    duration: 5000
                });
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
                        title="Prescrição IA (Full Stack)"
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
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium">Aluno</label>
                                            {selectedStudent && (
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {selectedStudent.status}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                placeholder="🔍 Pesquisar aluno pelo nome..."
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                className="mb-2 h-10 text-xs border-dashed"
                                            />
                                            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder={studentSearch ? `Resultados para "${studentSearch}"` : "Selecione um aluno..."} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredStudents.length > 0 ? (
                                                        filteredStudents.map((student) => (
                                                            <SelectItem key={student.id} value={student.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <img src={student.avatar} className="w-6 h-6 rounded-full object-cover" />
                                                                    {student.name}
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

                                    {/* Student Preview Card */}
                                    {studentFullDetails && (
                                        <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-3">
                                                <img src={studentFullDetails.avatar_url || selectedStudent?.avatar} className="w-10 h-10 rounded-full object-cover border border-primary/20" />
                                                <div>
                                                    <p className="text-sm font-semibold">{studentFullDetails.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{studentFullDetails.anamnesis?.[0]?.main_goal || 'Sem objetivo'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                <div className="bg-background/50 p-2 rounded">
                                                    <p className="text-muted-foreground uppercase font-bold">Nível</p>
                                                    <p>{studentFullDetails.anamnesis?.[0]?.training_level || 'N/A'}</p>
                                                </div>
                                                <div className="bg-background/50 p-2 rounded">
                                                    <p className="text-muted-foreground uppercase font-bold">Lesões</p>
                                                    <p className="truncate">{studentFullDetails.anamnesis?.[0]?.injuries || 'Nenhuma'}</p>
                                                </div>
                                            </div>
                                            {studentFullDetails.anamnesis?.[0]?.medical_conditions && (
                                                <div className="bg-status-error/5 border border-status-error/10 p-2 rounded text-[10px]">
                                                    <p className="text-status-error font-bold flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Condições Médicas:
                                                    </p>
                                                    <p className="text-muted-foreground mt-1 line-clamp-2">{studentFullDetails.anamnesis[0].medical_conditions}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

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

                                    {/* Context Files */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">Contexto Adicional (Opcional)</label>
                                        <label htmlFor="context-upload" className="block border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                                            {isUploading ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                                            )}
                                            <p className="text-xs text-muted-foreground group-hover:text-foreground">
                                                {isUploading ? "Enviando..." : "Arraste arquivos PDF ou clique para selecionar"}
                                            </p>
                                            <input
                                                id="context-upload"
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                            />
                                        </label>

                                        {/* Listed Files */}
                                        {contextFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {contextFiles.map((file) => (
                                                    <Badge key={file.id} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1 group">
                                                        <FileText className="w-3 h-3 mr-1" />
                                                        <span className="max-w-[100px] truncate">{file.name}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-5 h-5 rounded-full hover:bg-destructive hover:text-white p-0"
                                                            onClick={() => setContextFiles(prev => prev.filter(f => f.id !== file.id))}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
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
                                                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                                        <Badge variant="secondary">{generatedWorkout.programa_treino.objetivo}</Badge>
                                                        <Badge variant="outline">{generatedWorkout.programa_treino.nivel}</Badge>
                                                        <Badge variant="outline">{generatedWorkout.programa_treino.frequencia_semanal}x/Semana</Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleSaveProtocol}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    )}
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
                                                            {adapt.racional_dor && (
                                                                <p className="mt-2 p-2 bg-status-error/10 rounded border border-status-error/20 text-[11px] font-bold">
                                                                    ⚠️ ZONA DE EXCLUSÃO: {adapt.racional_dor}
                                                                </p>
                                                            )}
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
                                                    <div className="text-sm text-muted-foreground">Foco: {session.foco}</div>
                                                </CardHeader>
                                                <CardContent className="pt-6">
                                                    <div className="space-y-4">
                                                        {session.exercicios.map((ex, exIdx) => (
                                                            <div key={exIdx} className="group flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/30 transition-all duration-300">
                                                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
                                                                    {exIdx + 1}
                                                                </div>

                                                                <div className="flex-1 w-full space-y-3">
                                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                                        <div className="flex-1">
                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Nome do Exercício</label>
                                                                            <Input
                                                                                type="text"
                                                                                value={ex.nome}
                                                                                onChange={(e) => handleEditExercise(index, exIdx, 'nome', e.target.value)}
                                                                                className="h-9 font-bold bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/30 px-0 text-base"
                                                                            />
                                                                        </div>

                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <div className="flex flex-col items-center">
                                                                                <label className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground mb-1">Séries</label>
                                                                                <Input
                                                                                    type="number"
                                                                                    value={ex.series}
                                                                                    onChange={(e) => handleEditExercise(index, exIdx, 'series', parseInt(e.target.value))}
                                                                                    className="w-12 h-9 text-center font-bold bg-surface border-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm rounded-lg"
                                                                                />
                                                                            </div>
                                                                            <div className="flex flex-col items-center">
                                                                                <label className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground mb-1">Reps</label>
                                                                                <Input
                                                                                    type="text"
                                                                                    value={ex.repeticoes}
                                                                                    onChange={(e) => handleEditExercise(index, exIdx, 'repeticoes', e.target.value)}
                                                                                    className="w-16 h-9 text-center font-bold bg-surface border-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm rounded-lg"
                                                                                />
                                                                            </div>
                                                                            <div className="flex flex-col items-center">
                                                                                <label className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground mb-1">Descanso</label>
                                                                                <div className="relative">
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={ex.descanso_segundos}
                                                                                        onChange={(e) => handleEditExercise(index, exIdx, 'descanso_segundos', parseInt(e.target.value))}
                                                                                        className="w-16 h-9 text-center font-bold bg-surface border-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm rounded-lg pr-5"
                                                                                    />
                                                                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground">s</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Observações Técnicas</label>
                                                                        <Input
                                                                            type="text"
                                                                            value={ex.observacoes || ''}
                                                                            placeholder="Ex: Cadência 4020, Foco no alongamento..."
                                                                            onChange={(e) => handleEditExercise(index, exIdx, 'observacoes', e.target.value)}
                                                                            className="h-8 text-xs text-muted-foreground bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/20 px-0 italic"
                                                                        />
                                                                    </div>

                                                                    {ex.adaptacao_lesao && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-500 bg-amber-500/5 font-black uppercase tracking-widest px-2 py-0">
                                                                                <AlertCircle className="w-2.5 h-2.5 mr-1" /> Adaptado para Lesão
                                                                            </Badge>
                                                                        </div>
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
                                            <CardHeader><CardTitle className="text-lg">Justificativa PhD & Sincronia</CardTitle></CardHeader>
                                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                                <p><strong className="text-foreground">Biomecânica:</strong> {generatedWorkout.justificativa.escolha_exercicios}</p>
                                                <p><strong className="text-foreground">Fisiologia:</strong> {generatedWorkout.justificativa.volume_intensidade}</p>
                                                <p className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-primary">
                                                    <strong className="text-primary font-bold">Sincronia Nutricional:</strong><br />
                                                    {generatedWorkout.justificativa.sincronia_nutricional}
                                                </p>
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
            </div >
        </div >
    );
};

export default AITrainingAssistant;
