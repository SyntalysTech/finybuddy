"use client";

import { useEffect, useState, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    PointerLockControls,
    Text,
    Sky,
    Stars,
    Box,
    Cylinder,
    Plane,
    Sparkles,
    Float,
} from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft, MousePointerClick, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// --- HOOKS Y COMPONENTES 3D ---

const PlayerControls = () => {
    const { camera } = useThree();
    const keys = useRef({ w: false, a: false, s: false, d: false });

    useEffect(() => {
        // Inicializar la cámara
        camera.position.set(0, 1.6, 5);

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case "w": keys.current.w = true; break;
                case "a": keys.current.a = true; break;
                case "s": keys.current.s = true; break;
                case "d": keys.current.d = true; break;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case "w": keys.current.w = false; break;
                case "a": keys.current.a = false; break;
                case "s": keys.current.s = false; break;
                case "d": keys.current.d = false; break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [camera]);

    useFrame((state, delta) => {
        const speed = 10 * delta;
        if (keys.current.w) camera.translateZ(-speed);
        if (keys.current.s) camera.translateZ(speed);
        if (keys.current.a) camera.translateX(-speed);
        if (keys.current.d) camera.translateX(speed);

        // Limitar la altura para evitar "volar"
        camera.position.y = 1.6;

        // Límites básicos del mapa (paredes invisibles)
        if (camera.position.x > 20) camera.position.x = 20;
        if (camera.position.x < -20) camera.position.x = -20;
        if (camera.position.z > 20) camera.position.z = 20;
        if (camera.position.z < -20) camera.position.z = -20;
    });

    return <PointerLockControls selector="#click-to-start" />;
};

const HologramStand = ({ position, title, amount, color, iconText }: { position: [number, number, number], title: string, amount: string, color: string, iconText: string }) => {
    return (
        <group position={position}>
            {/* Base/Pedestal */}
            <Cylinder args={[1, 1, 0.5, 32]} position={[0, 0.25, 0]}>
                <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
            </Cylinder>
            <Cylinder args={[0.8, 0.8, 0.6, 32]} position={[0, 0.3, 0]}>
                <meshStandardMaterial color={color} metalness={0.5} roughness={0.1} emissive={color} emissiveIntensity={0.2} />
            </Cylinder>

            {/* Holograma Flotante */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                {/* Anillo exterior */}
                <mesh position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.8, 0.02, 16, 100]} />
                    <meshBasicMaterial color={color} transparent opacity={0.5} />
                </mesh>

                {/* Cristal central */}
                <Box args={[0.5, 0.5, 0.5]} position={[0, 2, 0]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                    <meshPhysicalMaterial
                        color={color}
                        transmission={0.9}
                        opacity={1}
                        metalness={0.1}
                        roughness={0.1}
                        ior={1.5}
                        thickness={0.5}
                        emissive={color}
                        emissiveIntensity={0.5}
                    />
                </Box>

                {/* Datos Financieros */}
                <Text
                    position={[0, 3, 0]}
                    fontSize={0.4}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor={color}
                >
                    {title}
                </Text>
                <Text
                    position={[0, 2.5, 0]}
                    fontSize={0.6}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                    fontWeight="bold"
                >
                    {amount}
                </Text>
                <Text
                    position={[0, 2, 0]}
                    fontSize={0.3}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    {iconText}
                </Text>
            </Float>

            {/* Partículas alrededor del holograma */}
            <Sparkles position={[0, 2, 0]} count={50} scale={2} size={2} color={color} speed={0.5} opacity={0.5} />

            {/* Luz puntual del color del holograma */}
            <pointLight position={[0, 2, 0]} color={color} intensity={2} distance={5} />
        </group>
    );
};

const Floor = () => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#0A0A15" metalness={0.2} roughness={0.8} />
            {/* Añadir una rejilla de cibermundo */}
            <gridHelper args={[100, 100, "#02EAFF", "#111122"]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} />
        </mesh>
    );
};

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---

