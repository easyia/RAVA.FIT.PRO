import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

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

    // Limpeza de sessão para evitar conflito com conta de Coach
    useEffect(() => {
        const clearSession = async () => {
            await supabase.auth.signOut();
        };
        clearSession();
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
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

            if (error) throw error;

            if (data.user) {
                toast.success("Cadastro realizado! Verifique seu e-mail (se habilitado) ou entre para preencher a anamnese.");
                navigate("/aluno/login");
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao realizar cadastro");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl">
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
                        <Button type="submit" className="w-full font-bold h-11 mt-4" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Criar Conta"}
                        </Button>
                        <Button
                            variant="ghost"
                            type="button"
                            className="w-full text-xs text-muted-foreground"
                            onClick={() => navigate("/aluno/login")}
                        >
                            Já tenho uma conta
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
