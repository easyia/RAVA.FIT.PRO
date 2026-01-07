import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { UserCheck, UserX, Clock, Search, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface CoachProfile {
    id: string;
    name: string;
    email: string;
    status: string;
    created_at: string;
    phone?: string;
    specialty?: string;
    student_count?: string;
    main_challenge?: string;
    experience_years?: string;
}

const AdminApprovalsPage = () => {
    const [coaches, setCoaches] = useState<CoachProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchPendingCoaches = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('coaches')
                .select('*')
                .eq('status', 'pending_approval')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoaches(data || []);
        } catch (error: any) {
            toast.error("Erro ao buscar coaches: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingCoaches();
    }, []);

    const handleApproval = async (id: string, newStatus: 'approved' | 'rejected') => {
        try {
            if (newStatus === 'rejected') {
                const { error } = await supabase
                    .from('coaches')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                toast.success("Coach removido da lista de espera.");
            } else {
                const { error } = await supabase
                    .from('coaches')
                    .update({ status: newStatus })
                    .eq('id', id);

                if (error) throw error;
                toast.success("Coach aprovado com sucesso!");
            }

            setCoaches(prev => prev.filter(c => c.id !== id));
        } catch (error: any) {
            console.error("Erro na ação administrativa:", error);
            toast.error("Erro ao processar: " + (error.details || error.message));
        }
    };

    const filteredCoaches = coaches.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        Controle de <span className="text-amber-500">Aprovações</span>
                    </h1>
                    <p className="text-zinc-500 font-medium">Gerencie o acesso de novos treinadores à plataforma elite.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-zinc-900 border-white/5"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Clock className="w-10 h-10 text-amber-500 animate-spin" />
                    </div>
                ) : filteredCoaches.length > 0 ? (
                    filteredCoaches.map((coach) => (
                        <Card key={coach.id} className="bg-zinc-900/50 border-white/5 hover:border-amber-500/20 transition-all overflow-hidden group">
                            <CardContent className="p-0">
                                <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5">
                                    <div className="flex items-center gap-5 w-full">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
                                            <Mail className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-white">{coach.name}</h3>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {coach.email}</span>
                                                {coach.phone && (
                                                    <span className="flex items-center gap-1 text-amber-500/70 font-medium tracking-wide">
                                                        <Search className="w-3 h-3" /> WhatsApp: {coach.phone}
                                                    </span>
                                                )}
                                                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                                <span>Inscrito em: {new Date(coach.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                                        <Button
                                            onClick={() => handleApproval(coach.id, 'rejected')}
                                            variant="outline"
                                            className="flex-1 md:flex-none border-red-500/20 text-red-500 hover:bg-red-500/10"
                                        >
                                            <UserX className="w-4 h-4 mr-2" />
                                            Rejeitar
                                        </Button>
                                        <Button
                                            onClick={() => handleApproval(coach.id, 'approved')}
                                            className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-black font-bold"
                                        >
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            Aprovar
                                        </Button>
                                    </div>
                                </div>

                                {/* Lead Qualification Details */}
                                <div className="p-6 bg-zinc-950/30 grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-widest text-zinc-600 font-black">Especialidade</Label>
                                        <p className="text-white font-medium">{coach.specialty || 'Não informado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-widest text-zinc-600 font-black">Qtd de Alunos</Label>
                                        <p className="text-white font-medium">{coach.student_count || 'Não informado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-widest text-zinc-600 font-black">Experiência</Label>
                                        <p className="text-white font-medium">{coach.experience_years || 'Não informado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-widest text-zinc-600 font-black">Maior Desafio</Label>
                                        <p className="text-zinc-400 text-sm leading-relaxed italic">"{coach.main_challenge || 'Não informado'}"</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-white/10 rounded-3xl">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Nenhuma pendência</h3>
                        <p className="text-zinc-500">Todos os treinadores foram processados. Bom trabalho!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminApprovalsPage;
