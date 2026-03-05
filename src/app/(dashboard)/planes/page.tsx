"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  CreditCard,
  ExternalLink,
  Bot,
  PiggyBank,
  TrendingUp,
  LayoutDashboard,
  Receipt,
  Calendar,
  FolderOpen,
  Scale,
  Bell,
  Download,
  Settings,
  Clock,
} from "lucide-react";
import Toast from "@/components/ui/Toast";

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "price_1T49EIK6uoz4D92qYPcT6qho";
const ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || "";

interface Feature {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  basic: boolean;
  pro: boolean;
}

const features: Feature[] = [
  { name: "Dashboard con KPIs y gráficos", icon: LayoutDashboard, basic: true, pro: true },
  { name: "Registro de operaciones", icon: Receipt, basic: true, pro: true },
  { name: "Calendario financiero", icon: Calendar, basic: true, pro: true },
  { name: "Previsión (presupuestos)", icon: TrendingUp, basic: true, pro: true },
  { name: "Categorías predefinidas", icon: FolderOpen, basic: true, pro: true },
  { name: "Regla 50/30/20 (vista básica)", icon: Scale, basic: true, pro: true },
  { name: "Tema claro/oscuro", icon: Settings, basic: true, pro: true },
  { name: "Previsión vs Realidad", icon: TrendingUp, basic: false, pro: true },
  { name: "Metas de ahorro", icon: PiggyBank, basic: false, pro: true },
  { name: "Gestión de deudas", icon: CreditCard, basic: false, pro: true },
  { name: "FinyBot - Chat IA + voz", icon: Bot, basic: false, pro: true },
  { name: "Categorías personalizadas", icon: FolderOpen, basic: false, pro: true },
  { name: "Regla financiera personalizable", icon: Scale, basic: false, pro: true },
  { name: "Recordatorios financieros", icon: Bell, basic: false, pro: true },
  { name: "Notificaciones y emails automáticos", icon: Bell, basic: false, pro: true },
  { name: "Exportación de datos (CSV/JSON)", icon: Download, basic: false, pro: true },
  { name: "Insights de Finy", icon: Sparkles, basic: false, pro: true },
];

