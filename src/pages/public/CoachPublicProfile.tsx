import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicCoachProfile, PublicCoachProfile } from "@/services/publicService";
import { Button } from "@/components/ui/button";
import { Loader2, Instagram, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CoachPublicProfile() {
    const { coach_id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<PublicCoachProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (coach_id) {
            loadProfile();
        }
    }, [coach_id]);

    const loadProfile = async () => {
        try {
            const data = await getPublicCoachProfile(coach_id!);
            setProfile(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>;

    if (!profile) return <div className="h-screen flex items-center justify-center bg-black text-white">Coach não encontrado ou perfil privado.</div>;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30">
            {/* Hero Section */}
            <div className="relative min-h-[40vh] md:h-[60vh] flex items-end">
                <div className="absolute inset-0 z-0">
                    {profile.avatar_url ? (
                        <>
                            <img src={profile.avatar_url} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-neutral-900" />
                    )}
                </div>

                <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 md:px-12 pb-12">
                    <div className="max-w-4xl mx-auto md:mx-0 flex flex-col items-center md:items-start text-center md:text-left">
                        <span className="px-3 py-1 bg-primary text-black font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-full mb-4 inline-block">Consultoria PhD Premium</span>
                        <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter mb-4 leading-[0.9] uppercase italic break-words w-full">
                            {profile.name}
                        </h1>
                        {profile.social_instagram && (
                            <a
                                href={`https://instagram.com/${profile.social_instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-white/60 hover:text-primary transition-colors text-sm md:text-base font-bold uppercase tracking-widest"
                            >
                                <Instagram className="w-4 h-4 md:w-5 h-5" /> @{profile.social_instagram}
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-12 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                    <div className="lg:col-span-7 space-y-8">
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-4">A Metodologia</h2>
                            <p className="text-gray-400 leading-relaxed text-lg md:text-xl font-medium">
                                {profile.public_bio || "Transforme seu corpo e sua saúde com uma metodologia validada cientificamente. Acompanhamento personalizado, análise biomecânica e suporte contínuo para você atingir seus objetivos."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            {[
                                "Treinos Periodizados",
                                "Análise Biomecânica",
                                "Suporte via App Exclusivo",
                                "Protocolos Nutricionais"
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3 text-gray-300 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <CheckCircle2 className="text-primary w-5 h-5 shrink-0" />
                                    <span className="font-bold text-sm uppercase tracking-wide">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-5 w-full">
                        <div className="sticky top-24 bg-neutral-900/40 p-6 md:p-10 rounded-3xl border border-white/10 backdrop-blur-2xl flex flex-col justify-center items-center text-center space-y-8 w-full max-w-md mx-auto">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Pronto para o Próximo Nível?</h3>
                                <p className="text-sm text-gray-400 font-medium">Faça seu cadastro agora e inicie sua jornada PhD.</p>
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-16 text-lg font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 shadow-[0_0_30px_rgba(155,135,245,0.3)] hover:shadow-[0_0_50px_rgba(155,135,245,0.5)] transition-all group"
                                onClick={() => navigate(`/aluno/cadastro?coach_id=${profile.id}`)}
                            >
                                Quero ser Aluno
                                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </Button>

                            <div className="pt-4 border-t border-white/5 w-full">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Inscrição Protegida por RAVA FIT PRO</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="max-w-screen-xl mx-auto px-6 md:px-12 py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30">
                <div className="text-sm font-black italic tracking-tighter">RAVA FIT PRO</div>
                <div className="text-[10px] uppercase font-bold tracking-widest">© 2026 • Todos os direitos reservados</div>
            </footer>
        </div>
    );
}
