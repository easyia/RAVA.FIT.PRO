import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Dumbbell, Loader2 } from "lucide-react";

export default function StudentLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Verificar se é realmente um aluno (em um app real, verificaríamos no perfil)
            const role = data.user?.user_metadata?.role;
            if (role === 'coach') {
                await supabase.auth.signOut();
                toast.error("Este acesso é restrito para alunos.");
                return;
            }

            toast.success("Bem-vindo de volta!");
            navigate("/aluno/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-sidebar to-background">
            <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Dumbbell className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold italic tracking-wider">RAVA FIT PRO</CardTitle>
                    <CardDescription>Área do Aluno</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <Button type="submit" className="w-full font-bold h-11" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
