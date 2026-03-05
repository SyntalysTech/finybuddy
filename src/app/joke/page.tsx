"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import {
    TrendingUp,
    TrendingDown,
    PiggyBank,
    Wallet,
    Zap,
    Bot,
    Ghost,
    ShieldAlert,
    Skull,
    MousePointer2,
} from "lucide-react";

// Componente para que las cosas huyan
const RunAway = ({ children, intensity = 200 }: { children: React.ReactNode; intensity?: number }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseEnter = () => {
        // Calculamos una nueva posición aleatoria
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * intensity + 100;

        setPosition(prev => ({
            x: prev.x + Math.cos(angle) * distance,
            y: prev.y + Math.sin(angle) * distance
        }));
    };

    return (
        <div
            onMouseEnter={handleMouseEnter}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                display: "inline-block",
                position: "relative",
                zIndex: 10,
            }}
        >
            {children}
        </div>
    );
};

export default function JokeDashboardPage() {
    const [scammedCount, setScammedCount] = useState(0);

    // Frases de broma para la mascota
    const jokePhrases = [
        "¡Ni lo intentes, que muerdo!",
        "Buscando tu dignidad financiera... 404 Not Found.",
        "He invertido todos tus ahorros en cromos de Pokémon.",
        "¿Quieres ver un truco de magia? ¡Mira cómo desaparece tu nómina!",
        "He detectado un gasto excesivo en 'aire'. Deja de respirar para ahorrar.",
        "Tu cuenta está tan vacía que hace eco.",
    ];

    const [currentPhrase, setCurrentPhrase] = useState(jokePhrases[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhrase(jokePhrases[Math.floor(Math.random() * jokePhrases.length)]);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--background)] overflow-hidden">
            <Header
                title="FinyBuddy (Versión Sincera)"
                subtitle="Donde tu dinero es libre... de ti."
                actions={
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-xs font-bold animate-pulse">
                        <ShieldAlert className="w-4 h-4" />
                        SISTEMA HACKEADO (BROMI)
                    </div>
                }
            />

            <div className="p-4 sm:p-6 space-y-8">
                {/* Mascota Troyana */}
                <div className="glass-brand p-6 rounded-2xl relative overflow-hidden flex items-center gap-6 border-dashed border-2 border-[var(--brand-cyan)]">
                    <RunAway intensity={300}>
                        <div className="animate-bounce cursor-help">
                            <Image
                                src="/assets/finy-mascota-minimalista.png"
                                alt="FinyBuddy"
                                width={80}
                                height={80}
                                className="grayscale contrast-125"
                            />
                        </div>
                    </RunAway>
                    <div className="flex-1">
                        <h2 className="text-xl font-black text-[var(--brand-cyan)] mb-1">FinyMalvado dice:</h2>
                        <p className="text-lg italic font-medium">&ldquo;{currentPhrase}&rdquo;</p>
                    </div>
                </div>

                {/* KPI Cards de Broma */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <RunAway>
                        <div className="kpi-glass !bg-[var(--danger)]/5 border-dashed border-[var(--danger)] p-6 w-full min-w-[300px]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-[var(--brand-gray)] mb-1">Gasto en Caprichos innecesarios</p>
                                    <p className="text-3xl font-black text-[var(--danger)]">99.999,99€</p>
                                    <p className="text-[10px] mt-2 opacity-50">Incluye ese café de 5€ que no necesitabas.</p>
                                </div>
                                <Skull className="text-[var(--danger)] w-8 h-8" />
                            </div>
                        </div>
                    </RunAway>

                    <RunAway>
                        <div className="kpi-glass !bg-[var(--warning)]/5 border-dashed border-[var(--warning)] p-6 w-full min-w-[300px]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-[var(--brand-gray)] mb-1">Ahorros Secuestrados</p>
                                    <p className="text-3xl font-black text-[var(--warning)]">0,00€</p>
                                    <p className="text-[10px] mt-2 opacity-50">Los tengo yo. Si los quieres, búscame.</p>
                                </div>
                                <Ghost className="text-[var(--warning)] w-8 h-8" />
                            </div>
                        </div>
                    </RunAway>

                    <RunAway>
                        <div className="kpi-glass !bg-[var(--brand-cyan)]/5 border-dashed border-[var(--brand-cyan)] p-6 w-full min-w-[300px]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-[var(--brand-gray)] mb-1">Probabilidad de hacerte Rico</p>
                                    <p className="text-3xl font-black text-[var(--brand-cyan)]">-50%</p>
                                    <p className="text-[10px] mt-2 opacity-50">Ni con la lotería, jefe.</p>
                                </div>
                                <Zap className="text-[var(--brand-cyan)] w-8 h-8" />
                            </div>
                        </div>
                    </RunAway>
                </div>

                {/* Gráfico Loco */}
                <div className="card p-8 text-center space-y-4">
                    <h3 className="text-xl font-bold">Tu Evolución Financiera (Ficción vs Realidad)</h3>
                    <RunAway intensity={500}>
                        <div className="flex items-end justify-center gap-4 h-48">
                            <div className="w-12 bg-[var(--success)] animate-pulse" style={{ height: '20%' }}></div>
                            <div className="w-12 bg-[var(--danger)] animate-bounce" style={{ height: '90%' }}></div>
                            <div className="w-12 bg-[var(--brand-cyan)] animate-ping" style={{ height: '5%' }}></div>
                            <div className="w-12 bg-[var(--brand-purple)] rotate-45" style={{ height: '60%' }}></div>
                        </div>
                    </RunAway>
                    <p className="text-sm text-[var(--brand-gray)] italic">Gráfico generado por una IA que está de lunes.</p>
                </div>

                {/* Botón Imposible */}
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <p className="font-bold text-lg">👇 Haz clic aquí para liquidar todas tus deudas (MÁGICO) 👇</p>
                    <RunAway intensity={400}>
                        <button
                            onClick={() => alert("¡Venga ya! ¿De verdad te lo has creído?")}
                            className="px-8 py-4 bg-gradient-to-r from-red-500 to-purple-600 rounded-full font-black text-xl text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"
                        >
                            BOTÓN MÁGICO DE DINERO GRATIS
                        </button>
                    </RunAway>
                </div>

                {/* Footer de Bromi */}
                <footer className="text-center py-10 opacity-30 text-xs">
                    <p>© 2026 FinyBuddy S.A. (Sociedad de Apariciones). No nos hacemos responsables de inversiones en caramelos.</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <span className="cursor-not-allowed line-through">Términos</span>
                        <span className="cursor-not-allowed line-through">Privacidad</span>
                        <span className="cursor-not-allowed line-through">Sentido Común</span>
                    </div>
                </footer>
            </div>

            {/* Cursor personalizado de broma */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100]">
                <style jsx global>{`
          .cursor-joke:hover {
            cursor: none !important;
          }
        `}</style>
            </div>
        </div>
    );
}
