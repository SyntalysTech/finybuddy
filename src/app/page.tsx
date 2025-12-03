import Image from "next/image";
import Link from "next/link";
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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
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
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg bg-[var(--brand-purple)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Tu asistente{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)]">
                  financiero
                </span>{" "}
                personal
              </h1>
              <p className="text-lg text-[var(--brand-gray)] mb-8 max-w-lg">
                Gestiona tus finanzas de forma inteligente. Controla ingresos,
                gastos, ahorros y deudas en un solo lugar con la regla 50/30/20.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--brand-purple)] text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Acceder a mi cuenta
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                <div className="flex items-center gap-2 text-sm text-[var(--brand-gray)]">
                  <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  Regla 50/30/20
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--brand-gray)]">
                  <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  Categorías inteligentes
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--brand-gray)]">
                  <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  100% privado
                </div>
              </div>
            </div>
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-purple)]/20 to-[var(--brand-cyan)]/20 blur-3xl rounded-full" />
              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBuddy Mascot"
                width={400}
                height={400}
                className="relative z-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 px-6 bg-[var(--background-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Todo en un vistazo
            </h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto">
              Dashboard intuitivo para ver tu situación financiera al momento
            </p>
          </div>

          {/* Mock Dashboard */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-lg">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[var(--background-secondary)]">
                <div className="flex items-center gap-2 text-[var(--brand-gray)] mb-2">
                  <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                  <span className="text-xs">Ingresos</span>
                </div>
                <p className="text-xl font-bold text-[var(--success)]">2.850,00 €</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--background-secondary)]">
                <div className="flex items-center gap-2 text-[var(--brand-gray)] mb-2">
                  <TrendingDown className="w-4 h-4 text-[var(--danger)]" />
                  <span className="text-xs">Gastos</span>
                </div>
                <p className="text-xl font-bold text-[var(--danger)]">1.423,50 €</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--background-secondary)]">
                <div className="flex items-center gap-2 text-[var(--brand-gray)] mb-2">
                  <PiggyBank className="w-4 h-4 text-[var(--brand-cyan)]" />
                  <span className="text-xs">Ahorro</span>
                </div>
                <p className="text-xl font-bold">570,00 €</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--background-secondary)]">
                <div className="flex items-center gap-2 text-[var(--brand-gray)] mb-2">
                  <BarChart3 className="w-4 h-4 text-[var(--brand-purple)]" />
                  <span className="text-xs">Balance</span>
                </div>
                <p className="text-xl font-bold text-[var(--success)]">+856,50 €</p>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[var(--background-secondary)]">
                <h3 className="font-semibold mb-4">Distribución 50/30/20</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--brand-gray)]">Necesidades (50%)</span>
                      <span className="font-medium">712 € / 1.425 €</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--brand-cyan)]" style={{ width: "50%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--brand-gray)]">Deseos (30%)</span>
                      <span className="font-medium">641 € / 855 €</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--brand-purple)]" style={{ width: "75%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--brand-gray)]">Ahorro (20%)</span>
                      <span className="font-medium">570 € / 570 €</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--success)]" style={{ width: "100%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--background-secondary)]">
                <h3 className="font-semibold mb-4">Últimas operaciones</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--danger)]/10 flex items-center justify-center text-sm">
                        🛒
                      </div>
                      <div>
                        <p className="text-sm font-medium">Supermercado</p>
                        <p className="text-xs text-[var(--brand-gray)]">Hoy</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-[var(--danger)]">-45,80 €</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--success)]/10 flex items-center justify-center text-sm">
                        💼
                      </div>
                      <div>
                        <p className="text-sm font-medium">Nómina</p>
                        <p className="text-xs text-[var(--brand-gray)]">1 dic</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-[var(--success)]">+2.850,00 €</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--danger)]/10 flex items-center justify-center text-sm">
                        🏠
                      </div>
                      <div>
                        <p className="text-sm font-medium">Alquiler</p>
                        <p className="text-xs text-[var(--brand-gray)]">1 dic</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-[var(--danger)]">-650,00 €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Funcionalidades
            </h2>
            <p className="text-[var(--brand-gray)] max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tus finanzas personales
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--brand-purple)]/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-[var(--brand-purple)]" />
              </div>
              <h3 className="font-semibold mb-2">Dashboard completo</h3>
              <p className="text-sm text-[var(--brand-gray)]">
                Visualiza ingresos, gastos y balance en tiempo real con gráficos claros
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--brand-cyan)]/10 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-[var(--brand-cyan)]" />
              </div>
              <h3 className="font-semibold mb-2">Previsión vs Realidad</h3>
              <p className="text-sm text-[var(--brand-gray)]">
                Compara tu presupuesto planificado con los gastos reales de cada categoría
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--success)]/10 flex items-center justify-center mb-4">
                <PiggyBank className="w-5 h-5 text-[var(--success)]" />
              </div>
              <h3 className="font-semibold mb-2">Metas de ahorro</h3>
              <p className="text-sm text-[var(--brand-gray)]">
                Crea metas personalizadas y sigue tu progreso con contribuciones
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--danger)]/10 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5 text-[var(--danger)]" />
              </div>
              <h3 className="font-semibold mb-2">Gestión de deudas</h3>
              <p className="text-sm text-[var(--brand-gray)]">
                Controla hipotecas, préstamos y tarjetas con seguimiento de pagos
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--warning)]/10 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <h3 className="font-semibold mb-2">Calendario financiero</h3>
              <p className="text-sm text-[var(--brand-gray)]">
                Ve tus operaciones organizadas por día en una vista de calendario
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--brand-purple)]/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-[var(--brand-purple)]" />
              </div>
              <h3 className="font-semibold mb-2">Regla 50/30/20</h3>
              <p className="text-sm text-[var(--brand-gray)]">
                Distribuye tus ingresos entre necesidades, deseos y ahorro automáticamente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-6 bg-[var(--background-secondary)]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            Próximamente
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Precios
          </h2>
          <p className="text-[var(--brand-gray)] mb-8">
            Estamos preparando diferentes planes para adaptarnos a tus necesidades.
            Si estás interesado en usar FinyBuddy, contacta con nosotros.
          </p>
          <a
            href="mailto:contacto@finybuddy.com"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background)] transition-colors"
          >
            Contactar
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBuddy"
                width={28}
                height={28}
              />
              <span className="font-semibold text-sm">FinyBuddy</span>
            </div>
            <p className="text-xs text-[var(--brand-gray)]">
              © {new Date().getFullYear()} FinyBuddy. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
