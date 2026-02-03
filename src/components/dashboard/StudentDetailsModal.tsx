import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getStudentDetails, getTrainingPrograms, getMealPlans, getPhysicalAssessments } from "@/services/studentService";
import { getStudentFeedbacks } from "@/services/feedbackService";
import { generateEvolutionReport } from "@/services/pdfService";
import { statusLabels } from "@/types/student";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Loader2, User, FileText, Dumbbell, Utensils, Calendar, Phone, Mail, TrendingUp, ChevronRight, Clock, MessageSquare, Send } from "lucide-react";
import { getChatMessages, sendMessageFromCoach } from "@/services/aiService";
import { StudentChatTab } from "./StudentChatTab";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const trainingLevelLabels: { [key: string]: string } = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
    athlete: "Atleta",
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado",
    atleta: "Atleta"
};

interface StudentDetailsModalProps {
    studentId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: (id: string, status: string) => void;
    defaultTab?: string;
}

export function StudentDetailsModal({ studentId, isOpen, onClose, onStatusChange, defaultTab = "anamnesis" }: StudentDetailsModalProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

    const { data: student, isLoading: loadingStudent } = useQuery({
        queryKey: ['student', studentId],
        queryFn: () => getStudentDetails(studentId!),
        enabled: !!studentId && isOpen,
    });

    const { data: programs, isLoading: loadingPrograms } = useQuery({
        queryKey: ['training_programs', studentId],
        queryFn: () => getTrainingPrograms(studentId!),
        enabled: !!studentId && isOpen,
    });

    const { data: mealPlans, isLoading: loadingMeals } = useQuery({
        queryKey: ['meal_plans', studentId],
        queryFn: () => getMealPlans(studentId!),
        enabled: !!studentId && isOpen,
    });

    const { data: assessments, isLoading: loadingAssessments } = useQuery({
        queryKey: ['assessments', studentId],
        queryFn: () => getPhysicalAssessments(studentId!),
        enabled: !!studentId && isOpen,
    });

    const { data: feedbacks, isLoading: loadingFeedbacks } = useQuery({
        queryKey: ['feedbacks', studentId],
        queryFn: () => getStudentFeedbacks(studentId!),
        enabled: !!studentId && isOpen,
    });

    const isLoading = loadingStudent;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-card border-border shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Detalhes do Aluno</DialogTitle>
                    <DialogDescription>
                        Visualize informações pessoais, anamnese, avaliações, treinos e dieta do aluno.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="h-[60vh] flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : student ? (
                    <div className="flex flex-col h-full">
                        <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-xl">
                                    <Avatar className="w-full h-full">
                                        <AvatarImage src={student.avatar_url || ""} className="object-cover" />
                                        <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black uppercase">
                                            {student.full_name ? student.full_name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-foreground mb-1">{student.full_name}</DialogTitle>
                                    <div className="flex flex-wrap gap-3">
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            {statusLabels[student.status as keyof typeof statusLabels] || 'Ativo'}
                                        </Badge>
                                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 uppercase text-[10px]">{student.classification || 'bronze'}</Badge>
                                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border uppercase text-[10px]">{student.service_type || 'online'}</Badge>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {student.email}</span>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {student.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <Tabs key={studentId + (defaultTab || '')} defaultValue={defaultTab} className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 border-b border-border">
                                <TabsList className="bg-transparent h-12 gap-6 p-0">
                                    <TabsTrigger value="info" className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><User className="w-4 h-4 mr-2" /> Perfil</TabsTrigger>
                                    <TabsTrigger value="anamnesis" className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><FileText className="w-4 h-4 mr-2" /> Anamnese</TabsTrigger>
                                    <TabsTrigger value="evaluation" className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><TrendingUp className="w-4 h-4 mr-2" /> Avaliação</TabsTrigger>
                                    <TabsTrigger value="training" className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><Dumbbell className="w-4 h-4 mr-2" /> Treinos</TabsTrigger>
                                    <TabsTrigger value="nutrition" className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><Utensils className="w-4 h-4 mr-2" /> Dieta</TabsTrigger>
                                    <TabsTrigger value="feedbacks" className="h-14 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Feedbacks
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 p-6 max-h-[calc(85vh-12rem)]">
                                <div className="space-y-6">
                                    <TabsContent value="info" className="mt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="card-elevated p-4 space-y-4 bg-sidebar/20">
                                                <h4 className="font-semibold text-primary uppercase text-[10px] tracking-[0.2em] opacity-80">Dados Pessoais</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-sm border-b border-border/10 pb-2 last:border-0"><span className="text-muted-foreground">Nascimento</span><span className="font-bold text-foreground">{student.birth_date || 'N/A'}</span></div>
                                                    <div className="flex justify-between items-center text-sm border-b border-border/10 pb-2 last:border-0"><span className="text-muted-foreground">Gênero</span><span className="font-bold text-foreground">{student.sex || 'N/A'}</span></div>
                                                    <div className="flex justify-between items-center text-sm border-b border-border/10 pb-2 last:border-0"><span className="text-muted-foreground">CPF</span><span className="font-bold text-foreground">{student.cpf || 'N/A'}</span></div>
                                                    <div className="flex justify-between items-center text-sm border-b border-border/10 pb-2 last:border-0"><span className="text-muted-foreground">RG</span><span className="font-bold text-foreground">{student.rg || 'N/A'}</span></div>
                                                    <div className="flex justify-between items-center text-sm border-b border-border/10 pb-2 last:border-0"><span className="text-muted-foreground">Profissão</span><span className="font-bold text-foreground">{student.profession || 'N/A'}</span></div>
                                                    <div className="flex justify-between items-center text-sm border-b border-border/10 pb-1 last:border-0"><span className="text-muted-foreground">Estado Civil</span><span className="font-bold text-foreground">{student.marital_status || 'N/A'}</span></div>
                                                </div>
                                            </div>
                                            <div className="card-elevated p-4 space-y-4 bg-sidebar/20">
                                                <h4 className="font-semibold text-primary uppercase text-[10px] tracking-[0.2em] opacity-80">Emergência</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-sm border-b border-border/10 pb-2 last:border-0"><span className="text-muted-foreground">Contato</span><span className="font-bold text-foreground">{student.emergency_contact || 'N/A'}</span></div>
                                                    <div className="flex justify-between items-center text-sm border-b border-border/10 pb-1 last:border-0"><span className="text-muted-foreground">Telefone</span><span className="font-bold text-foreground">{student.emergency_phone || 'N/A'}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="anamnesis" className="mt-0">
                                        {student.anamnesis && student.anamnesis.length > 0 ? (
                                            <Accordion type="single" collapsible className="w-full space-y-2">
                                                <AccordionItem value="health" className="border border-border rounded-lg px-4 bg-sidebar/10">
                                                    <AccordionTrigger className="hover:no-underline">Histórico de Saúde</AccordionTrigger>
                                                    <AccordionContent className="text-sm space-y-4 pt-4">
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Condições Médicas</span>
                                                            <span className="font-bold">{student.anamnesis[0].medical_conditions || 'Nenhuma'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Cirurgias</span>
                                                            <span className="font-bold">{student.anamnesis[0].surgeries || 'Nenhuma'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Medicamentos</span>
                                                            <span className="font-bold">{student.anamnesis[0].medications || 'Nenhum'}</span>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="habits" className="border border-border rounded-lg px-4 bg-sidebar/10">
                                                    <AccordionTrigger className="hover:no-underline font-semibold text-foreground">Hábitos e Estilo de Vida</AccordionTrigger>
                                                    <AccordionContent className="text-sm space-y-4 pt-4">
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Dieta</span>
                                                            <span className="font-bold">{student.anamnesis[0].diet_habits || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Sono</span>
                                                            <span className="font-bold">{student.anamnesis[0].sleep_pattern || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Estresse</span>
                                                            <span className="font-bold">{student.anamnesis[0].stress_level || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Rotina Diária</span>
                                                            <span className="font-bold">{student.anamnesis[0].daily_routine || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Horários</span>
                                                            <span className="font-bold whitespace-nowrap">Acorda: {student.anamnesis[0].wake_up_time || '-'} | Dorme: {student.anamnesis[0].sleep_time || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Nível de Treino</span>
                                                            <span className="font-bold">{trainingLevelLabels[student.anamnesis[0].training_level as keyof typeof trainingLevelLabels] || student.anamnesis[0].training_level || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Uso de Ergogênicos</span>
                                                            <Badge variant={student.anamnesis[0].uses_ergogenics ? "default" : "outline"} className={cn("text-[10px] uppercase font-bold px-3", !student.anamnesis[0].uses_ergogenics && "text-white/20 border-white/10")}>
                                                                {student.anamnesis[0].uses_ergogenics ? 'Sim' : 'Não'}
                                                            </Badge>
                                                        </div>
                                                        {student.anamnesis[0].uses_ergogenics && student.anamnesis[0].uses_ergogenics_details && (
                                                            <div className="flex flex-col gap-1 mt-2 p-3 bg-white/5 rounded-lg">
                                                                <span className="text-muted-foreground text-[10px] uppercase font-bold">Detalhes Ergogênicos</span>
                                                                <p className="font-bold text-primary">{student.anamnesis[0].uses_ergogenics_details}</p>
                                                            </div>
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="goals" className="border border-border rounded-lg px-4 bg-sidebar/10">
                                                    <AccordionTrigger className="hover:no-underline font-semibold text-foreground">Objetivos e Avaliação</AccordionTrigger>
                                                    <AccordionContent className="text-sm space-y-4 pt-4">
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Peso Atual</span>
                                                            <span className="font-bold text-primary">{student.anamnesis[0].weight_kg} kg</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Objetivo Principal</span>
                                                            <span className="font-bold text-foreground">{student.anamnesis[0].main_goal || 'N/A'}</span>
                                                        </div>
                                                        {student.anamnesis[0].secondary_goal && (
                                                            <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                                <span className="text-muted-foreground">Objetivo Secundário</span>
                                                                <span className="font-bold">{student.anamnesis[0].secondary_goal}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Altura</span>
                                                            <span className="font-bold">{student.anamnesis[0].height_cm} cm</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Freq. Semanal</span>
                                                            <span className="font-bold text-accent">{student.anamnesis[0].initial_training_frequency || 'N/A'}x</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-border/10 pb-2 last:border-0">
                                                            <span className="text-muted-foreground">Disponibilidade</span>
                                                            <span className="font-bold text-accent">{student.anamnesis[0].schedule_availability || 'N/A'}</span>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">Nenhuma anamnese cadastrada.</div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="evaluation" className="mt-0">
                                        {loadingAssessments ? (
                                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-semibold text-lg">Histórico de Avaliações</h4>
                                                    <Button
                                                        onClick={() => {
                                                            onClose();
                                                            navigate(`/analise-comparativa?studentId=${studentId}`);
                                                        }}
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                    >
                                                        Análise Completa <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {assessments && assessments.length > 0 ? (
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {assessments.slice(0, 3).map((assessment: any) => (
                                                            <div key={assessment.id} className="card-elevated p-4 flex justify-between items-center bg-sidebar/20 border-border/10">
                                                                <div>
                                                                    <p className="font-bold text-foreground text-sm uppercase tracking-tight mb-2">{new Date(assessment.assessment_date).toLocaleDateString()}</p>
                                                                    <div className="flex gap-4">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Peso</span>
                                                                            <span className="text-sm font-bold text-primary">{assessment.weight}kg</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Gordura</span>
                                                                            <span className="text-sm font-bold text-foreground">{assessment.body_fat}%</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Massa Magra</span>
                                                                            <span className="text-sm font-bold text-foreground">{assessment.muscle_mass}kg</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <Badge variant="outline" className="border-primary/20 text-primary text-[10px] uppercase font-bold">Concluída</Badge>
                                                                    <span className="text-[9px] text-white/20 uppercase font-medium">via app</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {assessments.length > 3 && (
                                                            <p className="text-center text-xs text-muted-foreground">Mais {assessments.length - 3} avaliações no histórico completo.</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 bg-sidebar/10 rounded-xl border border-dashed border-border">
                                                        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                        <p className="text-muted-foreground">Nenhuma avaliação registrada.</p>
                                                        <Button
                                                            onClick={() => {
                                                                onClose();
                                                                navigate(`/analise-comparativa?studentId=${studentId}&new=true`);
                                                            }}
                                                            variant="link"
                                                            className="text-primary mt-2"
                                                        >
                                                            Iniciar Primeira Avaliação
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="training" className="mt-0">
                                        {loadingPrograms ? (
                                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                        ) : (
                                            <div className="space-y-4 pb-4">
                                                {programs && programs.length > 0 ? programs.map((program: any) => (
                                                    <div key={program.id} className="rounded-xl border border-border/50 bg-card/50 dark:bg-zinc-900/50 p-6 shadow-sm">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                            <div>
                                                                <h4 className="text-xl font-black italic uppercase tracking-tighter text-foreground">{program.title || 'Programa de Treino'}</h4>
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary uppercase text-[10px] tracking-wider">
                                                                        {program.number_weeks} Semanas
                                                                    </Badge>
                                                                    <span className="text-xs text-zinc-300 flex items-center gap-1 font-medium">
                                                                        <Calendar className="w-3 h-3 text-amber-500" /> Início: {new Date(program.start_date).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Accordion type="single" collapsible className="w-full space-y-3">
                                                            {program.training_sessions?.map((session: any) => (
                                                                <AccordionItem key={session.id} value={session.id} className="border border-border/40 dark:border-border/10 rounded-xl bg-background dark:bg-zinc-900 overflow-hidden px-0">
                                                                    <AccordionTrigger className="hover:no-underline px-5 py-4 data-[state=open]:bg-muted/30">
                                                                        <div className="flex flex-col items-start gap-2 text-left w-full">
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-[9px] px-2 h-5">
                                                                                    Treino {session.division}
                                                                                </Badge>
                                                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                                                                                    {session.training_exercises?.length || 0} Exercícios
                                                                                </span>
                                                                            </div>
                                                                            <p className="font-bold text-foreground text-sm uppercase italic tracking-tight">{session.name}</p>
                                                                        </div>
                                                                    </AccordionTrigger>
                                                                    <AccordionContent className="pb-0">
                                                                        <div className="divide-y divide-border/40 dark:divide-white/10 border-t border-border/40 dark:border-white/10">
                                                                            {session.training_exercises?.map((exercise: any, exIdx: number) => (
                                                                                <div key={exercise.id} className="p-4 flex items-center justify-between group hover:bg-muted/20 transition-colors">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <span className="text-xl font-black text-amber-500 dark:text-amber-400 tabular-nums w-8 text-center leading-none">
                                                                                            {String(exIdx + 1).padStart(2, '0')}
                                                                                        </span>
                                                                                        <div>
                                                                                            <p className="text-xs font-bold text-foreground dark:text-zinc-100 uppercase tracking-tight">{exercise.name}</p>
                                                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                                                <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-bold text-zinc-100 bg-zinc-800 border-zinc-700">
                                                                                                    {exercise.sets} Séries
                                                                                                </Badge>
                                                                                                <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-bold text-zinc-100 bg-zinc-800 border-zinc-700">
                                                                                                    {exercise.reps_min}-{exercise.reps_max} Reps
                                                                                                </Badge>
                                                                                                {exercise.rest_time && (
                                                                                                    <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-medium">
                                                                                                        <Clock className="w-2.5 h-2.5 text-amber-500" /> {exercise.rest_time}s
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            ))}
                                                        </Accordion>
                                                    </div>
                                                )) : (
                                                    <div className="text-center py-12 text-muted-foreground">Nenhum treino prescrito.</div>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="nutrition" className="mt-0">
                                        {loadingMeals ? (
                                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                        ) : (
                                            <div className="space-y-4 pb-4">
                                                {mealPlans && mealPlans.length > 0 ? mealPlans.map((plan: any) => {
                                                    const groupedMeals: Record<string, any[]> = {};
                                                    plan.meals?.forEach((meal: any) => {
                                                        const key = `${meal.name}-${meal.meal_time}`;
                                                        if (!groupedMeals[key]) groupedMeals[key] = [];
                                                        groupedMeals[key].push(meal);
                                                    });

                                                    return (
                                                        <div key={plan.id} className="rounded-xl border border-border/50 bg-card/50 dark:bg-zinc-900/50 p-6 shadow-sm">
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/5 text-amber-500 uppercase text-[9px] tracking-widest font-black">
                                                                            Estratégia Ativa
                                                                        </Badge>
                                                                        <Badge variant="secondary" className="text-[9px] font-bold text-zinc-300 bg-zinc-800 border-zinc-700">{plan.goal}</Badge>
                                                                    </div>
                                                                    <h4 className="text-xl font-black italic uppercase tracking-tighter text-foreground">{plan.title}</h4>
                                                                </div>
                                                                <div className="flex gap-3 bg-muted/30 p-2 rounded-lg border border-border/30">
                                                                    <div className="text-center px-3 border-r border-border/30 last:border-0">
                                                                        <p className="text-sm font-black text-foreground tabular-nums leading-none">{plan.total_calories}</p>
                                                                        <p className="text-[9px] text-zinc-400 uppercase font-black tracking-wider mt-1">Kcal</p>
                                                                    </div>
                                                                    <div className="text-center px-3 border-r border-border/30 last:border-0">
                                                                        <p className="text-sm font-black text-foreground tabular-nums leading-none">{Math.round(plan.total_proteins)}g</p>
                                                                        <p className="text-[9px] text-zinc-400 uppercase font-black tracking-wider mt-1">Prot</p>
                                                                    </div>
                                                                    <div className="text-center px-3 last:border-0">
                                                                        <p className="text-sm font-black text-foreground tabular-nums leading-none">{Math.round(plan.total_carbs)}g</p>
                                                                        <p className="text-[9px] text-zinc-400 uppercase font-black tracking-wider mt-1">Carb</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <Accordion type="single" collapsible className="w-full space-y-3">
                                                                {Object.values(groupedMeals).map((options, mealIdx) => {
                                                                    const firstOption = options[0];
                                                                    return (
                                                                        <AccordionItem key={mealIdx} value={`meal-${mealIdx}`} className="border border-border/40 dark:border-border/10 rounded-xl bg-background dark:bg-zinc-900 overflow-hidden px-0">
                                                                            <AccordionTrigger className="hover:no-underline px-5 py-4 data-[state=open]:bg-muted/30">
                                                                                <div className="flex items-center justify-between w-full pr-4">
                                                                                    <div className="flex items-center gap-3 text-left">
                                                                                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0 shadow-inner">
                                                                                            <Clock className="w-4 h-4" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="font-bold text-white text-sm uppercase italic tracking-tight">{firstOption.name}</p>
                                                                                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{firstOption.meal_time}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        {options.length > 1 &&
                                                                                            <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-zinc-800 text-zinc-300 border-zinc-700">
                                                                                                {options.length} Opções
                                                                                            </Badge>
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            </AccordionTrigger>
                                                                            <AccordionContent className="pb-0">
                                                                                <div className="flex flex-col">
                                                                                    {options.map((opt, optIdx) => (
                                                                                        <div key={opt.id} className="border-t border-border/40 dark:border-border/10 first:border-0">
                                                                                            <div className="bg-muted/20 px-5 py-2 border-b border-border/40 dark:border-border/10">
                                                                                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400">
                                                                                                    Opção {optIdx + 1}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="p-4 space-y-2">
                                                                                                {opt.meal_foods?.map((food: any) => (
                                                                                                    <div key={food.id} className="flex justify-between items-center text-xs">
                                                                                                        <div className="flex items-center gap-3">
                                                                                                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                                                                                                            <span className="text-zinc-100 font-medium">{food.name}</span>
                                                                                                        </div>
                                                                                                        <span className="font-bold text-white tabular-nums bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] border border-zinc-700">
                                                                                                            {food.quantity}<span className="text-[8px] uppercase text-zinc-400 ml-0.5">{food.unit}</span>
                                                                                                        </span>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                    );
                                                                })}
                                                            </Accordion>
                                                        </div>
                                                    );
                                                }) : (
                                                    <div className="text-center py-12 text-muted-foreground">Nenhum plano alimentar prescrito.</div>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="feedbacks" className="mt-0">
                                        {loadingFeedbacks ? (
                                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                        ) : (
                                            <>
                                                <h4 className="font-semibold text-lg mb-4">Evolução Semanal</h4>
                                                <div className="space-y-4">
                                                    {feedbacks?.map((fb: any) => {
                                                        const isAlert = fb.fatigue_level > 8 || fb.sleep_quality < 4 || (fb.has_pain && fb.pain_intensity > 5);
                                                        return (
                                                            <div key={fb.id} className={cn("p-4 rounded-lg border bg-sidebar/20 relative transition-all hover:bg-sidebar/30", isAlert ? "border-red-500/50 bg-red-500/5" : "border-border")}>
                                                                {isAlert && <Badge variant="destructive" className="absolute top-2 right-2 animate-pulse">Alerta</Badge>}
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <span className="font-bold text-foreground flex items-center gap-2">Check-in <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{new Date(fb.created_at).toLocaleDateString()}</span></span>
                                                                    {fb.load_perception && <Badge variant="outline" className="text-[10px] uppercase font-bold border-border/10 text-muted-foreground">{fb.load_perception}</Badge>}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                                                    <div className="space-y-3">
                                                                        <div className="flex justify-between items-center border-b border-border/10 pb-1">
                                                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Cansaço</span>
                                                                            <span className={cn("font-bold text-sm", fb.fatigue_level > 7 ? "text-red-400" : "text-foreground")}>{fb.fatigue_level}/10</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center border-b border-border/10 pb-1">
                                                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Sono</span>
                                                                            <span className={cn("font-bold text-sm", fb.sleep_quality < 5 ? "text-red-400" : "text-foreground")}>{fb.sleep_quality}/10</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center border-b border-border/10 pb-1">
                                                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Treinos</span>
                                                                            <span className="font-bold text-sm text-primary">{fb.training_count}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        {fb.has_pain ? (
                                                                            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                                                                <p className="text-[10px] uppercase font-black text-red-400 tracking-widest mb-1">Registro de Dor</p>
                                                                                <p className="text-xs font-bold text-red-200">{fb.pain_location} <span className="font-black">({fb.pain_intensity}/10)</span></p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                                                                                <p className="text-[10px] uppercase font-black text-green-400 tracking-widest">Sem Dores</p>
                                                                            </div>
                                                                        )}
                                                                        {fb.comments && (
                                                                            <p className="text-muted-foreground italic text-xs mt-1 border-l-2 border-primary/20 pl-2 line-clamp-2">"{fb.comments}"</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!feedbacks || feedbacks.length === 0) && <p className="text-muted-foreground text-center py-8 opacity-50">Nenhum feedback registrado.</p>}
                                                </div>
                                            </>
                                        )}
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>

                        <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-2 shrink-0">
                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    if (!student || !assessments) return;
                                    setIsGeneratingPdf(true);
                                    try {
                                        await generateEvolutionReport({
                                            student,
                                            coach: { name: user?.email || 'Treinador' },
                                            assessments: assessments || [],
                                            feedbacks: feedbacks || []
                                        });
                                        toast.success("Relatório gerado com sucesso!");
                                    } catch (e) {
                                        toast.error("Erro ao gerar PDF.");
                                        console.error(e);
                                    } finally {
                                        setIsGeneratingPdf(false);
                                    }
                                }}
                                disabled={isGeneratingPdf}
                            >
                                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                                {isGeneratingPdf ? "Gerando..." : "Relatório PDF"}
                            </Button>

                            {student.status !== 'active' && (
                                <Button
                                    onClick={() => {
                                        onClose();
                                        onStatusChange?.(student.id, 'ativo');
                                    }}
                                    className="bg-green-600 text-white hover:bg-green-700"
                                >
                                    Aprovar e Vincular Plano
                                </Button>
                            )}
                            <Button variant="outline" onClick={onClose}>Fechar</Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center text-muted-foreground">Erro ao carregar dados do aluno.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
