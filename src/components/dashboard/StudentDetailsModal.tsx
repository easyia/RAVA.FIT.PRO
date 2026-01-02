import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getStudentDetails, getTrainingPrograms, getMealPlans } from "@/services/studentService";
import { Loader2, User, FileText, Dumbbell, Utensils, Calendar, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface StudentDetailsModalProps {
    studentId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function StudentDetailsModal({ studentId, isOpen, onClose }: StudentDetailsModalProps) {
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

    const isLoading = loadingStudent || loadingPrograms || loadingMeals;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-card border-border shadow-2xl">
                {isLoading ? (
                    <div className="h-[60vh] flex items-center justify-center">
                        <DialogTitle className="sr-only">Carregando detalhes do aluno</DialogTitle>
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : student ? (
                    <div className="flex flex-col h-full">
                        <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-xl">
                                    <img src={student.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces"} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-foreground mb-1">{student.full_name}</DialogTitle>
                                    <div className="flex flex-wrap gap-3">
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{student.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 uppercase text-[10px]">{student.classification || 'bronze'}</Badge>
                                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border uppercase text-[10px]">{student.service_type || 'online'}</Badge>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {student.email}</span>
                                        <span className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {student.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
                            <div className="px-6 border-b border-border">
                                <TabsList className="bg-transparent h-12 gap-6 p-0">
                                    <TabsTrigger value="info" className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><User className="w-4 h-4 mr-2" /> Perfil</TabsTrigger>
                                    <TabsTrigger value="anamnesis" className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><FileText className="w-4 h-4 mr-2" /> Anamnese</TabsTrigger>
                                    <TabsTrigger value="training" className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><Dumbbell className="w-4 h-4 mr-2" /> Treinos</TabsTrigger>
                                    <TabsTrigger value="nutrition" className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"><Utensils className="w-4 h-4 mr-2" /> Dieta</TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                <TabsContent value="info" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="card-elevated p-4 space-y-4 bg-sidebar/20">
                                            <h4 className="font-semibold text-primary/80 uppercase text-xs tracking-wider">Dados Pessoais</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nascimento:</span><span className="font-medium">{student.birth_date || 'N/A'}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gênero:</span><span className="font-medium">{student.sex || 'N/A'}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Profissão:</span><span className="font-medium">{student.profession || 'N/A'}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Estado Civil:</span><span className="font-medium">{student.marital_status || 'N/A'}</span></div>
                                            </div>
                                        </div>
                                        <div className="card-elevated p-4 space-y-4 bg-sidebar/20">
                                            <h4 className="font-semibold text-primary/80 uppercase text-xs tracking-wider">Emergência</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Contato:</span><span className="font-medium">{student.emergency_contact || 'N/A'}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Telefone:</span><span className="font-medium">{student.emergency_phone || 'N/A'}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="anamnesis" className="mt-0">
                                    {student.anamnesis && student.anamnesis.length > 0 ? (
                                        <Accordion type="single" collapsible className="w-full space-y-2">
                                            <AccordionItem value="health" className="border border-border rounded-lg px-4 bg-sidebar/10">
                                                <AccordionTrigger className="hover:no-underline">Histórico de Saúde</AccordionTrigger>
                                                <AccordionContent className="text-sm space-y-3">
                                                    <p><strong>Condições Médicas:</strong> {student.anamnesis[0].medical_conditions || 'Nenhuma'}</p>
                                                    <p><strong>Cirurgias:</strong> {student.anamnesis[0].surgeries || 'Nenhuma'}</p>
                                                    <p><strong>Medicamentos:</strong> {student.anamnesis[0].medications || 'Nenhum'}</p>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="habits" className="border border-border rounded-lg px-4 bg-sidebar/10">
                                                <AccordionTrigger className="hover:no-underline">Hábitos e Estilo de Vida</AccordionTrigger>
                                                <AccordionContent className="text-sm space-y-3">
                                                    <p><strong>Dieta:</strong> {student.anamnesis[0].diet_habits || 'N/A'}</p>
                                                    <p><strong>Sono:</strong> {student.anamnesis[0].sleep_pattern || 'N/A'}</p>
                                                    <p><strong>Estresse:</strong> {student.anamnesis[0].stress_level || 'N/A'}</p>
                                                    <p><strong>Nível de Treino:</strong> {student.anamnesis[0].training_level || 'N/A'}</p>
                                                    <p><strong>Uso de Ergogênicos:</strong> {student.anamnesis[0].uses_ergogenics ? 'Sim' : 'Não'}</p>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="goals" className="border border-border rounded-lg px-4 bg-sidebar/10">
                                                <AccordionTrigger className="hover:no-underline">Objetivos e Avaliação</AccordionTrigger>
                                                <AccordionContent className="text-sm space-y-3">
                                                    <p><strong>Objetivo Principal:</strong> {student.anamnesis[0].main_goal || 'N/A'}</p>
                                                    <p><strong>Peso Atual:</strong> {student.anamnesis[0].weight_kg} kg</p>
                                                    <p><strong>Altura:</strong> {student.anamnesis[0].height_cm} cm</p>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">Nenhuma anamnese cadastrada.</div>
                                    )}
                                </TabsContent>

                                <TabsContent value="training" className="mt-0">
                                    <div className="space-y-4">
                                        {programs && programs.length > 0 ? programs.map((program: any) => (
                                            <div key={program.id} className="card-elevated p-4 border-l-4 border-l-primary">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-foreground">{program.title || 'Programa de Treino'}</h4>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Início: {program.start_date}</p>
                                                    </div>
                                                    <Badge>{program.number_weeks} Semanas</Badge>
                                                </div>
                                                <div className="space-y-3">
                                                    {program.training_sessions?.map((session: any) => (
                                                        <div key={session.id} className="bg-sidebar/30 p-3 rounded text-sm">
                                                            <span className="font-bold text-primary mr-2 uppercase">{session.division}</span>
                                                            <span className="font-semibold">{session.name}</span>
                                                            <div className="mt-2 text-xs text-muted-foreground">
                                                                {session.training_exercises?.length || 0} exercícios prescritos
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12 text-muted-foreground">Nenhum treino prescrito.</div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="nutrition" className="mt-0">
                                    <div className="space-y-4">
                                        {mealPlans && mealPlans.length > 0 ? mealPlans.map((plan: any) => (
                                            <div key={plan.id} className="card-elevated p-4 border-l-4 border-l-accent">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-foreground">{plan.title}</h4>
                                                        <p className="text-xs text-muted-foreground lowercase">{plan.goal}</p>
                                                    </div>
                                                    <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent">Plano Ativo</Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    {plan.meals?.map((meal: any) => (
                                                        <div key={meal.id} className="flex justify-between items-center text-sm p-2 border-b border-border/50">
                                                            <span className="font-medium">{meal.name}</span>
                                                            <span className="text-xs text-muted-foreground">{meal.meal_time}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12 text-muted-foreground">Nenhum plano alimentar prescrito.</div>
                                        )}
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </div>
                ) : (
                    <div className="p-12 text-center text-muted-foreground">Erro ao carregar dados do aluno.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
