import { Activity } from "@/types/activity";
import { cn } from "@/lib/utils";
import { MessageSquareOff, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ActivityFeedProps {
  activities: Activity[];
  onViewAll?: () => void;
  onActivityClick?: (activity: Activity) => void;
}

export function ActivityFeed({ activities, onViewAll, onActivityClick }: ActivityFeedProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Atividades Recentes</h3>
        {activities.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver Todas
          </button>
        )}
      </div>

      {/* Activity list */}
      <div className="divide-y divide-border min-h-[100px] flex flex-col justify-center">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => onActivityClick?.(activity)}
              className="p-4 hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <div className="flex gap-3">
                <Avatar className="w-9 h-9 border border-border">
                  <AvatarImage src={activity.studentAvatar || ""} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                    {activity.studentName ? activity.studentName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {activity.studentName}
                    </span>
                    <span className="text-xs text-tertiary flex-shrink-0 ml-2">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {activity.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
              <MessageSquareOff className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhuma mensagem</p>
            <p className="text-xs text-muted-foreground">Novas notificações de alunos aparecerão aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
