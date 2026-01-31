import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock, Plus, SkipForward } from 'lucide-react';
import { useWorkoutSessionStore } from '@/stores/useWorkoutSessionStore';
import { cn } from '@/lib/utils';

// =============================================
// HELPERS
// =============================================

/**
 * Format seconds to MM:SS
 */
function formatRestTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// =============================================
// COMPONENT
// =============================================

export function RestTimerOverlay() {
    const { isResting, restTimeRemaining, skipRest } = useWorkoutSessionStore();

    // Add 30 seconds to rest timer
    const handleAdd30s = () => {
        useWorkoutSessionStore.setState((state) => ({
            restTimeRemaining: state.restTimeRemaining + 30,
        }));
    };

    return (
        <AnimatePresence>
            {isResting && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={cn(
                        'fixed bottom-4 left-4 right-4 z-50',
                        'md:left-auto md:right-4 md:w-80'
                    )}
                >
                    <div
                        className={cn(
                            'relative overflow-hidden rounded-2xl',
                            'bg-zinc-900/95 backdrop-blur-xl',
                            'border-2 border-amber-500/50',
                            'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
                            'p-4'
                        )}
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 animate-pulse" />

                        {/* Content */}
                        <div className="relative flex items-center justify-between gap-4">
                            {/* Timer Display */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-amber-500 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">
                                        Descanso
                                    </p>
                                    <p className="text-3xl font-black font-mono text-white tracking-tight">
                                        {formatRestTime(restTimeRemaining)}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAdd30s}
                                    className="h-10 px-3 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/50"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    30s
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={skipRest}
                                    className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                                >
                                    <SkipForward className="w-4 h-4 mr-1" />
                                    Pular
                                </Button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500"
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{
                                    duration: restTimeRemaining,
                                    ease: 'linear',
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default RestTimerOverlay;