export default function FinyVersePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false); // Estado del cursor

    useEffect(() => {
        async function fetchFinancialData() {
            const supabase = createClient();

            // Obtener mes actual
            const now = new Date();
            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

            const { data: summaryData } = await supabase
                .from('monthly_summaries')
                .select('*')
                .eq('month', currentMonthStr)
                .single();

            const { data: savingsData } = await supabase
                .rpc('get_savings_summary');

            setData({
                income: summaryData?.total_income || 0,
                expenses: summaryData?.total_expenses || 0,
                savings: summaryData?.total_savings || 0,
                goalsAmount: savingsData && savingsData[0] ? savingsData[0].total_saved : 0,
            });
            setLoading(false);
        }

        fetchFinancialData();

        // Event listener para detectar bloqueo/desbloqueo real del ratón
        const handleLockChange = () => {
            setIsLocked(document.pointerLockElement !== null);
        };

        document.addEventListener("pointerlockchange", handleLockChange);
        return () => {
            document.removeEventListener("pointerlockchange", handleLockChange);
        };
    }, []);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full z-10 p-4 sm:p-6 flex justify-between items-start pointer-events-none">
                <div>
                    <Link href="/dashboard" className="pointer-events-auto flex items-center gap-2 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 px-4 py-2 rounded-xl backdrop-blur-md transition-all">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold">Salir de FinyVerse</span>
                    </Link>
                    <div className="mt-4">
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#02EAFF] to-[#7739FE] tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(2,234,255,0.5)]">
                            FinyVerse <span className="text-white">v1.0</span>
                        </h1>
                        <p className="text-xs text-[var(--brand-gray)] font-bold uppercase tracking-[0.2em] mt-1">
                            {isLocked ? "Modo Inmersivo Activo" : "Pulsa START para entrar"}
                        </p>
                    </div>
                </div>

                <div className="text-right pointer-events-auto bg-black/50 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-[var(--brand-gray)] font-bold uppercase tracking-widest mb-1">Controles</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-bold text-white">W</div><span className="text-xs text-white/80">Adelante</span></div>
                        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-bold text-white">🖱️</div><span className="text-xs text-white/80">Mirar</span></div>
                        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-bold text-white">S</div><span className="text-xs text-white/80">Atrás</span></div>
                        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-bold text-[var(--danger)]">ESC</div><span className="text-xs text-[var(--danger)]">Pausa</span></div>
                        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-bold text-white">A</div><span className="text-xs text-white/80">Izquierda</span></div>
                        <div></div>
                        <div className="flex items-center gap-2"><div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-bold text-white">D</div><span className="text-xs text-white/80">Derecha</span></div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center relative z-20">
                    <Loader2 className="w-12 h-12 text-[#02EAFF] animate-spin mb-4" />
                    <p className="text-[#02EAFF] font-black uppercase tracking-widest text-sm animate-pulse">Renderizando Cibermundo...</p>
                </div>
            ) : (
                <div className="flex-1 relative">
                    {!isLocked && (
                        <div
                            id="click-to-start"
                            className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer group"
                        >
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#02EAFF] to-[#7739FE] p-[2px] mb-6 animate-pulse group-hover:scale-110 transition-transform">
                                <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#02EAFF]/20 to-[#7739FE]/20" />
                                    <MousePointerClick className="w-10 h-10 text-white relative z-10 group-hover:-translate-y-1 transition-transform" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Haz clic para entrar</h2>
                            <p className="text-[var(--brand-cyan)] font-bold tracking-[0.2em] text-sm uppercase">Modo Inmersivo 3D</p>
                        </div>
                    )}

                    <Canvas shadows>
                        <PlayerControls />

                        <Sky distance={450000} sunPosition={[0, -1, 0]} inclination={0} azimuth={0.25} turbidity={10} rayleigh={2} />
                        <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={1} />
                        <ambientLight intensity={0.2} />
                        <pointLight position={[0, 10, 0]} intensity={1} color="#02EAFF" />

                        <Floor />

                        {/* Stand de Ingresos */}
                        <HologramStand
                            position={[-4, 0, -5]}
                            title="INGRESOS DEL MES"
                            amount={formatMoney(data?.income || 0)}
                            color="#2EEB8F"
                            iconText="📈"
                        />

                        {/* Stand de Gastos */}
                        <HologramStand
                            position={[0, 0, -8]}
                            title="GASTOS DEL MES"
                            amount={formatMoney(data?.expenses || 0)}
                            color="#F43F5E"
                            iconText="📉"
                        />

                        {/* Stand de Ahorro / Metas */}
                        <HologramStand
                            position={[4, 0, -5]}
                            title="AHORRO TOTAL"
                            amount={formatMoney(data?.goalsAmount || 0)}
                            color="#02EAFF"
                            iconText="🏦"
                        />

                        {/* Logo Central Gigante de fondo */}
                        <Text
                            position={[0, 10, -20]}
                            fontSize={4}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.1}
                            outlineColor="#7739FE"
                        >
                            FINYBUDDY
                        </Text>
                        <Text
                            position={[0, 6, -20]}
                            fontSize={1.5}
                            color="#02EAFF"
                            anchorX="center"
                            anchorY="middle"
                        >
                            METAVERSE ALPHA
                        </Text>
                    </Canvas>
                </div>
            )}
        </div>
    );
}
