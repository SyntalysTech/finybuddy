"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    PointerLockControls,
    Text,
    Stars,
    Float,
    Sky,
    Box,
    Sparkles,
    Sphere,
    MeshDistortMaterial,
    MeshWobbleMaterial,
    Torus,
    Circle
} from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft, MousePointerClick, Loader2, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// --- ELEVENLABS TTS HELPER ---
const speakCinematic = async (text: string, enabled: boolean) => {
    if (!enabled || typeof window === "undefined") return;

    try {
        // Fallback inmediato a SpeechSynthesis para que no haya silencio mientras carga
        const utterance = new SpeechSynthesisUtterance("Procesando...");
        utterance.volume = 0; // Silencio
        window.speechSynthesis.speak(utterance);

        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = 1.0;
            audio.play();
        } else {
            // Fallback a voz nativa si falla ElevenLabs
            const nativeUtterance = new SpeechSynthesisUtterance(text);
            nativeUtterance.lang = "es-ES";
            nativeUtterance.rate = 0.9;
            nativeUtterance.pitch = 0.8;
            window.speechSynthesis.speak(nativeUtterance);
        }
    } catch (error) {
        console.error("TTS Error:", error);
    }
};

// --- HOOKS Y COMPONENTES 3D ---

const PlayerControls = () => {
    const { camera } = useThree();
    const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });

    useEffect(() => {
        camera.position.set(0, 1.6, 20);

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case "w": keys.current.w = true; break;
                case "a": keys.current.a = true; break;
                case "s": keys.current.s = true; break;
                case "d": keys.current.d = true; break;
                case "shift": keys.current.shift = true; break;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case "w": keys.current.w = false; break;
                case "a": keys.current.a = false; break;
                case "s": keys.current.s = false; break;
                case "d": keys.current.d = false; break;
                case "shift": keys.current.shift = false; break;
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
        const speedMultiplier = keys.current.shift ? 25 : 12;
        const speed = speedMultiplier * delta;
        if (keys.current.w) camera.translateZ(-speed);
        if (keys.current.s) camera.translateZ(speed);
        if (keys.current.a) camera.translateX(-speed);
        if (keys.current.d) camera.translateX(speed);

        // Limitar la altura: Headbob effect
        const time = state.clock.getElapsedTime();
        const isWalking = keys.current.w || keys.current.s || keys.current.a || keys.current.d;
        camera.position.y = 1.6 + (isWalking ? Math.sin(time * 12) * 0.05 : 0);

        // Límites del mapa para no caer al vacío
        if (camera.position.x > 80) camera.position.x = 80;
        if (camera.position.x < -80) camera.position.x = -80;
        if (camera.position.z > 80) camera.position.z = 80;
        if (camera.position.z < -80) camera.position.z = -80;
    });

    return <PointerLockControls selector="#click-to-start" />;
};

// Anillo tecnológico rotante
const TechRing = ({ radius, color, speed = 1, tilt = false }: any) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.z += 0.01 * speed;
            ref.current.rotation.x += tilt ? 0.005 : 0;
        }
    });

    return (
        <group ref={ref} rotation={[Math.PI / 2, 0, 0]}>
            <Torus args={[radius, 0.02, 16, 100]}>
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </Torus>
            {/* Pequeños nodos en el anillo */}
            <mesh position={[radius, 0, 0]}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} />
            </mesh>
            <mesh position={[-radius, 0, 0]}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} />
            </mesh>
        </group>
    );
};

