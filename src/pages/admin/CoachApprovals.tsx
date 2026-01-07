import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    XCircle,
    Clock,
    User,
    ShieldCheck,
    Search,
} from "lucide-react";
import { toast } from "sonner";

const CoachApprovals = () => {
    const [coaches, setCoaches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingCoaches();
    }, []);

    const fetchPendingCoaches = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("coaches")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Erro ao buscar treinadores pendentes.");
        } else {
            setCoaches(data || []);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (coachId: string, newStatus: string) => {
        const { error } = await supabase
            .from("coaches")
            .update({ status: newStatus })
            .eq("id", coachId);

        if (error) {
            toast.error("Erro ao atualizar status.");
        } else {
            toast.success(
                newStatus === "approved"
                    ? "Treinador aprovado com sucesso!"
                    : "Solicitação recusada."
            );
            setCoaches(coaches.filter((c) => c.id !== coachId));
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                        Curadoria <span className="text-amber-500">FIT PRO</span>
                    </h1>
                    <p className="text-zinc-500 font-medium">
                        Gerencie e aprove novos treinadores para o ecossistema.
                    </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-amber-500" />
                </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-zinc-900/50 flex items-center gap-4">
                    <Search className="w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar solicitações..."
                        className="bg-transparent border-none outline-none text-zinc-300 placeholder:text-zinc-600 w-full font-medium"
                    />
                </div>

                <div className="divide-y divide-white/5">
                    {loading ? (
                        <div className="p-20 text-center text-zinc-500 animate-pulse font-bold tracking-widest uppercase text-sm">
                            Sincronizando Banco de Dados...
                        </div>
                    ) : coaches.length === 0 ? (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                <Clock className="w-6 h-6 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 font-medium">Nenhuma solicitação pendente no momento.</p>
                        </div>
                    ) : (
                        coaches.map((coach) => (
                            <motion.div
                                key={coach.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/5">
                                        {coach.avatar_url ? (
                                            <img src={coach.avatar_url} className="w-full h-full rounded-2xl object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-zinc-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{coach.name || "Sem Nome"}</h3>
                                        <p className="text-zinc-500 text-sm font-medium">{coach.email}</p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                Solicitação Pendente
                                            </span>
                                            <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                                                {new Date(coach.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => handleUpdateStatus(coach.id, "rejected")}
                                        variant="ghost"
                                        className="h-12 px-6 rounded-full text-zinc-500 hover:text-red-500 hover:bg-red-500/5 font-bold"
                                    >
                                        <XCircle className="w-5 h-5 mr-2" />
                                        Recusar
                                    </Button>
                                    <Button
                                        onClick={() => handleUpdateStatus(coach.id, "approved")}
                                        className="h-12 px-8 rounded-full bg-amber-500 text-black hover:bg-amber-600 font-black shadow-lg shadow-amber-500/20"
                                    >
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                        Aprovar Acesso
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoachApprovals;
