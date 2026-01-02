import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, ClipboardList, Dumbbell, Utensils } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/services/studentService";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { getStudents, getMealPlans, getTrainingPrograms } from "@/services/studentService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Reports = () => {
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ["dashboardStats"],
        queryFn: getDashboardStats,
    });

    const { data: students } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    const { data: mealPlans, isLoading: isLoadingMeals } = useQuery({
        queryKey: ["mealPlans", selectedStudentId],
        queryFn: () => getMealPlans(selectedStudentId!),
        enabled: !!selectedStudentId,
    });

    const { data: trainingPrograms, isLoading: isLoadingTraining } = useQuery({
        queryKey: ["trainingPrograms", selectedStudentId],
        queryFn: () => getTrainingPrograms(selectedStudentId!),
        enabled: !!selectedStudentId,
    });

    const latestMealPlan = mealPlans?.[0];
    const latestProgram = trainingPrograms?.[0];

    // Mock data for charts
    const growthData = [
        { name: 'Jan', students: 4 },
        { name: 'Fev', students: 7 },
        { name: 'Mar', students: 12 },
        { name: 'Abr', students: 18 },
        { name: 'Mai', students: 25 },
        { name: 'Jun', students: stats?.totalStudents || 0 },
    ];

    const protocolData = [
        { name: 'Treinos', value: 45, color: '#F59E0B' },
        { name: 'Dietas', value: 32, color: '#10B981' },
    ];

    const activeInactiveData = [
        { name: 'Ativos', value: stats?.activeStudents || 0, color: '#F59E0B' },
        { name: 'Inativos', value: (stats?.totalStudents || 0) - (stats?.activeStudents || 0), color: '#374151' },
    ];

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            <div className={cn("transition-all duration-300 min-h-screen pb-10", sidebarCollapsed ? "ml-16" : "ml-60")}>
                <main className="p-8">
                    <DashboardHeader
                        title="Relatórios & Performance"
                        actions={
                            <div className="flex items-center gap-4">
                                <Select onValueChange={setSelectedStudentId} value={selectedStudentId || undefined}>
                                    <SelectTrigger className="w-[250px] bg-card border-border">
                                        <SelectValue placeholder="Selecionar aluno para relatório..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students?.map(student => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" className="border-border">
                                    <Download className="w-4 h-4 mr-2" /> Exportar PDF
                                </Button>
                            </div>
                        }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-card/50 border-border shadow-md">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-primary/10 rounded-lg"><Users className="w-4 h-4 text-primary" /></div>
                                    <span className="text-sm font-medium text-muted-foreground">Retenção de Alunos</span>
                                </div>
                                <h3 className="text-2xl font-bold">94%</h3>
                                <p className="text-xs text-status-success flex items-center gap-1 mt-1">
                                    <TrendingUp className="w-3 h-3" /> +2.1% este mês
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 border-border shadow-md">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-status-success/10 rounded-lg"><ClipboardList className="w-4 h-4 text-status-success" /></div>
                                    <span className="text-sm font-medium text-muted-foreground">Check-ins Realizados</span>
                                </div>
                                <h3 className="text-2xl font-bold">158</h3>
                                <p className="text-xs text-status-success flex items-center gap-1 mt-1">
                                    <TrendingUp className="w-3 h-3" /> +12% este mês
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-card/50 border-border shadow-md">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-status-info/10 rounded-lg"><Dumbbell className="w-4 h-4 text-status-info" /></div>
                                    <span className="text-sm font-medium text-muted-foreground">Satisfação Média</span>
                                </div>
                                <h3 className="text-2xl font-bold">4.9/5.0</h3>
                                <p className="text-xs text-status-success flex items-center gap-1 mt-1">
                                    <TrendingUp className="w-3 h-3" /> Estável
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Diet / Macro Report */}
                        <Card className="border-border bg-card shadow-xl rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Utensils className="w-5 h-5 text-accent" /> Relatório de Dieta
                                </CardTitle>
                                <CardDescription>Consumo prescrito de macronutrientes do plano atual</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full">
                                {selectedStudentId ? (
                                    latestMealPlan ? (
                                        <div className="h-full flex flex-col md:flex-row items-center gap-6">
                                            <div className="w-full md:w-1/2 h-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Proteína', value: Number(latestMealPlan.total_proteins) || 0, color: '#F59E0B' },
                                                                { name: 'Carbo', value: Number(latestMealPlan.total_carbs) || 0, color: '#10B981' },
                                                                { name: 'Gordura', value: Number(latestMealPlan.total_fats) || 0, color: '#3B82F6' },
                                                            ]}
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            <Cell fill="#F59E0B" />
                                                            <Cell fill="#10B981" />
                                                            <Cell fill="#3B82F6" />
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="w-full md:w-1/2 space-y-4">
                                                <div className="p-3 bg-muted/20 rounded-lg border border-border">
                                                    <p className="text-sm text-muted-foreground uppercase text-xs font-bold tracking-wider">Calorias Totais</p>
                                                    <h4 className="text-2xl font-bold text-primary">{latestMealPlan.total_calories} kcal</h4>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="text-center p-2 bg-sidebar/50 rounded border border-border">
                                                        <p className="text-[10px] text-muted-foreground uppercase">Prot</p>
                                                        <p className="font-bold text-sm">{latestMealPlan.total_proteins}g</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-sidebar/50 rounded border border-border">
                                                        <p className="text-[10px] text-muted-foreground uppercase">Carb</p>
                                                        <p className="font-bold text-sm">{latestMealPlan.total_carbs}g</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-sidebar/50 rounded border border-border">
                                                        <p className="text-[10px] text-muted-foreground uppercase">Lip</p>
                                                        <p className="font-bold text-sm">{latestMealPlan.total_fats}g</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                                            <Utensils className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="font-semibold text-foreground">Sem Plano Alimentar</p>
                                            <p className="text-sm max-w-[250px]">Este relatório é gerado automaticamente a partir da última dieta prescrita. Como não há prescrição ativa para este aluno, o relatório não pode ser processado.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground italic">Selecione um aluno para ver o relatório nutricional.</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Training Volume Report */}
                        <Card className="border-border bg-card shadow-xl rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Dumbbell className="w-5 h-5 text-primary" /> Relatório de Treino
                                </CardTitle>
                                <CardDescription>Volume semanal total por agrupamento muscular</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full">
                                {selectedStudentId ? (
                                    latestProgram ? (
                                        <div className="h-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                                                    (() => {
                                                        const volumes: Record<string, number> = {};
                                                        latestProgram.training_sessions?.forEach((session: any) => {
                                                            session.training_exercises?.forEach((ex: any) => {
                                                                const muscle = ex.main_muscle_group || 'Outros';
                                                                const volume = (ex.sets || 0) * (ex.reps_max || 0);
                                                                volumes[muscle] = (volumes[muscle] || 0) + volume;
                                                            });
                                                        });
                                                        return Object.entries(volumes).map(([name, value]) => ({ name, value }));
                                                    })()
                                                }>
                                                    <PolarGrid stroke="#374151" />
                                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                                    <Radar
                                                        name="Volume"
                                                        dataKey="value"
                                                        stroke="#F59E0B"
                                                        fill="#F59E0B"
                                                        fillOpacity={0.5}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                                            <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="font-semibold text-foreground">Sem Protocolo de Treino</p>
                                            <p className="text-sm max-w-[250px]">O volume semanal é calculado com base nas séries e repetições prescritas. Sem um protocolo ativo, não há dados para gerar este gráfico.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground italic">Selecione um aluno para ver o volume de treinamento.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="border-border bg-card shadow-xl rounded-2xl lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Status dos Alunos</CardTitle>
                                <CardDescription>Proporção de alunos ativos vs inativos</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={activeInactiveData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {activeInactiveData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-card shadow-xl rounded-2xl lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Metas Sugeridas</CardTitle>
                                <CardDescription>Objetivos recomendados com base no seu crescimento</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-xl border border-border bg-sidebar/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
                                        <div>
                                            <h4 className="font-semibold">Bater 30 alunos ativos</h4>
                                            <p className="text-xs text-muted-foreground">Faltam apenas {30 - (stats?.activeStudents || 0)} alunos para sua próxima meta.</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-primary">83%</div>
                                </div>
                                <div className="p-4 rounded-xl border border-border bg-sidebar/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-status-success/20 flex items-center justify-center"><Utensils className="w-5 h-5 text-status-success" /></div>
                                        <div>
                                            <h4 className="font-semibold">Planos de Nutrição</h4>
                                            <p className="text-xs text-muted-foreground">Aumentar a criação de dietas para alunos cadastrados.</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-status-success">45%</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Reports;
