import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getCoachProfile } from "@/services/studentService";

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
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 text-muted-foreground hover:text-foreground hover:bg-surface-hover"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User avatar */}
        <img
          src={coach?.avatar_url || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces"}
          alt="Profile"
          className="w-10 h-10 rounded-full border-2 border-border object-cover cursor-pointer hover:border-primary transition-colors bg-sidebar"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces";
          }}
        />
      </div>
    </header>
  );
}
