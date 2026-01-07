import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useQuery } from "@tanstack/react-query";
import { getCoachChats } from "@/services/aiService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { MessageSquare, Search, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StudentChatTab } from "@/components/dashboard/StudentChatTab";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function MessagesPage() {
    const { user } = useAuth();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(location.state?.studentId || null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (location.state?.studentId) {
            setSelectedStudentId(location.state.studentId);
        }
    }, [location.state]);

    const { data: chats = [], isLoading } = useQuery({
        queryKey: ['coachChats', user?.id],
        queryFn: () => getCoachChats(user?.id!),
        enabled: !!user?.id,
        refetchInterval: 10000
    });

    const filteredChats = chats.filter(c =>
        c.studentName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background flex">
            <AppSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div className={cn(
                "flex-1 flex flex-col transition-all duration-300",
                sidebarCollapsed ? "ml-16" : "ml-64"
            )}>
                <div className="p-8 pb-4 flex-shrink-0">
                    <DashboardHeader title="Central de Mensagens" />
                </div>

                <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-6">
                    {/* Chat List Sidebar */}
                    <div className="w-80 bg-card rounded-3xl border border-border flex flex-col overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar conversa..."
                                    className="pl-9 bg-muted/50 border-none rounded-xl"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary opacity-20" />
                                </div>
                            ) : filteredChats.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs uppercase font-bold tracking-widest">Nenhuma conversa</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {filteredChats.map((chat) => (
                                        <button
                                            key={chat.studentId}
                                            onClick={() => setSelectedStudentId(chat.studentId)}
                                            className={cn(
                                                "w-full p-4 flex gap-3 text-left transition-colors hover:bg-muted/30",
                                                selectedStudentId === chat.studentId && "bg-primary/5 relative after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-primary"
                                            )}
                                        >
                                            <div className="relative shrink-0">
                                                <Avatar className="w-12 h-12 border border-border">
                                                    <AvatarImage src={chat.studentAvatar || ""} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                        {chat.studentName ? chat.studentName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h4 className="font-bold text-sm truncate">{chat.studentName}</h4>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                        {format(new Date(chat.lastTime), "HH:mm", { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate italic">
                                                    {chat.senderType === 'coach' ? 'Você: ' : ''}{chat.lastMessage}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 bg-card rounded-3xl border border-border flex flex-col overflow-hidden shadow-sm">
                        {selectedStudentId ? (
                            <div className="flex flex-col h-full bg-muted/5">
                                <div className="p-4 border-b border-border bg-card flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm">
                                                {filteredChats.find(c => c.studentId === selectedStudentId)?.studentName}
                                            </h3>
                                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online agora</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <StudentChatTab studentId={selectedStudentId} coachId={user?.id!} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/5">
                                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                    <MessageSquare className="w-10 h-10 text-primary/20" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Selecione uma conversa</h3>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Escolha um aluno na lista ao lado para visualizar o histórico e responder suas dúvidas.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
