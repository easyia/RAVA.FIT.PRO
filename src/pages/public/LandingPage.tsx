"use client";

import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
    Dumbbell,
    Brain,
    Smartphone,
    Shield,
    ArrowRight,
    CheckCircle2,
    Zap,
    Globe,
    Wallet,
    Cpu,
    Lock,
    TrendingUp,
} from "lucide-react";

const LandingPage = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();

    const dashboardY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
    const dashboardScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.05]);

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    };

    return (
        <div className="min-h-screen bg-black text-white antialiased selection:bg-amber-500/30 overflow-x-hidden font-sans">
            {/* Premium Navbar */}
            <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/60 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/10">
                            <Dumbbell className="text-black w-4 h-4" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter inline-flex items-baseline">
                            <span className="text-amber-500">FIT</span>
                            <span className="text-zinc-500 font-medium ml-1 text-xs tracking-[0.2em]">PRO</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate("/auth")}
                            className="hidden md:block text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                        >
                            Já sou membro
                        </button>
                        <Button
                            onClick={() => navigate("/auth")}
                            className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-6 h-10 text-sm transition-all active:scale-95"
                        >
                            Entrar
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero: The Empire Command */}
            <section className="relative pt-32 pb-16 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/5 blur-[100px] rounded-full -z-10" />

                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-6 mb-12"
                    >
                        <span className="inline-block text-amber-500 text-[10px] font-black tracking-[0.4em] uppercase mb-2">
                            O Novo Padrão do Fitness
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1] max-w-4xl mx-auto">
                            Não é apenas um App. <br />
                            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                                É o seu Império Digital.
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light tracking-tight">
                            A primeira plataforma que une <span className="text-white font-medium">Sua Inteligência Artificial</span>,
                            Gestão Financeira e <span className="text-white font-medium">App Exclusivo</span> para seus alunos.
                        </p>

                        <div className="pt-8 flex flex-col items-center gap-4">
                            <Button
                                size="lg"
                                onClick={() => navigate("/solicitar-acesso")}
                                className="h-14 px-10 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black rounded-full shadow-[0_20px_40px_-15px_rgba(245,158,11,0.4)] group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Solicitar Convite Exclusivo
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                            <div className="flex items-center gap-6 text-zinc-600 text-[10px] font-black uppercase tracking-[0.15em]">
                                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" /> Ativação Imediata</span>
                                <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-amber-500" /> Acesso Global</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Abstract Dashboard Visualization */}
                    <motion.div
                        style={{ y: dashboardY, scale: dashboardScale }}
                        className="w-full max-w-5xl mx-auto mt-8 relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-orange-600/30 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="relative bg-zinc-950 border border-white/5 rounded-[28px] overflow-hidden shadow-2xl">
                            <img
                                src="/dashboard.png"
                                alt="FIT PRO Dashboard"
                                className="w-full h-auto object-cover opacity-95 group-hover:opacity-100 transition-opacity duration-700"
                            />
                            {/* Glow Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* The Mobile Experience */}
            <section className="py-32 bg-zinc-950 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div {...fadeInUp} className="space-y-6">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.1]">
                            Seu aluno merece uma <br />
                            <span className="text-amber-500">experiência Premium.</span>
                        </h2>
                        <p className="text-lg text-zinc-400 font-light leading-relaxed max-w-lg">
                            Esqueça PDFs e mensagens perdidas. Seu aluno terá um App exclusivo, nativo e instalado,
                            com acesso a treinos, dietas e evolução direto no smartphone.
                        </p>
                        <div className="space-y-3 pt-4">
                            {[
                                { title: "Acesso Offline", desc: "Sempre disponível, mesmo sem internet." },
                                { title: "Notificações Inteligentes", desc: "Lembretes de treino e hidratação via IA." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">{item.title}</h4>
                                        <p className="text-zinc-500 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* App Phone Image */}
                    <div className="flex justify-center relative">
                        <div className="absolute w-[200px] h-[200px] bg-amber-500/10 blur-[60px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        <div className="relative z-10 scale-75 md:scale-90 transition-transform duration-700 hover:scale-[0.95]">
                            <img
                                src="/app.mobile.png"
                                alt="FIT PRO Mobile App"
                                className="w-full max-w-[220px] h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Time & Profit Section */}
            <section className="py-32 bg-black relative border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <motion.div {...fadeInUp} className="lg:col-span-1 space-y-6">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                Mais Tempo. <br />
                                <span className="text-amber-500">Mais Lucro.</span>
                            </h2>
                            <p className="text-base text-zinc-400 font-light leading-relaxed">
                                Escalar sua consultoria não deve significar trabalhar mais. O FIT PRO automatiza o braçal e te deixa livre para o estratégico.
                            </p>
                            <Button
                                onClick={() => navigate("/solicitar-acesso")}
                                variant="outline"
                                className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 rounded-full px-6 h-11 text-sm font-bold"
                            >
                                Escalar meu negócio
                            </Button>
                        </motion.div>

                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                            {[
                                {
                                    icon: <Cpu className="w-5 h-5 text-amber-500" />,
                                    title: "Escalabilidade",
                                    desc: "Atenda 300 alunos com a mesma qualidade de 10. A IA faz a prescrição pesada."
                                },
                                {
                                    icon: <Zap className="w-5 h-5 text-amber-500" />,
                                    title: "Ticket Alto",
                                    desc: "Cobre 3x mais entregando um app próprio. Saia da guerra de preços de consultoria genérica."
                                },
                                {
                                    icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
                                    title: "Retenção",
                                    desc: "Dashboards de evolução geram vício no resultado e renovações automáticas."
                                },
                                {
                                    icon: <Wallet className="w-5 h-5 text-amber-500" />,
                                    title: "Fluxo de Caixa",
                                    desc: "Gestão integrada que garante cobrança profissional e zero inadimplência."
                                }
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    {...fadeInUp}
                                    className="p-6 rounded-2xl bg-zinc-900/[0.3] border border-white/5 hover:border-amber-500/20 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                        {card.icon}
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2">{card.title}</h4>
                                    <p className="text-zinc-500 leading-relaxed text-sm">{card.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparative: The Old vs The New */}
            <section className="py-32 bg-black">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div {...fadeInUp} className="text-center mb-16 space-y-4">
                        <h3 className="text-amber-500 text-[10px] font-black tracking-[0.4em] uppercase">O Novo Padrão</h3>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                            A Decisão que muda o <br />
                            <span className="text-amber-500">seu faturamento.</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* The Old Way */}
                        <div className="bg-zinc-950 border border-white/5 rounded-3xl p-8 opacity-40 grayscale">
                            <h3 className="text-sm font-black text-zinc-500 mb-6 uppercase tracking-widest">O Comum</h3>
                            <ul className="space-y-4">
                                {[
                                    "Planilhas em Excel/PDF",
                                    "Prescrição Manual Lenta",
                                    "Cobrança via WhatsApp",
                                    "Experiência Amadora",
                                    "Sem Inteligência Artificial"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-500 text-sm">
                                        <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                                        <span className="font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* The Elite Way */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur-[2px] opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative bg-zinc-900 border border-amber-500/10 rounded-3xl p-8">
                                <h3 className="text-sm font-black text-amber-500 mb-6 uppercase tracking-widest tracking-[0.2em]">FIT PRO ELITE</h3>
                                <ul className="space-y-4">
                                    {[
                                        "Inteligência Artificial Proprietária",
                                        "App Nativo do Aluno (Branded)",
                                        "Faturamento 100% Automático",
                                        "Ecossistema Digital Unificado",
                                        "Visual Elite de Alto Valor"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-white text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                            <span className="font-bold">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Elite: The Black Card */}
            <section className="py-32 bg-zinc-950 relative overflow-hidden">
                <div className="max-w-2xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        {/* The Black Card */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[32px] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-[80px] -z-10" />

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-amber-500 text-[10px] font-black tracking-[0.4em] uppercase mb-4">Elite Membership</h3>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xl text-zinc-500 align-top mt-1">R$</span>
                                        <span className="text-6xl md:text-7xl font-black tracking-tighter">297</span>
                                        <span className="text-xl text-zinc-500">/mês</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-left max-w-md mx-auto py-6 border-y border-white/5">
                                    {[
                                        "Alunos Ilimitados",
                                        "IA Generativa Full",
                                        "App Nativo Aluno",
                                        "Gestão Financeira",
                                        "Análise Estética",
                                        "Suporte VIP"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wide">{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    size="lg"
                                    onClick={() => navigate("/solicitar-acesso")}
                                    className="w-full h-14 text-lg bg-white text-black hover:bg-zinc-200 font-black rounded-full transition-transform active:scale-[0.98]"
                                >
                                    Solicitar Convite Exclusivo
                                </Button>

                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                    Ativação prioritária após aprovação.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-white/5 px-6 bg-black">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
                            <Dumbbell className="text-black w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-base tracking-tighter text-white uppercase">
                            <span className="text-amber-500">FIT</span> PRO
                        </span>
                    </div>

                    <div className="flex gap-8 text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                        <a href="#" className="hover:text-amber-500 transition-colors">Digital Museum</a>
                        <a href="#" className="hover:text-amber-500 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-amber-500 transition-colors">Terms</a>
                    </div>

                    <p className="text-zinc-700 text-[10px] tracking-[0.3em] font-black">
                        © 2026 FIT PRO. THE GLOBAL ELITE.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
