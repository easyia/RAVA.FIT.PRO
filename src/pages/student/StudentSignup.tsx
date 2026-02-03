import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail } from "lucide-react";

export default function StudentSignup() {
    const [searchParams] = useSearchParams();
    const coachId = searchParams.get("coach_id");
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [website, setWebsite] = useState(""); // Honeypot field
    const [lockoutTime, setLockoutTime] = useState(0);

    // Limpeza de sessão para evitar conflito com conta de Coach
    useEffect(() => {
        const clearSession = async () => {
            await supabase.auth.signOut();
        };
        clearSession();
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Honeypot check
        if (website) {
            console.warn("Bot detected via honeypot field");
            setLoading(true);
            setTimeout(() => setLoading(false), 2000);
            return;
        }

        // Throttling check
        if (lockoutTime > Date.now()) {
            const seconds = Math.ceil((lockoutTime - Date.now()) / 1000);
            toast.error(`Muitas tentativas. Aguarde ${seconds}s.`);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                        role: 'student',
                        coach_id: coachId,
                        status: 'pending_approval' // Alterado para pending_approval para exigir aprovação do coach
                    }
                }
            });

            if (error) {
                if (error.message.includes("rate limit")) {
                    throw new Error("Muitas tentativas de cadastro. Por favor, aguarde alguns minutos antes de tentar novamente.");
                }
                throw error;
            }

            if (data.user) {
                setIsSuccess(true);
                toast.success("Cadastro realizado com sucesso!");
            }
        } catch (error: any) {
            // Incremental lockout on failure
            setLockoutTime(Date.now() + 5000); // 5 second lockout on error
            toast.error(error.message || "Erro ao realizar cadastro");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl">
                {!isSuccess ? (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-bold uppercase italic italic">Crie sua Conta</CardTitle>
                            <CardDescription>Bem-vindo ao FIT PRO</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Nome Completo</Label>
                                    <Input
                                        id="full_name"
                                        placeholder="Seu nome"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Honeypot field - hidden from humans */}
                                <div className="opacity-0 absolute -z-50 pointer-events-none h-0 overflow-hidden">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        type="text"
                                        autoComplete="off"
                                        tabIndex={-1}
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                    />
                                </div>

                                <Button type="submit" className="w-full font-bold h-11 mt-4 shadow-button active:scale-[0.98] transition-transform" disabled={loading || lockoutTime > Date.now()}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Criar Conta"}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-widest pt-2">
                                    <ShieldCheck className="w-3 h-3" />
                                    Sistema de Proteção FIT PRO
                                </div>
                                <Button
                                    variant="ghost"
                                    type="button"
                                    className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => navigate("/aluno/login")}
                                >
                                    Já tenho uma conta
                                </Button>
                            </form>
                        </CardContent>
                    </>
                ) : (
                    <CardContent className="pt-10 pb-10 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 animate-bounce-subtle">
                            <Mail className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Verifique seu E-mail</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Enviamos um link de confirmação para <span className="text-foreground font-medium">{formData.email}</span>.
                            </p>
                        </div>
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 text-sm text-left space-y-3">
                            <p className="flex items-start gap-2">
                                <span className="text-primary font-bold">1.</span>
                                <span>Acesse seu e-mail e clique no link de confirmação.</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-primary font-bold">2.</span>
                                <span>Não esqueça de verificar a pasta de <strong>SPAM</strong> ou <strong>Lixo Eletrônico</strong>.</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-primary font-bold">3.</span>
                                <span>Após confirmar, você poderá acessar sua conta normalmente.</span>
                            </p>
                        </div>
                        <Button
                            className="w-full font-bold h-12 shadow-button transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={() => navigate("/aluno/login")}
                        >
                            Ir para Login
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
