import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionText,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center p-8 bg-sidebar rounded-xl border border-dashed border-border animate-fade-in",
                className
            )}
        >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-xs mb-6">{description}</p>
            {actionText && onAction && (
                <Button onClick={onAction} className="bg-primary hover:bg-primary/90">
                    {actionText}
                </Button>
            )}
        </div>
    );
}
