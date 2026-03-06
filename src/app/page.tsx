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
} from "lucide-react";

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

  useEffect(() => {
    // Check system preference or saved preference
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = saved ? (saved as "light" | "dark") : prefersDark ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");

    // Check auth and subscription
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("trial_ends_at, subscription_status")
          .eq("id", user.id)
          .single();
        if (profile?.trial_ends_at) {
          setHasUsedTrial(true);
        }
      }
    });

    // Trigger animations
    setIsVisible(true);

    // Track scroll
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden transition-colors duration-300">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/assets/logo-finybuddy-wordmark.png"
              alt="FinyBuddy"
              width={130}
              height={32}
              className="object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-[var(--brand-gray)] hover:text-[var(--foreground)] transition-colors">
              Funciones
            </a>
            <a href="#pricing" className="text-sm text-[var(--brand-gray)] hover:text-[var(--foreground)] transition-colors">
              Planes
            </a>
            <a href="#newsletter" className="text-sm text-[var(--brand-gray)] hover:text-[var(--foreground)] transition-colors">
              Newsletter
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-all hover:scale-105 active:scale-95"
              aria-label="Cambiar tema"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-[var(--brand-gray)]" />
              ) : (
                <Sun className="w-5 h-5 text-[var(--brand-yellow)]" />
              )}
            </button>

            {/* Desktop buttons */}
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-medium text-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--brand-purple)]/25"
              >
                <LayoutDashboard className="w-4 h-4" />
                Mi Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex px-5 py-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--background-secondary)] transition-all hover:scale-105 active:scale-95"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="hidden md:inline-flex px-5 py-2 rounded-lg bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-medium text-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--brand-purple)]/25"
                >
                  Crear cuenta gratis
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-all"
              aria-label="Menú"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl">
            <div className="px-6 py-4 space-y-1">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-[var(--brand-gray)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
              >
                Funciones
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-[var(--brand-gray)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
              >
                Planes
              </a>
              <a
                href="#newsletter"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-[var(--brand-gray)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
              >
                Newsletter
              </a>
              <div className="pt-3 mt-3 border-t border-[var(--border)] space-y-2">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-purple)]/25"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Mi Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--background-secondary)] transition-all"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--brand-purple)]/25"
                    >
                      Crear cuenta gratis
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-6 min-h-screen flex items-center">
        <GridBackground />
        <FloatingParticles />

        {/* Glowing orbs */}
        <GlowOrb color="var(--brand-cyan)" size={400} top="10%" left="-10%" delay={0} />
        <GlowOrb color="var(--brand-purple)" size={300} top="60%" left="80%" delay={2} />
        <GlowOrb color="var(--brand-yellow)" size={200} top="80%" left="20%" delay={4} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/20 text-[var(--brand-purple)] text-sm font-medium mb-6 animate-bounce-subtle">
                <Sparkles className="w-4 h-4" />
                Tu dinero, bajo control
              </div>

              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Tu asistente{" "}
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-cyan)] via-[var(--brand-purple)] to-[var(--brand-cyan)] bg-[length:200%_auto] animate-gradient">
                    financiero
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M1 5.5Q50 1 100 5.5T199 5.5" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round" className="animate-draw" />
                    <defs>
                      <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                        <stop offset="0%" stopColor="var(--brand-cyan)" />
                        <stop offset="100%" stopColor="var(--brand-purple)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>{" "}
                <br />personal
              </h1>

              <p className="text-lg md:text-xl text-[var(--brand-gray)] mb-8 max-w-lg leading-relaxed">
                Gestióna tus finanzas de forma inteligente. Controla ingresos,
                gastos, ahorros y deudas en un solo lugar con{" "}
                <span className="font-semibold text-[var(--foreground)]">IA integrada</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[var(--brand-purple)]/30"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Ir al Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[var(--brand-purple)]/30"
                  >
                    {hasUsedTrial ? "Crear cuenta gratis" : "Prueba gratis 15 días"}
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-all hover:scale-105"
                >
                  Ver planes
                  <ChevronDown className="w-5 h-5" />
                </a>
              </div>
              {!isLoggedIn && (
                <p className="text-sm text-[var(--brand-gray)] mb-10">
                  {hasUsedTrial
                    ? "Plan Basic gratuito para siempre. Actualiza a Pro cuando quieras."
                    : "Sin tarjeta de crédito. Acceso Pro completo durante 15 días."}
                </p>
              )}
              {isLoggedIn && <div className="mb-10" />}

            </div>

            {/* Mascot with animated effects */}
            <div className={`relative flex justify-center transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              {/* Animated rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full border border-[var(--brand-cyan)]/20 animate-spin-slow" />
                <div className="absolute w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full border border-[var(--brand-purple)]/20 animate-spin-reverse" />
                <div className="absolute w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-full border-2 border-dashed border-[var(--brand-yellow)]/30 animate-spin-slower" />
              </div>

              {/* Floating stats around mascot */}
              <div className="absolute -top-2 sm:top-0 right-0 md:right-10 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-lg animate-float">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--success)]" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--success)]">+2.850 €</span>
                </div>
              </div>

              <div className="absolute bottom-4 sm:bottom-10 left-0 md:left-5 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-lg animate-float-delayed">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <PiggyBank className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--brand-cyan)]" />
                  <span className="text-xs sm:text-sm font-semibold">570 € ahorrado</span>
                </div>
              </div>

              <div className="absolute top-1/3 left-0 md:-left-5 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-lg animate-float-slow">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--brand-purple)]" />
                  <span className="text-xs sm:text-sm font-semibold">Meta: 85%</span>
                </div>
              </div>

              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBuddy Mascot"
                width={350}
                height={350}
                className="relative z-10 drop-shadow-2xl animate-bounce-subtle w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[350px] md:h-[350px]"
                style={{ transform: `translateY(${scrollY * 0.1}px)` }}
              />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-[var(--brand-gray)]" />
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-12 sm:py-16 px-6 bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center text-white">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
                <AnimatedNumber value={100} suffix="%" />
              </p>
              <p className="text-white/80 text-xs sm:text-sm">Privado y seguro</p>
            </div>
            <div className="text-center text-white">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
                <AnimatedNumber value={24} suffix="/7" />
              </p>
              <p className="text-white/80 text-xs sm:text-sm">Finy AI disponible</p>
            </div>
            <div className="text-center text-white">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
                <AnimatedNumber value={6} suffix="+" />
              </p>
              <p className="text-white/80 text-xs sm:text-sm">Herramientas financieras</p>
            </div>
            <div className="text-center text-white">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
                <AnimatedNumber value={0} suffix=" €" />
              </p>
              <p className="text-white/80 text-xs sm:text-sm">Para empezar gratis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-6 bg-[var(--background-secondary)] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo en un <span className="gradient-brand-text">vistazo</span>
            </h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto text-lg">
              Una preview fiel al dashboard real: control diario, seguimiento por modulos y decisiones accionables.
            </p>
          </div>

          <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
              </div>
              <div className="text-xs text-[var(--brand-gray)] hidden sm:block">app.finybuddy.com/dashboard</div>
              <div className="text-[10px] px-2 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--brand-gray)]">Mar 2026</div>
            </div>

            <div className="grid lg:grid-cols-12 min-h-[620px]">
              <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--background-secondary)]/55 p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-6">
                  <Image src="/assets/finy-mascota-minimalista.png" alt="Finy" width={34} height={34} className="rounded-xl w-8 h-8 object-contain" />
                  <div>
                    <p className="text-xs text-[var(--brand-gray)]">Buenos dias</p>
                    <p className="text-sm font-semibold">Panel principal</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: "Dashboard", icon: LayoutDashboard, active: true },
                    { label: "Operaciones", icon: CreditCard },
                    { label: "Prevision", icon: Target },
                    { label: "Calendario", icon: Calendar },
                    { label: "Ahorro", icon: PiggyBank },
                    { label: "FinyBot", icon: Sparkles },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${item.active ? "border-[var(--brand-cyan)]/25 bg-[var(--brand-cyan)]/8" : "border-transparent hover:border-[var(--border)]"}`}
                    >
                      <item.icon className={`w-4 h-4 ${item.active ? "text-[var(--brand-cyan)]" : "text-[var(--brand-gray)]"}`} />
                      <span className={`text-sm ${item.active ? "font-semibold" : "text-[var(--brand-gray)]"}`}>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-3 rounded-xl border border-[var(--brand-cyan)]/20 bg-[var(--brand-cyan)]/5">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--brand-gray)] mb-1">Regla 50/30/20</p>
                  <p className="text-lg font-bold">20% ahorro</p>
                  <p className="text-xs text-[var(--brand-gray)]">Objetivo mensual completado</p>
                </div>
              </aside>

              <main className="lg:col-span-9 p-4 sm:p-6">
                <div className="grid sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Ingresos", value: "2.850 €", icon: TrendingUp, tone: "text-[var(--success)]" },
                    { label: "Gastos", value: "1.424 €", icon: TrendingDown, tone: "text-[var(--danger)]" },
                    { label: "Ahorro", value: "570 €", icon: PiggyBank, tone: "text-[var(--brand-cyan)]" },
                    { label: "Balance", value: "+1.426 €", icon: BarChart3, tone: "text-[var(--brand-purple)]" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[var(--brand-gray)]">{kpi.label}</span>
                        <kpi.icon className={kpi.tone + " w-3.5 h-3.5"} />
                      </div>
                      <p className={kpi.tone + " text-lg font-bold"}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid xl:grid-cols-5 gap-4">
                  <div className="xl:col-span-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/60">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4 text-[var(--brand-purple)]" />
                        Prevision vs realidad
                      </h3>
                      <span className="text-[11px] text-[var(--brand-gray)]">Ultimos 30 dias</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { c: "Vivienda", plan: 650, real: 650 },
                        { c: "Comida", plan: 280, real: 252 },
                        { c: "Transporte", plan: 120, real: 94 },
                        { c: "Ocio", plan: 140, real: 176 },
                        { c: "Suministros", plan: 90, real: 84 },
                      ].map((row) => {
                        const pct = Math.round((row.real / row.plan) * 100);
                        return (
                          <div key={row.c}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[var(--brand-gray)]">{row.c}</span>
                              <span className={row.real > row.plan ? "text-[var(--danger)] font-semibold" : "text-[var(--success)] font-semibold"}>
                                {row.real} € / {row.plan} €
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: row.real > row.plan ? "var(--danger)" : "var(--brand-cyan)" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="xl:col-span-2 space-y-4">
                    <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/60">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[var(--brand-cyan)]" />
                        Operaciones recientes
                      </h3>
                      <div className="space-y-2.5 text-xs">
                        {[
                          ["Amazon", "Compras online", "-34,50 €"],
                          ["Alquiler", "Vivienda", "-650,00 €"],
                          ["Nomina", "Ingreso", "+2.850,00 €"],
                          ["Transfer ahorro", "Ahorro", "-200,00 €"],
                        ].map(([name, cat, amount]) => (
                          <div key={name} className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)]/80">
                            <div>
                              <p className="font-medium">{name}</p>
                              <p className="text-[10px] text-[var(--brand-gray)]">{cat}</p>
                            </div>
                            <p className={"font-semibold tabular-nums " + (String(amount).startsWith("+") ? "text-[var(--success)]" : "text-[var(--danger)]")}>{amount}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[var(--brand-cyan)]/20 bg-gradient-to-br from-[var(--brand-cyan)]/5 to-[var(--brand-purple)]/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Image src="/assets/finy-mascota-minimalista.png" alt="Finy" width={24} height={24} className="object-contain" />
                        <p className="text-xs font-semibold text-[var(--brand-cyan)]">Sugerencia de Finy</p>
                      </div>
                      <p className="text-sm leading-relaxed">
                        Estas a 1% de tu objetivo de ahorro. Si reduces ocio en 15 €, cierras marzo al 20%.
                      </p>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative">
        <GridBackground />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Funcionalidades
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Producto completo, <span className="gradient-brand-text">flujo unificado</span>
            </h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto text-lg">
              Menos pantallas sueltas. Mas continuidad: registras, analizas, comparas y ejecutas decisiones en el mismo flujo.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">Workflow real de uso</h3>
                <span className="text-xs text-[var(--brand-gray)]">De operacion a decision</span>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "1) Captura inteligente",
                    desc: "Texto, voz o importacion de movimientos para no perder tiempo en tareas manuales.",
                    points: ["Registro por categorias", "Deteccion automatica", "Correccion en 1 clic"],
                  },
                  {
                    title: "2) Contexto financiero",
                    desc: "Dashboard y modulos conectados para ver impacto en ahorro, deuda y presupuesto.",
                    points: ["KPI en tiempo real", "Historico mensual", "Alertas por desviacion"],
                  },
                  {
                    title: "3) Accion recomendada",
                    desc: "FinyBot propone ajustes concretos y te lleva al modulo correcto para ejecutarlos.",
                    points: ["Sugerencias accionables", "Regla 50/30/20", "Seguimiento de objetivos"],
                  },
                ].map((step) => (
                  <div key={step.title} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/60">
                    <h4 className="font-semibold mb-1.5">{step.title}</h4>
                    <p className="text-sm text-[var(--brand-gray)] mb-3">{step.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.points.map((p) => (
                        <span key={p} className="px-2.5 py-1 rounded-lg text-xs border border-[var(--border)] bg-[var(--background)]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">Modulos conectados</h3>
                <div className="grid grid-cols-2 gap-2.5 text-sm">
                  {[
                    { name: "Dashboard", icon: LayoutDashboard },
                    { name: "Operaciones", icon: CreditCard },
                    { name: "Categorias", icon: Database },
                    { name: "Prevision", icon: Target },
                    { name: "Ahorro", icon: PiggyBank },
                    { name: "Deuda", icon: TrendingDown },
                    { name: "Calendario", icon: Calendar },
                    { name: "FinyBot", icon: Sparkles },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.name} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/60">
                        <Icon className="w-4 h-4 text-[var(--brand-cyan)]" />
                        <span>{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--brand-purple)]/20 bg-gradient-to-br from-[var(--brand-purple)]/5 to-[var(--brand-cyan)]/5 p-5 sm:p-6">
                <h3 className="text-lg font-semibold mb-3">Para quien esta hecho</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/80">
                    <p className="font-semibold mb-1">Personas que quieren control total</p>
                    <p className="text-[var(--brand-gray)]">Sin hojas de calculo ni apps desconectadas.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/80">
                    <p className="font-semibold mb-1">Usuarios que ejecutan decisiones rapido</p>
                    <p className="text-[var(--brand-gray)]">No solo ver datos, sino actuar cada semana.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/80">
                    <p className="font-semibold mb-1">Perfil proactivo</p>
                    <p className="text-[var(--brand-gray)]">Quien mide progreso y quiere mejorar mes a mes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Finy AI Interactive Demo */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        <GridBackground />
        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-[var(--brand-cyan)]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-[var(--brand-purple)]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Finy AI en acción
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4">
              De caos financiero a <span className="gradient-brand-text">claridad total</span>
            </h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto text-sm sm:text-lg">
              Tus movimientos transformados en decisiones financieras inteligentes. En milisegundos.
            </p>
          </div>

          <FinyAIDemo />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 relative">
        <GridBackground />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/20 text-[var(--brand-purple)] text-sm font-medium mb-6">
              <Crown className="w-4 h-4" />
              Planes y precios
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Elige tu <span className="gradient-brand-text">plan</span>
            </h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto text-lg">
              {hasUsedTrial
                ? "Plan Basic gratis para siempre. Desbloquea todo con Pro."
                : "Empieza gratis con 15 días de prueba Pro. Sin tarjeta de crédito."}
            </p>
          </div>

          {/* Billing Toggle */}
          <PricingToggle isLoggedIn={isLoggedIn} hasUsedTrial={hasUsedTrial} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para tomar el control?
          </h2>
          <p className="text-[var(--brand-gray)] mb-8 text-lg">
            {isLoggedIn
              ? "Vuelve a tu dashboard y sigue gestionando tus finanzas."
              : "Únete gratis y empieza a gestionar tus finanzas hoy mismo."}
          </p>
          <Link
            href={isLoggedIn ? "/dashboard" : "/register"}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[var(--brand-purple)]/30"
          >
            {isLoggedIn ? (
              <>
                <LayoutDashboard className="w-5 h-5" />
                Ir al Dashboard
              </>
            ) : (
              <>
                Crear cuenta gratis
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Link>
        </div>
      </section>

      {/* Newsletter Section */}
      <section id="newsletter" className="py-20 px-6 bg-[var(--background)]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Newsletter
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Consejos financieros cada semana
          </h2>
          <p className="text-lg text-[var(--brand-gray)] mb-8">
            Suscríbete y recibe trucos de ahorro, novedades de FinyBuddy y consejos para mejorar tus finanzas personales.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--border)] bg-[var(--background-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <Image
                src="/assets/logo-finybuddy-wordmark.png"
                alt="FinyBuddy"
                width={120}
                height={28}
                className="object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--brand-gray)]">
              <Link href="/terms" className="hover:text-[var(--foreground)] transition-colors">
                Términos
              </Link>
              <Link href="/privacy" className="hover:text-[var(--foreground)] transition-colors">
                Privacidad
              </Link>
              <a href="mailto:soporte@finybuddy.com" className="hover:text-[var(--foreground)] transition-colors">
                Soporte
              </a>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 hover:text-[var(--foreground)] transition-colors"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {theme === "light" ? "Modo oscuro" : "Modo claro"}
              </button>
            </div>

            <p className="text-sm text-[var(--brand-gray)]">
              © {new Date().getFullYear()} FinyBuddy. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
