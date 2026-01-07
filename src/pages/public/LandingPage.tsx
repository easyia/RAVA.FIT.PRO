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
            <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/50 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Dumbbell className="text-black w-5 h-5" />
                        </div>
                        <span className="font-bold text-2xl tracking-tighter inline-flex items-baseline">
                            <span className="text-amber-500">FIT</span>
                            <span className="text-zinc-500 font-medium ml-1 text-sm tracking-widest">PRO</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => navigate("/auth")}
                            className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            Já sou membro
                        </button>
                        <Button
                            onClick={() => navigate("/auth")}
                            className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-8 h-12 transition-all active:scale-95"
                        >
                            Entrar
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero: The Empire Command */}
            <section className="relative pt-48 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full -z-10" />

                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="space-y-6 mb-16"
                    >
                        <span className="inline-block text-amber-500 text-sm font-bold tracking-[0.2em] uppercase mb-4">
                            O Futuro do Fitness
                        </span>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] max-w-5xl mx-auto">
                            Não é apenas um App. <br />
                            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                                É o seu Império Digital.
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-light tracking-tight">
                            A primeira plataforma que une <span className="text-white font-medium">Sua Inteligência Artificial</span>,
                            Gestão Financeira e <span className="text-white font-medium">App Exclusivo</span> para seus alunos.
                        </p>

                        <div className="pt-10 flex flex-col items-center gap-4">
                            <Button
                                size="lg"
                                onClick={() => navigate("/auth")}
                                className="h-16 px-12 text-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black rounded-full shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Solicitar Convite Exclusivo
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                            <div className="flex items-center gap-6 text-zinc-500 text-sm font-medium tracking-wide">
                                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Ativação Imediata</span>
                                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-amber-500" /> Acesso Global</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Abstract Dashboard Visualization */}
                    <motion.div
                        style={{ y: dashboardY, scale: dashboardScale }}
                        className="w-full max-w-6xl mx-auto mt-12 relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/50 to-orange-600/50 rounded-[32px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
                        <div className="relative bg-zinc-950 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                            <img
                                src="/dashboard.png"
                                alt="FIT PRO Dashboard"
                                className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
                            />
                            {/* Glow Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 pointer-events-none" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* The Mobile Experience */}
            <section className="py-40 bg-zinc-900 relative">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
                    <motion.div {...fadeInUp} className="space-y-8">
                        <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-[0.95]">
                            Seu aluno merece uma <br />
                            <span className="text-amber-500">experiência Premium.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 font-light leading-relaxed">
                            Esqueça PDFs e mensagens perdidas. Seu aluno terá um App exclusivo, nativo e instalado,
                            com acesso a treinos, dietas e evolução direto no smartphone.
                        </p>
                        <div className="space-y-4">
                            {[
                                { title: "Acesso Offline", desc: "Sempre disponível, mesmo sem internet." },
                                { title: "Notificações Inteligentes", desc: "Lembretes de treino e hidratação via IA." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-1">
                                        <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{item.title}</h4>
                                        <p className="text-zinc-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* App Phone Image */}
                    <div className="flex justify-center relative scale-90 md:scale-110">
                        <div className="absolute w-[300px] h-[300px] bg-amber-500/20 blur-[100px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        <div className="relative z-10">
                            <img
                                src="/app.mobile.png"
                                alt="FIT PRO Mobile App"
                                className="w-full max-w-[320px] h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Time & Profit Section */}
            <section className="py-40 bg-black relative border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <motion.div {...fadeInUp} className="lg:col-span-1 space-y-6">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                                Mais Tempo. <br />
                                <span className="text-amber-500">Mais Lucro.</span>
                            </h2>
                            <p className="text-lg text-zinc-400 font-light leading-relaxed">
                                Escalar sua consultoria não deve significar trabalhar mais. O FIT PRO foi desenhado para automatizar o braçal e te deixar livre para o estratégico.
                            </p>
                            <Button
                                onClick={() => navigate("/auth")}
                                variant="outline"
                                className="border-amber-500/20 text-amber-500 hover:bg-amber-500/5 rounded-full px-8 h-12"
                            >
                                Escalar meu negócio
                            </Button>
                        </motion.div>

                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: <Cpu className="w-6 h-6 text-amber-500" />,
                                    title: "Atendimento Escalonável",
                                    desc: "Atenda 300 alunos com a mesma qualidade que atende 10. A IA faz o trabalho pesado de prescrição e ajustes."
                                },
                                {
                                    icon: <Zap className="w-6 h-6 text-amber-500" />,
                                    title: "Valor Percebido de Elite",
                                    desc: "Cobre 3x mais entregando um aplicativo próprio em vez de documentos genéricos. Saia da guerra de preços."
                                },
                                {
                                    icon: <TrendingUp className="w-6 h-6 text-amber-500" />,
                                    title: "Retenção Máxima",
                                    desc: "Alunos com app e dashboards de evolução renovam mais. O visual premium gera vício no resultado."
                                },
                                {
                                    icon: <Wallet className="w-6 h-6 text-amber-500" />,
                                    title: "Faturamento Previsível",
                                    desc: "Gestão financeira integrada que garante que nenhum aluno fique inadimplente. Cobrança automática e profissional."
                                }
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    {...fadeInUp}
                                    className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/20 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        {card.icon}
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-3">{card.title}</h4>
                                    <p className="text-zinc-500 leading-relaxed text-sm">{card.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparative: The Old vs The New */}
            <section className="py-40 bg-black">
                <div className="max-w-5xl mx-auto px-6">
                    <motion.div {...fadeInUp} className="text-center mb-20 space-y-4">
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
                            A Decisão que muda o <br />
                            <span className="text-amber-500">seu faturamento.</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* The Old Way */}
                        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-10 opacity-60 hover:opacity-100 transition-opacity">
                            <h3 className="text-2xl font-black text-zinc-500 mb-8 uppercase tracking-widest">Outros Apps</h3>
                            <ul className="space-y-6">
                                {[
                                    "Planilhas em Excel/PDF",
                                    "Prescrição Manual Lenta",
                                    "Cobrança via WhatsApp",
                                    "Experiência Genérica",
                                    "Sem Inteligência Artificial"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-500 line-through decoration-zinc-800">
                                        <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                                        <span className="font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* The RAVA Way */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
                            <div className="relative bg-zinc-900 border border-amber-500/20 rounded-3xl p-10">
                                <h3 className="text-2xl font-black text-amber-500 mb-8 uppercase tracking-widest">FIT PRO</h3>
                                <ul className="space-y-6">
                                    {[
                                        "Sua Inteligência Artificial",
                                        "App Nativo do Aluno",
                                        "Faturamento Total Automático",
                                        "Segurança Máxima (Automação)",
                                        "Visual Elite & Exclusivo"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-white">
                                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
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
            <section className="py-40 bg-zinc-950 relative overflow-hidden">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        {/* The Black Card */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[40px] p-12 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -z-10 group-hover:bg-amber-500/20 transition-all duration-1000" />

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-amber-500 font-bold tracking-[0.3em] uppercase mb-4">Elite Membership</h3>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-2xl text-zinc-400 align-top mt-2">R$</span>
                                        <span className="text-8xl font-black tracking-tighter">297</span>
                                        <span className="text-2xl text-zinc-500">/mês</span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8 text-left max-w-xl mx-auto py-8 border-y border-white/5">
                                    {[
                                        "Alunos Ilimitados",
                                        "IA Generativa Full",
                                        "App Nativo (Instalável)",
                                        "Painel Financeiro",
                                        "Análise Comparativa",
                                        "Protocolos Exclusivos"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                                            <span className="text-zinc-300 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    size="lg"
                                    onClick={() => navigate("/auth")}
                                    className="w-full h-16 text-xl bg-white text-black hover:bg-zinc-200 font-black rounded-full transition-transform active:scale-[0.98]"
                                >
                                    Solicitar Convite Exclusivo
                                </Button>

                                <p className="text-zinc-500 text-sm font-medium">
                                    Ativação instantânea logo após aprovação do convite.
                                </p>
                            </div>
                        </div>

                        <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-2 font-black text-xl"><Brain className="w-6 h-6" /> AI-POWERED</div>
                            <div className="flex items-center gap-2 font-black text-xl"><Lock className="w-6 h-6" /> ENCRYPTED</div>
                            <div className="flex items-center gap-2 font-black text-xl"><Wallet className="w-6 h-6" /> SMART-PAY</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Dumbbell className="text-black w-4 h-4" />
                        </div>
                        <span className="font-bold text-lg tracking-tighter text-white uppercase">
                            <span className="text-amber-500">FIT</span> PRO
                        </span>
                    </div>

                    <div className="flex gap-12 text-sm text-zinc-500 font-medium">
                        <a href="#" className="hover:text-white transition-colors">Concierge</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors">Termos</a>
                    </div>

                    <p className="text-zinc-600 text-xs tracking-widest font-bold">
                        © 2026 FIT PRO. THE NEW STANDARD.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
