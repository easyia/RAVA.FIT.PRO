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
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const Reports = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { data: stats, isLoading } = useQuery({
        queryKey: ["dashboardStats"],
        queryFn: getDashboardStats,
    });

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
                            <Button variant="outline" className="border-border">
                                <Download className="w-4 h-4 mr-2" /> Exportar PDF
                            </Button>
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
                        {/* Growth Chart */}
                        <Card className="border-border bg-card shadow-xl rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Crescimento da Base de Alunos</CardTitle>
                                <CardDescription>Quantidade de alunos matriculados nos últimos 6 meses</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData}>
                                        <defs>
                                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                            itemStyle={{ color: '#F59E0B' }}
                                        />
                                        <Area type="monotone" dataKey="students" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Protocol Distribution */}
                        <Card className="border-border bg-card shadow-xl rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Distribuição de Protocolos</CardTitle>
                                <CardDescription>Comparativo entre treinos e planos alimentares criados</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={protocolData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {protocolData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
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
