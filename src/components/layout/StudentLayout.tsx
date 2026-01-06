import { Outlet, NavLink } from "react-router-dom";
import { Dumbbell, Utensils, User, LayoutDashboard, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./ModeToggle";
import { LegalConsentModal } from "@/components/legal/LegalConsentModal";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getStudentProfile } from "@/services/studentService";

export default function StudentLayout() {
    const { user } = useAuth();
    const { data: profile, refetch } = useQuery({
        queryKey: ['studentProfile', user?.id],
        queryFn: () => getStudentProfile(user?.id!),
        enabled: !!user?.id
    });

    const navItems = [
        { icon: LayoutDashboard, label: "Home", path: "/aluno/dashboard" },
        { icon: Dumbbell, label: "Treino", path: "/aluno/treino" },
        { icon: Utensils, label: "Dieta", path: "/aluno/dieta" },
        { icon: Calendar, label: "Agenda", path: "/aluno/agenda" },
        { icon: User, label: "Perfil", path: "/aluno/perfil" },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {profile && <LegalConsentModal student={profile} onConsentGiven={() => refetch()} />}

            {/* Top Header for Mobile */}
            <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
                <div className="w-9" />
                <h1 className="text-lg font-black italic tracking-tighter text-primary">RAVA FIT PRO</h1>
                <ModeToggle />
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 overflow-y-auto pb-20">
                <div className="max-w-md mx-auto w-full">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 pb-safe z-50">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium leading-none">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
