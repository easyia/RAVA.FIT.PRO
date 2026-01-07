import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bot, User, Send, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage, sendStudentChatMessage, sendMessageToCoach, getChatMessages } from "@/services/aiService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, CheckCheck, Clock } from "lucide-react";
import { useEffect, useRef } from "react";

interface StudentChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string;
    coachId: string;
    coachName: string;
    coachAvatar?: string;
}

export function StudentChatModal({ open, onOpenChange, studentId, coachId, coachName, coachAvatar }: StudentChatModalProps) {
    const [view, setView] = useState<'initial' | 'ai' | 'coach'>('initial');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendAI = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await sendStudentChatMessage(studentId, newMessages);
            if (response.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
            }
        } catch (error) {
            toast.error("Erro ao falar com a IA. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendCoach = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: any = {
            sender_type: 'student',
            content: input,
            created_at: new Date().toISOString(),
            status: 'sent'
        };

        // Optimistic update
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput("");
        setIsLoading(true);

        try {
            await sendMessageToCoach(studentId, coachId, currentInput);
            // After sending, we could refresh messages if we had a getMessages function here
            // For now, let's just mark it as success
        } catch (error) {
            toast.error("Erro ao enviar mensagem.");
            // Remove the optimistic message on error
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    // UseEffect to fetch initial coach messages if needed, or we keep it simple since 
    // it's a modal. Let's add message fetching for coach view.
    useEffect(() => {
        if (view === 'coach' && open) {
            const fetchMessages = async () => {
                try {
                    const data = await getChatMessages(studentId, coachId);
                    setMessages(data);
                } catch (e) {
                    console.error("Error fetching messages", e);
                }
            };
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [view, open, studentId, coachId]);

    const resetMessages = () => {
        setMessages([]);
        setInput("");
        setView('initial');
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) setTimeout(resetMessages, 300);
        }}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-[#09090b] border-white/10 h-[650px] flex flex-col rounded-[2.5rem] shadow-2xl">
                {/* Background Effects */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/20 to-transparent opacity-50 pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />

                <DialogHeader className="p-4 border-b border-white/5 relative z-10 bg-zinc-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        {view !== 'initial' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setView('initial')}
                                className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white -ml-2"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        )}
                        <div className="flex items-center gap-3 flex-1">
                            {view === 'coach' && (
                                <div className="relative">
                                    <Avatar className="w-10 h-10 border border-white/10">
                                        <AvatarImage src={coachAvatar || ""} className="object-cover" />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {coachName ? coachName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
                                </div>
                            )}
                            <div>
                                <DialogTitle className="text-base font-bold text-white leading-tight">
                                    {view === 'initial' && "Central de Mensagens"}
                                    {view === 'ai' && "FIT PRO AI"}
                                    {view === 'coach' && coachName}
                                </DialogTitle>
                                <p className="text-[10px] text-zinc-400 font-medium">
                                    {view === 'initial' && "Canal Oficial"}
                                    {view === 'ai' && "Bot · 24h"}
                                    {view === 'coach' && "Online Agora"}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative z-10">
                    <AnimatePresence mode="wait">
                        {view === 'initial' && (
                            <motion.div
                                key="initial"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="p-8 space-y-6 h-full flex flex-col justify-center relative z-20"
                            >
                                <div className="text-center space-y-2 mb-4">
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Como posso ajudar?</h2>
                                    <p className="text-zinc-400 text-sm">Selecione uma opção para iniciar</p>
                                </div>

                                <button
                                    onClick={() => setView('ai')}
                                    className="w-full group relative overflow-hidden p-[1px] rounded-[2rem] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative bg-[#121214] hover:bg-[#121214]/90 backdrop-blur-xl p-6 rounded-[1.95rem] flex items-center gap-5 transition-colors h-full border border-white/5">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)] group-hover:shadow-[0_0_40px_-5px_rgba(245,158,11,0.6)] transition-shadow duration-500">
                                            <Sparkles className="w-8 h-8 text-white relative z-10" />
                                            <motion.div
                                                className="absolute inset-0 bg-white rounded-2xl"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: [0, 0.2, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">FIT PRO AI</h3>
                                                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[9px] uppercase font-black px-1.5 py-0 shadow-[0_0_10px_-2px_rgba(245,158,11,0.3)]">PRO</Badge>
                                            </div>
                                            <p className="text-xs text-zinc-400 leading-relaxed font-medium group-hover:text-zinc-300 transition-colors">
                                                Tire dúvidas técnicas de treino e dieta instantaneamente.
                                            </p>
                                        </div>
                                        <ChevronLeft className="w-5 h-5 text-zinc-600 rotate-180 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => setView('coach')}
                                    className="w-full group relative overflow-hidden p-[1px] rounded-[2rem] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/50 to-primary/10 opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative bg-[#121214] hover:bg-[#121214]/90 backdrop-blur-xl p-6 rounded-[1.95rem] flex items-center gap-5 transition-colors h-full border border-white/5">
                                        <div className="relative shrink-0">
                                            <div className="w-16 h-16 rounded-2xl p-[2px] bg-gradient-to-br from-primary to-emerald-500 shadow-[0_0_30px_-5px_rgba(var(--primary),0.4)]">
                                                <Avatar className="w-full h-full rounded-[14px]">
                                                    <AvatarImage src={coachAvatar || ""} className="object-cover" />
                                                    <AvatarFallback className="rounded-[14px] bg-primary/10 text-primary font-bold text-xl">
                                                        {coachName ? coachName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#121214] rounded-full shadow-lg" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <h3 className="font-bold text-lg text-white mb-1.5 group-hover:text-primary transition-colors">Falar com Treinador</h3>
                                            <p className="text-xs text-zinc-400 leading-relaxed font-medium group-hover:text-zinc-300 transition-colors">
                                                Envie mensagens, vídeos e feedback direto para o coach.
                                            </p>
                                        </div>
                                        <ChevronLeft className="w-5 h-5 text-zinc-600 rotate-180 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>

                                <div className="mt-auto pt-8 flex items-center justify-center gap-2 opacity-40 group-hover:opacity-60 transition-opacity">
                                    <div className="h-[1px] w-8 bg-zinc-600" />
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] text-center">
                                        Criptografia de Ponta a Ponta
                                    </p>
                                    <div className="h-[1px] w-8 bg-zinc-600" />
                                </div>
                            </motion.div>
                        )}

                        {/* AI e Coach Views permanecem com melhorias visuais no input */}
                        {view === 'ai' && (
                            <motion.div
                                key="ai"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col h-full"
                            >
                                <ScrollArea className="flex-1 p-6">
                                    <div className="space-y-4">
                                        {messages.length === 0 && (
                                            <div className="bg-white/5 border border-white/5 p-5 rounded-[1.5rem] relative">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                                                        <Bot className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.15em]">System Ready</span>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                                                    Olá! Analisei sua ficha técnica, treinos e dieta. Como posso otimizar seus resultados hoje?
                                                </p>
                                            </div>
                                        )}
                                        {messages.map((msg, i) => (
                                            <div key={i} className={cn(
                                                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                                            )}>
                                                <div className={cn(
                                                    "max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-lg",
                                                    msg.role === 'user'
                                                        ? 'bg-primary text-white rounded-tr-none'
                                                        : 'bg-zinc-900 border border-white/5 text-zinc-100 rounded-tl-none font-medium'
                                                )}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                                    <div className="flex gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                                                    </div>
                                                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Processando Contexto...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                                <div className="p-6 bg-zinc-950/50 backdrop-blur-xl border-t border-white/5">
                                    <div className="flex gap-3 bg-zinc-900/80 p-1.5 rounded-3xl border border-white/5 shadow-inner">
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendAI()}
                                            placeholder="Pergunte sobre sua dieta ou treino..."
                                            className="flex-1 bg-transparent border-none px-4 text-sm text-white focus:ring-0 outline-none"
                                        />
                                        <Button onClick={handleSendAI} disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/80 h-10 w-10 p-0 rounded-2xl shrink-0 shadow-lg">
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'coach' && (
                            <motion.div
                                key="coach"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col h-full"
                            >
                                <ScrollArea className="flex-1 bg-[#0b141a]">
                                    <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-[0.06] pointer-events-none" />
                                    <div className="p-4 space-y-3 pb-4 relative z-10">
                                        {messages.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                    <MessageSquare className="w-8 h-8 text-white/50" />
                                                </div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Histórico de Conversa</p>
                                                <div className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-1 rounded mt-2 border border-amber-500/20">
                                                    Criptografia de ponta a ponta
                                                </div>
                                            </div>
                                        )}
                                        {messages.map((msg: any, i) => (
                                            <div key={i} className={cn(
                                                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                                                msg.sender_type === 'student' || msg.role === 'user' ? 'justify-end' : 'justify-start'
                                            )}>
                                                <div className={cn(
                                                    "max-w-[85%] min-w-[80px] p-2 px-3 rounded-xl text-[14px] leading-snug shadow-sm relative group",
                                                    msg.sender_type === 'student' || msg.role === 'user'
                                                        ? 'bg-[#005c4b] text-white rounded-tr-none'
                                                        : 'bg-[#202c33] text-zinc-100 rounded-tl-none'
                                                )}>
                                                    <span className="block mb-1">{msg.content}</span>
                                                    <div className={cn(
                                                        "flex items-center gap-1 justify-end opacity-70 text-[10px] tabular-nums tracking-tight",
                                                        (msg.sender_type === 'student' || msg.role === 'user') ? "text-emerald-100" : "text-zinc-400"
                                                    )}>
                                                        {msg.created_at && format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                                                        {(msg.sender_type === 'student' || msg.role === 'user') && (
                                                            msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-sky-400" /> : <Check className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-3 bg-[#202c33] border-t border-white/5">
                                    <div className="flex gap-3 bg-[#2a3942] p-1.5 rounded-full px-4 items-center shadow-lg">
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendCoach()}
                                            placeholder="Mensagem"
                                            className="flex-1 bg-transparent border-none py-1.5 text-[15px] text-white focus:ring-0 outline-none placeholder:text-zinc-400"
                                        />
                                        <button
                                            onClick={handleSendCoach}
                                            disabled={isLoading || !input.trim()}
                                            className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#00a884]/90 flex items-center justify-center text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 pl-0.5" />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
