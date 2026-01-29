import { Users, UserCheck, ClipboardList, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: number | string;
    icon: any;
    trend: string | null;
    trendType: 'up' | 'down';
    className?: string;
}

function StatCard({ title, value, icon: Icon, trend, trendType, className }: StatCardProps) {
    return (
        <div className={cn("card-elevated p-6 flex flex-col justify-between h-[160px]", className)}>
            <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg bg-sidebar/50 border border-border/50">
                    <Icon className="w-5 h-5 text-tertiary" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        trendType === 'up' ? "text-status-success" : "text-status-error"
                    )}>
                        {trendType === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
    );
}

interface StatsGridProps {
    stats: {
        totalStudents: number;
        activeStudents: number;
        pendingAnamnesis: number;
        protocolsThisMonth: number;
        trends: {
            totalStudents: string | null;
            activeStudents: string | null;
            pendingAnamnesis: string | null;
            protocols: string | null;
        };
    };
    isLoading?: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[160px] rounded-xl bg-card animate-pulse border border-border" />
                ))}
            </div>
        );
    }

    const getTrendType = (trend: string | null | undefined, inverse = false) => {
        if (!trend) return 'up';
        const isPositive = trend.startsWith('+');
        if (inverse) return isPositive ? 'down' : 'up';
        return isPositive ? 'up' : 'down';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
                title="Total de Alunos"
                value={stats.totalStudents}
                icon={Users}
                trend={stats.trends?.totalStudents}
                trendType={getTrendType(stats.trends?.totalStudents)}
            />
            <StatCard
                title="Alunos Ativos"
                value={stats.activeStudents}
                icon={UserCheck}
                trend={stats.trends?.activeStudents}
                trendType={getTrendType(stats.trends?.activeStudents)}
            />
            <StatCard
                title="Anamneses Pendentes"
                value={stats.pendingAnamnesis}
                icon={ClipboardList}
                trend={stats.trends?.pendingAnamnesis}
                trendType={getTrendType(stats.trends?.pendingAnamnesis, true)} // Invertido: cair é bom
            />
            <StatCard
                title="Protocolos Este Mês"
                value={stats.protocolsThisMonth}
                icon={FileText}
                trend={stats.trends?.protocols}
                trendType={getTrendType(stats.trends?.protocols)}
            />
        </div>
    );
}
