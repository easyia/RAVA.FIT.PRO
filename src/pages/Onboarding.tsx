import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, User, Award, Phone, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import { getCoachProfile, updateCoachProfile, uploadAvatar } from "@/services/studentService";
import { useQueryClient } from "@tanstack/react-query";

const Onboarding = () => {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        avatar_url: "",
        phone: "",
        specialty: "",
        bio: ""
    });
    const navigate = useNavigate();

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await getCoachProfile();
                if (profile) {
                    setFormData({
                        name: profile.name || "",
                        avatar_url: profile.avatar_url || "",
                        phone: profile.phone || "",
                        specialty: profile.specialty || "",
                        bio: profile.bio || ""
                    });
                    if (profile.avatar_url) setLocalPreview(profile.avatar_url);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setFetching(false);
            }
        };
        loadProfile();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview imediato local
        const objectUrl = URL.createObjectURL(file);
        setLocalPreview(objectUrl);

        setIsUploading(true);
        try {
            const url = await uploadAvatar(file);
            setFormData(prev => ({ ...prev, avatar_url: url }));
            toast.success("Foto carregada com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar imagem.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error("O nome é obrigatório.");
            return;
        }

        setLoading(true);
        try {
            await updateCoachProfile(formData);
            toast.success(`Bem-vindo, ${formData.name}!`, {
                description: "Seu perfil foi configurado com sucesso."
            });
            queryClient.invalidateQueries({ queryKey: ["coachProfile"] });
            navigate("/");
        } catch (error: any) {
            toast.error("Erro ao salvar perfil.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden font-sans">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />

            <Card className="w-full max-w-lg border-border bg-card/50 backdrop-blur-xl shadow-2xl animate-fade-in relative z-10 overflow-hidden">
                <CardHeader className="space-y-2 text-center pb-8 border-b border-border/50 bg-muted/30">
                    <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Complete seu Perfil</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Precisamos de algumas informações para personalizar sua experiência.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 pt-8">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center justify-center gap-4 mb-4">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-2xl bg-sidebar flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary transition-all overflow-hidden shadow-inner">
                                    {localPreview ? (
                                        <img
                                            src={localPreview}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "";
                                                setLocalPreview(null);
                                            }}
                                        />
                                    ) : (
                                        <User className="w-10 h-10 text-tertiary" />
                                    )}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <Label htmlFor="coach-avatar" className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg border-4 border-background">
                                    <Upload className="w-4 h-4" />
                                </Label>
                                <input id="coach-avatar" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                            </div>
                            <p className="text-xs text-muted-foreground">Adicione uma foto profissional para seus alunos</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                    <Input id="name" placeholder="Seu nome como coach" className="pl-10 h-11 bg-sidebar" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialty">Especialidade</Label>
                                <div className="relative">
                                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                    <Input id="specialty" placeholder="Ex: Hipertrofia, Yoga..." className="pl-10 h-11 bg-sidebar" value={formData.specialty} onChange={e => setFormData(prev => ({ ...prev, specialty: e.target.value }))} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                    <Input id="phone" placeholder="(00) 00000-0000" className="pl-10 h-11 bg-sidebar" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="bio">Breve Bio (Opcional)</Label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-tertiary" />
                                    <Textarea id="bio" placeholder="Conte um pouco sobre sua formação e método..." className="pl-10 bg-sidebar min-h-[100px] py-3" value={formData.bio} onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="pb-8 border-t border-border/50 pt-6 bg-muted/20">
                        <Button className="w-full h-12 text-base font-semibold shadow-button bg-primary hover:bg-primary/90" disabled={loading || isUploading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando perfil...
                                </>
                            ) : (
                                "Concluir e Ir para o Dashboard"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Onboarding;
