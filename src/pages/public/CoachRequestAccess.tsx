import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dumbbell,
    ChevronRight,
    ChevronLeft,
    Mail,
    Lock,
    User as UserIcon,
    Phone,
    Briefcase,
    TrendingUp,
    MessageSquare,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { toast } from "sonner";

const steps = [
    {
        id: "intro",
        title: "Primeiro, quem é você?",
        description: "Conte-nos o básico para começarmos sua jornada elite.",
    },
    {
        id: "business",
        title: "Sobre o seu negócio",
        description: "Queremos entender como podemos te ajudar a escalar.",
    },
    {
        id: "account",
        title: "Sua conta oficial",
        description: "Defina seus dados de acesso à plataforma.",
    }
];

export default function CoachRequestAccess() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        specialty: "",
        experience: "",
        studentCount: "",
        mainChallenge: "",
        email: "",
        password: "",
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            // Basic validation
            if (currentStep === 0 && (!formData.name || !formData.phone)) {
                toast.error("Por favor, preencha seu nome e telefone.");
                return;
            }
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
        else navigate("/");
    };

    const handleSubmit = async () => {
        if (!formData.email || !formData.password) {
            toast.error("Preencha email e senha para criar sua conta.");
            return;
        }

        setLoading(true);
        try {
            // 1. SignUp in Supabase Auth with all lead metadata
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        role: 'coach',
                        phone: formData.phone,
                        specialty: formData.specialty,
                        experience_years: formData.experience,
                        student_count: formData.studentCount,
                        main_challenge: formData.mainChallenge,
                    }
                }
            });

            if (authError) throw authError;

            toast.success("Solicitação enviada com sucesso!", {
                description: "Seu perfil está em análise pela nossa equipe."
            });

            navigate("/aguardando-aprovacao");

        } catch (error: any) {
            toast.error(error.message || "Erro ao processar sua solicitação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-amber-500/30">
            {/* Header / Logo */}
            <header className="p-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Dumbbell className="text-black w-4 h-4" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter uppercase">
                            <span className="text-amber-500">FIT</span> PRO
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 pb-20">
                <div className="w-full max-w-xl">
                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-12">
                        {steps.map((step, idx) => (
                            <div
                                key={step.id}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${idx <= currentStep ? "bg-amber-500" : "bg-white/10"
                                    }`}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h1 className="text-4xl font-black tracking-tight leading-tight">
                                    {steps[currentStep].title}
                                </h1>
                                <p className="text-zinc-500 text-lg">
                                    {steps[currentStep].description}
                                </p>
                            </div>

                            <div className="space-y-6">
                                {currentStep === 0 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-zinc-400">Nome Completo</Label>
                                            <div className="relative group">
                                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={e => updateField("name", e.target.value)}
                                                    className="h-14 pl-12 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 rounded-2xl text-lg"
                                                    placeholder="Como quer ser chamado?"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-zinc-400">WhatsApp / Telefone</Label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                                <Input
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={e => updateField("phone", e.target.value)}
                                                    className="h-14 pl-12 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 rounded-2xl text-lg"
                                                    placeholder="(00) 00000-0000"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="specialty" className="text-zinc-400">Sua Principal Especialidade</Label>
                                            <div className="relative group">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                                <Input
                                                    id="specialty"
                                                    value={formData.specialty}
                                                    onChange={e => updateField("specialty", e.target.value)}
                                                    className="h-14 pl-12 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 rounded-2xl text-lg"
                                                    placeholder="Ex: Musculação, Yoga, Pilates..."
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {currentStep === 1 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">Quantos alunos você atende hoje?</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {['0-10', '11-30', '31-100', '100+'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => updateField("studentCount", opt)}
                                                        className={`h-16 rounded-2xl border text-lg font-bold transition-all ${formData.studentCount === opt
                                                            ? "bg-amber-500 text-black border-amber-500 scale-[1.02]"
                                                            : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/10"
                                                            }`}
                                                    >
                                                        {opt === '100+' ? 'Mais de 100' : opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="challenge" className="text-zinc-400">Qual seu maior desafio hoje?</Label>
                                            <div className="relative group">
                                                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                                <Input
                                                    id="challenge"
                                                    value={formData.mainChallenge}
                                                    onChange={e => updateField("mainChallenge", e.target.value)}
                                                    className="h-14 pl-12 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 rounded-2xl text-lg"
                                                    placeholder="Escalar, retenção, tempo..."
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exp" className="text-zinc-400">Anos de experiência</Label>
                                            <div className="relative group">
                                                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                                <Input
                                                    id="exp"
                                                    value={formData.experience}
                                                    onChange={e => updateField("experience", e.target.value)}
                                                    className="h-14 pl-12 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 rounded-2xl text-lg"
                                                    placeholder="Quanto tempo de carreira?"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {currentStep === 2 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-zinc-400">E-mail Profissional</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={e => updateField("email", e.target.value)}
                                                    className="h-14 pl-12 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 rounded-2xl text-lg"
                                                    placeholder="seu.email@dominio.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pass" className="text-zinc-400">Defina uma Senha</Label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                                                <Input
                                                    id="pass"
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={e => updateField("password", e.target.value)}
                                                    className="h-14 pl-12 bg-zinc-900/50 border-white/5 focus:border-amber-500/50 rounded-2xl text-lg"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4">
                                            <Shield className="w-6 h-6 text-amber-500 shrink-0" />
                                            <p className="text-xs text-amber-500/80 leading-relaxed italic">
                                                Ao prosseguir, você concorda que seus dados serão analisados para garantir a exclusividade da plataforma.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="flex-1 h-14 rounded-2xl border border-white/5 hover:bg-white/5 text-zinc-400"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" />
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="flex-[2] h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold text-lg dark"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {currentStep === steps.length - 1 ? "Finalizar Pedido" : "Próximo Passo"}
                                            <ChevronRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <footer className="p-8 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex justify-between items-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                    <span>Acesso Restrito</span>
                    <span>© 2026 FIT PRO ELITE</span>
                </div>
            </footer>
        </div>
    );
}

function Shield({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
    );
}
