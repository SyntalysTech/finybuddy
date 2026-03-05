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
    Sphere
} from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft, MousePointerClick, Loader2, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// --- WEB SPEECH API HELPER (I.A. VOICE) ---
const speakCinematic = (text: string, enabled: boolean) => {
    if (!enabled || typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop talking

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Buscar una voz en español que suene bien (Microsoft Sabina/Helena, Google español, etc.)
    const esVoice = voices.find(v => v.lang.startsWith("es-") && v.name.toLowerCase().includes("microsoft"));
    const altVoice = voices.find(v => v.lang.startsWith("es-"));
    if (esVoice) utterance.voice = esVoice;
    else if (altVoice) utterance.voice = altVoice;

    // Configuración para que suene como I.A de película
    utterance.rate = 0.9;
    utterance.pitch = 0.3; // Más grave, menos robótico agudo
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
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

// Stand Interactivo que habla al acercarse
const InteractiveStand = ({ position, title, amount, color, voiceText, voiceEnabled, scale = 1, icon }: any) => {
    const { camera } = useThree();
    const [isNear, setIsNear] = useState(false);
    const boxRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const dist = camera.position.distanceTo(new THREE.Vector3(...position));
        if (dist < 6 && !isNear) {
            setIsNear(true);
            speakCinematic(voiceText, voiceEnabled);
        } else if (dist >= 6 && isNear) {
            setIsNear(false);
        }

        if (boxRef.current) {
            // Latido sutil
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * (isNear ? 0.05 : 0.02);
            boxRef.current.scale.set(pulse * scale, pulse * scale, pulse * scale);
        }
    });

    return (
        <group position={position}>
            {/* Pedestal Voxel (Minecraft style base) */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[3, 1, 3]} />
                <meshStandardMaterial color="#1a1a2e" roughness={0.9} metalness={0.1} />
            </mesh>
            <mesh position={[0, 1.25, 0]}>
                <boxGeometry args={[2, 0.5, 2]} />
                <meshStandardMaterial color={color} roughness={0.1} metalness={0.8} emissive={color} emissiveIntensity={isNear ? 0.5 : 0.2} />
            </mesh>

            <Float speed={2} rotationIntensity={isNear ? 1.5 : 0.5} floatIntensity={1}>
                {/* Gran Cubo Flotante */}
                <mesh ref={boxRef} position={[0, 3.5, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
                    <boxGeometry args={[1.5, 1.5, 1.5]} />
                    <meshPhysicalMaterial
                        color={color}
                        transmission={0.8}
                        opacity={1}
                        roughness={0.1}
                        metalness={0.5}
                        ior={1.5}
                        thickness={1}
                        emissive={color}
                        emissiveIntensity={isNear ? 0.8 : 0.3}
                        wireframe={!isNear}
                    />
                </mesh>
            </Float>

            {/* Foco de luz */}
            <pointLight position={[0, 4, 0]} color={color} intensity={isNear ? 4 : 2} distance={15} />

            {/* Data Holograma Arriba */}
            <Text position={[0, 6, 0]} fontSize={0.6} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor={color}>
                {title}
            </Text>
            <Text position={[0, 5, 0]} fontSize={1.5} color={color} anchorX="center" anchorY="middle" fontWeight="black" fillOpacity={isNear ? 1 : 0.5}>
                {amount}
            </Text>
            {icon && (
                <Text position={[0, 3.5, 0]} fontSize={2} color="#ffffff" anchorX="center" anchorY="middle" fillOpacity={0.2}>
                    {icon}
                </Text>
            )}

            {/* Partículas de anillo */}
            <Sparkles position={[0, 3.5, 0]} count={isNear ? 100 : 30} scale={4} size={3} color={color} speed={isNear ? 1.5 : 0.5} opacity={isNear ? 1 : 0.5} />
        </group>
    );
};

// Nodos flotantes (operaciones) en el cielo
const FloatingDataNode = ({ position, data, color }: { position: [number, number, number], data: any, color: string }) => {
    const ref = useRef<THREE.Group>(null);
    const timeOffset = useMemo(() => Math.random() * 100, []);

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.position.y += Math.sin(clock.elapsedTime + timeOffset) * 0.005;
            ref.current.rotation.y += 0.01;
        }
    });

    return (
        <group ref={ref} position={position}>
            <Float speed={4} rotationIntensity={1} floatIntensity={1}>
                <mesh>
                    <octahedronGeometry args={[0.3]} />
                    <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.8} wireframe thickness={2} />
                </mesh>
                <Text position={[0, 0.6, 0]} fontSize={0.25} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor={color}>
                    {data.concept.substring(0, 15)}
                </Text>
                <Text position={[0, 0.3, 0]} fontSize={0.3} color={color} anchorX="center" anchorY="middle" fontWeight="bold">
                    {data.type === 'income' ? '+' : '-'}{data.amount}€
                </Text>
            </Float>
        </group>
    );
};

// Suelo estilo Voxel/Neon grid
const VoxelFloor = () => {
    return (
        <group>
            {/* Infinite flat space */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#050510" metalness={0.5} roughness={0.8} />
            </mesh>
            {/* Camino de Neon principal */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[10, 80]} />
                <meshStandardMaterial color="#0A0A15" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Decoración Voxelizada alrededor del camino */}
            {Array.from({ length: 40 }).map((_, i) => (
                <mesh key={`voxel-l-${i}`} position={[-6 - Math.random() * 20, 0, -30 + Math.random() * 70]}>
                    <boxGeometry args={[Math.random() * 2 + 1, Math.random() * 2, Math.random() * 2 + 1]} />
                    <meshStandardMaterial color="#1a1a2a" roughness={1} />
                </mesh>
            ))}
            {Array.from({ length: 40 }).map((_, i) => (
                <mesh key={`voxel-r-${i}`} position={[6 + Math.random() * 20, 0, -30 + Math.random() * 70]}>
                    <boxGeometry args={[Math.random() * 2 + 1, Math.random() * 2, Math.random() * 2 + 1]} />
                    <meshStandardMaterial color="#1a1a2a" roughness={1} />
                </mesh>
            ))}
            <gridHelper args={[200, 100, "#021A2F", "#080816"]} position={[0, 0.01, 0]} />
            <gridHelper args={[10, 10, "#02EAFF", "#02EAFF"]} position={[0, 0.02, 0]} rotation={[0, 0, 0]} />
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

                        <ambientLight intensity={0.4} color="#556688" />
                        <directionalLight position={[20, 30, 20]} intensity={1.5} color="#ffffff" castShadow />

                        <VoxelFloor />

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
