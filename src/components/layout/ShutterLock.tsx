import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Lock, Unlock, Camera } from "lucide-react";

interface ShutterLockProps {
    isLocked: boolean;
    onToggle: () => void;
}

export const ShutterLock: React.FC<ShutterLockProps> = ({ isLocked, onToggle }) => {
    const [showLogo, setShowLogo] = useState(false);

    useEffect(() => {
        if (isLocked) {
            const timer = setTimeout(() => setShowLogo(true), 600);
            return () => clearTimeout(timer);
        } else {
            setShowLogo(false);
        }
    }, [isLocked]);

    return (
        <div
            className={cn(
                "fixed inset-0 z-[9999] pointer-events-none overflow-hidden flex items-center justify-center transition-all duration-300",
                isLocked ? "pointer-events-auto bg-black/20" : "bg-transparent"
            )}
        >
            {/* Shutter Blades Container */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <div
                        key={i}
                        className={cn(
                            "absolute bg-black shadow-2xl transition-all ease-[cubic-bezier(0.2,0,0.1,1)] will-change-transform",
                            isLocked ? "duration-[4000ms]" : "duration-500", // Slow lock, fast unlock (fade out)
                            // Increased size massively to 150vmax to ensure coverage on any screen aspect ratio
                            "w-[150vmax] h-[150vmax]",
                            // Ensure visibility toggles correctly
                            isLocked ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none transition-opacity delay-0" // Add specific transition for opacity if needed, or rely on all
                        )}
                        style={{
                            // Transform origin is center of screen for the rotation
                            // BUT we need the blades to hinge from the outside in or pivot around the center.
                            // Better approach: Position them centered, and translate them OUT when open, IN when closed?
                            // No, mechanical iris rotates.
                            left: '50%',
                            top: '50%',
                            transformOrigin: '0% 0%', // Pivot from top-left of the blade which is at screen center?
                            // Let's try positioning Top-Left at 50% 50% then rotating.

                            // Closed state (Locked): Blades rotated to form hexagon. 
                            // Open state (Unlocked): Blades rotated OUT ensuring aperture is clear.

                            // Let's use a simple transform logic:
                            // Locked: Rotate to 'angle'.
                            // Unlocked: Rotate to 'angle + 90' (flinging them out)? Or scaling to 0?

                            // Using clip-path effectively creates the blade shape.
                            // clip-path: polygon(0% 0%, 100% 0%, 50% 100%) -> Triangle? 
                            // Standard 6-blade iris blade is roughly triangular or curved.
                            // Let's stick to the previous rect with polygon but ensure scale/position is correct.

                            transform: isLocked
                                ? `translate(-50%, -50%) rotate(${angle}deg) translate(0%, 0%)`
                                : `translate(-50%, -50%) rotate(${angle}deg) translate(0%, -100%)`,

                            // Fix: The previous scale approach might have been shrinking them to nothingness.
                            // Now we translate them "out" of the center hole.

                            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', // Full rect
                            transitionDelay: `${i * 0.15}s`,
                            zIndex: 100
                        }}
                    >
                        {/* Textura metálica sutil para dar acabamento premium */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-10 pointer-events-none" />
                    </div>
                ))}
            </div>

            {/* Logo and Content */}
            <div
                className={cn(
                    "relative z-[101] flex flex-col items-center justify-center transition-all duration-[2000ms] delay-[1500ms]",
                    showLogo ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-10"
                )}
            >
                {/* Logo Maior - Removido efeito de fundo (drop-shadow) */}
                <img
                    src="/Logomarca.png"
                    alt="RAVA FIT PRO"
                    className="w-[600px] h-auto mb-10"
                />

                <h2 className="text-white/40 text-sm tracking-[0.8em] mb-8 font-light uppercase animate-pulse">Painel Bloqueado</h2>

                <button
                    onClick={onToggle}
                    className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                    <Unlock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="font-medium tracking-wide">Desbloquear Sistema</span>
                </button>
            </div>

            {/* Floating Toggle Button (Visible when NOT locked) */}
            {!isLocked && (
                <button
                    onClick={onToggle}
                    className="fixed bottom-24 right-6 z-[110] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto group ring-4 ring-background"
                    title="Bloquear para Gravação"
                >
                    <Camera className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </button>
            )}
        </div>
    );
};
