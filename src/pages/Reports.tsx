import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, ClipboardList, Dumbbell, Utensils } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/services/studentService";
import { Badge } from "@/components/ui/badge";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";

const Reports = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { data: stats } = useQuery({
        queryKey: ["dashboardStats"],
        queryFn: getDashboardStats,
    });

    // Mock data for trends
    const retentionTrend = [
        { name: 'Mês 1', value: 85 },
        { name: 'Mês 2', value: 88 },
        { name: 'Mês 3', value: 92 },
        { name: 'Mês 4', value: 94 },
    ];

    const trainingActivity = [
        { name: 'Seg', value: 40 },
        { name: 'Ter', value: 55 },
        { name: 'Qua', value: 48 },
        { name: 'Qui', value: 70 },
        { name: 'Sex', value: 62 },
        { name: 'Sáb', value: 35 },
        { name: 'Dom', value: 20 },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            <div className={cn("transition-all duration-300 min-h-screen pb-10", sidebarCollapsed ? "ml-16" : "ml-60")}>
                <main className="p-8 max-w-7xl mx-auto">
                    <DashboardHeader
                        title="Dashboard do Treinador"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="border-border bg-card/40 backdrop-blur-xl border-l-4 border-l-primary shadow-lg hover:shadow-primary/5 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" /> Retenção de Alunos
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] border-status-success text-status-success bg-status-success/5 font-bold">+2.1%</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-1">94%</div>
                                <p className="text-[10px] text-muted-foreground">Comparado ao trimestre anterior</p>
                                <div className="h-[50px] mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={retentionTrend}>
                                            <Area type="monotone" dataKey="value" stroke="#9b87f5" fill="#9b87f5" fillOpacity={0.1} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-card/40 backdrop-blur-xl border-l-4 border-l-status-success shadow-lg hover:shadow-status-success/5 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-status-success" /> Check-ins Realizados
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] border-status-success text-status-success bg-status-success/5 font-bold">+12%</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-1">158</div>
                                <p className="text-[10px] text-muted-foreground">Treinos validados este mês</p>
                                <div className="h-[50px] mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={trainingActivity}>
                                            <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-card/40 backdrop-blur-xl border-l-4 border-l-status-warning shadow-lg hover:shadow-status-warning/5 transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Star className="w-4 h-4 text-status-warning" /> Satisfação Média
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground font-bold">Estável</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-1">4.9/5.0</div>
                                <p className="text-[10px] text-muted-foreground">Média de 42 avaliações pós-treino</p>
                                <div className="flex gap-1 mt-6">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={cn("w-4 h-4", i < 4 ? "fill-status-warning text-status-warning border-none" : "text-muted-foreground")} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-xl rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" /> Atividade de Treino
                                </CardTitle>
                                <CardDescription>Frequência semanal de validação de protocolos</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trainingActivity}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#6b7280" fontSize={12} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#9b87f5" fill="#9b87f5" fillOpacity={0.1} strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-xl rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent border-t-primary/20">
                            <CardHeader>
                                <CardTitle className="text-lg">Insights e Metas Sugeridas</CardTitle>
                                <CardDescription>Dicas automáticas para melhorar sua rentabilidade</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 flex items-center justify-between group hover:bg-primary/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center transition-transform group-hover:scale-110"><Users className="w-5 h-5 text-primary" /></div>
                                        <div>
                                            <h4 className="font-semibold text-sm">Meta: 30 Alunos Ativos</h4>
                                            <p className="text-xs text-muted-foreground">Faltam apenas {30 - (stats?.activeStudents || 0)} alunos para o próximo nível.</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-black text-primary">83%</div>
                                </div>

                                <div className="p-4 rounded-xl border border-status-success/10 bg-status-success/5 flex items-center justify-between group hover:bg-status-success/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-status-success/20 flex items-center justify-center transition-transform group-hover:scale-110"><ClipboardList className="w-5 h-5 text-status-success" /></div>
                                        <div>
                                            <h4 className="font-semibold text-sm">Fidelização: +15%</h4>
                                            <p className="text-xs text-muted-foreground">Parabéns! Sua taxa de renovação subiu este mês.</p>
                                        </div>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-status-success" />
                                </div>

                                <div className="mt-6 pt-6 border-t border-border">
                                    <p className="text-xs text-muted-foreground text-center italic">
                                        "O foco na experiência do aluno resultou em uma nota de satisfação 4.9. Continue postando feedbacks para atrair mais alunos online."
                                    </p>
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
