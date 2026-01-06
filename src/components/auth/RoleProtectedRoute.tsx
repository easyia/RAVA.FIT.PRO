import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
    allowedRole: 'coach' | 'student';
    redirectTo?: string;
}

export function RoleProtectedRoute({ allowedRole, redirectTo = "/auth" }: RoleProtectedRouteProps) {
    const { isAuthenticated, loading, role } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-primary">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} />;
    }

    // Se o role for 'coach' e estamos tentando acessar rota de 'student', redireciona para dashboard do coach
    if (role !== allowedRole) {
        const defaultRedirect = role === 'coach' ? '/' : '/aluno/dashboard';
        return <Navigate to={defaultRedirect} />;
    }

    return <Outlet />;
}
