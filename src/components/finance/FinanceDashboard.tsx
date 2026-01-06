import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { getFinancialMetrics } from '@/services/financeService';
import { DollarSign, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FinanceDashboard() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadMetrics();
        }
    }, [user]);

    const loadMetrics = async () => {
        try {
            const data = await getFinancialMetrics(user?.id!);
            setMetrics(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>;
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-card to-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Receita Recorrente (MRR)
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {metrics?.monthlyRecurringRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Previsão mensal atual
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-blue-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Assinaturas Ativas
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.activeSubscriptions}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Alunos com planos vigentes
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-card to-amber-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pendências
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.pendingPayments}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Pagamentos em atraso ou abertos
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Aqui poderia entrar um gráfico de evolução financeira */}
            <div className="h-[200px] w-full bg-muted/10 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                Gráfico de fluxo de caixa em desenvolvimento...
            </div>
        </div>
    );
}
