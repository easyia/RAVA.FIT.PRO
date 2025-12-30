import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  Dumbbell,
  Activity,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getCoachProfile } from "@/services/studentService";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Alunos", path: "/alunos" },
  { icon: ClipboardList, label: "Cadastros", path: "/cadastro" },
  { icon: Calendar, label: "Calendário", path: "/calendario" },
  { icon: Activity, label: "Análise Comparativa", path: "/analise-comparativa" },
  { icon: FileText, label: "Protocolos", path: "/protocolos" },
  { icon: Bot, label: "Assistente IA", path: "/ia-assistant" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { data: coach } = useQuery({
    queryKey: ["coachProfile"],
    queryFn: getCoachProfile,
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out flex flex-col",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      {/* Logo */}
      <div className="flex items-center justify-center h-16 w-full border-b border-sidebar-border/50">
        {!collapsed ? (
          <h1 className="text-xl font-black tracking-wider italic bg-gradient-to-r from-primary via-primary to-white bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
            RAVA FIT PRO
          </h1>
        ) : (
          <h1 className="text-xl font-black italic text-primary">R</h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth group",
                isActive
                  ? "sidebar-active"
                  : "text-sidebar-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full -ml-3" />
              )}
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-tertiary group-hover:text-foreground"
                )}
              />
              {!collapsed && (
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-primary" : ""
                  )}
                >
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Toggle button */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "w-full h-10 text-sidebar-foreground hover:text-foreground hover:bg-surface-hover transition-smooth",
            collapsed ? "justify-center" : "justify-end"
          )}
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-hover transition-smooth cursor-pointer",
            collapsed && "justify-center"
          )}
        >
          <img
            src={coach?.avatar_url || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces"}
            alt="Profile"
            className="w-8 h-8 rounded-full border-2 border-border object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces";
            }}
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {coach?.name || "Carregando..."}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {coach?.specialty || "Treinador"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