export default function PlanesPage() {
  const searchParams = useSearchParams();
  const {
    isPro,
    isTrialing,
    trialDaysLeft,
    trialExpired,
    plan,
    status,
    willCancel,
    periodEnd,
    hasStripeCustomer,
    loading,
  } = useSubscription();

  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    if (searchParams.get("canceled") === "true") {
      setShowCanceled(true);
      setTimeout(() => setShowCanceled(false), 5000);
    }
  }, [searchParams]);

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(true);
    try {
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

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Planes" subtitle="Elige el plan que mejor se adapte a ti" />
        <div className="p-6">
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)] mx-auto" />
            <p className="mt-3 text-[var(--brand-gray)]">Cargando planes...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Planes" subtitle="Elige el plan que mejor se adapte a ti" />

      <div className="p-6 space-y-6">
        {/* Toast notifications */}
        {showSuccess && <Toast type="success" message="Suscripción activada correctamente. Bienvenido a FinyBuddy Pro!" onClose={() => setShowSuccess(false)} />}
        {showCanceled && <Toast type="error" message="Proceso de pago cancelado. Puedes intentarlo de nuevo cuando quieras." onClose={() => setShowCanceled(false)} />}

        {/* Current Plan Status Banner */}
        <div className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isPro
                    ? "bg-gradient-to-br from-[#02EAFF]/20 to-[#7739FE]/20"
                    : "bg-[var(--background-secondary)]"
                }`}
              >
                <Crown
                  className={`w-5 h-5 ${
                    isPro ? "text-[#7739FE]" : "text-[var(--brand-gray)]"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {isTrialing
                    ? "Prueba gratuita Pro"
                    : status === "active"
                      ? plan === "pro_annual"
                        ? "Pro Anual"
                        : "Pro Mensual"
                      : "Plan Basic"}
                </p>
                <p className="text-xs text-[var(--brand-gray)]">
                  {isTrialing && (
                    <>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {trialDaysLeft} días restantes de prueba
                    </>
                  )}
                  {trialExpired && "Tu prueba ha terminado"}
                  {status === "active" && !willCancel && "Suscripción activa"}
                  {status === "active" &&
                    willCancel &&
                    periodEnd &&
                    `Se cancela el ${new Date(periodEnd).toLocaleDateString("es-ES")}`}
                  {status === "past_due" && "Pago pendiente"}
                  {status === "canceled" && "Suscripción cancelada"}
                  {!isTrialing && !trialExpired && status !== "active" && status !== "past_due" && status !== "canceled" && "Plan gratuito"}
                </p>
              </div>
            </div>

            {status === "active" && hasStripeCustomer && (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="text-sm px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ExternalLink className="w-4 h-4" />
                {portalLoading ? "Abriendo..." : "Gestiónar suscripción"}
              </button>
            )}
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span
            className={`text-sm font-medium ${
              !isAnnual ? "text-[var(--foreground)]" : "text-[var(--brand-gray)]"
            }`}
          >
            Mensual
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isAnnual
                ? "bg-gradient-to-r from-[#02EAFF] to-[#7739FE]"
                : "bg-[var(--border)]"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                isAnnual ? "left-8" : "left-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              isAnnual ? "text-[var(--foreground)]" : "text-[var(--brand-gray)]"
            }`}
          >
            Anual
          </span>
          {isAnnual && (
            <span className="text-xs px-2 py-1 rounded-full bg-[#22C55E]/20 text-[#22C55E] font-semibold">
              Ahorra ~20 EUR
            </span>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Basic Card */}
          <div className="card p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-1">FinyBuddy - Basic</h3>
              <p className="text-xs text-[var(--brand-gray)]">
                Lo esencial para empezar
              </p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">Gratis</span>
              </div>
              <p className="text-xs text-[var(--brand-gray)] mt-1">
                Para siempre
              </p>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {features
                .filter((f) => f.basic)
                .map((f) => (
                  <li key={f.name} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                    {f.name}
                  </li>
                ))}
            </ul>
            {!isPro && status !== "active" && !isTrialing && (
              <div className="px-4 py-3 rounded-xl bg-[var(--background-secondary)] text-center text-sm font-medium text-[var(--brand-gray)]">
                Plan actual
              </div>
            )}
          </div>

          {/* Pro Card */}
          <div className="card p-6 flex flex-col border-2 border-[#7739FE]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-[#02EAFF] to-[#7739FE] text-white text-xs font-semibold rounded-bl-xl">
              Popular
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#7739FE]" />
                FinyBuddy - Pro
              </h3>
              <p className="text-xs text-[var(--brand-gray)]">
                Desbloquea todo el potencial de FinyBuddy
              </p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {isAnnual ? "39,99" : "4,99"}
                </span>
                <span className="text-[var(--brand-gray)]">EUR</span>
              </div>
              <p className="text-xs text-[var(--brand-gray)] mt-1">
                {isAnnual
                  ? "al año (~3,33 EUR/mes)"
                  : "al mes"}
              </p>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              <li className="text-sm font-medium text-[#7739FE] flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                Todo lo de Basic, más:
              </li>
              {features
                .filter((f) => f.pro && !f.basic)
                .map((f) => (
                  <li key={f.name} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                    {f.name}
                  </li>
                ))}
            </ul>
            {status === "active" ? (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="w-full px-4 py-3 rounded-xl border border-[#7739FE] text-[#7739FE] font-semibold hover:bg-[#7739FE]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ExternalLink className="w-4 h-4" />
                {portalLoading ? "Abriendo..." : "Gestiónar suscripción"}
              </button>
            ) : (
              <button
                onClick={() =>
                  handleCheckout(isAnnual ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID)
                }
                disabled={checkoutLoading}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#02EAFF] to-[#7739FE] text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {checkoutLoading
                  ? "Redirigiendo..."
                  : isTrialing
                    ? "Suscribirse ahora"
                    : trialExpired
                      ? "Suscribirse a Pro"
                      : "Empezar prueba gratuita de 15 días"}
              </button>
            )}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="card overflow-hidden max-w-3xl mx-auto">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#7739FE]" />
              Comparativa de funcionalidades
            </h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.name}
                  className="flex items-center px-4 py-3 hover:bg-[var(--background-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className="w-4 h-4 text-[var(--brand-gray)] shrink-0" />
                    <span className="text-sm truncate">{f.name}</span>
                  </div>
                  <div className="w-20 text-center shrink-0">
                    {f.basic ? (
                      <Check className="w-4 h-4 text-[#22C55E] mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-[var(--brand-gray)]/30 mx-auto" />
                    )}
                  </div>
                  <div className="w-20 text-center shrink-0">
                    {f.pro ? (
                      <Check className="w-4 h-4 text-[#22C55E] mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-[var(--brand-gray)]/30 mx-auto" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Table header */}
          <div className="flex items-center px-4 py-2 bg-[var(--background-secondary)] border-t border-[var(--border)] text-xs font-semibold text-[var(--brand-gray)]">
            <div className="flex-1" />
            <div className="w-20 text-center">Basic</div>
            <div className="w-20 text-center text-[#7739FE]">Pro</div>
          </div>
        </div>
      </div>
    </>
  );
}
