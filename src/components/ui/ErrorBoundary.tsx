import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.fallback) return this.fallback;

            return (
                <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-card border border-dashed rounded-3xl mt-10">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter">Ops! Algo deu errado.</h2>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Ocorreu um erro inesperado ao carregar esta parte do aplicativo.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="rounded-xl gap-2 shadow-lg"
                    >
                        <RefreshCw className="w-4 h-4" /> Recarregar Página
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
