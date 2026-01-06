import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { FinanceDashboard } from "@/components/finance/FinanceDashboard";
import { CreditCard, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinancePage() {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div
                className={cn(
                    "transition-all duration-300 ease-out min-h-screen",
                    sidebarCollapsed ? "ml-16" : "ml-60"
                )}
            >
                <main className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-3xl p-8">
                    <DashboardHeader title="Gestão Financeira" />

                    <div className="max-w-7xl mx-auto space-y-8">

                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Visão Geral</h2>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => navigate('/financeiro/historico')} disabled>
                                    <History className="w-4 h-4 mr-2" /> Histórico
                                </Button>
                                <Button onClick={() => navigate('/financeiro/planos')}>
                                    <Settings className="w-4 h-4 mr-2" /> Gerenciar Planos
                                </Button>
                            </div>
                        </div>

                        <FinanceDashboard />

                        {/* Transações Recentes (Placeholder) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Transações Recentes</h3>
                            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                                <CreditCard className="w-10 h-10 mx-auto opacity-20 mb-2" />
                                <p>Nenhuma transação registrada este mês.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
