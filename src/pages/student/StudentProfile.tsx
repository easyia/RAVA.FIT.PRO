import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getStudentDetails, uploadAvatar, updateStudent } from "@/services/studentService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Phone,
    Calendar,
    LogOut,
    Camera,
    ChevronRight,
    Award,
    Shield,
    Settings,
    HelpCircle,
    Loader2,
    Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StudentProfile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch user details
    const { data: student, isLoading } = useQuery({
        queryKey: ['studentProfile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const data = await getStudentDetails(user.id);

            // Fetch coach details manualy if needed, but getStudentDetails might only return coach_id
            if (data.coach_id) {
                const { data: coachData } = await supabase
                    .from('coaches')
                    .select('name, avatar_url, specialty')
                    .eq('id', data.coach_id)
                    .single();

                if (coachData) {
                    data.coach = coachData;
                }
            }

            return data;
        },
        enabled: !!user?.id
    });

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success("Você saiu da conta.");
            navigate("/aluno/login");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao sair.");
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user?.id) return;

        setIsUploading(true);
        try {
            const publicUrl = await uploadAvatar(file);

            // Optimistic update
            if (student) {
                queryClient.setQueryData(['studentProfile', user.id], {
                    ...student,
                    avatar_url: publicUrl
                });
            }

            // Update in DB
            await updateStudent(user.id, { ...student, avatar_url: publicUrl });

            toast.success("Foto de perfil atualizada!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar foto.");
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    if (!student) return null;

    return (
        <div className="min-h-screen bg-black pb-24">
            {/* Header Section */}
            <header className="relative bg-zinc-900/50 pb-8 pt-6 rounded-b-[32px] border-b border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />

                <div className="container px-4 relative z-10 flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="relative mb-4 group cursor-pointer" onClick={handleAvatarClick}>
                        <div className={cn(
                            "w-28 h-28 rounded-full border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden relative shadow-2xl",
                            isUploading && "opacity-50"
                        )}>
                            {student.avatar_url ? (
                                <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-muted-foreground" />
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center border-4 border-zinc-900 shadow-xl">
                            <Settings className="w-4 h-4" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Name & Badge */}
                    <h1 className="text-2xl font-black text-white mb-1 tracking-tight">{student.full_name}</h1>
                    <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase text-[10px] tracking-widest px-3 py-1">
                            {student.classification || 'Membro'}
                        </Badge>
                        <span className="text-zinc-500 text-xs font-medium">
                            Desde {new Date(student.created_at).getFullYear()}
                        </span>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 divide-x divide-white/10 w-full max-w-sm mt-4 bg-white/5 rounded-2xl p-3 border border-white/5 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-zinc-400 font-medium">Peso</span>
                            <span className="text-sm font-bold text-white">
                                {student.anamnesis?.[0]?.weight_kg ? `${student.anamnesis[0].weight_kg}kg` : '--'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-zinc-400 font-medium">Altura</span>
                            <span className="text-sm font-bold text-white">
                                {student.anamnesis?.[0]?.height_cm ? `${student.anamnesis[0].height_cm}cm` : '--'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-zinc-400 font-medium">Idade</span>
                            <span className="text-sm font-bold text-white">
                                {student.birth_date ?
                                    Math.floor((new Date().getTime() - new Date(student.birth_date).getTime()) / 31557600000)
                                    : '--'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container px-4 mt-6 space-y-6">
                {/* Personal Info Card */}
                <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
                    <CardHeader className="pb-2 border-b border-white/5 bg-white/5">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <User className="w-4 h-4 text-amber-500" />
                            Dados Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                <Mail className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">E-mail</p>
                                <p className="text-sm font-medium text-zinc-200 truncate">{student.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                <Phone className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Telefone</p>
                                <p className="text-sm font-medium text-zinc-200">{student.phone || 'Não informado'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Data de Nascimento</p>
                                <p className="text-sm font-medium text-zinc-200">
                                    {student.birth_date ? format(new Date(student.birth_date), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Não informada'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Coach Info */}
                <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden group hover:border-amber-500/30 transition-colors">
                    <CardHeader className="pb-2 border-b border-white/5 bg-white/5">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-500" />
                            Seu Treinador
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {student.coach ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-amber-500/20 overflow-hidden">
                                    {student.coach.avatar_url ? (
                                        <img src={student.coach.avatar_url} alt={student.coach.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full p-2 text-zinc-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{student.coach.name}</h3>
                                    <p className="text-xs text-amber-500 font-medium uppercase tracking-wide">{student.coach.specialty || 'Personal Trainer'}</p>
                                </div>
                                <div className="ml-auto">
                                    <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Você ainda não tem um treinador vinculado.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Account Actions */}
                <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 pl-2 mb-2">Conta</h3>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 transition-all text-left group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">Privacidade e Segurança</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 transition-all text-left group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <HelpCircle className="w-4 h-4 text-purple-500" />
                            </div>
                            <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">Ajuda e Suporte</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-left group mt-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                <LogOut className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="font-medium text-zinc-200 group-hover:text-red-400 transition-colors">Sair da Conta</span>
                        </div>
                    </button>

                    <p className="text-center text-[10px] text-zinc-600 font-medium pt-6 pb-2">
                        RAVA FIT PRO v1.0.2
                    </p>
                </div>
            </div>
        </div>
    );
}
