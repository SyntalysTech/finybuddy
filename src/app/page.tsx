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
  { raw: "AMZN MKTPLACE ES", rawAmt: "34,50€", concept: "Amazon", amount: -34.50, category: "Compras online", icon: ShoppingCart, color: "#8B4DFF", type: "wants" as const },
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

    // Phase 1: Scan raw transactions with glow line
    DEMO_TX.forEach((_, i) => {
      addTimeout(() => setScanLine(i), i * 180);
    });

    // Phase 2: Categorize them (starts overlapping with scan for speed feel)
    addTimeout(() => setPhase("categorizing"), 400);
    DEMO_TX.forEach((_, i) => {
      addTimeout(() => setCategorized(i), 400 + i * 220);
    });

    // Phase 3: Analysis
    const catDone = 400 + DEMO_TX.length * 220 + 200;
    addTimeout(() => {
      setPhase("analyzing");
      setShowStats(true);
      setShowDonut(true);
      // Animate total counter
      const steps = 30;
      const increment = total / steps;
      for (let s = 1; s <= steps; s++) {
        addTimeout(() => setTotalAnimated(Math.min(increment * s, total)), catDone + s * 25 - catDone + 100);
      }
    }, catDone);

    // Phase 4: Insights
    DEMO_INSIGHTS.forEach((_, i) => {
      addTimeout(() => setShowInsights(i), catDone + 600 + i * 500);
    });

    // Phase 5: Done
    addTimeout(() => setPhase("done"), catDone + 600 + DEMO_INSIGHTS.length * 500 + 300);
  };

  const resetDemo = () => {
    clearAllTimeouts();
    setPhase("idle"); setScanLine(-1); setCategorized(-1); setShowStats(false); setShowInsights(-1); setTotalAnimated(0); setShowDonut(false);
  };

  const fmtAmount = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const distData = [
    { label: "Necesidades", value: needsTotal, pct: Math.round((needsTotal / total) * 100), color: "#2EEB8F" },
    { label: "Deseos", value: wantsTotal, pct: Math.round((wantsTotal / total) * 100), color: "#8B4DFF" },
    { label: "Ahorro", value: savingsTotal, pct: Math.round((savingsTotal / total) * 100), color: "#02EAFF" },
  ];

  // SVG donut math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="relative">
      {/* Ambient glow behind the whole demo */}
      <div className={`absolute -inset-8 rounded-3xl blur-3xl transition-opacity duration-1000 ${phase !== "idle" ? "opacity-100" : "opacity-0"}`}
        style={{ background: "radial-gradient(ellipse at center, rgba(2,234,255,0.08) 0%, rgba(119,57,254,0.05) 50%, transparent 70%)" }} />

      <div className="relative space-y-5">
        {/* Main demo area */}
        <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Top bar - terminal style */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]/80">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)]">
              <Sparkles className={`w-3 h-3 transition-colors duration-300 ${phase !== "idle" ? "text-[var(--brand-cyan)]" : "text-[var(--brand-gray)]"}`} />
              <span className="text-[10px] sm:text-xs text-[var(--brand-gray)] font-mono">finy-ai-engine v2.0</span>
              {phase !== "idle" && phase !== "done" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-cyan)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-cyan)]" />
                </span>
              )}
            </div>
            <div className="w-[52px]" />
          </div>

          {/* Two column layout */}
          <div className="grid lg:grid-cols-2">
            {/* LEFT: Raw bank extract */}
            <div className="relative border-b lg:border-b-0 lg:border-r border-[var(--border)]">
              <div className="px-4 sm:px-5 py-2.5 border-b border-[var(--border)] bg-[var(--background-secondary)]/50">
                <p className="text-[10px] sm:text-xs font-semibold flex items-center gap-2 text-[var(--brand-gray)] uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5" />
                  Extracto bancario
                </p>
              </div>
              <div className="p-2 sm:p-3 space-y-0.5 font-mono text-[10px] sm:text-xs relative">
                {DEMO_TX.map((t, i) => {
                  const isScanned = scanLine >= i;
                  const isActive = scanLine === i;
                  return (
                    <div
                      key={i}
                      className={`relative flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-300 ${
                        isActive ? "bg-[var(--brand-cyan)]/10 shadow-[0_0_20px_rgba(2,234,255,0.15)]" :
                        isScanned ? "bg-[var(--brand-cyan)]/5" : "bg-transparent"
                      }`}
                    >
                      {/* Scan line glow */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-lg border border-[var(--brand-cyan)]/40 shadow-[inset_0_0_12px_rgba(2,234,255,0.1)]" />
                      )}
                      <span className={`relative transition-all duration-300 ${isScanned ? "text-[var(--foreground)]" : "text-[var(--brand-gray)]/50"}`}>
                        {t.raw}
                      </span>
                      <span className={`relative font-semibold transition-all duration-300 tabular-nums ${isScanned ? "text-[var(--foreground)]" : "text-[var(--brand-gray)]/50"}`}>
                        {t.rawAmt}
                      </span>
                      {/* Check mark when scanned */}
                      {isScanned && !isActive && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--brand-cyan)]/10 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-[var(--brand-cyan)]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Categorized output */}
            <div className="relative">
              <div className="px-4 sm:px-5 py-2.5 border-b border-[var(--border)] bg-[var(--background-secondary)]/50">
                <p className="text-[10px] sm:text-xs font-semibold flex items-center gap-2 text-[var(--brand-gray)] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Categorizado por Finy AI
                </p>
              </div>
              <div className="p-2 sm:p-3 space-y-0.5">
                {DEMO_TX.map((t, i) => {
                  const Icon = t.icon;
                  const isVisible = categorized >= i;
                  const isJustAppeared = categorized === i;
                  return (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-lg"
                      style={{ minHeight: "40px" }}
                    >
                      {/* Flash effect on appear */}
                      {isJustAppeared && (
                        <div className="absolute inset-0 rounded-lg animate-[fadeIn_0.5s_ease-out]"
                          style={{ boxShadow: `inset 0 0 20px ${t.color}15, 0 0 15px ${t.color}10` }} />
                      )}
                      <div
                        className={`relative flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-500 ${
                          isVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-8 scale-95"
                        }`}
                        style={isVisible ? { borderLeft: `3px solid ${t.color}` } : {}}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                            style={{ backgroundColor: `${t.color}15`, boxShadow: isJustAppeared ? `0 0 12px ${t.color}30` : "none" }}>
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: t.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{t.concept}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                              <p className="text-[9px] sm:text-[10px] font-medium truncate" style={{ color: t.color }}>{t.category}</p>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-bold flex-shrink-0 ml-2" style={{ color: t.type === "savings" ? "#02EAFF" : "var(--danger)" }}>
                          {fmtAmount(t.amount)} €
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stats + Insights Panel */}
        <div className={`transition-all duration-700 ${showStats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}`}>
          <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
            {/* Total + Donut */}
            <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
              {/* Subtle gradient accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--brand-cyan)]/5 to-transparent rounded-bl-full pointer-events-none" />
              <p className="text-[10px] sm:text-xs font-semibold text-[var(--brand-gray)] uppercase tracking-wider mb-4">Análisis instantáneo</p>

              <div className="flex items-center gap-4 sm:gap-5">
                {/* Donut chart */}
                <div className={`relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 transition-all duration-1000 ${showDonut ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {distData.map((item, i) => {
                      const dashLen = (item.pct / 100) * circumference;
                      const offset = cumulativeOffset;
                      cumulativeOffset += dashLen;
                      return (
                        <circle
                          key={i}
                          cx="50" cy="50" r={radius}
                          fill="none"
                          stroke={item.color}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                          strokeDashoffset={-offset}
                          className="transition-all duration-1000"
                          style={{ filter: `drop-shadow(0 0 4px ${item.color}40)` }}
                        />
                      );
                    })}
                  </svg>
                  {/* Center total */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[9px] text-[var(--brand-gray)]">Total</span>
                    <span className="text-sm sm:text-base font-bold tabular-nums">{fmtAmount(totalAnimated)} €</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2.5 flex-1">
                  {distData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}50` }} />
                        <span className="text-[10px] sm:text-xs text-[var(--brand-gray)]">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] sm:text-xs font-bold" style={{ color: item.color }}>{item.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini progress bars */}
              <div className="mt-4 space-y-1.5">
                {distData.map((item, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-[1500ms] ease-out"
                      style={{ width: showDonut ? `${item.pct}%` : "0%", backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}40` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Finy Insights */}
            <div className="lg:col-span-3 rounded-2xl border border-[var(--brand-cyan)]/20 bg-gradient-to-br from-[var(--background)]/80 to-[var(--brand-cyan)]/[0.02] backdrop-blur-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
              {/* Animated gradient border accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--brand-cyan)] to-transparent opacity-40" />

              <div className="flex items-center gap-2.5 mb-4">
                <div className="relative">
                  <Image src="/assets/finy-mascota-minimalista.png" alt="Finy" width={36} height={36} className="rounded-full w-9 h-9" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--background)] transition-colors duration-300 ${phase !== "idle" ? "bg-[var(--brand-cyan)]" : "bg-[var(--brand-gray)]"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[var(--brand-cyan)]">Finy AI</span>
                    <Sparkles className="w-3.5 h-3.5 text-[var(--brand-cyan)] opacity-70" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-[var(--brand-gray)]">Analizando tus movimientos...</p>
                </div>
              </div>

              <div className="space-y-3">
                {DEMO_INSIGHTS.map((insight, i) => {
                  const isVisible = showInsights >= i;
                  const colors = { warning: { bg: "var(--warning)", icon: "!" }, info: { bg: "var(--brand-cyan)", icon: "i" }, tip: { bg: "var(--success)", icon: "✓" } };
                  const c = colors[insight.type];
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-600 ${
                        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                      }`}
                      style={isVisible ? { backgroundColor: `color-mix(in srgb, ${c.bg} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${c.bg} 15%, transparent)` } : {}}
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold text-white"
                        style={{ backgroundColor: c.bg, boxShadow: `0 0 8px color-mix(in srgb, ${c.bg} 40%, transparent)` }}>
                        {c.icon}
                      </div>
                      <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed">{insight.text}</p>
                    </div>
                  );
                })}

                {/* Savings opportunity highlight */}
                <div className={`mt-2 p-3 sm:p-4 rounded-xl transition-all duration-700 ${
                  phase === "done" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                  style={{ background: "linear-gradient(135deg, rgba(2,234,255,0.08) 0%, rgba(119,57,254,0.08) 100%)", border: "1px solid rgba(2,234,255,0.2)" }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[var(--brand-cyan)] to-[var(--brand-purple)] flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-[var(--brand-gray)]">Potencial de ahorro detectado</p>
                        <p className="text-sm sm:text-lg font-bold gradient-brand-text">+15,00 € / mes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs text-[var(--brand-gray)]">Proyección anual</p>
                      <p className="text-sm sm:text-base font-bold text-[var(--success)]">+180,00 €</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center pt-2">
          {phase === "idle" && (
            <button
              onClick={startDemo}
              className="group relative inline-flex items-center gap-2.5 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-bold text-sm sm:text-base hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-[var(--brand-purple)]/30"
            >
              {/* Animated border glow */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[var(--brand-cyan)] via-[var(--brand-purple)] to-[var(--brand-cyan)] opacity-0 group-hover:opacity-50 blur-sm transition-opacity duration-500" />
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
              <div className="flex gap-1">
                {[0, 1, 2].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
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
  "Dashboard con KPIs y graficos",
  "Registro de ingresos y gastos",
  "Calendario financiero",
  "Prevision (presupuestos)",
  "Categorias predefinidas",
  "Regla 50/30/20",
  "Tema claro/oscuro",
];

const PRO_FEATURES = [
  "Todo lo del plan Basic",
  "Prevision vs Realidad",
  "Metas de ahorro",
  "Gestion de deudas",
  "FinyBot - Chat IA + voz",
  "Categorias personalizadas",
  "Regla financiera personalizable",
  "Recordatorios y notificaciones",
  "Exportacion CSV/JSON",
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
          className={`relative w-14 h-7 rounded-full transition-colors ${
            annual ? "bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)]" : "bg-[var(--border)]"
          }`}
        >
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
            annual ? "translate-x-7" : "translate-x-0.5"
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
                Gestiona tus finanzas de forma inteligente. Controla ingresos,
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

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm text-[var(--brand-gray)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  </div>
                  <span>Control total</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--brand-gray)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-cyan)]/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[var(--brand-cyan)]" />
                  </div>
                  <span>Tiempo real</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--brand-gray)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-purple)]/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[var(--brand-purple)]" />
                  </div>
                  <span>100% privado</span>
                </div>
              </div>
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
              Dashboard intuitivo para ver tu situación financiera al momento
            </p>
          </div>

          {/* Mock Dashboard with glass effect */}
          <div className="relative">
            {/* Glow effect behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--brand-cyan)]/20 to-[var(--brand-purple)]/20 rounded-3xl blur-2xl" />

            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
              {/* Browser bar mock */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--border)]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-lg bg-[var(--background-secondary)] text-xs text-[var(--brand-gray)]">
                    www.finybuddy.com/dashboard
                  </div>
                </div>
              </div>

              {/* Finy greeting */}
              <div className="flex items-center gap-2.5 mb-5 p-3 rounded-xl bg-gradient-to-r from-[var(--brand-cyan)]/5 to-[var(--brand-purple)]/5 border border-[var(--border)]">
                <Image src="/assets/finy-mascota-minimalista.png" alt="Finy" width={32} height={32} className="rounded-full w-8 h-8 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--brand-cyan)]">Vas bien este mes, sigue así</p>
                  <p className="text-[10px] text-[var(--brand-gray)] italic">&ldquo;El ahorro es la base de la fortuna&rdquo;</p>
                </div>
              </div>

              {/* KPI Cards - 3 like real dashboard */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
                <div className="p-2.5 sm:p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[var(--brand-gray)] mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />
                    <span className="text-[10px] sm:text-xs">Ingresos</span>
                  </div>
                  <p className="text-sm sm:text-xl font-bold text-[var(--success)]">2.850 €</p>
                </div>
                <div className="p-2.5 sm:p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[var(--brand-gray)] mb-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-[var(--danger)]" />
                    <span className="text-[10px] sm:text-xs">Gastos</span>
                  </div>
                  <p className="text-sm sm:text-xl font-bold text-[var(--danger)]">1.424 €</p>
                </div>
                <div className="p-2.5 sm:p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[var(--brand-gray)] mb-1.5">
                    <PiggyBank className="w-3.5 h-3.5 text-[var(--brand-cyan)]" />
                    <span className="text-[10px] sm:text-xs">Ahorro</span>
                  </div>
                  <p className="text-sm sm:text-xl font-bold text-[var(--brand-cyan)]">570 €</p>
                </div>
              </div>

              {/* Main content grid */}
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
                {/* Evolución mensual - bar chart mockup */}
                <div className="p-4 sm:p-5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-xs sm:text-sm">
                    <BarChart3 className="w-4 h-4 text-[var(--brand-purple)]" />
                    Evolución mensual
                  </h3>
                  {/* Simulated bar chart */}
                  <div className="flex items-end gap-1.5 sm:gap-3 h-28 sm:h-32">
                    {[
                      { label: "Sep", income: 60, expense: 45, savings: 15 },
                      { label: "Oct", income: 70, expense: 55, savings: 15 },
                      { label: "Nov", income: 65, expense: 50, savings: 15 },
                      { label: "Dic", income: 80, expense: 48, savings: 32 },
                      { label: "Ene", income: 75, expense: 52, savings: 23 },
                      { label: "Feb", income: 85, expense: 50, savings: 35 },
                    ].map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end h-24 sm:h-28">
                          <div className="flex-1 rounded-t bg-[var(--success)]/80" style={{ height: `${m.income}%` }} />
                          <div className="flex-1 rounded-t bg-[var(--danger)]/80" style={{ height: `${m.expense}%` }} />
                          <div className="flex-1 rounded-t bg-[var(--brand-cyan)]/80" style={{ height: `${m.savings}%` }} />
                        </div>
                        <span className="text-[8px] sm:text-[10px] text-[var(--brand-gray)]">{m.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-3 sm:gap-4 mt-3">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--success)]" /><span className="text-[8px] sm:text-[10px] text-[var(--brand-gray)]">Ingresos</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--danger)]" /><span className="text-[8px] sm:text-[10px] text-[var(--brand-gray)]">Gastos</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--brand-cyan)]" /><span className="text-[8px] sm:text-[10px] text-[var(--brand-gray)]">Ahorro</span></div>
                  </div>
                </div>

                {/* Distribución + Finy AI */}
                <div className="space-y-4 sm:space-y-5">
                  {/* Distribución pie chart mockup */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-xs sm:text-sm">
                      <PieChartIcon className="w-4 h-4 text-[var(--brand-cyan)]" />
                      Distribución del mes
                    </h3>
                    <div className="flex items-center gap-4">
                      {/* Simulated donut chart */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#2EEB8F" strokeWidth="4" strokeDasharray="44 88" strokeDashoffset="0" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#8B4DFF" strokeWidth="4" strokeDasharray="26.4 88" strokeDashoffset="-44" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#00E5FF" strokeWidth="4" strokeDasharray="17.6 88" strokeDashoffset="-70.4" />
                        </svg>
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#2EEB8F" }} />
                          <span className="text-[10px] sm:text-xs text-[var(--brand-gray)]">Necesidades: 712 €</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#8B4DFF" }} />
                          <span className="text-[10px] sm:text-xs text-[var(--brand-gray)]">Deseos: 641 €</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#00E5FF" }} />
                          <span className="text-[10px] sm:text-xs text-[var(--brand-gray)]">Ahorro: 570 €</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Finy AI Panel */}
                  <div className="p-4 sm:p-5 rounded-xl border border-[var(--brand-cyan)]/20 bg-gradient-to-br from-[var(--brand-cyan)]/5 to-[var(--brand-purple)]/5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Image src="/assets/finy-mascota-minimalista.png" alt="Finy" width={28} height={28} className="rounded-full w-7 h-7" />
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-[var(--brand-cyan)]">Finy</span>
                        <Sparkles className="w-3 h-3 text-[var(--brand-cyan)] opacity-60" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] mt-1.5 flex-shrink-0" />
                        <p className="text-[10px] sm:text-xs text-[var(--foreground)]">Has ahorrado un 20% de tus ingresos este mes</p>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] mt-1.5 flex-shrink-0" />
                        <p className="text-[10px] sm:text-xs text-[var(--foreground)]">Gastas un 12% menos que el mes pasado</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              Todo lo que necesitas
            </h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto text-lg">
              Herramientas diseñadas para simplificar tu gestión financiera
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, color: "brand-purple", title: "Dashboard completo", desc: "Visualiza ingresos, gastos y balance en tiempo real con gráficos claros" },
              { icon: Target, color: "brand-cyan", title: "Previsión vs Realidad", desc: "Compara tu presupuesto planificado con los gastos reales de cada categoría" },
              { icon: PiggyBank, color: "success", title: "Metas de ahorro", desc: "Crea metas personalizadas y sigue tu progreso con contribuciones" },
              { icon: CreditCard, color: "danger", title: "Gestión de deudas", desc: "Controla hipotecas, préstamos y tarjetas con seguimiento de pagos" },
              { icon: Calendar, color: "warning", title: "Calendario financiero", desc: "Ve tus operaciones organizadas por día en una vista de calendario" },
              { icon: TrendingUp, color: "brand-purple", title: "Regla 50/30/20", desc: "Distribuye tus ingresos entre necesidades, deseos y ahorro automáticamente" },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--brand-cyan)] transition-all duration-300 hover:shadow-xl hover:shadow-[var(--brand-cyan)]/10 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-[var(--${feature.color})]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-[var(--${feature.color})]`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--brand-gray)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
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
