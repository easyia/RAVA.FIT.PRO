import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Target, Activity, ShieldCheck, Zap } from "lucide-react";

const steps = [
    {
        id: "welcome",
        title: "Bem-vindo ao RAVA FIT PRO",
        description: "Você acaba de ser convidado para um ecossistema de alta performance, onde ciência e tecnologia trabalham para o seu corpo.",
        icon: ShieldCheck,
        color: "text-primary"
    },
    {
        id: "science",
        title: "Sincronia Total (IA)",
        description: "Nossa inteligência entende que seu treino e sua dieta devem estar em harmonia com o esporte que você pratica.",
        icon: Zap,
        color: "text-status-warning"
    },
    {
        id: "method",
        title: "O Método PhD",
        description: "Análise antropométrica detalhada e protocolos baseados em biomecânica acadêmica, agora na palma da sua mão.",
        icon: Target,
        color: "text-status-success"
    },
    {
        id: "ready",
        title: "Pronto para começar?",
        description: "Vamos realizar um cadastro rápido e, em seguida, sua ficha de anamnese PhD para o seu coach preparar seu primeiro protocolo.",
        icon: Activity,
        color: "text-primary"
    }
];

export default function StudentOnboarding() {
    const [searchParams] = useSearchParams();
    const coachId = searchParams.get("coach_id");
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    const next = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            navigate(`/aluno/cadastro?coach_id=${coachId}`);
        }
    };

    const back = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="max-w-md w-full"
                >
                    <div className="mx-auto w-20 h-20 rounded-3xl bg-card border border-border/50 flex items-center justify-center mb-10 shadow-xl">
                        <Icon className={`w-10 h-10 ${step.color}`} />
                    </div>

                    <h1 className="text-3xl font-black italic uppercase tracking-tight mb-4">
                        {step.title}
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-12">
                        {step.description}
                    </p>
                </motion.div>
            </AnimatePresence>

            <div className="flex flex-col gap-4 w-full max-w-sm mt-auto pb-10">
                <Button
                    className="h-14 rounded-2xl text-lg font-bold group"
                    onClick={next}
                >
                    {currentStep === steps.length - 1 ? "Entrar na Plataforma" : "Continuar"}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                {currentStep > 0 && (
                    <Button variant="ghost" className="h-10 text-muted-foreground" onClick={back}>
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Voltar
                    </Button>
                )}

                <div className="flex justify-center gap-2 mt-4">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? "w-8 bg-primary" : "w-2 bg-border"}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
