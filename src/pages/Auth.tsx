import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Loader2, Mail, Lock, User as UserIcon, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [website, setWebsite] = useState(""); // Honeypot field
    const [showSuccess, setShowSuccess] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(0);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        // Honeypot check
        if (website) {
            console.warn("Bot detected via honeypot field");
            setLoading(true);
            setTimeout(() => setLoading(false), 2000); // Mimic work to frustrate bot
            return;
        }

        // Throttling check
        if (lockoutTime > Date.now()) {
            const seconds = Math.ceil((lockoutTime - Date.now()) / 1000);
            toast.error(`Muitas tentativas. Aguarde ${seconds}s.`);
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Bem-vindo de volta!");
                // Verificamos o perfil no Dashboard ou em um loader especializado
                navigate("/dashboard");
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                if (error) {
                    if (error.message.includes("rate limit")) {
                        throw new Error("Muitas tentativas de cadastro. Por favor, aguarde alguns minutos antes de tentar novamente.");
                    }
                    throw error;
                }

                setShowSuccess(true);
                toast.success("Cadastro realizado com sucesso!");
            }
        } catch (error: any) {
            // Incremental lockout on failure
            setLockoutTime(Date.now() + 5000); // 5 second lockout on error
            toast.error(error.message || "Ocorreu um erro na autenticação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />

            <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-xl shadow-2xl animate-fade-in relative z-10">
                <CardHeader className="space-y-4 text-center pb-8">
                    <div className="flex justify-center mb-2">
                        <span className="font-black text-3xl tracking-tighter inline-flex items-baseline">
                            <span className="text-primary tracking-tighter">FIT</span>
                            <span className="text-zinc-500 font-medium ml-1 text-sm tracking-[0.2em]">PRO</span>
                        </span>
                    </div>
                    {!showSuccess && (
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-bold tracking-tight">
                                {isLogin ? "Acesse sua conta" : "Criar nova conta"}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {isLogin
                                    ? "Entre para gerenciar seus alunos e treinos"
                                    : "Comece hoje a transformar a vida de seus alunos"}
                            </CardDescription>
                        </div>
                    )}
                </CardHeader>

                {showSuccess ? (
                    <CardContent className="pt-0 pb-10 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 animate-bounce-subtle">
                            <Mail className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">Verifique seu E-mail</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Enviamos um link de confirmação para <span className="text-foreground font-medium">{email}</span>.
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
                                <span>Após confirmar, você poderá acessar o painel do FIT PRO.</span>
                            </p>
                        </div>
                        <Button
                            className="w-full font-bold h-12 shadow-button transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={() => {
                                setShowSuccess(false);
                                setIsLogin(true);
                            }}
                        >
                            Ir para Login
                        </Button>
                    </CardContent>
                ) : (
                    <form onSubmit={handleAuth}>
                        <CardContent className="space-y-4">
                            {!isLogin && (
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nome Completo</Label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                        <Input
                                            id="fullName"
                                            placeholder="Seu nome completo"
                                            className="pl-10 bg-sidebar"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        className="pl-10 bg-sidebar"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 bg-sidebar"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
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
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-4">
                            <Button className="w-full h-12 text-base font-semibold shadow-button active:scale-[0.98] transition-transform" disabled={loading || lockoutTime > Date.now()}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Carregando...
                                    </>
                                ) : (
                                    isLogin ? "Entrar" : "Cadastrar"
                                )}
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-widest pt-2">
                                <ShieldCheck className="w-3 h-3" />
                                Infraestrutura Segura & Criptografada
                            </div>
                            <button
                                type="button"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                {isLogin
                                    ? "Não tem uma conta? Cadastre-se agora"
                                    : "Já possui uma conta? Faça o login"}
                            </button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
};

export default Auth;
