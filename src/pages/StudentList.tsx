import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StudentCard } from "@/components/dashboard/StudentCard";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Users, SearchX, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStudents, deleteStudent, updateStudentStatus } from "@/services/studentService";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentDetailsModal } from "@/components/dashboard/StudentDetailsModal";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getPlans, createSubscription, Plan } from "@/services/financeService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type FilterStatus = 'todos' | 'ativo' | 'inativo' | 'excluido' | 'pendente';

const filterTabs: { value: FilterStatus; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'inativo', label: 'Inativos' },
  { value: 'excluido', label: 'Excluídos' },
];

const StudentList = () => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Activation Flow States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [activationStudentId, setActivationStudentId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isActivating, setIsActivating] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });

  const handleOpenDetails = (id: string) => {
    setSelectedStudentId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja mover este aluno para a lixeira?")) {
      try {
        await updateStudentStatus(id, 'deleted');
        toast.success("Aluno movido para excluídos!");
        queryClient.invalidateQueries({ queryKey: ["students"] });
      } catch (error) {
        toast.error("Erro ao remover aluno.");
      }
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    if (status === 'ativo') {
      try {
        const availablePlans = await getPlans(user?.id!);
        if (availablePlans && availablePlans.length > 0) {
          setPlans(availablePlans);
          setActivationStudentId(id);
          if (availablePlans.length > 0) setSelectedPlanId(availablePlans[0].id);
          setIsPlanModalOpen(true);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const statusMap: Record<string, string> = {
        'ativo': 'active',
        'inativo': 'inactive',
        'pendente': 'pending_approval',
        'excluido': 'deleted'
      };
      const dbStatus = statusMap[status] || status;
      await updateStudentStatus(id, dbStatus);
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (error) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleConfirmActivation = async () => {
    if (!activationStudentId || !selectedPlanId) return;
    setIsActivating(true);
    try {
      await createSubscription({
        student_id: activationStudentId,
        plan_id: selectedPlanId,
        start_date: new Date().toISOString(),
        payment_day: new Date().getDate(),
        auto_renew: true
      });

      await updateStudentStatus(activationStudentId, 'active');

      toast.success("Aluno ativado e plano vinculado!");
      setIsPlanModalOpen(false);
      setActivationStudentId(null);
      setSelectedPlanId('');
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (error) {
      toast.error("Erro ao ativar aluno.");
    } finally {
      setIsActivating(false);
    }
  };

  const handleEdit = (student: any) => {
    navigate(`/cadastro/${student.id}`);
  };

  const filteredStudents = students.filter((student) => {
    const matchesFilter = activeFilter === 'todos' || student.status === activeFilter;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-300 ease-out min-h-screen",
          sidebarCollapsed ? "ml-16" : "ml-60"
        )}
      >
        <main className="p-8">
          <DashboardHeader
            title="Alunos"
            showSearch={true}
            searchPlaceholder="Buscar alunos..."
            onSearch={setSearchQuery}
            actions={
              <Button
                onClick={() => navigate('/cadastro')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-button h-11 px-5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Aluno
              </Button>
            }
          />

          {/* Filter tabs */}
          <div className="flex items-center gap-1 mb-8 border-b border-border">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors relative",
                  activeFilter === tab.value
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {activeFilter === tab.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Student grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onClick={() => handleOpenDetails(student.id)}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={searchQuery ? SearchX : Users}
              title={
                searchQuery
                  ? "Nenhum resultado encontrado"
                  : activeFilter !== 'todos'
                    ? "Nenhum aluno encontrado"
                    : "Sua lista de alunos está vazia"
              }
              description={
                searchQuery
                  ? `Não encontramos nenhum aluno correspondente a "${searchQuery}". Tente outros termos.`
                  : activeFilter !== 'todos'
                    ? `Não há alunos na categoria "${filterTabs.find(t => t.value === activeFilter)?.label}" no momento.`
                    : "Comece cadastrando seus alunos para gerenciar treinos, evoluções e protocolos."
              }
              actionText={
                searchQuery
                  ? "Limpar Busca"
                  : activeFilter !== 'todos'
                    ? "Limpar Filtro"
                    : "Cadastrar Novo Aluno"
              }
              onAction={() => {
                if (searchQuery) setSearchQuery('');
                else if (activeFilter !== 'todos') setActiveFilter('todos');
                else navigate("/cadastro");
              }}
            />
          )}

          <StudentDetailsModal
            studentId={selectedStudentId}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onStatusChange={handleStatusChange}
          />

          <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ativar Aluno</DialogTitle>
                <DialogDescription>
                  Escolha o plano financeiro para ativar este aluno.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - R$ {plan.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>Pular</Button>
                <Button onClick={handleConfirmActivation} disabled={isActivating}>
                  {isActivating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default StudentList;
