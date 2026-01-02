import { cn } from "@/lib/utils";
import { Student, goalLabels, statusLabels } from "@/types/student";
import { Calendar, MoreHorizontal, Edit, Trash2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (student: Student) => void;
  onStatusChange?: (id: string, status: string) => void;
}

export function StudentCard({ student, onClick, onDelete, onEdit, onStatusChange }: StudentCardProps) {
  const progressColor =
    student.progress >= 70 ? "bg-status-success" :
      student.progress >= 40 ? "bg-status-warning" :
        "bg-status-error";

  const statusColor =
    student.status === 'ativo' ? "badge-success" :
      student.status === 'pendente' ? "badge-warning" :
        student.status === 'aguardando' ? "badge-warning" :
          "bg-secondary text-muted-foreground";

  const classificationColor =
    student.classification === 'gold' ? "bg-status-warning text-white" :
      student.classification === 'silver' ? "bg-slate-400 text-white" :
        "bg-amber-700 text-white";

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div
      onClick={onClick}
      className="card-elevated p-5 cursor-pointer transition-all duration-200 hover:shadow-card-hover group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-12 h-12 rounded-lg border border-border object-cover"
          />
          <div>
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
              {student.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {goalLabels[student.goal]}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-tertiary hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(student); }} className="gap-2 cursor-pointer">
              <Edit className="w-4 h-4" /> Editar Cadastro
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                <UserCog className="w-4 h-4" /> Mudar Status
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-card border-border">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(student.id, 'ativo'); }} className="cursor-pointer">Ativo</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(student.id, 'inativo'); }} className="cursor-pointer">Inativo</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange?.(student.id, 'aguardando'); }} className="cursor-pointer">Aguardando</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete?.(student.id); }}
              className="gap-2 cursor-pointer text-status-error focus:text-status-error focus:bg-status-error/10"
            >
              <Trash2 className="w-4 h-4" /> Eliminar Usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status badge */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full", statusColor)}>
          {statusLabels[student.status]}
        </span>
        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm", classificationColor)}>
          {student.classification}
        </span>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {student.serviceType}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="progress-track h-1.5 w-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", progressColor)}
            style={{ width: `${student.progress}%` }}
          />
        </div>
      </div>

      {/* Tasks completed */}
      <p className="text-sm text-muted-foreground mb-4">
        Concluído: {student.completedTasks}/{student.totalTasks} atividades
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-tertiary">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">Próximo: {formatDate(student.nextSession)}</span>
        </div>
      </div>
    </div>
  );
}
