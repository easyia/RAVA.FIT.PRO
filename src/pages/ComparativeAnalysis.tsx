import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    Plus,
    Calendar,
    Scale,
    Activity,
    TrendingUp,
    ChevronRight,
    Camera,
    Video,
    ArrowLeftRight,
    Loader2,
    Save,
    FileText,
    Upload
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
    getStudents,
    getPhysicalAssessments,
    createPhysicalAssessment,
    uploadFile
} from "@/services/studentService";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ComparativeAnalysis = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [comparisonView, setComparisonView] = useState<"front" | "left" | "right" | "back">("front");
    const queryClient = useQueryClient();

    const [newAssessment, setNewAssessment] = useState({
        assessment_date: format(new Date(), "yyyy-MM-dd"),
        weight: "",
        height: "",
        bmi: "",
        body_fat: "",
        muscle_mass: "",
        postural_notes: "",
        functional_notes: "",
        general_notes: "",
        front_photo_url: "",
        left_side_photo_url: "",
        right_side_photo_url: "",
        back_photo_url: "",
        video_url: "",
        videos: [] as { url: string, label: string }[]
    });

    const { data: students, isLoading: loadingStudents } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    const { data: assessments, isLoading: loadingAssessments } = useQuery({
        queryKey: ["assessments", selectedStudentId],
        queryFn: () => getPhysicalAssessments(selectedStudentId!),
        enabled: !!selectedStudentId,
    });

    // Auto-calculate BMI
    const calculateBMI = (w: string, h: string) => {
        const weightNum = parseFloat(w);
        const heightNum = parseFloat(h) / 100; // cm to m
        if (weightNum > 0 && heightNum > 0) {
            return (weightNum / (heightNum * heightNum)).toFixed(1);
        }
        return "";
    };

    const handleInputChange = (field: string, value: string) => {
        setNewAssessment(prev => {
            const updated = { ...prev, [field]: value };
            if (field === "weight" || field === "height") {
                updated.bmi = calculateBMI(updated.weight, updated.height);
            }
            return updated;
        });
    };

    const handleFileUpload = async (file: File, field: string) => {
        try {
            toast.info(`Fazendo upload de ${field === 'video_url' ? 'vídeo' : 'foto'}...`);
            const url = await uploadFile(file, 'avatars'); // Usando avatars bucket por enquanto ou criar um novo
            setNewAssessment(prev => ({ ...prev, [field]: url }));
            toast.success("Upload concluído!");
        } catch (error) {
            toast.error("Erro no upload.");
        }
    };

    const handleSaveAssessment = async () => {
        if (!selectedStudentId) return;
        setIsSaving(true);
        try {
            await createPhysicalAssessment({
                ...newAssessment,
                student_id: selectedStudentId,
                weight: parseFloat(newAssessment.weight),
                height: parseFloat(newAssessment.height),
                bmi: parseFloat(newAssessment.bmi),
                body_fat: parseFloat(newAssessment.body_fat),
                muscle_mass: parseFloat(newAssessment.muscle_mass),
            });
            toast.success("Avaliação salva com sucesso!");
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["assessments", selectedStudentId] });
            // Reset form
            setNewAssessment({
                assessment_date: format(new Date(), "yyyy-MM-dd"),
                weight: "",
                height: "",
                bmi: "",
                body_fat: "",
                muscle_mass: "",
                postural_notes: "",
                functional_notes: "",
                general_notes: "",
                front_photo_url: "",
                left_side_photo_url: "",
                right_side_photo_url: "",
                back_photo_url: "",
                video_url: "",
                videos: []
            });
        } catch (error) {
            toast.error("Erro ao salvar avaliação.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleVideoUpload = async (file: File) => {
        try {
            toast.info("Fazendo upload do vídeo...");
            const url = await uploadFile(file, 'avatars');
            setNewAssessment(prev => ({
                ...prev,
                videos: [...prev.videos, { url, label: `Vídeo ${prev.videos.length + 1}` }]
            }));
            toast.success("Vídeo adicionado!");
        } catch (error) {
            toast.error("Erro no upload do vídeo.");
        }
    };

    const updateVideoLabel = (index: number, label: string) => {
        setNewAssessment(prev => {
            const newVids = [...prev.videos];
            newVids[index].label = label;
            return { ...prev, videos: newVids };
        });
    };

    const removeVideo = (index: number) => {
        setNewAssessment(prev => ({
            ...prev,
            videos: prev.videos.filter((_, i) => i !== index)
        }));
    };

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedStudent = students?.find(s => s.id === selectedStudentId);

    // Prepare chart data
    const chartData = assessments?.map(a => ({
        date: format(new Date(a.assessment_date), "dd/MM", { locale: ptBR }),
        peso: a.weight,
        gordura: a.body_fat,
        musculo: a.muscle_mass,
    })).reverse();

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            <div className={cn("transition-all duration-300 min-h-screen pb-10", sidebarCollapsed ? "ml-16" : "ml-60")}>
                <main className="p-8">
                    <DashboardHeader title="Análise Comparativa" showSearch={false} />

                    {!selectedStudentId ? (
                        <div className="space-y-6">
                            <Card className="border-border bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Selecione um Aluno</CardTitle>
                                    <CardDescription>Busque o aluno para ver seu histórico ou realizar nova avaliação.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative mb-6">
                                        <Input
                                            placeholder="Buscar aluno por nome..."
                                            className="bg-sidebar pl-10 h-12"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredStudents?.map((student) => (
                                            <div
                                                key={student.id}
                                                onClick={() => setSelectedStudentId(student.id)}
                                                className="group p-4 rounded-xl border border-border bg-sidebar/30 hover:bg-sidebar/80 hover:border-primary transition-all cursor-pointer flex items-center gap-4"
                                            >
                                                <img src={student.avatar} className="w-12 h-12 rounded-full object-cover border border-border" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold truncate">{student.name}</h4>
                                                    <p className="text-xs text-muted-foreground uppercase">{student.goal}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-primary transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            {/* Student Header */}
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedStudentId(null)} className="rounded-full bg-sidebar/50">
                                        <Plus className="w-5 h-5 rotate-45" />
                                    </Button>
                                    <img src={selectedStudent?.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-lg" />
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedStudent?.name}</h2>
                                        <p className="text-muted-foreground">{selectedStudent?.goal} • {selectedStudent?.phone}</p>
                                    </div>
                                </div>
                                <Button onClick={() => setIsModalOpen(true)} className="h-12 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-button">
                                    <Plus className="w-4 h-4" /> Nova Avaliação
                                </Button>
                            </div>

                            <Tabs defaultValue="evolution" className="w-full">
                                <TabsList className="bg-muted/50 p-1 mb-8">
                                    <TabsTrigger value="evolution" className="gap-2"><TrendingUp className="w-4 h-4" /> Evolução</TabsTrigger>
                                    <TabsTrigger value="photos" className="gap-2"><Camera className="w-4 h-4" /> Fotos & Vídeos</TabsTrigger>
                                    <TabsTrigger value="history" className="gap-2"><Calendar className="w-4 h-4" /> Histórico</TabsTrigger>
                                </TabsList>

                                <TabsContent value="evolution" className="space-y-8">
                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card className="bg-card/50 border-border">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Scale className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-medium text-muted-foreground">Peso Atual</span>
                                                </div>
                                                <h3 className="text-2xl font-bold">{assessments?.[0]?.weight || "--"} kg</h3>
                                                {assessments?.length > 1 && (
                                                    <p className={cn(
                                                        "text-xs mt-1 font-medium",
                                                        assessments[0].weight < assessments[1].weight ? "text-status-success" : "text-status-error"
                                                    )}>
                                                        {assessments[0].weight - assessments[1].weight > 0 ? "+" : ""}{(assessments[0].weight - assessments[1].weight).toFixed(1)} kg vs anterior
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-card/50 border-border">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Activity className="w-4 h-4 text-status-success" />
                                                    <span className="text-sm font-medium text-muted-foreground">% Gordura</span>
                                                </div>
                                                <h3 className="text-2xl font-bold">{assessments?.[0]?.body_fat || "--"}%</h3>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-card/50 border-border">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <TrendingUp className="w-4 h-4 text-status-info" />
                                                    <span className="text-sm font-medium text-muted-foreground">Massa Muscular</span>
                                                </div>
                                                <h3 className="text-2xl font-bold">{assessments?.[0]?.muscle_mass || "--"} kg</h3>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-card/50 border-border">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Scale className="w-4 h-4 text-status-warning" />
                                                    <span className="text-sm font-medium text-muted-foreground">IMC</span>
                                                </div>
                                                <h3 className="text-2xl font-bold">{assessments?.[0]?.bmi || "--"}</h3>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Chart */}
                                    <Card className="border-border bg-card shadow-xl rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-muted/30 pb-2">
                                            <CardTitle className="text-lg">Gráfico de Desempenho</CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[400px] w-full pt-8">
                                            {assessments && assessments.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                        <XAxis dataKey="date" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                        />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="peso" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} name="Peso (kg)" />
                                                        <Line type="monotone" dataKey="gordura" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} name="% Gordura" />
                                                        <Line type="monotone" dataKey="musculo" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} name="Massa Muscular (kg)" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                                    <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                                                    <p>Nenhum dado histórico para exibir o gráfico.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="photos" className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <Card className="border-border bg-card overflow-hidden">
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <div>
                                                    <CardTitle>Comparações Visuais</CardTitle>
                                                    <CardDescription>Baseline vs Última Avaliação</CardDescription>
                                                </div>
                                                <div className="flex bg-muted p-1 rounded-lg gap-1">
                                                    <Button
                                                        variant={comparisonView === "front" ? "secondary" : "ghost"}
                                                        size="sm"
                                                        className="h-8 text-[10px] px-2"
                                                        onClick={() => setComparisonView("front")}
                                                    >FRENTE</Button>
                                                    <Button
                                                        variant={comparisonView === "right" ? "secondary" : "ghost"}
                                                        size="sm"
                                                        className="h-8 text-[10px] px-2"
                                                        onClick={() => setComparisonView("right")}
                                                    >LADO D</Button>
                                                    <Button
                                                        variant={comparisonView === "left" ? "secondary" : "ghost"}
                                                        size="sm"
                                                        className="h-8 text-[10px] px-2"
                                                        onClick={() => setComparisonView("left")}
                                                    >LADO E</Button>
                                                    <Button
                                                        variant={comparisonView === "back" ? "secondary" : "ghost"}
                                                        size="sm"
                                                        className="h-8 text-[10px] px-2"
                                                        onClick={() => setComparisonView("back")}
                                                    >COSTAS</Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-center text-muted-foreground uppercase tracking-widest">Baseline</p>
                                                        <div className="aspect-[3/4] rounded-xl bg-sidebar border border-border flex items-center justify-center overflow-hidden">
                                                            {assessments?.[assessments.length - 1]?.[`${comparisonView === 'front' ? 'front' : comparisonView === 'back' ? 'back' : comparisonView === 'left' ? 'left_side' : 'right_side'}_photo_url`] ? (
                                                                <img src={assessments[assessments.length - 1][`${comparisonView === 'front' ? 'front' : comparisonView === 'back' ? 'back' : comparisonView === 'left' ? 'left_side' : 'right_side'}_photo_url`]} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Camera className="w-8 h-8 text-tertiary" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-center text-primary uppercase tracking-widest">Atual</p>
                                                        <div className="aspect-[3/4] rounded-xl bg-sidebar border border-primary/30 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/5">
                                                            {assessments?.[0]?.[`${comparisonView === 'front' ? 'front' : comparisonView === 'back' ? 'back' : comparisonView === 'left' ? 'left_side' : 'right_side'}_photo_url`] ? (
                                                                <img src={assessments[0][`${comparisonView === 'front' ? 'front' : comparisonView === 'back' ? 'back' : comparisonView === 'left' ? 'left_side' : 'right_side'}_photo_url`]} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Camera className="w-8 h-8 text-tertiary" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-border bg-card">
                                            <CardHeader>
                                                <CardTitle className="flex items-center justify-between">
                                                    Vídeos de Execução
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                        {(assessments?.[0]?.videos?.length || 0) + (assessments?.[0]?.video_url ? 1 : 0)} Vídeos
                                                    </span>
                                                </CardTitle>
                                                <CardDescription>Análise técnica de movimentos</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Legacy Single Video Fallback */}
                                                {assessments?.[0]?.video_url && (
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-semibold text-primary">Vídeo Principal</p>
                                                        <div className="aspect-video rounded-xl bg-sidebar border border-border overflow-hidden shadow-inner">
                                                            <video src={assessments[0].video_url} controls className="w-full h-full" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Modern Video List */}
                                                <div className="grid grid-cols-1 gap-6">
                                                    {assessments?.[0]?.videos?.map((vid: any, i: number) => (
                                                        <div key={i} className="space-y-2">
                                                            <p className="text-sm font-semibold text-primary">{vid.label || `Vídeo ${i + 1}`}</p>
                                                            <div className="aspect-video rounded-xl bg-sidebar border border-border overflow-hidden shadow-2xl">
                                                                <video src={vid.url} controls className="w-full h-full bg-black/40" />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {(!assessments?.[0]?.videos?.length && !assessments?.[0]?.video_url) && (
                                                        <div className="aspect-video rounded-xl bg-sidebar border border-border flex flex-col items-center justify-center text-muted-foreground gap-4">
                                                            <Video className="w-12 h-12 opacity-20" />
                                                            <p>Nenhum vídeo registrado nesta análise.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="animate-fade-in">
                                    <div className="space-y-4">
                                        {assessments?.map((assessment) => (
                                            <Card key={assessment.id} className="border-border bg-card hover:bg-surface-hover transition-colors">
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                {format(new Date(assessment.assessment_date), "dd")}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold">{format(new Date(assessment.assessment_date), "MMMM 'de' yyyy", { locale: ptBR })}</h4>
                                                                <p className="text-sm text-muted-foreground">{assessment.weight}kg • {assessment.body_fat}% gordura</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="outline" size="sm">Ver Detalhes</Button>
                                                            <Button variant="outline" size="sm">Exportar PDF</Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal de Nova Avaliação */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Plus className="w-6 h-6 text-primary" /> Nova Avaliação Física
                        </DialogTitle>
                        <DialogDescription>
                            Registre as métricas, fotos e vídeos para acompanhar a evolução de {selectedStudent?.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                        {/* Metrics Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold border-b border-border pb-2 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-primary" /> Métricas Corporais
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Data da Avaliação</Label>
                                    <Input type="date" value={newAssessment.assessment_date} onChange={(e) => handleInputChange("assessment_date", e.target.value)} className="bg-sidebar" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Peso (kg)</Label>
                                    <Input type="number" step="0.1" value={newAssessment.weight} onChange={(e) => handleInputChange("weight", e.target.value)} placeholder="0.0" className="bg-sidebar" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Altura (cm)</Label>
                                    <Input type="number" value={newAssessment.height} onChange={(e) => handleInputChange("height", e.target.value)} placeholder="170" className="bg-sidebar" />
                                </div>
                                <div className="space-y-2">
                                    <Label>IMC</Label>
                                    <Input value={newAssessment.bmi} disabled className="bg-muted opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label>% Gordura</Label>
                                    <Input type="number" step="0.1" value={newAssessment.body_fat} onChange={(e) => handleInputChange("body_fat", e.target.value)} placeholder="0.0" className="bg-sidebar" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Massa Muscular (kg)</Label>
                                    <Input type="number" step="0.1" value={newAssessment.muscle_mass} onChange={(e) => handleInputChange("muscle_mass", e.target.value)} placeholder="0.0" className="bg-sidebar" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <h3 className="text-lg font-semibold border-b border-border pb-2 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" /> Observações Técnicas
                                </h3>
                                <div className="space-y-2">
                                    <Label>Avaliação Postural</Label>
                                    <Textarea value={newAssessment.postural_notes} onChange={(e) => handleInputChange("postural_notes", e.target.value)} placeholder="Desvios, simetria..." className="bg-sidebar min-h-[80px]" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Avaliação Funcional</Label>
                                    <Textarea value={newAssessment.functional_notes} onChange={(e) => handleInputChange("functional_notes", e.target.value)} placeholder="Limitações, testes de movimento..." className="bg-sidebar min-h-[80px]" />
                                </div>
                            </div>
                        </div>

                        {/* Media Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold border-b border-border pb-2 flex items-center gap-2">
                                <Camera className="w-5 h-5 text-primary" /> Registro Visual
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-center block">Frente</Label>
                                    <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-sidebar/50">
                                        {newAssessment.front_photo_url ? (
                                            <img src={newAssessment.front_photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="w-6 h-6 text-tertiary" />
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "front_photo_url")} />
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-center block">Lado D</Label>
                                    <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-sidebar/50">
                                        {newAssessment.right_side_photo_url ? (
                                            <img src={newAssessment.right_side_photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="w-6 h-6 text-tertiary" />
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "right_side_photo_url")} />
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-center block">Lado E</Label>
                                    <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-sidebar/50">
                                        {newAssessment.left_side_photo_url ? (
                                            <img src={newAssessment.left_side_photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="w-6 h-6 text-tertiary" />
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "left_side_photo_url")} />
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase text-center block">Costas</Label>
                                    <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-sidebar/50">
                                        {newAssessment.back_photo_url ? (
                                            <img src={newAssessment.back_photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="w-6 h-6 text-tertiary" />
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "back_photo_url")} />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <Label className="flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Video className="w-4 h-4 text-primary" /> Vídeos de Movimentos</span>
                                    <span className="text-[10px] text-muted-foreground">{newAssessment.videos.length} vídeos adicionados</span>
                                </Label>

                                {/* List of added videos */}
                                <div className="space-y-3">
                                    {newAssessment.videos.map((vid, idx) => (
                                        <div key={idx} className="flex gap-2 items-end bg-sidebar/30 p-3 rounded-lg border border-border/50 animate-in slide-in-from-right-2">
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-[10px] text-tertiary">NOME DO MOVIMENTO</Label>
                                                <Input
                                                    value={vid.label}
                                                    onChange={(e) => updateVideoLabel(idx, e.target.value)}
                                                    placeholder="Ex: Agachamento Lateral"
                                                    className="h-8 bg-background border-none text-sm"
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeVideo(idx)}
                                                className="h-8 w-8 text-status-error hover:bg-status-error/10"
                                            >
                                                <Plus className="w-4 h-4 rotate-45" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Upload button */}
                                <label className="aspect-[4/1] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group overflow-hidden bg-sidebar/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Adicionar mais um vídeo</p>
                                            <p className="text-[10px] text-muted-foreground text-center">Arraste ou clique para selecionar</p>
                                        </div>
                                    </div>
                                    <input type="file" className="hidden" accept="video/*" onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])} />
                                </label>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label>Observações Gerais</Label>
                                <Textarea value={newAssessment.general_notes} onChange={(e) => handleInputChange("general_notes", e.target.value)} placeholder="Pontos de atenção ou comentários..." className="bg-sidebar min-h-[100px]" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="border-t border-border pt-6 mt-6">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveAssessment} disabled={isSaving || !newAssessment.weight} className="min-w-[150px]">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Avaliação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ComparativeAnalysis;
