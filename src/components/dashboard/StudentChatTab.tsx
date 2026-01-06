import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, User, Check, CheckCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatMessages, sendMessageFromCoach } from "@/services/aiService";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StudentChatTabProps {
    studentId: string;
    coachId: string;
}

export function StudentChatTab({ studentId, coachId }: StudentChatTabProps) {
    const [input, setInput] = useState("");
    const queryClient = useQueryClient();

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['chatMessages', studentId, coachId],
        queryFn: () => getChatMessages(studentId, coachId),
        refetchInterval: 3000 // Poll every 3s for new messages
    });

    const mutation = useMutation({
        mutationFn: (content: string) => sendMessageFromCoach(studentId, coachId, content),
        onSuccess: () => {
            setInput("");
            queryClient.invalidateQueries({ queryKey: ['chatMessages', studentId, coachId] });
        }
    });

    const handleSend = () => {
        if (!input.trim() || mutation.isPending) return;
        mutation.mutate(input);
    };

    return (
        <div className="flex flex-col h-full bg-[#0b141a]">
            <ScrollArea className="flex-1 p-6 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-95">
                <div className="space-y-4">
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                            <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-sm">Inicie a conversa com seu aluno.</p>
                        </div>
                    )}
                    {messages.map((m: any) => (
                        <div key={m.id} className={cn(
                            "flex w-full animate-in fade-in slide-in-from-bottom-1 duration-300",
                            m.sender_type === 'coach' ? "justify-end" : "justify-start"
                        )}>
                            <div className={cn(
                                "max-w-[85%] min-w-[80px] px-3 py-2 rounded-xl text-[13px] leading-relaxed shadow-sm relative",
                                m.sender_type === 'coach'
                                    ? "bg-[#005c4b] text-white rounded-tr-none"
                                    : "bg-[#202c33] text-zinc-100 rounded-tl-none"
                            )}>
                                {m.content}
                                <div className="flex items-center justify-end gap-1 mt-1 opacity-60 text-[10px]">
                                    {format(new Date(m.created_at), "HH:mm", { locale: ptBR })}
                                    {m.sender_type === 'coach' && (
                                        m.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-sky-400" /> : <Check className="w-3.5 h-3.5" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages.length === 0 && (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-primary opacity-20" />
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 bg-[#202c33] border-t border-white/5">
                <div className="flex gap-3 bg-[#2a3942] p-1 rounded-xl items-center px-4">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Mensagem"
                        className="flex-1 bg-transparent border-none py-2.5 text-sm text-white focus:ring-0 outline-none placeholder:text-zinc-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={mutation.isPending || !input.trim()}
                        className="text-primary hover:text-primary/80 transition-colors p-1"
                    >
                        {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
