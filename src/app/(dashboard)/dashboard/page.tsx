"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  CreditCard,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { format, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Frases motivacionales financieras
const motivationalQuotes = [
  "El mejor momento para empezar a ahorrar fue ayer. El segundo mejor momento es hoy.",
  "No se trata de cuánto ganas, sino de cuánto conservas.",
  "Cada euro ahorrado es un paso más hacia tu libertad financiera.",
  "Los pequeños gastos vacían grandes bolsillos.",
  "Tu futuro yo te agradecerá las decisiones que tomes hoy.",
  "La riqueza no es tener mucho dinero, es tener muchas opciones.",
  "Presupuestar no es limitarte, es darte permiso para gastar sin culpa.",
  "El dinero es un buen sirviente, pero un mal amo.",
  "Invertir en ti mismo es la mejor inversión que puedes hacer.",
  "La disciplina financiera de hoy es la libertad de mañana.",
  "No gastes lo que queda después de ahorrar. Ahorra lo que queda después de gastar.",
  "Un presupuesto te dice a tu dinero a dónde ir, en lugar de preguntarte a dónde fue.",
  "La independencia financiera se construye un día a la vez.",
  "Cuida los céntimos y los euros se cuidarán solos.",
  "El éxito financiero no es un sprint, es un maratón.",
];

// Interfaces
interface MonthlySummary {
  total_income: number;
  total_expenses: number;
  total_savings: number;
  balance: number;
  needs_total: number;
  wants_total: number;
  savings_total: number;
}

interface SavingsSummary {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_target: number;
  total_saved: number;
  overall_progress: number;
}

interface DebtsSummary {
  total_debts: number;
  active_debts: number;
  paid_debts: number;
  total_original: number;
  total_remaining: number;
  overall_progress: number;
  total_monthly_payment: number;
}

interface RecentOperation {
  id: string;
  type: "income" | "expense" | "savings";
  amount: number;
  concept: string;
  operation_date: string;
  category?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface MonthlyEvolution {
  year: number;
  month: number;
  month_name: string;
  total_income: number;
  total_expenses: number;
  balance: number;
}

// Obtener frase del día basada en la fecha
const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
};

// Obtener saludo según la hora
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
};

