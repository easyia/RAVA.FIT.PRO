import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCoachDetailsPublic } from "@/services/studentService";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ShieldCheck, Zap, Trophy, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function InvitePage() {
    const { coach_id } = useParams();
    const navigate = useNavigate();

    const { data: coach, isLoading } = useQuery({
        queryKey: ['coach_public', coach_id],
        queryFn: () => getCoachDetailsPublic(coach_id!),
        enabled: !!coach_id
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!coach) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
                <h1 className="text-2xl font-bold mb-4">Convite Inválido</h1>
                <p className="text-muted-foreground text-center">Este link de convite expirou ou não é válido.</p>
                <Button className="mt-6" onClick={() => navigate("/")}>Ir para Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-status-success rounded-full blur-[120px]" />
            </div>

            <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 w-full max-w-screen-xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="relative inline-block mb-6">
                        <Avatar className="w-32 h-32 md:w-32 md:h-44 object-cover rounded-2xl border-4 border-primary/20 shadow-2xl">
                            <AvatarImage src={coach.avatar_url || ""} className="object-cover" />
                            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-4xl font-black">
                                {coach.name ? coach.name.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 uppercase leading-[0.8]">
                        FIT <span className="text-primary tracking-tighter italic">PRO</span>
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium uppercase tracking-[0.2em] mb-8">
                        Você foi convidado para a Consultoria <span className="text-white">Elite</span>
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="grid grid-cols-1 gap-4 w-full mb-12"
                >
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold">IA em Sincronia</h3>
                            <p className="text-xs text-muted-foreground">Treino e dieta ajustados ao seu esporte principal.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50">
                        <div className="w-12 h-12 rounded-xl bg-status-success/10 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-6 h-6 text-status-success" />
                        </div>
                        <div>
                            <h3 className="font-bold">Elite Protocol</h3>
                            <p className="text-xs text-muted-foreground">O método acadêmico aplicado ao seu resultado real.</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full"
                >
                    <Button
                        className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest shadow-[0_0_40px_rgba(155,135,245,0.4)] hover:shadow-[0_0_60px_rgba(155,135,245,0.6)] transition-all group"
                        onClick={() => navigate(`/onboarding-aluno?coach_id=${coach_id}`)}
                    >
                        Começar minha transformação
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-tighter">
                        Plataforma Exclusiva • Acesso via Convite
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
