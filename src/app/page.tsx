"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  CreditCard,
  Calendar,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Sun,
  Moon,
  Sparkles,
  Shield,
  Zap,
  ChevronDown,
  Mail,
  Loader2,
  Crown,
  Check,
  X,
  Menu,
  LayoutDashboard,
  PieChart as PieChartIcon,
  Database,
  Play,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Wifi,
  Dumbbell,
  Gift,
  Mic,
  Phone,
  MessageCircle,
  Bell,
  Volume2,
  Plane,
  Eye,
  AlertTriangle,
  TrendingDown as Leak,
  RefreshCw,
  Send,
} from "lucide-react";

// ─── Testimonials ───
const TESTIMONIALS = [
  { name: "Maria Lopez", role: "Freelance / Disenadora", quote: "Antes usaba una hoja de Excel enorme. Con FinyBuddy tengo todo controlado en 5 minutos al dia. Finy me aviso cuando me estaba pasando en restaurantes y ajuste a tiempo.", avatar: "ML", color: "#EC4899" },
  { name: "Carlos Ruiz", role: "Ingeniero de Software", quote: "La demo de IA me convencio al instante. Subi mi extracto y en segundos tenia todo categorizado con la regla 50/30/20. Llevo 4 meses ahorrando un 22% de mi sueldo.", avatar: "CR", color: "#3B82F6" },
  { name: "Ana Torres", role: "Emprendedora", quote: "Lo que mas me gusta es que FinyBot no solo te dice donde gastas, sino que te dice que hacer. Es como tener un asesor financiero 24/7 por menos de un cafe al mes.", avatar: "AT", color: "#10B981" },
];

// Newsletter subscription form
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Error al suscribirse");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Inténtalo de nuevo.");
    }

    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 5000);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu email"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:border-[var(--brand-cyan)] focus:ring-2 focus:ring-[var(--brand-cyan)]/20 outline-none transition-all"
            disabled={status === "loading"}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading" || !email}
          className="px-6 py-3.5 rounded-xl bg-[var(--brand-cyan)] text-white font-semibold hover:bg-[var(--brand-cyan)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === "loading" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>Suscribirse</>
          )}
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-sm ${status === "success" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

// Animated counter component
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(increment * step, value));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}{current % 1 === 0 ? current.toLocaleString("es-ES") : current.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
    </span>
  );
}

// Interactive Finy AI Demo
const DEMO_TX = [
  { raw: "AMZN MKTPLACE ES", rawAmt: "34,50€", concept: "Amazon", amount: -34.50, category: "Compras online", icon: ShoppingCart, color: "#3B82F6", type: "wants" as const },
  { raw: "ALQUILER MENSUAL", rawAmt: "650,00€", concept: "Alquiler", amount: -650.00, category: "Vivienda", icon: Home, color: "#EF4444", type: "needs" as const },
  { raw: "UBER *TRIP ABCD", rawAmt: "8,90€", concept: "Uber", amount: -8.90, category: "Transporte", icon: Car, color: "#F59E0B", type: "needs" as const },
  { raw: "REST EL PINO", rawAmt: "24,00€", concept: "Restaurante El Pino", amount: -24.00, category: "Restaurantes", icon: Utensils, color: "#EC4899", type: "wants" as const },
  { raw: "VODAFONE FIBRA SP", rawAmt: "39,99€", concept: "Vodafone Fibra", amount: -39.99, category: "Suministros", icon: Wifi, color: "#06B6D4", type: "needs" as const },
  { raw: "BASIC FIT BCN", rawAmt: "29,90€", concept: "Basic-Fit", amount: -29.90, category: "Deporte", icon: Dumbbell, color: "#10B981", type: "wants" as const },
  { raw: "TRANSF AHORRO", rawAmt: "200,00€", concept: "Ahorro mensual", amount: -200.00, category: "Ahorro", icon: PiggyBank, color: "#02EAFF", type: "savings" as const },
  { raw: "REGALO CUMPLE MAMA", rawAmt: "45,00€", concept: "Regalo cumpleaños", amount: -45.00, category: "Regalos", icon: Gift, color: "#A855F7", type: "wants" as const },
];

const DEMO_INSIGHTS = [
  { text: "Restaurantes +18% vs mes anterior", type: "warning" as const },
  { text: "Ahorro al 19% — solo 1% para llegar al objetivo", type: "info" as const },
  { text: "Mueve 15€ de ocio → ahorro para alcanzar el 20%", type: "tip" as const },
];

