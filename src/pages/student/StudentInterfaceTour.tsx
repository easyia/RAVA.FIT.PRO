import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Dumbbell, Utensils, Zap, ArrowRight, Sparkles } from "lucide-react";

export default function StudentInterfaceTour() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);

    const tourSteps = [
        {
            title: "Seu Hub Principal",
            description: "Aqui você verá seu treino do dia, sua dieta atualizada e seu progresso em tempo real.",
            icon: LayoutDashboard,
            color: "text-primary"
        },
        {
            title: "Treinos Inteligentes",
            description: "Acesse seus protocolos de musculação com vídeos de execução e contagem de séries.",
            icon: Dumbbell,
            color: "text-primary"
        },
        {
            title: "Nutrição",
            description: "Sua dieta sincronizada com o gasto calórico do seu esporte principal.",
            icon: Utensils,
            color: "text-status-success"
        },
        {
            title: "Sincronia RAVA",
            description: "Nossa tecnologia ajusta tudo automaticamente conforme seu feedback diário.",
            icon: Zap,
            color: "text-status-warning"
        }
    ];

    const next = () => {
        if (step < tourSteps.length - 1) {
            setStep(step + 1);
        } else {
            navigate("/aluno/anamnese");
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-sidebar to-background w-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="max-w-xs w-full"
                >
                    <div className="mx-auto w-24 h-24 rounded-full bg-card border-4 border-primary/20 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(155,135,245,0.2)]">
                        {step === 0 ? <LayoutDashboard className="w-10 h-10 text-primary" /> :
                            step === 1 ? <Dumbbell className="w-10 h-10 text-primary" /> :
                                step === 2 ? <Utensils className="w-10 h-10 text-status-success" /> :
                                    <Zap className="w-10 h-10 text-status-warning" />}
                    </div>

                    <h2 className="text-2xl font-bold mb-4">{tourSteps[step].title}</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        {tourSteps[step].description}
                    </p>
                </motion.div>
            </AnimatePresence>

            <div className="fixed bottom-12 left-0 right-0 px-6 max-w-md mx-auto">
                <Button
                    className="w-full h-14 rounded-2xl font-bold text-lg group bg-primary hover:bg-primary/90 shadow-xl"
                    onClick={next}
                >
                    {step === tourSteps.length - 1 ? "Ir para Anamnese" : "Próximo"}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>

            <div className="fixed top-12 left-0 right-0 flex justify-center gap-2">
                {tourSteps.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : "w-2 bg-muted"}`}
                    />
                ))}
            </div>
        </div>
    );
}
