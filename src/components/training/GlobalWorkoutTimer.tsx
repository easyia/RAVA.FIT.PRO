import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Timer } from 'lucide-react';
import { useWorkoutSessionStore } from '@/stores/useWorkoutSessionStore';

// =============================================
// HELPERS
// =============================================

/**
 * Format seconds to HH:MM:SS
 */
function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
}

// =============================================
// COMPONENT
// =============================================

export function GlobalWorkoutTimer() {
    const { activeWorkoutId, elapsedTime, tickTimer } = useWorkoutSessionStore();

    // Tick every second when workout is active
    useEffect(() => {
        if (!activeWorkoutId) return;

        const interval = setInterval(() => {
            tickTimer();
        }, 1000);

        return () => clearInterval(interval);
    }, [activeWorkoutId, tickTimer]);

    // Don't render if no active workout
    if (!activeWorkoutId) return null;

    return (
        <Badge
            variant="outline"
            className="gap-2 px-3 py-1.5 text-sm font-mono font-bold border-primary/30 bg-primary/5 text-primary"
        >
            <Timer className="w-4 h-4" />
            {formatTime(elapsedTime)}
        </Badge>
    );
}

export default GlobalWorkoutTimer;