function FinyAIDemo() {
  const [phase, setPhase] = useState<"idle" | "scanning" | "categorizing" | "analyzing" | "done">("idle");
  const [scanLine, setScanLine] = useState(-1);
  const [categorized, setCategorized] = useState(-1);
  const [showStats, setShowStats] = useState(false);
  const [showInsights, setShowInsights] = useState(-1);
  const [totalAnimated, setTotalAnimated] = useState(0);
  const [showDonut, setShowDonut] = useState(false);
  const timeoutsRef = useState<NodeJS.Timeout[]>([])[0];

  const clearAllTimeouts = () => { timeoutsRef.forEach(clearTimeout); timeoutsRef.length = 0; };
  const addTimeout = (fn: () => void, ms: number) => { timeoutsRef.push(setTimeout(fn, ms)); };

  const needsTotal = DEMO_TX.filter(t => t.type === "needs").reduce((s, t) => s + Math.abs(t.amount), 0);
  const wantsTotal = DEMO_TX.filter(t => t.type === "wants").reduce((s, t) => s + Math.abs(t.amount), 0);
  const savingsTotal = DEMO_TX.filter(t => t.type === "savings").reduce((s, t) => s + Math.abs(t.amount), 0);
  const total = needsTotal + wantsTotal + savingsTotal;

  const startDemo = () => {
    if (phase !== "idle") return;
    clearAllTimeouts();
    setScanLine(-1); setCategorized(-1); setShowStats(false); setShowInsights(-1); setTotalAnimated(0); setShowDonut(false);
    setPhase("scanning");

    DEMO_TX.forEach((_, i) => {
      addTimeout(() => setScanLine(i), i * 180);
    });

    addTimeout(() => setPhase("categorizing"), 400);
    DEMO_TX.forEach((_, i) => {
      addTimeout(() => setCategorized(i), 400 + i * 220);
    });

    const catDone = 400 + DEMO_TX.length * 220 + 200;
    addTimeout(() => {
      setPhase("analyzing");
      setShowStats(true);
      setShowDonut(true);
      const steps = 30;
      const increment = total / steps;
      for (let s = 1; s <= steps; s++) {
        addTimeout(() => setTotalAnimated(Math.min(increment * s, total)), catDone + s * 25 - catDone + 100);
      }
    }, catDone);

    DEMO_INSIGHTS.forEach((_, i) => {
      addTimeout(() => setShowInsights(i), catDone + 600 + i * 500);
    });

    addTimeout(() => setPhase("done"), catDone + 600 + DEMO_INSIGHTS.length * 500 + 300);
  };

  const resetDemo = () => {
    clearAllTimeouts();
    setPhase("idle"); setScanLine(-1); setCategorized(-1); setShowStats(false); setShowInsights(-1); setTotalAnimated(0); setShowDonut(false);
  };

  const fmtAmount = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const distData = [
    { label: "Necesidades", value: needsTotal, pct: Math.round((needsTotal / total) * 100), color: "#2EEB8F" },
    { label: "Deseos", value: wantsTotal, pct: Math.round((wantsTotal / total) * 100), color: "#3B82F6" },
    { label: "Ahorro", value: savingsTotal, pct: Math.round((savingsTotal / total) * 100), color: "#02EAFF" },
  ];

  const monthlyFlow = [
    { month: "Sep", planned: 1820, actual: 1760 },
    { month: "Oct", planned: 1840, actual: 1880 },
    { month: "Nov", planned: 1890, actual: 1810 },
    { month: "Dic", planned: 1910, actual: 1930 },
    { month: "Ene", planned: 1950, actual: 1860 },
    { month: "Feb", planned: 1980, actual: 1842 },
  ];

  const budgetRows = [
    { label: "Vivienda", planned: 650, actual: 650, tone: "var(--danger)" },
    { label: "Transporte", planned: 120, actual: 94, tone: "var(--warning)" },
    { label: "Restaurantes", planned: 130, actual: 154, tone: "var(--brand-purple)" },
    { label: "Suministros", planned: 90, actual: 84, tone: "var(--brand-cyan)" },
    { label: "Ahorro", planned: 200, actual: 200, tone: "var(--success)" },
  ];

  const phaseLabel = {
    idle: "Listo para procesar",
    scanning: "Leyendo extracto bancario",
    categorizing: "Asignando categorias",
    analyzing: "Generando recomendaciones",
    done: "Analisis completado",
  }[phase];

  return (
    <div className="relative space-y-4">
      <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]/80">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)]" />
            <span className="text-xs font-semibold">FinyBuddy Workspace</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-[var(--brand-gray)]">
            <span className="px-2 py-1 rounded-md border border-[var(--border)]">Marzo 2026</span>
            <span className="px-2 py-1 rounded-md border border-[var(--border)]">Cuenta principal</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)]">
            <Sparkles className={`w-3 h-3 ${phase === "idle" ? "text-[var(--brand-gray)]" : "text-[var(--brand-cyan)]"}`} />
            <span className="text-[10px] text-[var(--brand-gray)]">IA en directo</span>
          </div>
        </div>

        <div className="grid xl:grid-cols-12">
          <div className="xl:col-span-4 border-b xl:border-b-0 xl:border-r border-[var(--border)]">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--background-secondary)]/50">
              <p className="text-[10px] sm:text-xs font-semibold flex items-center gap-2 text-[var(--brand-gray)] uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                Extracto importado
              </p>
            </div>
            <div className="p-2.5 sm:p-3 space-y-1 font-mono text-[10px] sm:text-xs">
              {DEMO_TX.map((t, i) => {
                const isScanned = scanLine >= i;
                const isActive = scanLine === i;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all duration-300 ${
                      isActive
                        ? "border-[var(--brand-cyan)]/30 bg-[var(--brand-cyan)]/10"
                        : isScanned
                          ? "border-[var(--border)] bg-[var(--background-secondary)]/60"
                          : "border-transparent"
                    }`}
                  >
                    <span className={isScanned ? "text-[var(--foreground)]" : "text-[var(--brand-gray)]/55"}>{t.raw}</span>
                    <span className={`tabular-nums ${isScanned ? "text-[var(--foreground)]" : "text-[var(--brand-gray)]/55"}`}>{t.rawAmt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-5 border-b xl:border-b-0 xl:border-r border-[var(--border)]">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--background-secondary)]/50">
              <p className="text-[10px] sm:text-xs font-semibold flex items-center gap-2 text-[var(--brand-gray)] uppercase tracking-wider">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Operaciones categorizadas
              </p>
            </div>
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 pt-3 text-[10px] text-[var(--brand-gray)] uppercase tracking-wider">
              <span className="col-span-4">Concepto</span>
              <span className="col-span-4">Categoria</span>
              <span className="col-span-2 text-right">Tipo</span>
              <span className="col-span-2 text-right">Importe</span>
            </div>
            <div className="p-2.5 sm:p-3 space-y-1.5">
              {DEMO_TX.map((t, i) => {
                const Icon = t.icon;
                const isVisible = categorized >= i;
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-12 gap-2 items-center px-2.5 sm:px-3 py-2.5 rounded-lg border transition-all duration-500 ${
                      isVisible ? "opacity-100 translate-x-0 border-[var(--border)]" : "opacity-0 translate-x-4 border-transparent h-0 py-0 overflow-hidden"
                    }`}
                  >
                    <div className="col-span-6 sm:col-span-4 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${t.color}15` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                      </div>
                      <span className="text-xs font-medium truncate">{t.concept}</span>
                    </div>
                    <div className="col-span-4 sm:col-span-4 text-[11px] font-medium truncate" style={{ color: t.color }}>{t.category}</div>
                    <div className="hidden sm:block col-span-2 text-right text-[10px] text-[var(--brand-gray)] uppercase">{t.type}</div>
                    <div className="col-span-2 text-right text-xs font-bold tabular-nums" style={{ color: t.type === "savings" ? "var(--brand-cyan)" : "var(--danger)" }}>
                      {fmtAmount(t.amount)} €
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-3">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--background-secondary)]/50">
              <p className="text-[10px] sm:text-xs font-semibold flex items-center gap-2 text-[var(--brand-gray)] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Motor de decisiones
              </p>
            </div>
            <div className="p-3 sm:p-4 space-y-4">
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--brand-gray)]">Estado</span>
                  <span className={`w-2 h-2 rounded-full ${phase === "idle" ? "bg-[var(--brand-gray)]/50" : phase === "done" ? "bg-[var(--success)]" : "bg-[var(--brand-cyan)] animate-pulse"}`} />
                </div>
                <p className="text-sm font-semibold">{phaseLabel}</p>
              </div>

              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/60">
                <p className="text-[10px] uppercase tracking-wider text-[var(--brand-gray)] mb-3">Regla 50 / 30 / 20</p>
                {distData.map((item) => (
                  <div key={item.label} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span>{item.label}</span>
                      <span className="font-semibold" style={{ color: item.color }}>{item.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: showDonut ? `${item.pct}%` : "0%", backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {DEMO_INSIGHTS.map((insight, i) => {
                  const isVisible = showInsights >= i;
                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border text-xs transition-all duration-500 ${
                        isVisible ? "opacity-100 translate-y-0 border-[var(--border)] bg-[var(--background-secondary)]/60" : "opacity-0 translate-y-2"
                      }`}
                    >
                      {insight.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-700 ${showStats ? "opacity-100 translate-y-0" : "hidden"}`}>
        <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
          <div className="lg:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--background)]/85 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Cashflow mensual</h3>
              <span className="text-xs text-[var(--brand-gray)]">Planificado vs real</span>
            </div>
            <div className="grid grid-cols-6 gap-2 h-44 items-end">
              {monthlyFlow.map((m) => {
                const max = 2100;
                return (
                  <div key={m.month} className="flex flex-col items-center gap-1.5">
                    <div className="w-full h-32 flex items-end justify-center gap-1">
                      <div className="w-2.5 rounded-t bg-[var(--brand-cyan)]/70" style={{ height: `${(m.planned / max) * 100}%` }} />
                      <div className="w-2.5 rounded-t bg-[var(--brand-purple)]/80" style={{ height: `${(m.actual / max) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-[var(--brand-gray)]">{m.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--brand-gray)]">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--brand-cyan)]/80" />Plan</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--brand-purple)]/80" />Real</div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--background)]/85 p-4 sm:p-5">
            <h3 className="text-sm font-semibold mb-4">Prevision vs realidad</h3>
            <div className="space-y-3">
              {budgetRows.map((row) => {
                const pct = Math.round((row.actual / row.planned) * 100);
                const over = row.actual > row.planned;
                return (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[var(--brand-gray)]">{row.label}</span>
                      <span className={`font-semibold ${over ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                        {fmtAmount(row.actual)} € / {fmtAmount(row.planned)} €
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: showDonut ? `${Math.min(pct, 100)}%` : "0%", backgroundColor: over ? "var(--danger)" : row.tone }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-xl border border-[var(--brand-cyan)]/25 bg-[var(--brand-cyan)]/5">
              <p className="text-[10px] uppercase tracking-wider text-[var(--brand-gray)] mb-1">Balance procesado</p>
              <p className="text-lg font-bold tabular-nums">{fmtAmount(totalAnimated)} €</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        {phase === "idle" && (
          <button
            onClick={startDemo}
            className="group relative inline-flex items-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-bold text-sm sm:text-base hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-[var(--brand-purple)]/30"
          >
            <Play className="w-5 h-5 relative" />
            <span className="relative">Probar la magia de Finy</span>
          </button>
        )}
        {(phase === "scanning" || phase === "categorizing" || phase === "analyzing") && (
          <div className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-[var(--background)] border border-[var(--brand-cyan)]/30 shadow-lg shadow-[var(--brand-cyan)]/5">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--brand-cyan)]/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--brand-cyan)] animate-spin" />
            </div>
            <span className="text-sm font-medium text-[var(--brand-cyan)]">
              {phase === "scanning" && "Escaneando movimientos..."}
              {phase === "categorizing" && "Categorizando con IA..."}
              {phase === "analyzing" && "Generando insights..."}
            </span>
          </div>
        )}
        {phase === "done" && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={resetDemo}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-all text-sm font-medium hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4" />
              Repetir demo
            </button>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              Empieza gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
// Floating particles background - using fixed values to avoid hydration mismatch
const PARTICLES = [
  { w: 8, h: 12, l: 5, t: 15, d: 12, delay: 2 },
  { w: 6, h: 9, l: 25, t: 45, d: 15, delay: 5 },
  { w: 10, h: 7, l: 45, t: 10, d: 18, delay: 1 },
  { w: 7, h: 11, l: 65, t: 70, d: 14, delay: 8 },
  { w: 9, h: 8, l: 85, t: 25, d: 16, delay: 3 },
  { w: 5, h: 10, l: 15, t: 80, d: 13, delay: 6 },
  { w: 11, h: 6, l: 35, t: 55, d: 17, delay: 4 },
  { w: 8, h: 13, l: 55, t: 35, d: 11, delay: 7 },
  { w: 6, h: 8, l: 75, t: 85, d: 19, delay: 0 },
  { w: 12, h: 9, l: 95, t: 50, d: 15, delay: 9 },
  { w: 7, h: 10, l: 10, t: 60, d: 14, delay: 3 },
  { w: 9, h: 7, l: 30, t: 20, d: 16, delay: 6 },
  { w: 5, h: 11, l: 50, t: 90, d: 12, delay: 1 },
  { w: 10, h: 8, l: 70, t: 40, d: 18, delay: 8 },
  { w: 8, h: 12, l: 90, t: 75, d: 13, delay: 4 },
];

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: p.w + "px",
            height: p.h + "px",
            background: i % 2 === 0 ? "var(--brand-cyan)" : "var(--brand-purple)",
            left: p.l + "%",
            top: p.t + "%",
            animation: `float ${p.d}s ease-in-out infinite`,
            animationDelay: `-${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Animated grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--foreground) 1px, transparent 1px),
            linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// Glowing orb component
function GlowOrb({ color, size, top, left, delay = 0 }: { color: string; size: number; top: string; left: string; delay?: number }) {
  return (
    <div
      className="absolute rounded-full blur-3xl opacity-30 animate-pulse-slow"
      style={{
        width: size,
        height: size,
        background: color,
        top,
        left,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// Pricing section with monthly/annual toggle
const BASIC_FEATURES = [
  "Dashboard con KPIs y gráficos",
  "Registro de ingresos y gastos",
  "Calendario financiero",
  "Previsión (presupuestos)",
  "Categorías predefinidas",
  "Regla 50/30/20",
  "Tema claro/oscuro",
];

const PRO_FEATURES = [
  "Todo lo del plan Basic",
  "Previsión vs Realidad",
  "Metas de ahorro",
  "Gestión de deudas",
  "FinyBot - Chat IA + voz",
  "Categorías personalizadas",
  "Regla financiera personalizable",
  "Recordatorios y notificaciones",
  "Exportación CSV/JSON",
  "Insights de Finy",
];

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "price_1T49EIK6uoz4D92qYPcT6qho";
const ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || "";

function PricingToggle({ isLoggedIn, hasUsedTrial }: { isLoggedIn: boolean; hasUsedTrial: boolean }) {
  const [annual, setAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    if (!isLoggedIn) return;
    setCheckoutLoading(true);
    try {
      const priceId = annual ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!annual ? "text-[var(--foreground)]" : "text-[var(--brand-gray)]"}`}>
          Mensual
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-14 h-7 rounded-full transition-colors ${annual ? "bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)]" : "bg-[var(--border)]"
            }`}
        >
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${annual ? "translate-x-7" : "translate-x-0.5"
            }`} />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-[var(--foreground)]" : "text-[var(--brand-gray)]"}`}>
          Anual
        </span>
        <span className={`text-xs px-2 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] font-medium transition-opacity ${annual ? "opacity-100" : "opacity-0"}`}>
          Ahorra ~20 EUR
        </span>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Basic */}
        <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--brand-cyan)]/50 transition-all">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-1">FinyBuddy - Basic</h3>
            <p className="text-sm text-[var(--brand-gray)]">Controla tus finanzas con lo esencial</p>
          </div>
          <div className="mb-6 h-[72px] flex flex-col justify-center">
            <div>
              <span className="text-4xl font-bold">Gratis</span>
              <span className="text-[var(--brand-gray)] ml-1">para siempre</span>
            </div>
          </div>
          <Link
            href={isLoggedIn ? "/dashboard" : "/register"}
            className="block w-full text-center px-6 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-all mb-8"
          >
            {isLoggedIn ? "Ir al Dashboard" : "Empezar gratis"}
          </Link>
          <ul className="space-y-3">
            {BASIC_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Check className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
            <li className="flex items-start gap-3 text-sm text-[var(--brand-gray)]">
              <X className="w-4 h-4 text-[var(--brand-gray)]/50 shrink-0 mt-0.5" />
              <span>FinyBot - Chat IA + voz</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[var(--brand-gray)]">
              <X className="w-4 h-4 text-[var(--brand-gray)]/50 shrink-0 mt-0.5" />
              <span>Metas de ahorro y deudas</span>
            </li>
          </ul>
        </div>

        {/* Pro */}
        <div className="relative p-8 rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--background)] shadow-xl shadow-[var(--brand-purple)]/10">
          {/* Popular badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white text-xs font-semibold shadow-lg">
              {hasUsedTrial ? "Más popular" : "15 días gratis"}
            </span>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">FinyBuddy - Pro</h3>
              <Crown className="w-5 h-5 text-[var(--brand-purple)]" />
            </div>
            <p className="text-sm text-[var(--brand-gray)]">Desbloquea todo el potencial de FinyBuddy</p>
          </div>
          <div className="mb-6 h-[72px] flex flex-col justify-center">
            <div>
              <span className="text-4xl font-bold">{annual ? "39,99 €" : "4,99 €"}</span>
              <span className="text-[var(--brand-gray)] ml-1">{annual ? "/año" : "/mes"}</span>
            </div>
            <p className={`text-sm mt-1 ${annual ? "text-[var(--brand-gray)]" : "invisible"}`}>
              <span className="line-through">59,88 €</span>{" "}
              <span className="text-[var(--success)] font-medium">Ahorras ~20 €</span>
            </p>
          </div>
          {isLoggedIn ? (
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="block w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-purple)]/25 mb-8 disabled:opacity-50"
            >
              {checkoutLoading ? "Redirigiendo a Stripe..." : "Mejorar a Pro"}
            </button>
          ) : (
            <Link
              href="/register"
              className="block w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-purple)]/25 mb-8"
            >
              {hasUsedTrial ? "Suscribirse a Pro" : "Empezar prueba gratis"}
            </Link>
          )}
          <ul className="space-y-3">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Check className="w-4 h-4 text-[var(--brand-purple)] shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}


export default function HomePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = saved ? (saved as "light" | "dark") : prefersDark ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase.from("profiles").select("trial_ends_at, subscription_status").eq("id", user.id).single();
        if (profile?.trial_ends_at) setHasUsedTrial(true);
      }
    });
    setIsVisible(true);
    const handleScroll = () => { setScrollY(window.scrollY); setHeaderScrolled(window.scrollY > 20); };
    window.addEventListener("scroll", handleScroll);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("revealed"); }),
      { threshold: 0.06, rootMargin: "0px 0px -60px 0px" }
    );
    setTimeout(() => { document.querySelectorAll(".reveal, .reveal-scale").forEach(el => observer.observe(el)); }, 100);
    return () => { window.removeEventListener("scroll", handleScroll); observer.disconnect(); };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden transition-colors duration-300">

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${headerScrolled ? "bg-[var(--background)]/80 backdrop-blur-2xl border-b border-[var(--border)]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[64px] sm:h-[68px] flex items-center justify-between">
          <Link href="/" className="shrink-0"><Image src="/assets/logo-finybuddy-wordmark.png" alt="FinyBuddy" width={120} height={30} className="object-contain sm:w-[130px]" /></Link>
          <nav className="hidden lg:flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl bg-[var(--background-secondary)]/60 backdrop-blur-xl border border-[var(--border)]/50">
            {[{ l: "Metodo", h: "#method" }, { l: "Demo", h: "#demo" }, { l: "Testimonios", h: "#testimonials" }, { l: "Planes", h: "#pricing" }].map((link) => (
              <a key={link.h} href={link.h} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--brand-gray)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all">{link.l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 sm:p-2.5 rounded-xl border border-[var(--border)]/60 hover:bg-[var(--background-secondary)] transition-all" aria-label="Tema">
              {theme === "light" ? <Moon className="w-[18px] h-[18px] text-[var(--brand-gray)]" /> : <Sun className="w-[18px] h-[18px] text-[var(--brand-yellow)]" />}
            </button>
            {isLoggedIn ? (
              <Link href="/dashboard" className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-semibold text-sm shadow-lg shadow-[var(--brand-purple)]/20 transition-all hover:scale-[1.02]"><LayoutDashboard className="w-4 h-4" />Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="hidden md:inline-flex px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--brand-gray)] hover:text-[var(--foreground)] transition-all">Entrar</Link>
                <Link href="/register" className="hidden md:inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-semibold text-sm shadow-lg shadow-[var(--brand-purple)]/20 transition-all hover:scale-[1.02]">Empezar gratis</Link>
              </>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-xl border border-[var(--border)]/60 hover:bg-[var(--background-secondary)] transition-all" aria-label="Menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--border)] bg-[var(--background)]/98 backdrop-blur-2xl">
            <div className="px-5 py-4 space-y-1">
              {["Metodo:#method","Demo:#demo","Testimonios:#testimonials","Planes:#pricing"].map((s) => { const [l,h] = s.split(":"); return <a key={h} href={h} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-[var(--brand-gray)] hover:bg-[var(--background-secondary)] transition-colors">{l}</a>; })}
              <div className="pt-3 mt-3 border-t border-[var(--border)] space-y-2">
                {isLoggedIn ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white text-sm font-semibold"><LayoutDashboard className="w-4 h-4" />Dashboard</Link>
                ) : (
                  <><Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-medium">Entrar</Link><Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-4 py-3.5 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white text-sm font-semibold">Empezar gratis</Link></>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO - DOLOR + PROMESA */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 sm:pt-24 pb-12 sm:pb-16 px-5 sm:px-8 overflow-hidden noise-overlay">
        <div className="hero-beam" />
        <FloatingParticles />
        <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-[var(--brand-cyan)]/15 blur-[150px] animate-mesh-1 pointer-events-none" />
        <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[var(--brand-purple)]/15 blur-[130px] animate-mesh-2 pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[30%] w-[350px] h-[350px] rounded-full bg-[var(--brand-yellow)]/8 blur-[100px] animate-mesh-3 pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 w-full">
          <div className={`text-center transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/20 text-[var(--brand-purple)] text-sm font-semibold mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-[var(--brand-purple)] animate-pulse" />
              El metodo 3Finy
            </div>

            <h1 className="text-[1.75rem] sm:text-[2.5rem] md:text-[3.25rem] lg:text-[4rem] font-black leading-[1.1] tracking-[-0.03em] mb-4 sm:mb-5">
              Ganas dinero...{" "}
              <span className="text-[var(--brand-gray)]">pero no sabes</span>
              <br />
              <span className="text-[var(--brand-gray)]">donde se te va.</span>
            </h1>
            <h2 className="text-[1.5rem] sm:text-[2rem] md:text-[2.5rem] lg:text-[3rem] font-black leading-[1.1] tracking-[-0.03em] mb-7 sm:mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-cyan)] via-[var(--brand-purple)] to-[var(--brand-cyan)] bg-[length:200%_auto] animate-gradient">Este sistema lo organiza por ti.</span>
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-[var(--brand-gray)] mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              FinyBuddy automatiza tu dinero, detecta fugas y crea un plan para que empieces a <span className="font-semibold text-[var(--foreground)]">ahorrar sin pensar</span> desde el primer mes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 px-2">
              <Link href={isLoggedIn ? "/dashboard" : "/register"} className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-bold text-base shadow-2xl shadow-[var(--brand-purple)]/25 hover:shadow-[var(--brand-purple)]/40 transition-all hover:scale-[1.03] active:scale-[0.97] animate-cta-glow">
                {isLoggedIn ? <><LayoutDashboard className="w-5 h-5" />Ir al Dashboard</> : <>{hasUsedTrial ? "Empezar gratis" : "Prueba gratis 15 dias"}<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></>}
              </Link>
              <a href="#method" className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl border border-[var(--border)] font-semibold hover:bg-[var(--background-secondary)] transition-all hover:scale-[1.02] hover:border-[var(--brand-cyan)]/40">
                Como funciona <ChevronDown className="w-4 h-4 text-[var(--brand-cyan)]" />
              </a>
            </div>
            {!isLoggedIn && <p className="text-xs sm:text-sm text-[var(--brand-gray)]">{hasUsedTrial ? "Plan Basic gratuito para siempre." : "Sin tarjeta de credito. Acceso completo 15 dias."}</p>}
          </div>

          {/* Mascot */}
          <div className={`relative flex justify-center mt-8 sm:mt-10 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full border border-[var(--brand-cyan)]/10 animate-spin-slow" />
              <div className="absolute w-36 h-36 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-full border border-[var(--brand-purple)]/10 animate-spin-reverse" />
            </div>
            <div className="absolute -top-2 right-[5%] sm:right-[12%] md:right-[18%] p-2.5 sm:p-3.5 rounded-2xl bg-[var(--background)]/90 backdrop-blur-xl border border-[var(--border)] shadow-2xl shadow-black/5 animate-float z-20">
              <div className="flex items-center gap-2 sm:gap-3"><div className="w-8 h-8 rounded-xl bg-[var(--success)]/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-[var(--success)]" /></div><div><p className="text-[9px] sm:text-[10px] text-[var(--brand-gray)] font-medium uppercase tracking-wider">Ingresos</p><p className="text-xs sm:text-sm font-bold text-[var(--success)]">+2.850 EUR</p></div></div>
            </div>
            <div className="absolute bottom-0 left-[5%] sm:left-[12%] md:left-[18%] p-2.5 sm:p-3.5 rounded-2xl bg-[var(--background)]/90 backdrop-blur-xl border border-[var(--border)] shadow-2xl shadow-black/5 animate-float-delayed z-20">
              <div className="flex items-center gap-2 sm:gap-3"><div className="w-8 h-8 rounded-xl bg-[var(--danger)]/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-[var(--danger)]" /></div><div><p className="text-[9px] sm:text-[10px] text-[var(--brand-gray)] font-medium uppercase tracking-wider">Fugas detectadas</p><p className="text-xs sm:text-sm font-bold text-[var(--danger)]">-220 EUR/mes</p></div></div>
            </div>
            <Image src="/assets/finybuddy-mascot.png" alt="FinyBuddy" width={260} height={260} className="relative z-10 drop-shadow-2xl animate-bounce-subtle w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] md:w-[260px] md:h-[260px]" style={{ transform: `translateY(${scrollY * 0.05}px)` }} priority />
          </div>

          <div className={`mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 transition-all duration-1000 delay-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[{ icon: Shield, text: "100% privado" }, { icon: Mic, text: "Entrada por voz" }, { icon: CheckCircle, text: "Gratis para siempre" }, { icon: Zap, text: "Automatico" }].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-xs sm:text-sm text-[var(--brand-gray)]"><item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-cyan)]" /><span>{item.text}</span></div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 animate-bounce"><ChevronDown className="w-5 h-5 text-[var(--brand-gray)]/40" /></div>
      </section>

      {/* VOZ - DIFERENCIACION CLAVE */}
      <section className="relative py-20 sm:py-28 px-5 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-purple)] via-[#1a1a40] to-[var(--brand-cyan)]" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <p className="text-white/50 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-4 sm:mb-6">La diferencia</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-[-0.02em] px-2">Olvidate de apuntar gastos<br className="hidden sm:block" /> manualmente</h2>
          <p className="text-lg sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-yellow)] mb-8 sm:mb-12 px-2">Hablas. El sistema lo hace todo.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-14 px-2">
            {[
              { icon: Mic, title: "Dile a Finy", desc: "Por voz, chat o llamada. Sin abrir nada, sin escribir nada." },
              { icon: Sparkles, title: "Se categoriza solo", desc: "La IA entiende el gasto, lo clasifica y lo ubica automaticamente." },
              { icon: RefreshCw, title: "Tu sistema se actualiza", desc: "Dashboard, presupuesto y alertas se ajustan en tiempo real." },
            ].map((step, i) => (
              <div key={step.title} className="p-5 sm:p-7 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.10] hover:bg-white/[0.10] transition-all text-left">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 sm:mb-5"><step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--brand-cyan)]" /></div>
                <p className="text-white/40 text-xs font-bold mb-2 tracking-wider">0{i + 1}</p>
                <h3 className="text-white text-lg sm:text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-3 px-5 sm:px-7 py-3 sm:py-4 rounded-2xl bg-white/[0.06] border border-white/[0.10] backdrop-blur-sm">
            <Volume2 className="w-5 h-5 text-[var(--brand-yellow)] shrink-0" />
            <p className="text-white/80 text-sm sm:text-base font-semibold italic">&ldquo;Si tienes que escribir tus gastos, ya has perdido.&rdquo;</p>
          </div>
        </div>
      </section>

      {/* METODO 3FINY */}
      <section id="method" className="py-20 sm:py-32 px-5 sm:px-8 relative overflow-hidden">
        <GridBackground />
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[var(--brand-cyan)]/[0.03] rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] text-sm font-semibold mb-6"><Zap className="w-4 h-4" />El metodo</div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-5 tracking-[-0.02em] px-2">Un sistema simple que cambia<br className="hidden sm:block" /> <span className="gradient-brand-text">como funciona tu dinero</span></h2>
            <p className="text-[var(--brand-gray)] max-w-xl mx-auto text-base sm:text-lg leading-relaxed px-2">Tres pasos. Sin complicaciones. Resultados desde el primer mes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[
              { num: "01", name: "Fotografia", icon: Eye, title: "Detecta en que se te va el dinero", desc: "Sin hacer nada. El sistema analiza tus movimientos y te muestra un mapa claro de tu dinero: donde entra, donde sale y que sobra.", color: "var(--brand-cyan)" },
              { num: "02", name: "Fugas", icon: AlertTriangle, title: "Identifica hasta 200 EUR en gastos innecesarios", desc: "Suscripciones olvidadas, gastos hormiga, categorias infladas. FinyBuddy los detecta y te avisa antes de que se acumulen.", color: "var(--danger)" },
              { num: "03", name: "Flujo", icon: RefreshCw, title: "Reorganiza tu dinero para ahorrar automaticamente", desc: "Con la regla 50/30/20 personalizada, tu dinero se redistribuye. Ahorras sin pensar, cada mes, sin esfuerzo.", color: "var(--success)" },
            ].map((step) => (
              <div key={step.num} className="reveal feature-card border border-[var(--border)] p-6 sm:p-8 group">
                <div className="card-glow top-0 right-0" style={{ background: `color-mix(in srgb, ${step.color} 8%, transparent)` }} />
                <div className="relative z-10">
                  <p className="text-xs font-black tracking-widest mb-4 sm:mb-5" style={{ color: step.color }}>{step.num} — {step.name.toUpperCase()}</p>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `color-mix(in srgb, ${step.color} 12%, transparent)` }}>
                    <step.icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: step.color }} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-3 leading-snug">{step.title}</h3>
                  <p className="text-[var(--brand-gray)] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* AI DEMO - SIMULADOR */}
      <section id="demo" className="py-20 sm:py-32 px-4 sm:px-8 relative overflow-hidden">
        <GridBackground />
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[var(--brand-cyan)]/[0.05] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[var(--brand-purple)]/[0.05] rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-14 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] text-sm font-semibold mb-6"><Sparkles className="w-4 h-4" />Simulador en vivo</div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-5 tracking-[-0.02em] px-2">Mira como tu caos financiero se convierte<br className="hidden sm:block" /> en <span className="gradient-brand-text">claridad total</span></h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed px-2">Movimientos reales. Categorizacion automatica. Decisiones inteligentes. En tiempo real.</p>
          </div>
          <div className="reveal-scale"><FinyAIDemo /></div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ESCENARIOS REALES */}
      <section className="py-20 sm:py-32 px-5 sm:px-8 bg-[var(--background-secondary)] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--brand-purple)]/[0.03] rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/20 text-[var(--brand-purple)] text-sm font-semibold mb-6"><Target className="w-4 h-4" />Resultados reales</div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-5 tracking-[-0.02em] px-2">Esto es lo que pasa cuando tu dinero<br className="hidden sm:block" /> <span className="gradient-brand-text">esta bajo control</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {[
              { icon: Plane, title: "Vacaciones sin culpa", desc: "Llegas al verano con el dinero ya reservado. Sin darte cuenta, sin agobios.", color: "#3B82F6", bg: "from-blue-500/5 to-cyan-500/5" },
              { icon: PiggyBank, title: "Ahorras por primera vez", desc: "Empiezas a guardar dinero cada mes aunque nunca lo hayas conseguido antes.", color: "#10B981", bg: "from-emerald-500/5 to-green-500/5" },
              { icon: AlertTriangle, title: "Descubres tus fugas", desc: "Te das cuenta de que estabas perdiendo 100-300 EUR al mes sin saberlo.", color: "#EF4444", bg: "from-red-500/5 to-orange-500/5" },
              { icon: Home, title: "Objetivos grandes", desc: "Por primera vez tienes un plan real para ese coche, ese viaje o esa entrada del piso.", color: "#8B5CF6", bg: "from-violet-500/5 to-purple-500/5" },
            ].map((s) => (
              <div key={s.title} className={`reveal feature-card border border-[var(--border)] p-6 sm:p-8 bg-gradient-to-br ${s.bg} group`}>
                <div className="relative z-10 flex gap-4 sm:gap-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${s.color}12` }}>
                    <s.icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: s.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">{s.title}</h3>
                    <p className="text-[var(--brand-gray)] text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* AUTOMATIZACION */}
      <section className="py-20 sm:py-32 px-5 sm:px-8 relative overflow-hidden">
        <GridBackground />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] text-sm font-semibold mb-6"><RefreshCw className="w-4 h-4" />Ecosistema</div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-5 tracking-[-0.02em] px-2">Todo conectado.<br /><span className="gradient-brand-text">Todo automatico.</span></h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[
              { icon: MessageCircle, title: "Telegram", desc: "Controla tu dinero desde cualquier sitio" },
              { icon: Bell, title: "Alertas email", desc: "Nunca mas un pago olvidado" },
              { icon: Calendar, title: "Calendario", desc: "Anticipa lo que viene cada mes" },
              { icon: BarChart3, title: "Modulos", desc: "Todo se actualiza en tiempo real" },
            ].map((item) => (
              <div key={item.title} className="reveal feature-card border border-[var(--border)] p-4 sm:p-6 text-center group">
                <div className="relative z-10">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[var(--brand-cyan)]/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500"><item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--brand-cyan)]" /></div>
                  <h3 className="text-sm sm:text-base font-bold mb-1">{item.title}</h3>
                  <p className="text-[var(--brand-gray)] text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* DASHBOARD PREVIEW */}
      <section className="py-20 sm:py-32 px-5 sm:px-8 bg-[var(--background-secondary)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[var(--brand-cyan)]/[0.04] rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] text-sm font-semibold mb-6"><LayoutDashboard className="w-4 h-4" />Tu panel de control</div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-5 tracking-[-0.02em] px-2">Asi se ve tener el <span className="gradient-brand-text">control total</span></h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto text-base sm:text-lg leading-relaxed px-2">No es una demo. Es exactamente lo que veras cuando entres.</p>
          </div>
          <div className="reveal-scale perspective-container">
            <div className="relative">
              <div className="rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)] overflow-hidden perspective-tilt">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]/80">
                  <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F57]" /><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]" /><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28CA41]" /></div>
                  <div className="flex-1 max-w-md mx-4 hidden sm:block"><div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--brand-gray)]"><Shield className="w-3 h-3 text-[var(--success)]" />app.finybuddy.com/dashboard</div></div>
                  <div className="text-[10px] px-2 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--brand-gray)] font-medium">Mar 2026</div>
                </div>
                <div className="grid lg:grid-cols-12 min-h-[500px] sm:min-h-[620px]">
                  <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--background-secondary)]/55 p-3 sm:p-5">
                    <div className="flex items-center gap-3 mb-5 sm:mb-6"><Image src="/assets/finy-mascota-minimalista.png" alt="Finy" width={34} height={34} className="rounded-xl w-7 h-7 sm:w-8 sm:h-8 object-contain" /><div><p className="text-[10px] sm:text-xs text-[var(--brand-gray)]">Buenos dias</p><p className="text-xs sm:text-sm font-semibold">Panel principal</p></div></div>
                    <div className="space-y-1">
                      {[{ label: "Dashboard", icon: LayoutDashboard, active: true }, { label: "Operaciones", icon: CreditCard }, { label: "Prevision", icon: Target }, { label: "Calendario", icon: Calendar }, { label: "Ahorro", icon: PiggyBank }, { label: "FinyBot", icon: Sparkles }].map((item) => (
                        <div key={item.label} className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border ${item.active ? "border-[var(--brand-cyan)]/25 bg-[var(--brand-cyan)]/8" : "border-transparent"}`}><item.icon className={`w-3.5 h-3.5 ${item.active ? "text-[var(--brand-cyan)]" : "text-[var(--brand-gray)]"}`} /><span className={`text-xs sm:text-sm ${item.active ? "font-semibold" : "text-[var(--brand-gray)]"}`}>{item.label}</span></div>
                      ))}
                    </div>
                    <div className="mt-5 p-3 rounded-xl border border-[var(--brand-cyan)]/20 bg-[var(--brand-cyan)]/5"><p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--brand-gray)] mb-1">Regla 50/30/20</p><p className="text-base sm:text-lg font-bold">20% ahorro</p><p className="text-[10px] sm:text-xs text-[var(--brand-gray)]">Objetivo completado</p></div>
                  </aside>
                  <main className="lg:col-span-9 p-3 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      {[{ label: "Ingresos", value: "2.850 EUR", icon: TrendingUp, tone: "text-[var(--success)]" }, { label: "Gastos", value: "1.424 EUR", icon: TrendingDown, tone: "text-[var(--danger)]" }, { label: "Ahorro", value: "570 EUR", icon: PiggyBank, tone: "text-[var(--brand-cyan)]" }, { label: "Balance", value: "+1.426 EUR", icon: BarChart3, tone: "text-[var(--brand-purple)]" }].map((kpi) => (
                        <div key={kpi.label} className="p-2.5 sm:p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/60"><div className="flex items-center justify-between mb-1"><span className="text-[10px] sm:text-[11px] text-[var(--brand-gray)] font-medium">{kpi.label}</span><kpi.icon className={kpi.tone + " w-3 h-3 sm:w-3.5 sm:h-3.5"} /></div><p className={kpi.tone + " text-sm sm:text-lg font-bold tabular-nums"}>{kpi.value}</p></div>
                      ))}
                    </div>
                    <div className="grid xl:grid-cols-5 gap-3 sm:gap-4">
                      <div className="xl:col-span-3 p-3 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/60">
                        <div className="flex items-center justify-between mb-3"><h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2"><Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-purple)]" />Prevision vs realidad</h3><span className="text-[10px] text-[var(--brand-gray)]">30 dias</span></div>
                        <div className="space-y-2.5 sm:space-y-3">
                          {[{ c: "Vivienda", plan: 650, real: 650 },{ c: "Comida", plan: 280, real: 252 },{ c: "Transporte", plan: 120, real: 94 },{ c: "Ocio", plan: 140, real: 176 },{ c: "Suministros", plan: 90, real: 84 }].map((row) => { const pct = Math.round((row.real/row.plan)*100); return (<div key={row.c}><div className="flex items-center justify-between text-[10px] sm:text-xs mb-1"><span className="text-[var(--brand-gray)]">{row.c}</span><span className={(row.real>row.plan?"text-[var(--danger)]":"text-[var(--success)]")+" font-semibold"}>{row.real} / {row.plan} EUR</span></div><div className="h-1.5 sm:h-2 rounded-full bg-[var(--border)] overflow-hidden"><div className="h-full rounded-full" style={{width:`${Math.min(pct,100)}%`,backgroundColor:row.real>row.plan?"var(--danger)":"var(--brand-cyan)"}}/></div></div>);})}
                        </div>
                      </div>
                      <div className="xl:col-span-2 space-y-3 sm:space-y-4">
                        <div className="p-3 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/60">
                          <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-cyan)]" />Recientes</h3>
                          <div className="space-y-2 text-[10px] sm:text-xs">{[["Amazon","Compras","-34,50 EUR"],["Alquiler","Vivienda","-650,00 EUR"],["Nomina","Ingreso","+2.850,00 EUR"]].map(([n,c,a])=>(<div key={n} className="flex items-center justify-between p-2 rounded-lg border border-[var(--border)] bg-[var(--background)]/80"><div><p className="font-medium">{n}</p><p className="text-[9px] sm:text-[10px] text-[var(--brand-gray)]">{c}</p></div><p className={"font-semibold tabular-nums "+(String(a).startsWith("+")?"text-[var(--success)]":"text-[var(--danger)]")}>{a}</p></div>))}</div>
                        </div>
                        <div className="p-3 sm:p-4 rounded-2xl border border-[var(--brand-cyan)]/20 bg-gradient-to-br from-[var(--brand-cyan)]/5 to-[var(--brand-purple)]/5">
                          <div className="flex items-center gap-2 mb-2"><Image src="/assets/finy-mascota-minimalista.png" alt="Finy" width={24} height={24} className="object-contain w-5 h-5 sm:w-6 sm:h-6" /><p className="text-[10px] sm:text-xs font-semibold text-[var(--brand-cyan)]">Sugerencia de Finy</p></div>
                          <p className="text-xs sm:text-sm leading-relaxed">Estas a 1% de tu objetivo. Reduce ocio 15 EUR y cierras al 20%.</p>
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
              <div className="dashboard-glow" />
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-20 sm:py-32 px-5 sm:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--brand-purple)]/[0.03] rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/20 text-[var(--brand-purple)] text-sm font-semibold mb-6"><CheckCircle className="w-4 h-4" />Testimonios</div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-5 tracking-[-0.02em] px-2">Lo que dicen quienes ya <span className="gradient-brand-text">tienen el control</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`reveal reveal-delay-${i+1} testimonial-card p-5 sm:p-7`}>
                <div className="flex gap-1 mb-4 sm:mb-5">{[...Array(5)].map((_,j)=>(<svg key={j} className="w-3.5 h-3.5 sm:w-4 sm:h-4 star-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>))}</div>
                <p className="text-[13px] sm:text-[15px] leading-relaxed mb-5 sm:mb-7">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 sm:pt-5 border-t border-[var(--border)]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm" style={{backgroundColor:t.color}}>{t.avatar}</div>
                  <div><p className="text-xs sm:text-sm font-semibold">{t.name}</p><p className="text-[10px] sm:text-xs text-[var(--brand-gray)]">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* PRICING */}
      <section id="pricing" className="py-20 sm:py-32 px-5 sm:px-8 relative overflow-hidden">
        <GridBackground />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[var(--brand-purple)]/[0.04] rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-14 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/20 text-[var(--brand-purple)] text-sm font-semibold mb-6"><Crown className="w-4 h-4" />Planes</div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-5 tracking-[-0.02em] px-2">Un precio justo para <span className="gradient-brand-text">tu tranquilidad</span></h2>
            <p className="text-[var(--brand-gray)] max-w-xl mx-auto text-base sm:text-lg leading-relaxed px-2">{hasUsedTrial ? "Plan Basic gratis para siempre. Desbloquea todo con Pro." : "Empieza gratis con 15 dias de prueba Pro. Sin tarjeta."}</p>
          </div>
          <div className="reveal reveal-delay-2"><PricingToggle isLoggedIn={isLoggedIn} hasUsedTrial={hasUsedTrial} /></div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-20 sm:py-32 px-5 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--brand-purple)]/[0.04] to-[var(--background)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--brand-cyan)]/[0.04] rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 text-center reveal">
          <Image src="/assets/finy-mascota-minimalista.png" alt="Finy" width={56} height={56} className="object-contain mx-auto mb-6 sm:mb-8 w-12 h-12 sm:w-14 sm:h-14" />
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 tracking-[-0.02em] px-2">No es otra app.<br /><span className="gradient-brand-text">Es un sistema que funciona.</span></h2>
          <p className="text-[var(--brand-gray)] mb-8 sm:mb-10 text-base sm:text-lg leading-relaxed max-w-xl mx-auto px-2">{isLoggedIn ? "Vuelve a tu dashboard y sigue con el control." : "Organiza tu dinero, detecta fugas y empieza a ahorrar sin esfuerzo."}</p>
          <Link href={isLoggedIn ? "/dashboard" : "/register"} className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-10 sm:px-12 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-bold text-base sm:text-lg shadow-2xl shadow-[var(--brand-purple)]/20 transition-all hover:scale-[1.03] active:scale-[0.97] animate-cta-glow">
            {isLoggedIn ? (<><LayoutDashboard className="w-5 h-5" />Ir al Dashboard</>) : (<>Quiero tomar el control<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></>)}
          </Link>
          {!isLoggedIn && <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-[var(--brand-gray)]">Sin tarjeta de credito requerida</p>}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section id="newsletter" className="py-16 sm:py-24 px-5 sm:px-8 bg-[var(--background-secondary)] border-t border-[var(--border)]">
        <div className="max-w-2xl mx-auto text-center reveal">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] text-sm font-semibold mb-6"><Mail className="w-4 h-4" />Newsletter</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 tracking-[-0.02em] px-2">Consejos financieros cada semana</h2>
          <p className="text-base sm:text-lg text-[var(--brand-gray)] mb-8 sm:mb-10 leading-relaxed px-2">Trucos de ahorro, novedades y consejos para mejorar tus finanzas personales.</p>
          <NewsletterForm />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 sm:py-16 px-5 sm:px-8 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 mb-10 sm:mb-14">
            <div className="md:col-span-5">
              <Image src="/assets/logo-finybuddy-wordmark.png" alt="FinyBuddy" width={120} height={30} className="object-contain mb-4 sm:mb-5" />
              <p className="text-xs sm:text-sm text-[var(--brand-gray)] leading-relaxed max-w-sm mb-5 sm:mb-6">El sistema que organiza tu dinero, detecta fugas y te ayuda a ahorrar sin esfuerzo. No es otra app. Es un metodo.</p>
              <div className="flex flex-wrap items-center gap-2">
                {[{ icon: Shield, text: "Privado" }, { icon: Mic, text: "Voz" }, { icon: CheckCircle, text: "Gratis" }].map((b) => (
                  <div key={b.text} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] text-[10px] sm:text-xs font-medium text-[var(--brand-gray)]"><b.icon className="w-3 h-3 text-[var(--brand-cyan)]" />{b.text}</div>
                ))}
              </div>
            </div>
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
              <div><h4 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4">Producto</h4><ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[var(--brand-gray)]"><li><a href="#method" className="hover:text-[var(--foreground)] transition-colors">Metodo 3Finy</a></li><li><a href="#demo" className="hover:text-[var(--foreground)] transition-colors">Simulador</a></li><li><a href="#testimonials" className="hover:text-[var(--foreground)] transition-colors">Testimonios</a></li><li><a href="#pricing" className="hover:text-[var(--foreground)] transition-colors">Planes</a></li></ul></div>
              <div><h4 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4">Legal</h4><ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[var(--brand-gray)]"><li><Link href="/terms" className="hover:text-[var(--foreground)] transition-colors">Terminos</Link></li><li><Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">Privacidad</Link></li></ul></div>
              <div><h4 className="text-xs sm:text-sm font-semibold mb-3 sm:mb-4">Soporte</h4><ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[var(--brand-gray)]"><li><a href="mailto:soporte@finybuddy.com" className="hover:text-[var(--foreground)] transition-colors">soporte@finybuddy.com</a></li><li><button onClick={toggleTheme} className="flex items-center gap-2 hover:text-[var(--foreground)] transition-colors">{theme==="light"?<Moon className="w-3.5 h-3.5"/>:<Sun className="w-3.5 h-3.5"/>}{theme==="light"?"Modo oscuro":"Modo claro"}</button></li></ul></div>
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-[var(--brand-gray)]">&copy; {new Date().getFullYear()} FinyBuddy. Todos los derechos reservados.</p>
            <p className="text-[10px] sm:text-xs text-[var(--brand-gray)]/50">Hecho con cuidado para tus finanzas personales.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
