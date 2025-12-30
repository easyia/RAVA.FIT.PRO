import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StudentCard } from "@/components/dashboard/StudentCard";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getActiveStudents, deleteStudent, updateStudentStatus, getDashboardStats, getCoachProfile } from "@/services/studentService";
import { getRecentActivities, getCalendarEvents } from "@/services/activityService";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Plus, Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentDetailsModal } from "@/components/dashboard/StudentDetailsModal";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Button } from "@/components/ui/button";
import { ShutterLock } from "@/components/layout/ShutterLock";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: coach } = useQuery({
    queryKey: ["coachProfile"],
    queryFn: getCoachProfile,
  });

  // Effect to redirect to onboarding if profile is incomplete
  useEffect(() => {
    if (coach && !coach.specialty && !coach.phone) {
      // Se não tem especialidade ou telefone, consideramos incompleto
      navigate("/onboarding");
    }
  }, [coach, navigate]);

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

  const { data: activeStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["activeStudents"],
    queryFn: getActiveStudents,
  });

  const handleOpenDetails = (id: string) => {
    setSelectedStudentId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja eliminar este usuário?")) {
      try {
        await deleteStudent(id);
        toast.success("Aluno removido!");
        queryClient.invalidateQueries({ queryKey: ["activeStudents"] });
      } catch (error) {
        toast.error("Erro ao remover aluno.");
      }
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const dbStatus = status === 'ativo' ? 'active' : status === 'inativo' ? 'inactive' : 'waiting';
      await updateStudentStatus(id, dbStatus);
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["activeStudents"] });
    } catch (error) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleEdit = (student: any) => {
    navigate(`/cadastro/${student.id}`);
  };

  const { data: recentActivities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["recentActivities"],
    queryFn: getRecentActivities,
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["calendarEvents"],
    queryFn: getCalendarEvents,
  });

  const eventDates = calendarEvents.map(e => e.date);

  return (
    <div className="min-h-screen bg-background">
      <ShutterLock isLocked={isLocked} onToggle={() => setIsLocked(!isLocked)} />
      {/* Sidebar */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          sidebarCollapsed ? "ml-16" : "ml-60"
        )}
      >
        <div className="flex min-h-screen">
          {/* Center column - Main content */}
          <main className="flex-1 p-8 lg:pr-4">
            <DashboardHeader
              title={coach ? `Olá, ${coach.name.split(' ')[0]}! 👋` : "Dashboard"}
              showSearch={true}
              searchPlaceholder="Buscar alunos, protocolos..."
              actions={
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                    className="xl:hidden"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/ia-assistant')}
                    className="h-11 px-4 gap-2 hidden sm:flex border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Assistente IA</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/cadastro')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 shadow-button"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Novo Aluno
                  </Button>
                </div>
              }
            />

            <StatsGrid stats={stats} isLoading={isLoadingStats} />

            {/* Active students section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h2 text-foreground">Alunos Ativos</h2>
                {activeStudents.length > 0 && (
                  <button
                    onClick={() => navigate('/alunos')}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Ver Todos
                  </button>
                )}
              </div>

              {isLoadingStudents ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-xl" />
                  ))}
                </div>
              ) : activeStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeStudents.slice(0, 4).map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onClick={() => handleOpenDetails(student.id)}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Nenhum aluno ativo"
                  description="Você ainda não possui alunos matriculados ou ativos no momento."
                  actionText="Cadastrar Primeiro Aluno"
                  onAction={() => navigate("/cadastro")}
                />
              )}
            </section>
          </main>

          {/* Right column - Side panel */}
          <aside className={cn(
            "hidden xl:flex flex-col border-l border-border bg-sidebar transition-all duration-300 ease-in-out h-[calc(100vh-2rem)] sticky top-4 rounded-xl mr-4 my-4",
            rightSidebarCollapsed ? "w-0 opacity-0 border-none p-0 overflow-hidden" : "w-80 p-6 opacity-100"
          )}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">Agenda & Atividade</h3>
              <Button variant="ghost" size="icon" onClick={() => setRightSidebarCollapsed(true)} className="h-8 w-8">
                <Plus className="w-4 h-4 rotate-45" />
              </Button>
            </div>
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <MiniCalendar eventsOnDates={eventDates} />
              <ActivityFeed
                activities={recentActivities}
                onViewAll={() => navigate("/alunos")}
              />
            </div>
          </aside>

          {/* Floating toggle for right sidebar when collapsed */}
          {rightSidebarCollapsed && (
            <button
              onClick={() => setRightSidebarCollapsed(false)}
              className="hidden xl:flex fixed bottom-6 right-6 z-[100] w-10 h-10 bg-card border border-border text-tertiary rounded-xl items-center justify-center shadow-lg hover:text-primary hover:border-primary transition-all active:scale-95 group"
              title="Abrir Agenda & Atividade"
            >
              <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>
      </div>

      <StudentDetailsModal
        studentId={selectedStudentId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