export default function DashboardPage() {
  const { profile, loading: profileLoading, getFirstName } = useProfile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [savingsSummary, setSavingsSummary] = useState<SavingsSummary | null>(null);
  const [debtsSummary, setDebtsSummary] = useState<DebtsSummary | null>(null);
  const [recentOperations, setRecentOperations] = useState<RecentOperation[]>([]);
  const [monthlyEvolution, setMonthlyEvolution] = useState<MonthlyEvolution[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch monthly summary using RPC function
    const { data: summaryData } = await supabase.rpc("get_monthly_summary", {
      p_user_id: user.id,
      p_year: selectedYear,
      p_month: selectedMonth,
    });

    if (summaryData && summaryData.length > 0) {
      setMonthlySummary(summaryData[0]);
    } else {
      setMonthlySummary({
        total_income: 0,
        total_expenses: 0,
        total_savings: 0,
        balance: 0,
        needs_total: 0,
        wants_total: 0,
        savings_total: 0,
      });
    }

    // Fetch savings summary
    const { data: savingsData } = await supabase.rpc("get_savings_summary", {
      p_user_id: user.id,
    });

    if (savingsData && savingsData.length > 0) {
      setSavingsSummary(savingsData[0]);
    }

    // Fetch debts summary
    const { data: debtsData } = await supabase.rpc("get_debts_summary", {
      p_user_id: user.id,
    });

    if (debtsData && debtsData.length > 0) {
      setDebtsSummary(debtsData[0]);
    }

    // Fetch monthly evolution (last 6 months)
    const { data: evolutionData } = await supabase.rpc("get_monthly_evolution", {
      p_user_id: user.id,
      p_months: 6,
    });

    if (evolutionData) {
      setMonthlyEvolution(evolutionData);
    }

    // Fetch recent operations (last 5)
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];

    const { data: operationsData } = await supabase
      .from("operations")
      .select(`
        id,
        type,
        amount,
        concept,
        operation_date,
        category:categories(name, icon, color)
      `)
      .eq("user_id", user.id)
      .gte("operation_date", startDate)
      .lte("operation_date", endDate)
      .order("operation_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (operationsData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedOperations = operationsData.map((op: any) => ({
        ...op,
        category: Array.isArray(op.category) ? op.category[0] : op.category
      }));
      setRecentOperations(formattedOperations as RecentOperation[]);
    }

    setLoading(false);
  }, [selectedYear, selectedMonth, supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: profile?.currency || "EUR",
      minimumFractionDigits: profile?.show_decimals ? 2 : 0,
      maximumFractionDigits: profile?.show_decimals ? 2 : 0,
    }).format(amount);
  };

  const greeting = getGreeting();
  const firstName = getFirstName();
  const dailyQuote = getDailyQuote();

  // Calculate 50/30/20 percentages
  const totalIncome = monthlySummary?.total_income || 0;
  const needsPercent = totalIncome > 0 ? ((monthlySummary?.needs_total || 0) / totalIncome) * 100 : 0;
  const wantsPercent = totalIncome > 0 ? ((monthlySummary?.wants_total || 0) / totalIncome) * 100 : 0;
  const savingsPercent = totalIncome > 0 ? ((monthlySummary?.savings_total || 0) / totalIncome) * 100 : 0;

  // Get progress bar color based on rule compliance
  const getProgressColor = (current: number, target: number, isInverse: boolean = false) => {
    if (isInverse) {
      // For needs/wants: under target is good
      if (current <= target) return "bg-[var(--success)]";
      if (current <= target * 1.1) return "bg-[var(--warning)]";
      return "bg-[var(--danger)]";
    } else {
      // For savings: meeting/exceeding target is good
      if (current >= target) return "bg-[var(--success)]";
      if (current >= target * 0.8) return "bg-[var(--warning)]";
      return "bg-[var(--danger)]";
    }
  };

  // Data for pie chart
  const pieData = [
    { name: "Necesidades", value: monthlySummary?.needs_total || 0, color: "#10b981" },
    { name: "Deseos", value: monthlySummary?.wants_total || 0, color: "#f59e0b" },
    { name: "Ahorro", value: monthlySummary?.savings_total || 0, color: "#8b5cf6" },
  ].filter(item => item.value > 0);

  // Data for bar chart
  const barData = monthlyEvolution.map(item => ({
    name: item.month_name,
    Ingresos: item.total_income,
    Gastos: item.total_expenses,
  }));

  const handlePreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedDate, 1);
    if (nextMonth <= new Date()) {
      setSelectedDate(nextMonth);
    }
  };

  const typeConfig = {
    income: { label: "Ingreso", icon: TrendingUp, color: "text-[var(--success)]", bg: "bg-[var(--success)]/10" },
    expense: { label: "Gasto", icon: TrendingDown, color: "text-[var(--danger)]", bg: "bg-[var(--danger)]/10" },
    savings: { label: "Ahorro", icon: Wallet, color: "text-[var(--brand-cyan)]", bg: "bg-[var(--brand-cyan)]/10" },
  };

  return (
    <>
      <Header
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        subtitle="Bienvenido a tu Dashboard Financiero"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--background-secondary)]">
              <Calendar className="w-4 h-4 text-[var(--brand-gray)]" />
              <span className="font-medium capitalize">
                {format(selectedDate, "MMMM yyyy", { locale: es })}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={addMonths(selectedDate, 1) > new Date()}
              className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Frase motivacional */}
        <div className="card p-4 bg-gradient-to-r from-[var(--brand-purple)]/10 to-[var(--brand-cyan)]/10 border-[var(--brand-purple)]/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--brand-purple)]/20">
              <Sparkles className="w-5 h-5 text-[var(--brand-purple)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--brand-purple)] mb-1">
                Frase del día
              </p>
              <p className="text-[var(--foreground)] italic">
                "{dailyQuote}"
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Ingresos */}
          <div className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--brand-gray)] mb-1">Ingresos del mes</p>
                <p className="text-2xl font-bold text-[var(--success)]">
                  {loading ? "..." : formatCurrency(monthlySummary?.total_income || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--success)]/10">
                <TrendingUp className="w-6 h-6 text-[var(--success)]" />
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--brand-gray)] mb-1">Gastos del mes</p>
                <p className="text-2xl font-bold text-[var(--danger)]">
                  {loading ? "..." : formatCurrency(monthlySummary?.total_expenses || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--danger)]/10">
                <TrendingDown className="w-6 h-6 text-[var(--danger)]" />
              </div>
            </div>
          </div>

          {/* Ahorro */}
          <div className="kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--brand-gray)] mb-1">Ahorro del mes</p>
                <p className="text-2xl font-bold text-[var(--brand-cyan)]">
                  {loading ? "..." : formatCurrency(monthlySummary?.total_savings || 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--brand-cyan)]/10">
                <PiggyBank className="w-6 h-6 text-[var(--brand-cyan)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regla 50/30/20 */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">
              Regla {profile?.rule_needs_percent || 50}/{profile?.rule_wants_percent || 30}/{profile?.rule_savings_percent || 20}
            </h3>
            <div className="space-y-4">
              {/* Necesidades */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Necesidades</span>
                  <span className="text-sm text-[var(--brand-gray)]">
                    {Math.round(needsPercent)}% / {profile?.rule_needs_percent || 50}%
                  </span>
                </div>
                <div className="progress-bar h-3">
                  <div
                    className={`progress-bar-fill ${getProgressColor(needsPercent, profile?.rule_needs_percent || 50, true)}`}
                    style={{ width: `${Math.min(needsPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--brand-gray)] mt-1">
                  {formatCurrency(monthlySummary?.needs_total || 0)}
                </p>
              </div>

              {/* Deseos */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Deseos</span>
                  <span className="text-sm text-[var(--brand-gray)]">
                    {Math.round(wantsPercent)}% / {profile?.rule_wants_percent || 30}%
                  </span>
                </div>
                <div className="progress-bar h-3">
                  <div
                    className={`progress-bar-fill ${getProgressColor(wantsPercent, profile?.rule_wants_percent || 30, true)}`}
                    style={{ width: `${Math.min(wantsPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--brand-gray)] mt-1">
                  {formatCurrency(monthlySummary?.wants_total || 0)}
                </p>
              </div>

              {/* Ahorro */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Ahorro</span>
                  <span className="text-sm text-[var(--brand-gray)]">
                    {Math.round(savingsPercent)}% / {profile?.rule_savings_percent || 20}%
                  </span>
                </div>
                <div className="progress-bar h-3">
                  <div
                    className={`progress-bar-fill ${getProgressColor(savingsPercent, profile?.rule_savings_percent || 20, false)}`}
                    style={{ width: `${Math.min(savingsPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--brand-gray)] mt-1">
                  {formatCurrency(monthlySummary?.savings_total || 0)}
                </p>
              </div>
            </div>

            {/* Pie Chart */}
            {pieData.length > 0 && (
              <div className="mt-6 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Últimas operaciones */}
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Últimas operaciones</h3>
              <Link
                href="/operaciones"
                className="text-sm text-[var(--brand-cyan)] hover:underline"
              >
                Ver todas
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-[var(--brand-gray)]">Cargando...</p>
              </div>
            ) : recentOperations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--background-secondary)] flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-[var(--brand-gray)]" />
                </div>
                <p className="text-[var(--brand-gray)] mb-2">No hay operaciones registradas</p>
                <p className="text-sm text-[var(--brand-gray)]">
                  Registra tu primera operación para empezar a controlar tus finanzas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOperations.map((operation) => {
                  const config = typeConfig[operation.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={operation.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{operation.concept}</p>
                        <div className="flex items-center gap-2 text-sm text-[var(--brand-gray)]">
                          <span>{format(new Date(operation.operation_date), "d MMM", { locale: es })}</span>
                          {operation.category && (
                            <>
                              <span>·</span>
                              <span style={{ color: operation.category.color }}>
                                {operation.category.icon} {operation.category.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`font-semibold ${config.color}`}>
                        {operation.type === "expense" ? "-" : "+"}{formatCurrency(operation.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Evolución Mensual Chart */}
        {barData.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Evolución mensual</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--brand-gray)" />
                  <YAxis stroke="var(--brand-gray)" tickFormatter={(value) => `${value}€`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metas de ahorro */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Metas de ahorro</h3>
              <Link
                href="/ahorro"
                className="text-sm text-[var(--brand-cyan)] hover:underline"
              >
                Ver todas
              </Link>
            </div>
            {savingsSummary && savingsSummary.total_goals > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--brand-purple)]/10">
                      <Target className="w-5 h-5 text-[var(--brand-purple)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{savingsSummary.active_goals}</p>
                      <p className="text-sm text-[var(--brand-gray)]">metas activas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[var(--brand-purple)]">
                      {Math.round(savingsSummary.overall_progress)}%
                    </p>
                    <p className="text-sm text-[var(--brand-gray)]">progreso total</p>
                  </div>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="progress-bar-fill bg-[var(--brand-purple)]"
                    style={{ width: `${Math.min(savingsSummary.overall_progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-[var(--brand-gray)]">
                  <span>Ahorrado: {formatCurrency(savingsSummary.total_saved)}</span>
                  <span>Meta: {formatCurrency(savingsSummary.total_target)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--background-secondary)] flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-[var(--brand-gray)]" />
                </div>
                <p className="text-sm text-[var(--brand-gray)]">No hay metas de ahorro</p>
              </div>
            )}
          </div>

          {/* Deudas */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mis deudas</h3>
              <Link
                href="/deuda"
                className="text-sm text-[var(--brand-cyan)] hover:underline"
              >
                Ver todas
              </Link>
            </div>
            {debtsSummary && debtsSummary.total_debts > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--danger)]/10">
                      <CreditCard className="w-5 h-5 text-[var(--danger)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{debtsSummary.active_debts}</p>
                      <p className="text-sm text-[var(--brand-gray)]">deudas activas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[var(--success)]">
                      {Math.round(debtsSummary.overall_progress)}%
                    </p>
                    <p className="text-sm text-[var(--brand-gray)]">pagado</p>
                  </div>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="progress-bar-fill bg-[var(--success)]"
                    style={{ width: `${Math.min(debtsSummary.overall_progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-[var(--brand-gray)]">
                  <span>Pendiente: {formatCurrency(debtsSummary.total_remaining)}</span>
                  <span>Total: {formatCurrency(debtsSummary.total_original)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--background-secondary)] flex items-center justify-center mb-3">
                  <CreditCard className="w-6 h-6 text-[var(--brand-gray)]" />
                </div>
                <p className="text-sm text-[var(--brand-gray)]">No hay deudas registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
