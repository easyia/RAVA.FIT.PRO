import { useState } from "react";
import { cn } from "@/lib/utils";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronDown,
  Dumbbell,
  Activity,
  Bot,
  Utensils,
  CreditCard,
  Link as LinkIcon,
  Copy,
  Eye,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCoachProfile, getPendingApprovalsCount } from "@/services/studentService";
import { getOverdueSubscriptionsCount } from "@/services/financeService";
import { ModeToggle } from "./ModeToggle";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const { data: coach } = useQuery({
    queryKey: ["coachProfile"],
    queryFn: getCoachProfile,
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pendingApprovalsCount"],
    queryFn: getPendingApprovalsCount,
    refetchInterval: 30000,
  });

  const { data: overdueCount = 0 } = useQuery({
    queryKey: ["overdueSubscriptionsCount"],
    queryFn: getOverdueSubscriptionsCount,
    refetchInterval: 60000,
  });

  const toggleMenu = (label: string, path?: string) => {
    if (collapsed) {
      onToggle();
    }

    setExpandedMenus(prev =>
      prev.includes(label) ? [] : [label]
    );

    if (path) {
      navigate(path);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    {
      icon: MessageSquare,
      label: "Mensagens",
      path: "/mensagens",
    },
    {
      icon: Users,
      label: "Alunos",
      subItems: [
        { label: "Lista de Alunos", path: "/alunos" },
        { label: "Novo Cadastro", path: "/cadastro" },
        { label: "Análise Comparativa", path: "/analise-comparativa" },
        { label: "Protocolos", path: "/protocolos" },
      ],
      pendingBadge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      icon: Bot,
      label: "Prescrição IA",
      subItems: [
        { label: "IA de Treino", path: "/ia-assistant" },
        { label: "IA de Dieta", path: "/ia-diet-assistant" },
      ]
    },
    {
      icon: CreditCard,
      label: "Financeiro",
      path: "/financeiro",
      subItems: [
        { label: "Visão Geral", path: "/financeiro" },
        { label: "Planos", path: "/financeiro/planos" },
      ],
      alertBadge: overdueCount > 0 ? overdueCount : undefined
    },
    { icon: Calendar, label: "Calendário", path: "/calendario", disabled: true, badge: "Em breve" },
    { icon: BarChart3, label: "Relatórios", path: "/relatorios", disabled: true, badge: "Em breve" },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 w-full border-b border-sidebar-border/50">
        {!collapsed ? (
          <h1 className="text-xl font-black tracking-wider italic bg-gradient-to-r from-primary via-primary to-white bg-clip-text text-transparent drop-shadow-[0_2px_10_rgba(255,255,255,0.1)]">
            RAVA FIT PRO
          </h1>
        ) : (
          <h1 className="text-xl font-black italic text-primary">R</h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedMenus.includes(item.label);

          // Improved active logic:
          // 1. If it's the dashboard (/), it must be an exact match.
          // 2. If it has sub-items, check if the current path starts with any of the sub-item paths.
          const isActive = hasSubItems
            ? item.subItems?.some(s => location.pathname.startsWith(s.path) && s.path !== '/')
            : (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path));

          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-tertiary opacity-60 cursor-not-allowed group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>
                {!collapsed && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <div key={item.label} className="space-y-1">
              {hasSubItems ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu(item.label, item.path);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-smooth group",
                    isActive && !isExpanded
                      ? "bg-primary/5 text-primary"
                      : "text-sidebar-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-tertiary group-hover:text-foreground")} />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!collapsed && ((item as any).pendingBadge || (item as any).alertBadge) && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1 flex items-center justify-center text-[10px] animate-pulse">
                        {(item as any).pendingBadge || (item as any).alertBadge}
                      </Badge>
                    )}
                    {!collapsed && (
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                    )}
                  </div>
                  {collapsed && ((item as any).pendingBadge || (item as any).alertBadge) && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full" />
                  )}
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth group",
                    location.pathname === item.path
                      ? "sidebar-active"
                      : "text-sidebar-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", location.pathname === item.path ? "text-primary" : "text-tertiary group-hover:text-foreground")} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              )}

              {!collapsed && hasSubItems && isExpanded && (
                <div className="ml-9 space-y-1 border-l border-sidebar-border/50 pl-2">
                  {item.subItems?.map((subItem) => (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-smooth",
                        location.pathname === subItem.path
                          ? "text-primary font-semibold bg-primary/5"
                          : "text-sidebar-foreground/70 hover:text-foreground hover:bg-surface-hover"
                      )}
                    >
                      {subItem.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>


      {/* Footer Actions */}
      <div className="mt-auto px-3 py-4 space-y-1">
        {/* Settings */}
        <NavLink
          to="/configuracoes"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth group",
            location.pathname === "/configuracoes"
              ? "bg-primary/5 text-primary"
              : "text-sidebar-foreground hover:bg-surface-hover hover:text-foreground"
          )}
        >
          <Settings className={cn("w-5 h-5 flex-shrink-0 transition-colors", location.pathname === "/configuracoes" ? "text-primary" : "text-tertiary group-hover:text-foreground")} />
          {!collapsed && <span className="text-sm font-medium">Configurações</span>}
        </NavLink>

        {/* Invite Link - Cleaner Style */}
        {!collapsed && coach?.id && (
          <button
            onClick={() => {
              const url = `${window.location.origin}/link/${coach.id}`;
              navigator.clipboard.writeText(url);
              toast.success("Link de convite copiado!");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-primary/5 hover:text-primary transition-smooth group text-left"
          >
            <LinkIcon className="w-5 h-5 flex-shrink-0 text-tertiary group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium">Copiar Link de Convite</span>
          </button>
        )}

        {/* Profile & Mode Toggle Unified Block */}
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-xl transition-smooth mt-4",
            collapsed ? "justify-center" : "bg-sidebar-border/30 hover:bg-sidebar-border/50"
          )}
        >
          <img
            src={coach?.avatar_url || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces"}
            alt="Profile"
            className="w-9 h-9 rounded-lg object-cover flex-shrink-0 shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces";
            }}
          />
          {!collapsed && (
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-semibold text-foreground truncate leading-none mb-1">
                {coach?.name || "Carregando..."}
              </p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black truncate">
                  Online
                </p>
              </div>
            </div>
          )}
          {!collapsed && <ModeToggle />}
        </div>

        {/* Toggle Button - Integrated */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full h-6 mt-2 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors opacity-50 hover:opacity-100 flex items-center justify-center"
        >
          <div className={cn("h-1 w-8 rounded-full bg-border transition-all group-hover:bg-foreground/20", collapsed && "w-1 h-8")} />
        </Button>
      </div>
    </aside>
  );
}
