import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getPlans, createPlan, updatePlan, deletePlan, Plan } from "@/services/financeService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, CreditCard, Calendar, Repeat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { cn } from "@/lib/utils";

export default function PlanManager() {
    const { user } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        type: "recurring",
        duration_months: "1"
    });

    useEffect(() => {
        if (user) loadPlans();
    }, [user]);

    const loadPlans = async () => {
        try {
            const data = await getPlans(user?.id!);
            setPlans(data);
        } catch (error) {
            toast.error("Erro ao carregar planos");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                description: plan.description || "",
                price: plan.price.toString(),
                type: plan.type,
                duration_months: plan.duration_months.toString()
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: "",
                description: "",
                price: "",
                type: "recurring",
                duration_months: "1"
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                type: formData.type as 'recurring' | 'installment' | 'one_time',
                duration_months: parseInt(formData.duration_months)
            };

            if (editingPlan) {
                await updatePlan(editingPlan.id, payload);
                toast.success("Plano atualizado!");
            } else {
                await createPlan(payload);
                toast.success("Plano criado!");
            }
            await loadPlans();
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Erro ao salvar plano");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este plano?")) {
            try {
                await deletePlan(id);
                toast.success("Plano removido");
                loadPlans();
            } catch (error) {
                toast.error("Erro ao remover plano");
            }
        }
    };

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
                    <DashboardHeader title="Gerenciador de Planos Financeiros" />

                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header Action */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Modelos de Venda</h2>
                                <p className="text-muted-foreground text-sm">Crie planos para cobrar seus alunos de forma recorrente ou parcelada</p>
                            </div>
                            <Button onClick={() => handleOpenModal()} className="gap-2">
                                <Plus className="w-4 h-4" /> Novo Plano
                            </Button>
                        </div>

                        {/* Plans Grid */}
                        {loading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                        ) : plans.length === 0 ? (
                            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">Nenhum plano criado</h3>
                                <p className="text-muted-foreground mb-6">Comece criando seu primeiro modelo de cobrança</p>
                                <Button onClick={() => handleOpenModal()}>Criar Plano</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <Card key={plan.id} className="border-border hover:border-primary/50 transition-colors">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className={`p-2 rounded-lg ${plan.type === 'recurring' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    {plan.type === 'recurring' ? <Repeat className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenModal(plan)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(plan.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardTitle className="mt-4 text-xl">R$ {plan.price.toFixed(2)}</CardTitle>
                                            <CardDescription>{plan.name}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-sm text-muted-foreground line-clamp-2">
                                                {plan.description || "Sem descrição"}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex justify-between">
                                            <span>
                                                {plan.type === 'recurring'
                                                    ? 'Cobrança Mensal'
                                                    : plan.type === 'installment'
                                                        ? `Duração de ${plan.duration_months} meses`
                                                        : 'Pagamento Único'}
                                            </span>
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{plan.type}</span>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create/Edit Modal */}
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano de Venda'}</DialogTitle>
                                <DialogDescription>Configure os detalhes do modelo de cobrança.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome do Plano</Label>
                                    <Input
                                        placeholder="Ex: Consultoria Trimestral"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Valor (R$)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="recurring">Recorrente (Mensal)</SelectItem>
                                                <SelectItem value="installment">Parcelado/Ciclo</SelectItem>
                                                <SelectItem value="one_time">Pagamento Único</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Duração (Meses)</Label>
                                    <Input
                                        type="number"
                                        value={formData.duration_months}
                                        onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                                        min="1"
                                    />
                                    <p className="text-xs text-muted-foreground">Ciclo de renovação ou duração do contrato.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Descrição (Opcional)</Label>
                                    <Textarea
                                        placeholder="Detalhes do que está incluso..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Salvar Plano
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    );
}
