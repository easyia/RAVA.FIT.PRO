import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Lock, Unlock, Camera, ShieldCheck, Aperture } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShutterLockProps {
    isLocked: boolean;
    onToggle: () => void;
}

export const ShutterLock: React.FC<ShutterLockProps> = ({ isLocked, onToggle }) => {
    // Prevent scrolling when locked
    useEffect(() => {
        if (isLocked) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [isLocked]);

    return (
        <>
            <AnimatePresence>
                {isLocked && (
                    <motion.div
                        initial={{ clipPath: "circle(0% at 94% 90%)" }} // Starts from the button position roughly
                        animate={{ clipPath: "circle(150% at 50% 50%)" }}
                        exit={{ clipPath: "circle(0% at 94% 90%)" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // Apple-like spring easing
                        className="fixed inset-0 z-[9999] bg-[#000000] flex flex-col items-center justify-center text-white overflow-hidden"
                    >
                        {/* Background Texture & Effects */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full pointer-events-none"
                        />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.15 }}
                            transition={{ delay: 0.7, duration: 1 }}
                            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"
                        />

                        {/* Content Container */}
                        <div className="relative z-10 flex flex-col items-center p-8 max-w-md text-center">

                            {/* Logo */}
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="mb-16"
                            >
                                <img src="/Logomarca.png" alt="RAVA FIT PRO" className="h-32 md:h-40 w-auto object-contain drop-shadow-2xl" />
                            </motion.div>

                            {/* Privacy Icon */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                                className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl backdrop-blur-sm"
                            >
                                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            </motion.div>

                            {/* Status Text */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-2 mb-12"
                            >
                                <h2 className="text-3xl font-bold tracking-tight">Painel Protegido</h2>
                                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Modo de Privacidade Ativo</p>
                            </motion.div>

                            {/* Unlock Swipe/Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onToggle}
                                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold flex items-center gap-3 hover:bg-zinc-200 transition-colors shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                            >
                                <Unlock className="w-5 h-5 text-black group-hover:rotate-[-15deg] transition-transform" />
                                <span>Desbloquear Acesso</span>
                                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />
                            </motion.button>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="mt-8 text-xs text-zinc-600 font-mono"
                            >
                                Clique para retomar sua sessão
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button (Only visible when unlocked) */}
            <AnimatePresence>
                {!isLocked && (
                    <motion.button
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -180 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onToggle}
                        className="fixed bottom-24 right-8 z-[110] w-14 h-14 rounded-2xl bg-[#09090b] border border-white/10 text-white shadow-2xl flex items-center justify-center group overflow-hidden"
                        title="Bloquear Tela"
                    >
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Aperture className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
};
