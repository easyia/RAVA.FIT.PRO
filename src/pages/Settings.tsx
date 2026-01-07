import { useState, useEffect, useRef } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Palette, Save, Upload, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCoachProfile, updateCoachProfile, uploadAvatar } from "@/services/studentService";
import { supabase } from "@/lib/supabase";

const Settings = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: coach, isLoading } = useQuery({
        queryKey: ["coachProfile"],
        queryFn: getCoachProfile,
    });

    const [formData, setFormData] = useState({
        name: "",
        avatar_url: "",
        phone: "",
        specialty: "",
        bio: ""
    });

    useEffect(() => {
        if (coach) {
            setFormData({
                name: coach.name || "",
                avatar_url: coach.avatar_url || "",
                phone: coach.phone || "",
                specialty: coach.specialty || "",
                bio: coach.bio || ""
            });
            if (coach.avatar_url) setLocalPreview(coach.avatar_url);
        }
    }, [coach]);

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
            toast.success("Foto atualizada com sucesso!");
        } catch (error) {
            toast.error("Erro ao subir foto.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await updateCoachProfile(formData);
            queryClient.invalidateQueries({ queryKey: ["coachProfile"] });
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            toast.error("Erro ao salvar alterações.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/auth";
    };

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            <div className={cn("transition-all duration-300 min-h-screen pb-10", sidebarCollapsed ? "ml-16" : "ml-60")}>
                <main className="p-8">
                    <DashboardHeader title="Configurações" showSearch={false} />

                    <Tabs defaultValue="profile" className="w-full max-w-4xl mx-auto">
                        <TabsList className="bg-muted/50 p-1 mb-8">
                            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Perfil</TabsTrigger>
                            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notificações</TabsTrigger>
                            <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> Segurança</TabsTrigger>
                            <TabsTrigger value="appearance" className="gap-2"><Palette className="w-4 h-4" /> Aparência</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="space-y-6 animate-fade-in">
                            <Card className="border-border bg-card shadow-lg">
                                <CardHeader>
                                    <CardTitle>Dados do Coach</CardTitle>
                                    <CardDescription>Gerencie suas informações públicas e de contato.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col md:flex-row items-center gap-8 pb-6 border-b border-border/50">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-2xl bg-sidebar border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                                                <Avatar className="w-full h-full rounded-2xl">
                                                    <AvatarImage
                                                        src={localPreview || formData.avatar_url || ""}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-3xl">
                                                        {formData.name ? formData.name.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm z-10">
                                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                            <label onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                                <Upload className="w-4 h-4" />
                                            </label>
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h4 className="font-bold text-lg">{formData.name || "Seu Nome"}</h4>
                                            <p className="text-sm text-muted-foreground mb-4">{coach?.email}</p>
                                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Alterar Foto</Button>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome Completo</Label>
                                            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Anderson..." className="bg-sidebar" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="specialty">Especialidade Principal</Label>
                                            <Input id="specialty" value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })} placeholder="Hipertrofia..." className="bg-sidebar" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone de Contato</Label>
                                            <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" className="bg-sidebar" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="bio">Biografia / Método</Label>
                                            <Textarea id="bio" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Conte sobre sua experiência..." className="bg-sidebar min-h-[100px]" />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t border-border/50 pt-6">
                                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                                        <LogOut className="w-4 h-4 mr-2" /> Log Out
                                    </Button>
                                    <Button onClick={handleSaveProfile} disabled={loading}>
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Salvar Alterações
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications" className="animate-fade-in">
                            <Card className="border-border bg-card">
                                <CardHeader>
                                    <CardTitle>Preferências de Notificação</CardTitle>
                                    <CardDescription>Escolha como você quer ser avisado sobre seus alunos.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-sidebar/50">
                                        <div>
                                            <p className="font-medium">Novos Alunos</p>
                                            <p className="text-xs text-muted-foreground">Notificar quando um aluno completar o cadastro.</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-sidebar/50">
                                        <div>
                                            <p className="font-medium">Feedbacks de Treino</p>
                                            <p className="text-xs text-muted-foreground">Receba avisos quando um aluno finalizar um protocolo.</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-sidebar/50">
                                        <div>
                                            <p className="font-medium">Relatórios Semanais</p>
                                            <p className="text-xs text-muted-foreground">E-mail com o resumo de performance da sua base.</p>
                                        </div>
                                        <Switch />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Other content placeholders */}
                        <TabsContent value="security" className="animate-fade-in">
                            <Card className="border-border bg-card text-center p-12">
                                <Shield className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <h3 className="text-lg font-bold">Segurança da Conta</h3>
                                <p className="text-sm text-muted-foreground mb-6">Altere sua senha ou gerencie a autenticação em duas etapas.</p>
                                <Button variant="outline">Redefinir Senha</Button>
                            </Card>
                        </TabsContent>

                        <TabsContent value="appearance" className="animate-fade-in">
                            <Card className="border-border bg-card text-center p-12">
                                <Palette className="w-12 h-12 text-tertiary mx-auto mb-4" />
                                <h3 className="text-lg font-bold">Tema e Cores</h3>
                                <p className="text-sm text-muted-foreground mb-6">O FIT PRO segue o tema do seu sistema operacional.</p>
                                <div className="flex justify-center gap-4">
                                    <div className="w-20 h-10 bg-slate-200 rounded-lg border border-border cursor-pointer"></div>
                                    <div className="w-20 h-10 bg-slate-900 rounded-lg border border-border cursor-pointer"></div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
};

export default Settings;
