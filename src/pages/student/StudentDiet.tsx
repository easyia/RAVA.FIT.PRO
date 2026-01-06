import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMealPlans } from "@/services/studentService";
import { useQuery } from "@tanstack/react-query";
import {
    Utensils,
    Flame,
    Beef,
    Wheat,
    Droplets,
    Clock,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StudentDiet() {
    const { user } = useAuth();
    const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});

    const { data: plans, isLoading } = useQuery({
        queryKey: ['myDiet', user?.id],
        queryFn: () => getMealPlans(user?.id!),
        enabled: !!user?.id
    });

    const activePlan = plans?.[0]; // Pega o plano alimentar mais recente

    const groupedMeals = useMemo(() => {
        if (!activePlan?.meals) return [];
        const groups: Record<string, any[]> = {};
        activePlan.meals.forEach((meal: any) => {
            const key = `${meal.name}-${meal.meal_time}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(meal);
        });
        return Object.values(groups);
    }, [activePlan]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!activePlan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                    <Utensils className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-bold mb-2">Sem Dieta Ativa</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Seu plano alimentar ainda está sendo processado pelo Coach.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            <header className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10">
                        <span className="text-amber-600 dark:text-amber-400 uppercase tracking-widest text-[9px] font-black">
                            Estratégia Nutricional Ativa
                        </span>
                    </div>
                </div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-foreground">{activePlan.title}</h1>
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold text-amber-600 dark:text-amber-500">{activePlan.goal}</p>
            </header>

            {/* Macros Card - PRO Design */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: 'KCAL', value: activePlan.total_calories, icon: Flame, color: 'text-orange-600 dark:text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                    { label: 'PROT', value: Math.round(activePlan.total_proteins), icon: Beef, color: 'text-red-600 dark:text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                    { label: 'CARB', value: Math.round(activePlan.total_carbs), icon: Wheat, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                    { label: 'GORD', value: Math.round(activePlan.total_fats), icon: Droplets, color: 'text-cyan-600 dark:text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' }
                ].map((macro, i) => (
                    <div key={i} className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border backdrop-blur-sm", macro.bg, macro.border)}>
                        <macro.icon className={cn("w-4 h-4 mb-1.5", macro.color)} />
                        <span className="text-sm font-black text-foreground dark:text-white leading-none">{macro.value}</span>
                        <span className="text-[9px] text-muted-foreground dark:text-zinc-400 font-bold mt-1 tracking-wider">{macro.label}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-3 bg-amber-500 rounded-full" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-400">Refeições do Dia</h2>
                </div>

                {groupedMeals.map((options: any[], groupIdx: number) => {
                    const mealKey = `${options[0].name}-${options[0].meal_time}`;
                    const currentOptionIdx = selectedOptions[mealKey] || 0;
                    const currentMeal = options[currentOptionIdx] || options[0];

                    return (
                        <motion.div
                            key={mealKey}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIdx * 0.1 }}
                        >
                            <Card className="bg-card dark:bg-zinc-900/80 backdrop-blur-xl border border-border dark:border-white/10 overflow-hidden shadow-lg">
                                <CardHeader className="p-4 border-b border-border dark:border-white/5 pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-muted dark:bg-white/5 border border-border dark:border-white/5 flex items-center justify-center text-amber-600 dark:text-amber-500 shadow-inner">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-foreground dark:text-white uppercase italic tracking-tight leading-none mb-1">{currentMeal.name}</h3>
                                                <p className="text-[10px] text-muted-foreground dark:text-zinc-400 font-bold uppercase tracking-widest">{currentMeal.meal_time}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Premium Option Switcher */}
                                    <div className="flex p-1 bg-muted dark:bg-black/40 rounded-xl border border-border dark:border-white/5">
                                        {options.map((opt, optIdx) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelectedOptions(prev => ({ ...prev, [mealKey]: optIdx }))}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all relative overflow-hidden",
                                                    currentOptionIdx === optIdx
                                                        ? "text-white dark:text-black shadow-md"
                                                        : "text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:hover:text-zinc-300 hover:bg-background dark:hover:bg-white/5"
                                                )}
                                            >
                                                {currentOptionIdx === optIdx && (
                                                    <motion.div
                                                        layoutId={`active-pill-${mealKey}`}
                                                        className="absolute inset-0 bg-amber-600 dark:bg-amber-500"
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                                <span className="relative z-10">Opção {optIdx + 1}</span>
                                            </button>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border dark:divide-white/5">
                                        {currentMeal.meal_foods?.map((food: any) => (
                                            <div key={food.id} className="p-4 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/5 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:scale-125 transition-transform" />
                                                    <span className="text-sm font-bold text-foreground/80 dark:text-zinc-200 group-hover:text-foreground dark:group-hover:text-white transition-colors">
                                                        {food.name}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-black text-foreground/90 dark:text-white/90 tabular-nums bg-muted dark:bg-white/5 px-2 py-0.5 rounded border border-border dark:border-white/5">
                                                    {food.quantity}<span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-bold ml-0.5 uppercase">{food.unit}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
