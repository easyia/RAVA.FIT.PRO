import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Clock, LogOut, CheckCircle2 } from "lucide-react";

const PendingApproval = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-amber-500/30">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[32px] p-12 text-center shadow-2xl"
            >
                <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-amber-500/20">
                    <Clock className="w-10 h-10 text-amber-500" />
                </div>

                <h1 className="text-3xl font-black mb-4 tracking-tight">Convite Enviado!</h1>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Sua solicitação para entrar no <span className="text-white font-bold">FIT PRO</span> está em análise. Como somos uma plataforma exclusiva de alta performance, nossa curadoria entrará em contato em breve.
                </p>

                <div className="space-y-4 mb-10">
                    {[
                        "Verificação de perfil profissional",
                        "Análise de disponibilidade",
                        "Configuração do Império Digital"
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 text-left">
                            <CheckCircle2 className="w-5 h-5 text-amber-500/50" />
                            <span className="text-zinc-500 text-sm font-medium">{step}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-4">
                    <Button
                        onClick={() => window.location.reload()}
                        className="h-12 bg-white text-black hover:bg-zinc-200 font-bold rounded-full transition-all active:scale-95"
                    >
                        Verificar Status
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="h-12 text-zinc-500 hover:text-white hover:bg-white/5 font-medium rounded-full flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </Button>
                </div>

                <p className="mt-8 text-xs text-zinc-600 font-medium tracking-widest uppercase">
                    © 2026 FIT PRO. THE NEW STANDARD.
                </p>
            </motion.div>
        </div>
    );
};

export default PendingApproval;
