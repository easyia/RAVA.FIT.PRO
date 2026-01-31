import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CheckInCardProps {
    logsCount: number;
    targetLogs: number;
    onRespond: () => void;
}

export function CheckInCard({ logsCount, targetLogs, onRespond }: CheckInCardProps) {
    const progress = Math.min((logsCount / targetLogs) * 100, 100);
    const isGoalMet = logsCount >= targetLogs;
    const today = new Date();
    // 0 = Sunday, 6 = Saturday
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    const canRespond = isGoalMet || isWeekend;

    return (
        <Card className={cn(
            "border-none overflow-hidden relative group transition-all duration-300",
            isGoalMet
                ? "bg-gradient-to-br from-orange-500 to-amber-600 shadow-2xl shadow-orange-500/20"
                : "bg-gradient-to-br from-violet-600 to-indigo-700 shadow-2xl shadow-indigo-500/20"
        )}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Activity size={120} color="white" />
            </div>

            <CardContent className="p-6 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Icon and Title */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg shrink-0">
                            <Activity className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-white tracking-tight leading-none uppercase">Check-in</h3>
                            <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em] mt-2">Acompanhamento Semanal</p>
                        </div>
                    </div>

                    {/* Progress Bar Section */}
                    <div className="flex-1 max-w-md w-full space-y-3">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">
                                Sua Meta Semanal
                            </span>
                            <span className="text-sm font-black text-white tabular-nums">
                                {logsCount} / {targetLogs}
                            </span>
                        </div>
                        <div className="relative h-4 bg-black/20 rounded-full p-1 border border-white/10">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn(
                                    "h-full rounded-full relative",
                                    isGoalMet
                                        ? "bg-gradient-to-r from-emerald-400 to-green-300 shadow-[0_0_20px_rgba(52,211,153,1)]"
                                        : "bg-gradient-to-r from-orange-500 to-amber-400"
                                )}
                            >
                                {isGoalMet && (
                                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                                )}
                            </motion.div>
                        </div>
                        {!canRespond && (
                            <p className="text-[10px] text-white/60 font-medium italic text-right px-1">
                                Complete sua meta ou aguarde o fim de semana para liberar
                            </p>
                        )}
                        {isGoalMet && (
                            <p className="text-[10px] text-amber-200 font-bold text-right px-1 animate-bounce">
                                Meta batida! Check-in liberado 🚀
                            </p>
                        )}
                    </div>

                    {/* Action Button */}
                    <Button
                        size="lg"
                        disabled={!canRespond}
                        onClick={onRespond}
                        className={cn(
                            "font-black px-8 text-xs h-12 rounded-xl transition-all active:scale-95 gap-3 shrink-0",
                            canRespond
                                ? "bg-white text-indigo-700 hover:bg-white/90 shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
                                : "bg-black/20 text-white/30 cursor-not-allowed border border-white/5 backdrop-blur-sm"
                        )}
                    >
                        {!canRespond ? (
                            <Lock className="w-4 h-4 opacity-50" />
                        ) : isGoalMet ? (
                            <CheckCircle2 className="w-4 h-4 text-orange-600" />
                        ) : null}
                        RESPONDER CHECK-IN
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
