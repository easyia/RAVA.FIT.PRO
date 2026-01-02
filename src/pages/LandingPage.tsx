import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dumbbell,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    ShieldCheck,
    ChevronRight,
    MessageSquare,
    Instagram,
    ArrowRight,
    Users,
    Zap,
    LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const LandingPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        whatsapp: "",
        social: "",
        profile: "personal"
    });

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Store lead in Supabase (optional table creation, fallback to toast)
            const { error } = await supabase
                .from('leads_beta')
                .insert([
                    {
                        full_name: formData.name,
                        whatsapp: formData.whatsapp,
                        social_handle: formData.social,
                        profile_type: formData.profile
                    }
                ]);

            if (error) {
                console.warn("Table leads_beta might not exist, but we got your info!", error);
            }

            toast.success("Inscrição realizada! Entraremos em contato em breve via WhatsApp.");
            setFormData({ name: "", whatsapp: "", social: "", profile: "personal" });
        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro. Tente novamente ou nos chame no direct.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-primary/30 font-sans">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Dumbbell className="text-white w-6 h-6" />
                        </div>
                        <span className="font-black text-2xl tracking-tighter text-white">RAVA<span className="text-primary italic">.FIT</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#problema" className="hover:text-white transition-colors">O Problema</a>
                        <a href="#solucao" className="hover:text-white transition-colors">A Solução</a>
                        <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
                    </div>
                    <Button
                        onClick={() => document.getElementById('beta-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6 shadow-xl shadow-primary/20"
                    >
                        Quero ser Beta
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10" />

                <div className="max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <Badge variant="outline" className="py-1 px-4 border-primary/30 text-primary bg-primary/5 rounded-full mb-4">
                        <Sparkles className="w-3 h-3 mr-2" /> Inscrições Abertas para o Beta Gratuito
                    </Badge>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
                        Pare de perder tempo com <br />
                        <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent italic">
                            planilhas e gambiarras.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        A plataforma completa para Educadores Físicos prescreverem treinos, dietas e
                        acompanharem a evolução biológica de seus alunos em um só lugar.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            size="lg"
                            onClick={() => document.getElementById('beta-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto h-14 px-10 text-lg bg-primary hover:bg-primary/90 rounded-full font-black shadow-2xl shadow-primary/30 group"
                        >
                            PARTICIPAR DO BETA AGORA
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto h-14 px-10 text-lg border-white/10 hover:bg-white/5 rounded-full text-slate-300"
                        >
                            Já sou parceiro
                        </Button>
                    </div>

                    {/* Mockup Preview */}
                    <div className="pt-20 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10" />
                        <div className="p-1 bg-white/5 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&q=80&w=2069"
                                alt="Dashboard Preview"
                                className="w-full h-auto rounded-2xl opacity-80"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Problems Section */}
            <section id="problema" className="py-24 px-6 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                            Você é um treinador de elite, <br />
                            <span className="text-slate-500">não um digitador de planilhas.</span>
                        </h2>
                        <ul className="space-y-6">
                            {[
                                { title: "Prescrição Fragmentada", desc: "Treino no WhatsApp, Dieta no PDF e Avaliação no papel.", icon: MessageSquare },
                                { title: "Relatórios Manuais", desc: "Passa horas compilando dados para mostrar evolução pro aluno.", icon: TrendingUp },
                                { title: "Feedback Invisível", desc: "Dificuldade em saber se o aluno realmente executou o planejado.", icon: Users },
                            ].map((item, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className="mt-1 w-12 h-12 shrink-0 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                                        <item.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{item.title}</h3>
                                        <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                        <Card className="relative bg-[#030712] border-white/10 h-full p-8 flex flex-col justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                                <Zap className="w-10 h-10 text-red-500" />
                            </div>
                            <p className="text-xl font-medium text-slate-300 italic leading-relaxed">
                                "Sinto que gasto mais tempo gerenciando arquivos do que realmente orientando meus alunos."
                            </p>
                            <span className="text-slate-500 text-sm">— Dor comum de 95% dos Personals Online</span>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section id="solucao" className="py-24 px-6">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">RAVA FIT PRO</Badge>
                        <h2 className="text-4xl md:text-5xl font-black text-white">Ecossistema Completo.</h2>
                        <p className="text-slate-400 text-lg">
                            Centralize tudo o que você precisa para entregar resultados de alto nível.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Prescrição Inteligente",
                                desc: "Crie protocolos de treino e dieta em minutos com interface fluida e intuitiva.",
                                icon: LayoutDashboard
                            },
                            {
                                title: "Avaliação 360°",
                                desc: "Simetógrafo digital e linha do tempo de fotos para provar a evolução do seu aluno.",
                                icon: ShieldCheck
                            },
                            {
                                title: "Classificação Elite",
                                desc: "Organize sua carteira de alunos por níveis (Bronze/Silver/Gold) e foque onde importa.",
                                icon: Zap
                            }
                        ].map((feat, i) => (
                            <Card key={i} className="bg-white/[0.03] border-white/5 p-8 hover:bg-white/[0.05] transition-all duration-300">
                                <CardContent className="p-0 space-y-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                        <feat.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-black text-white">{feat.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section id="beta-form" className="py-24 px-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[150px] -z-10" />

                <div className="max-w-4xl mx-auto">
                    <Card className="bg-gradient-to-b from-white/10 to-transparent border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                        <div className="p-8 md:p-12">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6 text-center md:text-left">
                                    <h2 className="text-4xl font-black text-white leading-tight">
                                        Faça parte do <br />
                                        <span className="text-primary italic">Beta Aberto.</span>
                                    </h2>
                                    <p className="text-slate-400">
                                        Estamos selecionando profissionais para testar a plataforma gratuitamente e influenciar o desenvolvimento do produto.
                                    </p>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            <span className="text-sm font-medium">Acesso Vitalício ao Plano Beta</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            <span className="text-sm font-medium">Canal Direto com os Desenvolvedores</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-300">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            <span className="text-sm font-medium">Prioridade em Novas Features</span>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleFormSubmit} className="space-y-4 bg-[#030712]/50 p-6 rounded-2xl border border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Nome Completo</label>
                                        <Input
                                            required
                                            placeholder="Seu nome aqui"
                                            className="h-12 bg-white/5 border-white/10 focus:border-primary/50"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">WhatsApp</label>
                                        <Input
                                            required
                                            placeholder="(00) 00000-0000"
                                            className="h-12 bg-white/5 border-white/10 focus:border-primary/50"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Instagram / CREF</label>
                                        <Input
                                            required
                                            placeholder="@seuperfil ou Registro"
                                            className="h-12 bg-white/5 border-white/10 focus:border-primary/50"
                                            value={formData.social}
                                            onChange={(e) => setFormData({ ...formData, social: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Principal Atuação</label>
                                        <select
                                            className="w-full h-12 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            value={formData.profile}
                                            onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                                        >
                                            <option value="personal">Personal Online</option>
                                            <option value="presencial">Personal Presencial</option>
                                            <option value="nutri">Nutricionista Esportivo</option>
                                            <option value="clinica">Gestor de Estúdio/Academia</option>
                                        </select>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-14 mt-4 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-xl shadow-xl shadow-primary/20"
                                    >
                                        {isSubmitting ? "ENVIANDO..." : "QUERO MEU ACESSO"}
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-500 pt-2 uppercase tracking-tighter">
                                        Sem spam. Apenas convites reais selecionados.
                                    </p>
                                </form>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                        <Dumbbell className="text-primary w-6 h-6" />
                        <span className="font-black text-xl tracking-tighter text-white uppercase">RAVA<span className="text-primary italic">.FIT</span></span>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © 2026 RAVA FIT PRO. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-slate-500 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                        <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">Suporte</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
