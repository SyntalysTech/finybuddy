"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
    Trail
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
        camera.position.set(0, 1.6, 10);

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
        const speed = 15 * delta;
        if (keys.current.w) camera.translateZ(-speed);
        if (keys.current.s) camera.translateZ(speed);
        if (keys.current.a) camera.translateX(-speed);
        if (keys.current.d) camera.translateX(speed);

        // Limitar la altura para evitar "volar" pero dar un sutil rebote al caminar
        const time = state.clock.getElapsedTime();
        const isWalking = keys.current.w || keys.current.s || keys.current.a || keys.current.d;
        camera.position.y = 1.6 + (isWalking ? Math.sin(time * 10) * 0.05 : 0);

        // Límites expandidos
        if (camera.position.x > 40) camera.position.x = 40;
        if (camera.position.x < -40) camera.position.x = -40;
        if (camera.position.z > 40) camera.position.z = 40;
        if (camera.position.z < -40) camera.position.z = -40;
    });

    return <PointerLockControls selector="#click-to-start" />;
};

const DataPillar = ({ position, title, amount, color, heightValue }: { position: [number, number, number], title: string, amount: string, color: string, heightValue: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    // Escalamos la altura: min 0.5 unidades, max infinito
    const targetHeight = Math.max(0.2, heightValue / 500);

    useFrame(() => {
        if (meshRef.current) {
            // Animación de crecimiento suave desde la base
            meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetHeight, 0.03);
            meshRef.current.position.y = meshRef.current.scale.y / 2;
        }
    });

    return (
        <group position={position}>
            {/* Pilar base de datos */}
            <mesh ref={meshRef} position={[0, 0.1, 0]} scale={[1, 0.1, 1]}>
                <cylinderGeometry args={[1.5, 1.5, 1, 6]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} emissive={color} emissiveIntensity={0.6} wireframe={false} />
            </mesh>

            {/* Armazón wireframe */}
            <mesh position={[0, targetHeight / 2, 0]}>
                <cylinderGeometry args={[1.6, 1.6, targetHeight + 0.5, 6]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
            </mesh>

            <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
                {/* Cristal holográfico rotando arriba */}
                <group position={[0, targetHeight + 2, 0]}>
                    <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshPhysicalMaterial color={color} transmission={0.9} opacity={1} metalness={0.2} roughness={0} ior={1.5} thickness={1} emissive={color} emissiveIntensity={0.4} />
                    </mesh>
                </group>

                {/* Textos de Datos Financieros */}
                <Text position={[0, targetHeight + 3.5, 0]} fontSize={0.6} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor={color}>
                    {title}
                </Text>
                <Text position={[0, targetHeight + 2.8, 0]} fontSize={1.2} color={color} anchorX="center" anchorY="middle" fontWeight="bold">
                    {amount}
                </Text>
            </Float>

            {/* Partículas subiendo por el pilar */}
            <Sparkles position={[0, targetHeight / 2, 0]} count={100} scale={[3, targetHeight, 3]} size={4} color={color} speed={1} opacity={0.8} />

            {/* Foco de luz debajo iluminando la ciudad */}
            <pointLight position={[0, targetHeight + 1, 0]} color={color} intensity={5} distance={20} decay={2} />
        </group>
    );
};

const FloatingDataNode = ({ position, data, color }: { position: [number, number, number], data: any, color: string }) => {
    const ref = useRef<THREE.Group>(null);
    const timeOffset = useMemo(() => Math.random() * 100, []);

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.position.y += Math.sin(clock.elapsedTime * 2 + timeOffset) * 0.003;
            ref.current.rotation.y += 0.01;
            ref.current.rotation.z += 0.005;
        }
    });

    return (
        <group ref={ref} position={position}>
            <Float speed={5} rotationIntensity={2} floatIntensity={2}>
                <mesh>
                    <octahedronGeometry args={[0.4]} />
                    <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={1} wireframe thickness={2} />
                </mesh>
                <Text position={[0, 0.8, 0]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor={color}>
                    {data.concept}
                </Text>
                <Text position={[0, 0.45, 0]} fontSize={0.4} color={color} anchorX="center" anchorY="middle" fontWeight="bold">
                    {data.type === 'income' ? '+' : '-'}{data.amount}€
                </Text>
            </Float>
            <pointLight distance={3} intensity={0.5} color={color} />
        </group>
    );
};

