import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMealPlans } from "@/services/studentService";
import { saveMealLog, uploadMealPhoto, getMealLogsByDate } from "@/services/mealLogService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Utensils,
    Flame,
    Beef,
    Wheat,
    Droplets,
    Clock,
    Loader2,
    CheckCircle2,
    Camera,
    Check,
    Image as ImageIcon,
    Edit2,
    Save,
    Plus,
    Minus,
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StudentDiet() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
    const [isUploading, setIsUploading] = useState<string | null>(null);
    const [editingMealKey, setEditingMealKey] = useState<string | null>(null);
    const [tempFoods, setTempFoods] = useState<Record<string, any[]>>({});

    const { data: plans, isLoading } = useQuery({
        queryKey: ['myDiet', user?.id],
        queryFn: () => getMealPlans(user?.id!),
        enabled: !!user?.id
    });

    const todayDate = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

    const { data: todayLogs = [] } = useQuery({
        queryKey: ['todayMealLogs', user?.id, todayDate],
        queryFn: () => getMealLogsByDate(user?.id!, todayDate),
        enabled: !!user?.id
    });

    const checkedMeals = useMemo(() => {
        return new Set(todayLogs.map((log: any) => log.meal_name));
    }, [todayLogs]);

    const activePlan = plans?.[0]; // Pega o plano alimentar mais recente

    const groupedMeals = useMemo(() => {
        if (!activePlan?.meals) return [];
        const groups: Record<string, any[]> = {};
        activePlan.meals.forEach((meal: any) => {
            const key = meal.name; // Simplificar a chave para o nome, já que é o que usamos no checkedMeals
            if (!groups[key]) groups[key] = [];
            groups[key].push(meal);
        });
        return Object.values(groups);
    }, [activePlan]);

    const handlePhotoUpload = async (mealName: string, file: File) => {
        if (!user?.id || isSaving[mealName]) return;
        if (checkedMeals.has(mealName)) {
            toast.error("Esta refeição já foi registrada hoje");
            return;
        }

        setIsUploading(mealName);
        setIsSaving(prev => ({ ...prev, [mealName]: true }));
        try {
            const photoUrl = await uploadMealPhoto(file, user.id);
            await saveMealLog({
                student_id: user.id,
                meal_plan_id: activePlan?.id,
                meal_name: mealName,
                photo_url: photoUrl
            });

            toast.success(`${mealName} registrado com foto!`);

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['todayMealLogs', user.id, todayDate] }),
                queryClient.invalidateQueries({ queryKey: ['studentMealLogs'] })
            ]);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar foto da refeição");
        } finally {
            setIsUploading(null);
            setIsSaving(prev => ({ ...prev, [mealName]: false }));
        }
    };

    const handleCheckMeal = async (mealName: string, modifiedFoods?: any[]) => {
        if (!user?.id || isSaving[mealName]) return;
        if (checkedMeals.has(mealName)) {
            toast.error("Esta refeição já foi registrada hoje");
            return;
        }

        setIsSaving(prev => ({ ...prev, [mealName]: true }));
        try {
            await saveMealLog({
                student_id: user.id,
                meal_plan_id: activePlan?.id,
                meal_name: mealName,
                modified_foods: modifiedFoods
            });

            toast.success(`${mealName} concluído${modifiedFoods ? ' com edições' : ''}!`);
            setEditingMealKey(null);

            // Invalidação imediata e forçada
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['todayMealLogs', user.id, todayDate] }),
                queryClient.invalidateQueries({ queryKey: ['studentMealLogs'] })
            ]);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao registrar refeição");
        } finally {
            setIsSaving(prev => ({ ...prev, [mealName]: false }));
        }
    };

    const startEditing = (mealKey: string, foods: any[]) => {
        setEditingMealKey(mealKey);
        setTempFoods(prev => ({
            ...prev,
            [mealKey]: JSON.parse(JSON.stringify(foods))
        }));
    };

    const updateFoodQuantity = (mealKey: string, foodId: string, delta: number) => {
        setTempFoods(prev => {
            const foods = prev[mealKey] || [];
            return {
                ...prev,
                [mealKey]: foods.map(f => {
                    if (f.id === foodId) {
                        const currentQty = typeof f.quantity === 'string' ? parseFloat(f.quantity) : f.quantity;
                        const newQty = Math.max(0, (currentQty || 0) + delta);
                        return { ...f, quantity: newQty };
                    }
                    return f;
                })
            };
        });
    };

    const updateFoodName = (mealKey: string, foodId: string, name: string) => {
        setTempFoods(prev => ({
            ...prev,
            [mealKey]: (prev[mealKey] || []).map(f => f.id === foodId ? { ...f, name } : f)
        }));
    };

    const removeFood = (mealKey: string, foodId: string) => {
        setTempFoods(prev => ({
            ...prev,
            [mealKey]: (prev[mealKey] || []).filter(f => f.id !== foodId)
        }));
    };

    const addFood = (mealKey: string) => {
        const newFood = {
            id: `new-${Date.now()}`,
            name: 'Nova Comida',
            quantity: 100,
            unit: 'g'
        };
        setTempFoods(prev => ({
            ...prev,
            [mealKey]: [...(prev[mealKey] || []), newFood]
        }));
    };

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
            <header className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10">
                                <span className="text-amber-600 dark:text-amber-400 uppercase tracking-widest text-[9px] font-black">
                                    Estratégia Nutricional Ativa
                                </span>
                            </div>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-foreground">{activePlan.title}</h1>
                        <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold text-amber-600 dark:text-amber-500">{activePlan.goal}</p>
                    </div>

                    {/* Progress Circle - Mobile Friendly */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-muted/20"
                            />
                            <motion.circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={175.9}
                                initial={{ strokeDashoffset: 175.9 }}
                                animate={{ strokeDashoffset: 175.9 - (175.9 * (checkedMeals.size / groupedMeals.length)) }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="text-primary"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm font-black italic tabular-nums">{Math.round((checkedMeals.size / groupedMeals.length) * 100)}%</span>
                        </div>
                    </div>
                </div>

                {/* Daily Overview Card */}
                <div className="p-4 rounded-3xl bg-zinc-900 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Progresso do Dia</p>
                            <h2 className="text-lg font-bold text-white italic uppercase tracking-tight">
                                {checkedMeals.size} de {groupedMeals.length} refeições
                            </h2>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                            <Utensils className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(checkedMeals.size / groupedMeals.length) * 100}%` }}
                        />
                    </div>
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700" />
                </div>
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
                            <Card className="bg-card border-0 overflow-hidden">
                                <CardHeader className="p-4 border-b border-border/50 pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary relative">
                                                <Clock className="w-5 h-5" />
                                                {checkedMeals.has(currentMeal.name) && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-background">
                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-bold text-foreground uppercase tracking-tight leading-none">{currentMeal.name}</h3>
                                                    {checkedMeals.has(currentMeal.name) && (
                                                        <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Concluída</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">{currentMeal.meal_time}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!checkedMeals.has(currentMeal.name) && (
                                                <button
                                                    onClick={() => {
                                                        if (editingMealKey === mealKey) {
                                                            setEditingMealKey(null);
                                                        } else {
                                                            startEditing(mealKey, currentMeal.meal_foods);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                        editingMealKey === mealKey ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:text-amber-500"
                                                    )}
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                            )}

                                            <input
                                                type="file"
                                                accept="image/*"
                                                id={`photo-${mealKey}`}
                                                className="hidden"
                                                capture="environment"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handlePhotoUpload(currentMeal.name, file);
                                                }}
                                            />
                                            <label
                                                htmlFor={`photo-${mealKey}`}
                                                className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                                                    isUploading === currentMeal.name ? "bg-primary/20 animate-pulse" : "bg-muted hover:bg-muted/80",
                                                    (checkedMeals.has(currentMeal.name) || isSaving[currentMeal.name]) && "opacity-50 cursor-not-allowed pointer-events-none"
                                                )}
                                            >
                                                {isUploading === currentMeal.name ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                ) : (
                                                    <Camera className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </label>

                                            <button
                                                onClick={() => {
                                                    if (editingMealKey === mealKey) {
                                                        handleCheckMeal(currentMeal.name, tempFoods[mealKey]);
                                                    } else {
                                                        handleCheckMeal(currentMeal.name);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                    checkedMeals.has(currentMeal.name)
                                                        ? "bg-emerald-500 text-white"
                                                        : isSaving[currentMeal.name]
                                                            ? "bg-primary/20 animate-pulse text-primary"
                                                            : editingMealKey === mealKey
                                                                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                                                                : "bg-muted text-muted-foreground hover:text-primary"
                                                )}
                                                disabled={checkedMeals.has(currentMeal.name) || isSaving[currentMeal.name]}
                                            >
                                                {checkedMeals.has(currentMeal.name) ? (
                                                    <Check className="w-5 h-5" />
                                                ) : isSaving[currentMeal.name] ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : editingMealKey === mealKey ? (
                                                    <Save className="w-5 h-5" />
                                                ) : (
                                                    <CheckCircle2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Premium Option Switcher */}
                                    {!editingMealKey && (
                                        <div className="flex p-1 bg-muted rounded-xl">
                                            {options.map((opt, optIdx) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setSelectedOptions(prev => ({ ...prev, [mealKey]: optIdx }))}
                                                    className={cn(
                                                        "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all relative overflow-hidden",
                                                        currentOptionIdx === optIdx
                                                            ? "text-primary-foreground shadow-md"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                    )}
                                                >
                                                    {currentOptionIdx === optIdx && (
                                                        <motion.div
                                                            className="absolute inset-0 bg-primary"
                                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                        />
                                                    )}
                                                    <span className="relative z-10">Opção {optIdx + 1}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {editingMealKey === mealKey && (
                                        <div className="px-1 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Modo de Edição Ativo</span>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/50">
                                        {(editingMealKey === mealKey ? tempFoods[mealKey] : currentMeal.meal_foods)?.map((food: any) => (
                                            <div key={food.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/30 transition-colors group gap-4">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-125 transition-transform shrink-0" />
                                                    {editingMealKey === mealKey ? (
                                                        <div className="flex flex-col flex-1 gap-1">
                                                            <input
                                                                type="text"
                                                                value={food.name}
                                                                placeholder="Nome do alimento"
                                                                onChange={(e) => updateFoodName(mealKey, food.id, e.target.value)}
                                                                className="bg-background border border-border/50 rounded px-2 py-1 text-sm font-bold w-full focus:ring-1 focus:ring-primary outline-none"
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={food.unit}
                                                                    placeholder="Unid (ex: g, ml)"
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setTempFoods(prev => ({
                                                                            ...prev,
                                                                            [mealKey]: (prev[mealKey] || []).map(f => f.id === food.id ? { ...f, unit: val } : f)
                                                                        }));
                                                                    }}
                                                                    className="bg-background/50 border border-border/30 rounded px-1.5 py-0.5 text-[10px] uppercase font-black w-14 focus:ring-1 focus:ring-primary outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-bold text-foreground/80 dark:text-zinc-200 group-hover:text-foreground dark:group-hover:text-white transition-colors">
                                                            {food.name}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                                    {editingMealKey === mealKey ? (
                                                        <>
                                                            <div className="flex items-center gap-2 bg-background rounded-lg border border-border/50 p-1">
                                                                <button
                                                                    onClick={() => updateFoodQuantity(mealKey, food.id, -5)}
                                                                    className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <div className="flex flex-col items-center min-w-[60px]">
                                                                    <input
                                                                        type="number"
                                                                        value={food.quantity}
                                                                        onChange={(e) => {
                                                                            const val = parseFloat(e.target.value) || 0;
                                                                            setTempFoods(prev => {
                                                                                const foods = prev[mealKey] || [];
                                                                                return {
                                                                                    ...prev,
                                                                                    [mealKey]: foods.map(f => f.id === food.id ? { ...f, quantity: val } : f)
                                                                                };
                                                                            });
                                                                        }}
                                                                        className="w-full text-center bg-transparent border-0 focus:ring-0 text-sm font-black tabular-nums"
                                                                    />
                                                                    <span className="text-[8px] uppercase font-bold text-muted-foreground">{food.unit}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => updateFoodQuantity(mealKey, food.id, 5)}
                                                                    className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFood(mealKey, food.id)}
                                                                className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm font-bold text-foreground tabular-nums bg-muted px-2 py-0.5 rounded">
                                                            {food.quantity}<span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-bold ml-0.5 uppercase">{food.unit}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {editingMealKey === mealKey && (
                                            <div className="p-4 bg-muted/20 border-t border-border/50">
                                                <button
                                                    onClick={() => addFood(mealKey)}
                                                    className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                                >
                                                    <div className="w-6 h-6 rounded-lg bg-background flex items-center justify-center border border-border/50 group-hover:scale-110 transition-transform">
                                                        <Plus className="w-3 h-3 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest">Adicionar Alimento</span>
                                                </button>
                                            </div>
                                        )}
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