// Stand Interactivo PREMIUM (La Torre de Datos)
const InteractiveStand = ({ position, title, amount, color, voiceText, voiceEnabled, scale = 1, icon }: any) => {
    const { camera } = useThree();
    const [isNear, setIsNear] = useState(false);
    const crystalRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const dist = camera.position.distanceTo(new THREE.Vector3(...position));
        if (dist < 8 && !isNear) {
            setIsNear(true);
            speakCinematic(voiceText, voiceEnabled);
        } else if (dist >= 8 && isNear) {
            setIsNear(false);
        }
    });

    return (
        <group position={position} scale={scale}>
            {/* Base - Concentric Glow Rings */}
            <group position={[0, 0.05, 0]}>
                <Circle args={[4, 64]} rotation={[-Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color={color} transparent opacity={0.05} />
                </Circle>
                <Torus args={[3.8, 0.03, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={0.3} />
                </Torus>
                <Torus args={[3.2, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.2} />
                </Torus>
            </group>

            {/* Pedestal Central - Cyber Column */}
            <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.8, 1.2, 4, 32]} />
                <meshPhysicalMaterial
                    color="#0a0a1a"
                    roughness={0.1}
                    metalness={0.9}
                    emissive={color}
                    emissiveIntensity={isNear ? 0.2 : 0.05}
                />
            </mesh>

            {/* Glow Core */}
            <mesh position={[0, 4, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 8, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNear ? 10 : 2} transparent opacity={0.3} />
            </mesh>

            {/* The Floating Crystal (Heart) */}
            <Float speed={3} rotationIntensity={2} floatIntensity={1.5}>
                <mesh position={[0, 5, 0]} ref={crystalRef}>
                    <octahedronGeometry args={[1.2]} />
                    <MeshDistortMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={isNear ? 4 : 1}
                        speed={2}
                        distort={0.3}
                        transparent
                        opacity={0.9}
                        metalness={1}
                        roughness={0}
                    />
                </mesh>

                {/* Icon inside crystal (Hologram look) */}
                <Text position={[0, 5, 1.3]} fontSize={1} color="#ffffff" anchorX="center" anchorY="middle" fillOpacity={isNear ? 1 : 0.5}>
                    {icon}
                </Text>
            </Float>

            {/* Tech Orbitals */}
            <group position={[0, 5, 0]}>
                <TechRing radius={2.2} color={color} speed={1.5} />
                <TechRing radius={2.8} color={color} speed={-0.8} tilt />
                <TechRing radius={3.5} color={color} speed={0.4} />
            </group>

            {/* Data Hologram Overlay */}
            <group position={[0, 8.5, 0]}>
                <Float speed={5} rotationIntensity={0} floatIntensity={0.5}>
                    <Text fontSize={0.7} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor={color} fontWeight="black">
                        {title.toUpperCase()}
                    </Text>
                    <Text position={[0, -1.2, 0]} fontSize={2} color={color} fontWeight="black" anchorX="center" anchorY="middle">
                        {amount}
                    </Text>
                    {isNear && (
                        <Text position={[0, -2.2, 0]} fontSize={0.3} color="#ffffff" fillOpacity={0.6} fontWeight="bold">
                            ANALIZANDO FLUJO...
                        </Text>
                    )}
                </Float>
            </group>

            {/* Lights */}
            <pointLight position={[0, 5, 0]} color={color} intensity={isNear ? 15 : 5} distance={20} />
            <Sparkles position={[0, 5, 0]} count={isNear ? 150 : 40} scale={6} size={4} color={color} speed={2} />
        </group>
    );
};

// Nodos flotantes (operaciones)
const FloatingDataNode = ({ position, data, color }: { position: [number, number, number], data: any, color: string }) => {
    const ref = useRef<THREE.Group>(null);
    const timeOffset = useMemo(() => Math.random() * 100, []);

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.position.y += Math.sin(clock.elapsedTime + timeOffset) * 0.005;
            ref.current.rotation.y += 0.02;
        }
    });

    return (
        <group ref={ref} position={position}>
            <Float speed={5} rotationIntensity={2} floatIntensity={1}>
                <mesh>
                    <dodecahedronGeometry args={[0.2]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
                </mesh>
                <Text position={[0, 0.5, 0]} fontSize={0.2} color="#ffffff" fontWeight="black">
                    {data.concept.toUpperCase()}
                </Text>
                <Text position={[0, 0.3, 0]} fontSize={0.25} color={color} fontWeight="black">
                    {data.type === 'income' ? '+' : '-'}{data.amount}€
                </Text>
            </Float>
        </group>
    );
};

// Metropolis Financiera - Ambient Buildings
const DataMetropolis = () => {
    const buildings = useMemo(() => {
        return Array.from({ length: 60 }).map((_, i) => ({
            position: [
                (Math.random() - 0.5) * 150,
                0,
                -30 - Math.random() * 100
            ] as [number, number, number],
            scale: [2 + Math.random() * 5, 10 + Math.random() * 50, 2 + Math.random() * 5] as [number, number, number],
            color: Math.random() > 0.5 ? "#02EAFF" : "#7739FE",
            opacity: 0.1 + Math.random() * 0.2
        }));
    }, []);

    return (
        <group>
            {buildings.map((b, i) => (
                <group key={i} position={b.position}>
                    <mesh position={[0, b.scale[1] / 2, 0]}>
                        <boxGeometry args={b.scale} />
                        <meshStandardMaterial color="#050510" metalness={1} roughness={0} />
                    </mesh>
                    {/* Glowing Edges / Windows */}
                    <mesh position={[0, b.scale[1] / 2, 0]}>
                        <boxGeometry args={[b.scale[0] + 0.1, b.scale[1], b.scale[2] + 0.1]} />
                        <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.5} wireframe transparent opacity={b.opacity} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

// Suelo estilo Cyber Grid
const MatrixFloor = () => {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#020205" metalness={1} roughness={0.1} />
            </mesh>
            <gridHelper args={[500, 100, "#111122", "#050510"]} position={[0, 0.01, 0]} />

            {/* Main Path Glow */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[12, 100]} />
                <meshStandardMaterial color="#000000" emissive="#02EAFF" emissiveIntensity={0.05} />
            </mesh>
            <gridHelper args={[12, 12, "#02EAFF", "#02EAFF"]} position={[0, 0.05, 0]} />
        </group>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function FinyVersePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const initializedVoice = useRef(false);

    useEffect(() => {
        async function fetchFinancialData() {
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const now = new Date();
            const selectedYear = now.getFullYear();
            const selectedMonth = now.getMonth() + 1;

            const [summaryRes, savingsRes, debtsRes, opsRes] = await Promise.all([
                supabase.rpc("get_monthly_summary", { p_user_id: user.id, p_year: selectedYear, p_month: selectedMonth }),
                supabase.rpc("get_savings_summary", { p_user_id: user.id }),
                supabase.rpc("get_debts_summary", { p_user_id: user.id }),
                supabase.from("operations").select('id, type, amount, concept').eq("user_id", user.id).order("operation_date", { ascending: false }).limit(20)
            ]);

            const summary = summaryRes.data?.[0];
            const savings = savingsRes.data?.[0];
            const debts = debtsRes.data?.[0];

            setData({
                income: summary?.total_income || 0,
                expenses: summary?.total_expenses || 0,
                savings: summary?.total_savings || 0,
                goalsAmount: savings?.total_saved || 0,
                debtsAmount: debts?.total_remaining || 0,
                operations: opsRes.data || []
            });
            setLoading(false);
        }

        fetchFinancialData();

        const handleLockChange = () => {
            const locked = document.pointerLockElement !== null;
            setIsLocked(locked);

            // Bienvenida una sola vez cuando entramos
            if (locked && !initializedVoice.current) {
                initializedVoice.current = true;
                setTimeout(() => {
                    speakCinematic("Conexión neural establecida. Sistema cargado online. Bienvenido a tu Ciudad Financiera FinyVerse. Camina hacia los pilares para analizar tus datos.", voiceEnabled);
                }, 1000);
            }
        };

        document.addEventListener("pointerlockchange", handleLockChange);
        return () => {
            document.removeEventListener("pointerlockchange", handleLockChange);
            if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
        }
    }, [voiceEnabled]);

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
            <div className={`absolute top-0 left-0 w-full z-10 p-4 sm:p-6 flex justify-between items-start pointer-events-none transition-opacity duration-1000 ${isLocked ? "opacity-30" : "opacity-100"}`}>
                <div>
                    <Link href="/dashboard" className="pointer-events-auto flex items-center gap-2 text-white/50 hover:text-white bg-black/50 hover:bg-[var(--brand-cyan)]/20 px-4 py-2 rounded-xl backdrop-blur-md transition-all border border-white/5 hover:border-[var(--brand-cyan)] group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">Desconectar del Matrix</span>
                    </Link>
                    <div className="mt-4">
                        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#02EAFF] via-white to-[#7739FE] tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(2,234,255,0.6)]">
                            FinyVerse <span className="text-white text-3xl">V3.0</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-[#2EEB8F] font-black uppercase tracking-[0.4em] mt-2 drop-shadow-[0_0_8px_rgba(46,235,143,0.8)]">
                            {isLocked ? "SISTEMA NEURAL EN LÍNEA - MOVIENDO" : "SISTEMA DESCONECTADO - ESPERANDO USUARIO"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 pointer-events-auto">
                    <button
                        onClick={() => {
                            setVoiceEnabled(!voiceEnabled);
                            if (voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border transition-all ${voiceEnabled ? 'bg-[var(--brand-cyan)]/20 border-[var(--brand-cyan)] text-[var(--brand-cyan)]' : 'bg-red-500/20 border-red-500 text-red-500'}`}
                    >
                        {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{voiceEnabled ? 'Voz I.A. Activada' : 'Voz I.A. Silenciada'}</span>
                    </button>

                    <div className="bg-black/60 backdrop-blur-xl px-5 py-4 rounded-xl border border-white/10 shadow-[0_0_30px_rgba(2,234,255,0.15)]">
                        <p className="text-[10px] text-[var(--brand-cyan)] font-black uppercase tracking-widest mb-3 border-b border-[var(--brand-cyan)]/30 pb-2">Controles de Navegación</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/5 outline outline-1 outline-white/20 rounded flex items-center justify-center text-xs font-black text-white shadow-inner">W</div><span className="text-xs font-bold text-white/80 uppercase">Avanzar</span></div>
                            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/5 outline outline-1 outline-white/20 rounded flex items-center justify-center text-[10px] font-black text-[var(--brand-cyan)] shadow-inner">SHIFT</div><span className="text-xs font-bold text-[var(--brand-cyan)] uppercase">Correr</span></div>
                            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/5 outline outline-1 outline-white/20 rounded flex items-center justify-center text-xs font-black text-white shadow-inner">S</div><span className="text-xs font-bold text-white/80 uppercase">Atrás</span></div>
                            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/5 outline outline-1 outline-white/20 rounded flex items-center justify-center text-xs font-black text-white shadow-inner">🖱️</div><span className="text-xs font-bold text-white/80 uppercase">Mirar</span></div>
                            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/5 outline outline-1 outline-white/20 rounded flex items-center justify-center text-xs font-black text-white shadow-inner">A D</div><span className="text-xs font-bold text-white/80 uppercase">Lados</span></div>
                            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-red-500/10 outline outline-1 outline-red-500/50 rounded flex items-center justify-center text-[10px] font-black text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">ESC</div><span className="text-xs font-black text-red-500 uppercase tracking-widest">Pausa</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center relative z-20">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#02EAFF] blur-3xl opacity-30 rounded-full" />
                        <div className="absolute inset-0 border-4 border-[var(--brand-cyan)] border-t-transparent rounded-full animate-spin" />
                        <Loader2 className="w-20 h-20 text-white animate-pulse p-4 relative z-10 drop-shadow-[0_0_15px_rgba(2,234,255,1)]" />
                    </div>
                    <p className="text-[var(--brand-cyan)] font-black uppercase tracking-[0.5em] text-sm animate-pulse drop-shadow-lg mt-8">Generando Estructuras Voxel...</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">{"> SYNC_DB_SUCCESS"}</p>
                </div>
            ) : (
                <div className="flex-1 relative">
                    {!isLocked && (
                        <div
                            id="click-to-start"
                            className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer group"
                        >
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#02EAFF] to-[#7739FE] p-[2px] mb-8 animate-pulse group-hover:scale-110 transition-transform shadow-[0_0_60px_rgba(2,234,255,0.6)]">
                                <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#02EAFF]/40 to-[#7739FE]/40" />
                                    <MousePointerClick className="w-12 h-12 text-white relative z-10 group-hover:-translate-y-1 transition-transform drop-shadow-xl" />
                                </div>
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-widest mb-4 drop-shadow-[0_2px_15px_rgba(255,255,255,0.5)]">CLICK PARA ENTRAR AL METAVERSO</h2>
                            <p className="text-[var(--brand-cyan)] font-black tracking-[0.4em] text-sm uppercase bg-black/60 px-6 py-3 rounded-full border-2 border-[var(--brand-cyan)]/30 group-hover:border-[var(--brand-cyan)] shadow-[0_0_20px_rgba(2,234,255,0.2)]">Haz clic para capturar inmersión total</p>
                        </div>
                    )}

                    <Canvas shadows camera={{ fov: 75 }}>
                        <PlayerControls />
                        <fog attach="fog" args={["#050510", 15, 60]} />

                        <Sky distance={450000} sunPosition={[0, -2, -10]} inclination={0.6} azimuth={0.1} turbidity={20} rayleigh={0.5} />
                        <Stars radius={150} depth={50} count={15000} factor={6} saturation={1} fade speed={1} />

                        <ambientLight intensity={0.2} color="#556688" />
                        <pointLight position={[10, 20, 10]} intensity={2} color="#02EAFF" />
                        <directionalLight position={[20, 50, -20]} intensity={1} color="#ffffff" castShadow />

                        <MatrixFloor />
                        <DataMetropolis />

                        {/* BLOQUE DINÁMICO: INGRESOS */}
                        <InteractiveStand
                            position={[-12, 0, -15]}
                            title="NODO DE INGRESOS"
                            amount={formatMoney(data?.income || 0)}
                            color="#2EEB8F" /* Verde exito */
                            voiceText={`Bienvenido al nodo de ingresos. Este mes has generado ${data?.income || 0} euros de liquidez entrante. Estructura verde optimizada.`}
                            voiceEnabled={voiceEnabled}
                            scale={1.2}
                            icon="▲"
                        />

                        {/* BLOQUE DINÁMICO: GASTOS */}
                        <InteractiveStand
                            position={[-4, 0, -25]}
                            title="TORRE DE GASTOS"
                            amount={formatMoney(data?.expenses || 0)}
                            color="#F43F5E" /* Rojo alerta */
                            voiceText={`Alerta en la torre de gastos. Detectamos salidas de ${data?.expenses || 0} euros en tus operaciones. Mantén esta alerta vigilada para no devaluar el imperio.`}
                            voiceEnabled={voiceEnabled}
                            scale={1.5}
                            icon="▼"
                        />

                        {/* BLOQUE DINÁMICO: AHORROS / METAS */}
                        <InteractiveStand
                            position={[12, 0, -15]}
                            title="CÁMARA DE AHORRO"
                            amount={formatMoney(data?.goalsAmount || 0)}
                            color="#02EAFF" /* Azul Finybuddy */
                            voiceText={`Bóveda acorazada alcanzada. Tu capital protegido y ahorrado asciende a ${data?.goalsAmount || 0} euros. Tu fortaleza de futuro sigue intacta.`}
                            voiceEnabled={voiceEnabled}
                            scale={1.2}
                            icon="◆"
                        />

                        {/* BLOQUE DINÁMICO: DEUDAS */}
                        <InteractiveStand
                            position={[4, 0, -25]}
                            title="ABISMO DE DEUDAS"
                            amount={formatMoney(data?.debtsAmount || 0)}
                            color="#F59E0B" /* Naranja / Amarillo */
                            voiceText={data?.debtsAmount > 0
                                ? `Sector inestable de pasivos. Actualmente mantienes ${data?.debtsAmount} euros en deudas activas. Prioriza su liquidación preventiva.`
                                : `Sector de pasivos estabilizado. Tienes 0 deudas. Esta es una plataforma segura.`}
                            voiceEnabled={voiceEnabled}
                            scale={1}
                            icon="✕"
                        />

                        {/* Operaciones Flotantes alrededor del pasillo neuronal */}
                        {data?.operations?.map((op: any, index: number) => {
                            const side = index % 2 === 0 ? -1 : 1;
                            const zDist = -10 - (index * 2);
                            const xDist = side * (8 + Math.random() * 5);
                            const color = op.type === 'income' ? '#2EEB8F' : (op.type === 'expense' ? '#F43F5E' : '#FED235');

                            return (
                                <FloatingDataNode
                                    key={op.id}
                                    position={[xDist, 2 + Math.random() * 4, zDist]}
                                    data={op}
                                    color={color}
                                />
                            );
                        })}

                        {/* Texto Holográfico Central Volador gigante al fondo del camino */}
                        <group position={[0, 25, -50]}>
                            <Float speed={2} rotationIntensity={0.2} floatIntensity={2}>
                                <Text
                                    position={[0, 5, 0]}
                                    fontSize={15}
                                    color="#ffffff"
                                    anchorX="center"
                                    anchorY="middle"
                                    outlineWidth={0.3}
                                    outlineColor="#7739FE"
                                    fontWeight="black"
                                >
                                    FINYBUDDY
                                </Text>
                                <Text
                                    position={[0, -3, 0]}
                                    fontSize={4}
                                    color="#02EAFF"
                                    anchorX="center"
                                    anchorY="middle"
                                    fontWeight="bold"
                                >
                                    C I U D A D   F I N A N C I E R A
                                </Text>
                            </Float>
                        </group>
                    </Canvas>
                </div>
            )}
        </div>
    );
}