const Floor = () => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial color="#0A0A15" metalness={0.9} roughness={0.1} />
            {/* Red cibernética inmensa */}
            <gridHelper args={[200, 100, "#02EAFF", "#111122"]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} />
        </mesh>
    );
};

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---

export default function FinyVersePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

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

            // Conseguir los datos REALES con las RPC Functions que se usan en la app
            const [summaryRes, savingsRes, opsRes] = await Promise.all([
                supabase.rpc("get_monthly_summary", {
                    p_user_id: user.id,
                    p_year: selectedYear,
                    p_month: selectedMonth,
                }),
                supabase.rpc("get_savings_summary", {
                    p_user_id: user.id,
                }),
                supabase.from("operations")
                    .select('id, type, amount, concept')
                    .eq("user_id", user.id)
                    .order("operation_date", { ascending: false })
                    .limit(12) // Mostrar 12 operaciones flotando
            ]);

            const summary = summaryRes.data && summaryRes.data.length > 0 ? summaryRes.data[0] : null;
            const savings = savingsRes.data && savingsRes.data.length > 0 ? savingsRes.data[0] : null;

            setData({
                income: summary?.total_income || 0,
                expenses: summary?.total_expenses || 0,
                savings: summary?.total_savings || 0,
                goalsAmount: savings?.total_saved || 0,
                operations: opsRes.data || []
            });
            setLoading(false);
        }

        fetchFinancialData();

        const handleLockChange = () => {
            setIsLocked(document.pointerLockElement !== null);
        };

        document.addEventListener("pointerlockchange", handleLockChange);
        return () => document.removeEventListener("pointerlockchange", handleLockChange);
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
                        <span className="font-bold cursor-pointer">Salir de FinyVerse</span>
                    </Link>
                    <div className="mt-4">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#02EAFF] to-[#7739FE] tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(2,234,255,0.5)]">
                            FinyVerse <span className="text-white">v2.0</span>
                        </h1>
                        <p className="text-xs text-[var(--brand-cyan)] font-black uppercase tracking-[0.3em] mt-1 shadow-black drop-shadow-md">
                            {isLocked ? "MODO INMERSIVO ACTIVO" : "PULSA START PARA ENTRAR AL METAVERSO"}
                        </p>
                    </div>
                </div>

                <div className="text-right pointer-events-auto bg-black/50 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(2,234,255,0.1)]">
                    <p className="text-[10px] text-[var(--brand-cyan)] font-black uppercase tracking-widest mb-2">Controles Neuronales</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex items-center gap-3"><div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-xs font-black text-white shadow-inner">W</div><span className="text-xs font-bold text-white/80 uppercase">Avanzar</span></div>
                        <div className="flex items-center gap-3"><div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-xs font-black text-white shadow-inner">🖱️</div><span className="text-xs font-bold text-white/80 uppercase">Mirar</span></div>
                        <div className="flex items-center gap-3"><div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-xs font-black text-white shadow-inner">S</div><span className="text-xs font-bold text-white/80 uppercase">Atrás</span></div>
                        <div className="flex items-center gap-3"><div className="w-7 h-7 bg-white/10 outline outline-1 outline-[var(--danger)] rounded flex items-center justify-center text-[10px] font-black text-[var(--danger)] shadow-[0_0_10px_rgba(244,63,94,0.3)]">ESC</div><span className="text-xs font-bold text-[var(--danger)] uppercase tracking-widest">Liberar</span></div>
                        <div className="flex items-center gap-3"><div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-xs font-black text-white shadow-inner">A</div><span className="text-xs font-bold text-white/80 uppercase">Izquierda</span></div>
                        <div></div>
                        <div className="flex items-center gap-3"><div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-xs font-black text-white shadow-inner">D</div><span className="text-xs font-bold text-white/80 uppercase">Derecha</span></div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center relative z-20">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#02EAFF] blur-2xl opacity-20 rounded-full" />
                        <Loader2 className="w-16 h-16 text-[#02EAFF] animate-spin mb-6 relative z-10 drop-shadow-[0_0_10px_rgba(2,234,255,1)]" />
                    </div>
                    <p className="text-[#02EAFF] font-black uppercase tracking-[0.5em] text-sm animate-pulse drop-shadow-lg">Sincronizando Mente...</p>
                </div>
            ) : (
                <div className="flex-1 relative">
                    {!isLocked && (
                        <div
                            id="click-to-start"
                            className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer group"
                        >
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#02EAFF] to-[#7739FE] p-[2px] mb-8 animate-pulse group-hover:scale-110 transition-transform shadow-[0_0_50px_rgba(2,234,255,0.4)]">
                                <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#02EAFF]/30 to-[#7739FE]/30" />
                                    <MousePointerClick className="w-12 h-12 text-white relative z-10 group-hover:-translate-y-1 transition-transform drop-shadow-xl" />
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">ENTRAR AL METAVERSO</h2>
                            <p className="text-[var(--brand-cyan)] font-bold tracking-[0.4em] text-xs uppercase bg-black/50 px-4 py-2 rounded-full border border-[var(--brand-cyan)]/30">Haz clic para capturar inmersión</p>
                        </div>
                    )}

                    <Canvas shadows camera={{ fov: 75 }}>
                        <PlayerControls />
                        <fog attach="fog" args={["#0A0A15", 10, 80]} />

                        <Sky distance={450000} sunPosition={[0, -10, -10]} inclination={0.5} azimuth={0.25} turbidity={100} rayleigh={0.1} />
                        <Stars radius={200} depth={50} count={10000} factor={6} saturation={1} fade speed={2} />
                        <ambientLight intensity={0.5} color="#444466" />
                        <directionalLight position={[10, 20, 10]} intensity={1} color="#02EAFF" castShadow />

                        <Floor />

                        {/* Monolitos Gigantes Dinámicos */}
                        <DataPillar
                            position={[-10, 0, -15]}
                            title="MEGA ESTRUCTURA: INGRESOS"
                            amount={formatMoney(data?.income || 0)}
                            color="#2EEB8F" /* Verde exito */
                            heightValue={data?.income || 100}
                        />

                        <DataPillar
                            position={[0, 0, -20]}
                            title="NÚCLEO CRÍTICO: GASTOS"
                            amount={formatMoney(data?.expenses || 0)}
                            color="#F43F5E" /* Rojo alerta */
                            heightValue={data?.expenses || 100}
                        />

                        <DataPillar
                            position={[10, 0, -15]}
                            title="FORTALEZA: TUS AHORROS TOTALES"
                            amount={formatMoney(data?.goalsAmount || 0)}
                            color="#02EAFF" /* Azul Finybuddy */
                            heightValue={data?.goalsAmount || 100}
                        />

                        {/* Operaciones Flotantes */}
                        {data?.operations?.map((op: any, index: number) => {
                            // Crear un círculo alrededor del centro para las operaciones
                            const radius = 12;
                            const angle = (index / (data.operations.length || 1)) * Math.PI * 2;
                            const x = Math.cos(angle) * radius;
                            const z = Math.sin(angle) * radius - 5;
                            const color = op.type === 'income' ? '#2EEB8F' : (op.type === 'expense' ? '#F43F5E' : '#7739FE');

                            return (
                                <FloatingDataNode
                                    key={op.id}
                                    position={[x, 2 + Math.random() * 2, z]}
                                    data={op}
                                    color={color}
                                />
                            );
                        })}

                        {/* Texto Holográfico Central Volador */}
                        <group position={[0, 20, -30]}>
                            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={1}>
                                <Text
                                    position={[0, 4, 0]}
                                    fontSize={10}
                                    color="#ffffff"
                                    anchorX="center"
                                    anchorY="middle"
                                    outlineWidth={0.2}
                                    outlineColor="#7739FE"
                                    fontWeight="black"
                                >
                                    FINYBUDDY
                                </Text>
                                <Text
                                    position={[0, -2, 0]}
                                    fontSize={3}
                                    color="#02EAFF"
                                    anchorX="center"
                                    anchorY="middle"
                                    fontWeight="bold"
                                >
                                    HOLOGRAM NETWORK V2.0
                                </Text>
                            </Float>
                        </group>
                    </Canvas>
                </div>
            )}
        </div>
    );
}
