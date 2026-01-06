import { Search, Bell, Check, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getCoachProfile } from "@/services/studentService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getRecentActivities } from "@/services/activityService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StudentDetailsModal } from "./StudentDetailsModal";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { updateStudentStatus } from "@/services/studentService";

interface DashboardHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({
  title,
  showSearch = true,
  onSearch,
  searchPlaceholder = "Buscar alunos, protocolos...",
  className,
  actions,
}: DashboardHeaderProps) {
  const { data: coach } = useQuery({
    queryKey: ["coachProfile"],
    queryFn: getCoachProfile,
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [defaultTab, setDefaultTab] = useState("info");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getRecentActivities,
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissed_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const visibleNotifications = notifications.filter((n: any) => !dismissedIds.includes(n.id));

  const handleClearAll = () => {
    const allIds = notifications.map((n: any) => n.id);
    const newDismissed = [...new Set([...dismissedIds, ...allIds])];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_notifications', JSON.stringify(newDismissed));
    toast.success("Notificações limpas");
  };

  const markNotificationAsRead = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_notifications', JSON.stringify(newDismissed));
  };

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markNotificationAsRead(id);
  };

  const handleNotificationClick = (notification: any) => {
    // Marca como lida imediatamente
    markNotificationAsRead(notification.id);

    // Lógica robusta de redirecionamento (igual ao Dashboard.tsx)
    const isMessage =
      notification.type === 'message' ||
      (typeof notification.id === 'string' && notification.id.startsWith('message-')) ||
      (!notification.type && notification.message && !notification.message.toLowerCase().includes('avaliação') && !notification.message.toLowerCase().includes('anamnese'));

    if (isMessage) {
      navigate('/mensagens', { state: { studentId: notification.studentId } });
    } else {
      let targetTab = 'info';
      if (notification.type === 'anamnesis' || (typeof notification.id === 'string' && notification.id.startsWith('anamnesis-'))) {
        targetTab = 'anamnesis';
      } else if (notification.type === 'assessment' || (typeof notification.id === 'string' && notification.id.startsWith('assessment-'))) {
        targetTab = 'evaluation';
      }

      setSelectedStudentId(notification.studentId);
      setDefaultTab(targetTab);
      setIsModalOpen(true);
    }
  };

  const handleStatusChange = async (studentId: string, status: string) => {
    try {
      const statusMap: Record<string, string> = {
        'ativo': 'active',
        'inativo': 'inactive',
        'pendente': 'pending_approval',
        'aguardando': 'pending_approval', // Added 'aguardando' mapping
        'excluido': 'deleted'
      };
      const dbStatus = statusMap[status] || status;
      await updateStudentStatus(studentId, dbStatus);
      toast.success("Status do aluno atualizado!");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      toast.error("Erro ao atualizar status.");
    }
  };

  return (
    <header className={cn("flex items-center justify-between gap-4 mb-8", className)}>
      {title && (
        <h1 className="text-h1 text-foreground">{title}</h1>
      )}

      <div className="flex items-center gap-4 flex-1 justify-end">
        {showSearch && (
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
              className="pl-10 bg-card border-border text-foreground placeholder:text-tertiary focus:ring-primary focus:border-primary h-11"
            />
          </div>
        )}

        {actions}

        {/* Notifications */}
        <div className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all duration-300"
              >
                <Bell className="w-5 h-5" />
                {visibleNotifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                <h4 className="font-bold text-sm">Notificações</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20">{visibleNotifications.length}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-[10px] uppercase tracking-tighter h-7 px-2 hover:bg-transparent hover:text-primary transition-colors"
                  >
                    Limpar tudo
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-[400px]">
                <div className="flex flex-col">
                  {visibleNotifications.length > 0 ? (
                    visibleNotifications.map((notification: any, idx: number) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "p-4 border-b border-border/50 hover:bg-surface-hover transition-colors cursor-pointer group",
                          idx === 0 && "bg-primary/5"
                        )}
                      >
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-border flex-shrink-0 group-hover:border-primary/50 transition-colors">
                            <img src={notification.studentAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground">
                              {notification.studentName}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="p-1 rounded-full bg-primary/10 text-primary">
                                <Activity className="w-3 h-3" />
                              </span>
                              <span className="text-[10px] text-tertiary flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(notification.time), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={(e) => handleMarkAsRead(e, notification.id)}
                            >
                              <Check className="h-3 w-3 text-primary" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                        <Bell className="w-6 h-6 text-tertiary" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Sem notificações</p>
                      <p className="text-xs text-muted-foreground mt-1">Tudo em dia por aqui!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 bg-muted/30 border-t border-border mt-auto">
                <Button
                  variant="link"
                  onClick={() => navigate('/alunos')}
                  className="w-full text-xs h-auto p-0 text-primary hover:no-underline font-bold"
                >
                  Ver todas as atividades recentes
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

      </div>


      <StudentDetailsModal
        studentId={selectedStudentId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={handleStatusChange}
        defaultTab={defaultTab}
      />
    </header>
  );
}

