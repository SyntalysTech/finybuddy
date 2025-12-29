"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  Clock,
  Sun,
  Moon,
  Sparkles,
  Shield,
  Zap,
  ChevronDown,
} from "lucide-react";

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
      {prefix}{current.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
    </span>
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

export default function HomePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check system preference or saved preference
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = saved ? (saved as "light" | "dark") : prefersDark ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");

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
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/finybuddy-mascot.png"
              alt="FinyBuddy"
              width={40}
              height={40}
            />
            <Image
              src="/assets/logo-finybuddy-wordmark.png"
              alt="FinyBuddy"
              width={120}
              height={30}
              className="object-contain hidden sm:block"
            />
          </Link>

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

            <Link
              href="/login"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-medium text-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--brand-purple)]/25"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
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
                gastos, ahorros y deudas en un solo lugar con la regla{" "}
                <span className="font-semibold text-[var(--foreground)]">50/30/20</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] text-white font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[var(--brand-purple)]/30"
                >
                  Empezar ahora
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-all hover:scale-105"
                >
                  Ver funciones
                  <ChevronDown className="w-5 h-5" />
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm text-[var(--brand-gray)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  </div>
                  <span>Regla 50/30/20</span>
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
                <div className="w-72 h-72 md:w-96 md:h-96 rounded-full border border-[var(--brand-cyan)]/20 animate-spin-slow" />
                <div className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-[var(--brand-purple)]/20 animate-spin-reverse" />
                <div className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border-2 border-dashed border-[var(--brand-yellow)]/30 animate-spin-slower" />
              </div>

              {/* Floating stats around mascot */}
              <div className="absolute top-0 right-0 md:right-10 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-lg animate-float">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                  <span className="text-sm font-semibold text-[var(--success)]">+2.850 €</span>
                </div>
              </div>

              <div className="absolute bottom-10 left-0 md:left-5 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-lg animate-float-delayed">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-[var(--brand-cyan)]" />
                  <span className="text-sm font-semibold">570 € ahorrado</span>
                </div>
              </div>

              <div className="absolute top-1/3 left-0 md:-left-5 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-lg animate-float-slow">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[var(--brand-purple)]" />
                  <span className="text-sm font-semibold">Meta: 85%</span>
                </div>
              </div>

              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBuddy Mascot"
                width={350}
                height={350}
                className="relative z-10 drop-shadow-2xl animate-bounce-subtle"
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

      {/* Live Stats Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center text-white">
              <p className="text-4xl md:text-5xl font-bold mb-2">
                <AnimatedNumber value={50} suffix="%" />
              </p>
              <p className="text-white/80 text-sm">Necesidades</p>
            </div>
            <div className="text-center text-white">
              <p className="text-4xl md:text-5xl font-bold mb-2">
                <AnimatedNumber value={30} suffix="%" />
              </p>
              <p className="text-white/80 text-sm">Deseos</p>
            </div>
            <div className="text-center text-white">
              <p className="text-4xl md:text-5xl font-bold mb-2">
                <AnimatedNumber value={20} suffix="%" />
              </p>
              <p className="text-white/80 text-sm">Ahorro</p>
            </div>
            <div className="text-center text-white">
              <p className="text-4xl md:text-5xl font-bold mb-2">100%</p>
              <p className="text-white/80 text-sm">Control total</p>
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
                    app.finybuddy.com/dashboard
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-cyan)] transition-colors group">
                  <div className="flex items-center gap-2 text-[var(--brand-gray)] mb-2">
                    <TrendingUp className="w-4 h-4 text-[var(--success)] group-hover:scale-110 transition-transform" />
                    <span className="text-xs">Ingresos</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--success)]">2.850,00 €</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-cyan)] transition-colors group">
                  <div className="flex items-center gap-2 text-[var(--brand-gray)] mb-2">
                    <TrendingDown className="w-4 h-4 text-[var(--danger)] group-hover:scale-110 transition-transform" />
                    <span className="text-xs">Gastos</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--danger)]">1.423,50 €</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-cyan)] transition-colors group">
                  <div className="flex items-center gap-2 text-[var(--brand-gray)] mb-2">
                    <PiggyBank className="w-4 h-4 text-[var(--brand-cyan)] group-hover:scale-110 transition-transform" />
                    <span className="text-xs">Ahorro</span>
                  </div>
                  <p className="text-xl font-bold">570,00 €</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-cyan)] transition-colors group">
                  <div className="flex items-center gap-2 text-[var(--brand-gray)] mb-2">
                    <BarChart3 className="w-4 h-4 text-[var(--brand-purple)] group-hover:scale-110 transition-transform" />
                    <span className="text-xs">Balance</span>
                  </div>
                  <p className="text-xl font-bold text-[var(--success)]">+856,50 €</p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[var(--brand-purple)]" />
                    Distribución 50/30/20
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--brand-gray)]">Necesidades (50%)</span>
                        <span className="font-medium">712 € / 1.425 €</span>
                      </div>
                      <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-cyan)]/70 animate-progress-50" style={{ width: "50%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--brand-gray)]">Deseos (30%)</span>
                        <span className="font-medium">641 € / 855 €</span>
                      </div>
                      <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-purple)]/70 animate-progress-75" style={{ width: "75%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--brand-gray)]">Ahorro (20%)</span>
                        <span className="font-medium">570 € / 570 €</span>
                      </div>
                      <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[var(--success)] to-[var(--success)]/70 animate-progress-100" style={{ width: "100%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--brand-cyan)]" />
                    Últimas operaciones
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: "🛒", name: "Supermercado", date: "Hoy", amount: "-45,80 €", type: "expense" },
                      { icon: "💼", name: "Nómina", date: "1 dic", amount: "+2.850,00 €", type: "income" },
                      { icon: "🏠", name: "Alquiler", date: "1 dic", amount: "-650,00 €", type: "expense" },
                    ].map((op, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--background)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${op.type === "income" ? "bg-[var(--success)]/10" : "bg-[var(--danger)]/10"}`}>
                            {op.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{op.name}</p>
                            <p className="text-xs text-[var(--brand-gray)]">{op.date}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${op.type === "income" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                          {op.amount}
                        </span>
                      </div>
                    ))}
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

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-purple)] via-[var(--brand-cyan)] to-[var(--brand-purple)]" />

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }} />
            </div>

            <div className="relative z-10 p-10 md:p-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6 backdrop-blur-sm">
                <Clock className="w-4 h-4" />
                Próximamente más planes
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para tomar el control?
              </h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto text-lg">
                Empieza a gestionar tus finanzas de forma inteligente hoy mismo.
                Si tienes preguntas, contacta con nosotros.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[var(--brand-purple)] font-semibold hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-xl"
                >
                  Acceder a FinyBuddy
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="mailto:contacto@finybuddy.com"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  Contactar
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--border)] bg-[var(--background-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBuddy"
                width={36}
                height={36}
              />
              <div>
                <p className="font-semibold">FinyBuddy</p>
                <p className="text-xs text-[var(--brand-gray)]">Tu asistente financiero</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-sm text-[var(--brand-gray)] hover:text-[var(--foreground)] transition-colors"
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
