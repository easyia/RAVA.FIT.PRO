import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PendingApprovalPage = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-amber-500/30">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-md w-full text-center space-y-8"
            >
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                    <Clock className="w-10 h-10 text-amber-500" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight leading-tight">
                        Solicitação em <br />
                        <span className="text-amber-500">Análise.</span>
                    </h1>
                    <p className="text-zinc-400 leading-relaxed">
                        Seu convite exclusivo está sendo processado. Nossa equipe de elite revisa cada perfil para garantir o padrão FIT PRO.
                    </p>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 text-sm text-left space-y-4">
                    <div className="flex gap-4">
                        <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                            <p className="font-bold text-white">Próximos Passos</p>
                            <p className="text-zinc-500">Você receberá uma confirmação por e-mail assim que sua conta for aprovada.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Button
                        variant="link"
                        onClick={handleLogout}
                        className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Sair e voltar para Home
                    </Button>
                </div>

                <p className="text-zinc-600 text-xs tracking-widest font-bold pt-8 uppercase">
                    FIT PRO • THE NEW STANDARD
                </p>
            </motion.div>
        </div>
    );
};

export default PendingApprovalPage;
