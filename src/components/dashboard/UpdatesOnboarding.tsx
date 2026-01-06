import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Award,
    BarChart3,
    Camera,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const steps = [
    {
        title: "Classificação de Alunos",
        description: "Você pediu e nós entregamos! Agora você pode organizar seus alunos em categorias Bronze, Prata ou Ouro.",
        icon: <Award className="w-12 h-12 text-status-warning" />,
        location: "Cadastro do Aluno → Seção de Classificação",
        benefit: "Justifique seus diferentes níveis de serviço com clareza visual."
    },
    {
        title: "Relatórios Visuais",
        description: "Visualize a distribuição de macros e volume de treino diretamente na aba de Protocolos de cada aluno.",
        icon: <BarChart3 className="w-12 h-12 text-status-success" />,
        location: "Protocolos → Selecionar Aluno → Aba Treinos/Dietas",
        benefit: "Dados reais extraídos diretamente das suas prescrições."
    },
    {
        title: "Simetógrafo Evolutivo",
        description: "Análise postural profissional com linha do tempo e identificação automática de fotos.",
        icon: <Camera className="w-12 h-12 text-primary" />,
        location: "Análise Comparativa → Fotos & Vídeos",
        benefit: "Compare qualquer data do histórico e identifique desvios com facilidade."
    }
];

export function UpdatesOnboarding() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Não exibir para alunos - modal é exclusivo para Coaches
        const role = user?.user_metadata?.role;
        if (role === 'student') {
            return;
        }

        if (user && !user.user_metadata?.has_seen_update_onboarding_v1) {
            setOpen(true);
        }
    }, [user]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { has_seen_update_onboarding_v1: true }
            });
            if (error) throw error;
            setOpen(false);
        } catch (error) {
            console.error("Error updating onboarding metadata:", error);
            // Even if it fails, close the modal to not block the user
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const step = steps[currentStep];

    return (
        <Dialog open={open} onOpenChange={(v) => !loading && !v && handleComplete()}>
            <DialogContent className="sm:max-w-[500px] border-none bg-card/60 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/20 blur-[100px] rounded-full" />

                <div className="relative p-8 pt-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Novidades da Plataforma</span>
                    </div>

                    <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6 p-4 rounded-3xl bg-sidebar/50 border border-border/50 shadow-inner">
                            {step.icon}
                        </div>

                        <h2 className="text-2xl font-bold mb-3">{step.title}</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                            {step.description}
                        </p>

                        <div className="w-full space-y-3 text-left">
                            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex gap-3">
                                <div className="shrink-0 pt-0.5 text-primary"><CheckCircle2 className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-tertiary">Onde encontrar</p>
                                    <p className="text-xs text-foreground font-medium">{step.location}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex gap-3">
                                <div className="shrink-0 pt-0.5 text-primary"><Zap className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-primary">Benefício</p>
                                    <p className="text-xs text-foreground font-medium">{step.benefit}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t border-border/50 flex flex-row items-center justify-between sm:justify-between gap-4">
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    i === currentStep ? "w-6 bg-primary" : "w-1.5 bg-border"
                                )}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleBack} disabled={loading}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                            </Button>
                        )}
                        <Button onClick={handleNext} size="sm" className="bg-primary hover:bg-primary/90 min-w-[100px]" disabled={loading}>
                            {currentStep === steps.length - 1 ? "Começar" : "Próximo"}
                            <ChevronRight className="ml-1 w-4 h-4" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
