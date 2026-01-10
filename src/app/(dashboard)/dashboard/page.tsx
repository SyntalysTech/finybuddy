"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
  "No ahorres lo que te queda después de gastar. Gasta lo que te queda después de ahorrar.",
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
  total_savings: number;
  balance: number;
}

interface BudgetSummary {
  total_budgeted_income: number;
  total_budgeted_expenses: number;
  total_budgeted_savings: number;
}

// Obtener frase del día basada en la fecha
const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
};

// Obtener saludo según la hora (horario español)
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 20) return "Buenas tardes";
  return "Buenas noches"; // 20:00 - 05:59
};

// Frase contextual dinámica basada en los datos del mes
const getContextualPhrase = (
  summary: MonthlySummary | null,
  savingsSummary: SavingsSummary | null,
  debtsSummary: DebtsSummary | null
): string => {
  if (!summary) return "Cargando tus datos financieros...";

  const { total_income, total_expenses, total_savings, balance } = summary;

  // Si no hay datos
  if (total_income === 0 && total_expenses === 0 && total_savings === 0) {
    return "Empieza a registrar tus operaciones para ver tu progreso financiero";
  }

  // Balance positivo alto
  if (balance > 0 && balance >= total_income * 0.3) {
    return "Excelente mes: estás ahorrando más del 30% de tus ingresos";
  }

  // Balance positivo moderado
  if (balance > 0 && balance >= total_income * 0.2) {
    return "Buen ritmo: tu balance es positivo y vas por buen camino";
  }

  // Balance positivo pero bajo
  if (balance > 0 && balance < total_income * 0.1) {
    return "Cuidado: tu margen de ahorro este mes es muy ajustado";
  }

  // Balance negativo
  if (balance < 0) {
    return "Atención: tus gastos superan tus ingresos este mes";
  }

  // Ahorro destacado
  if (total_savings > 0 && total_savings >= total_income * 0.2) {
    return "Gran trabajo ahorrando: superas el 20% de tus ingresos";
  }

  // Meta de ahorro cerca
  if (savingsSummary && savingsSummary.overall_progress >= 90 && savingsSummary.overall_progress < 100) {
    return "Casi alcanzas tu meta de ahorro, sigue así";
  }

  // Deudas casi pagadas
  if (debtsSummary && debtsSummary.overall_progress >= 90 && debtsSummary.active_debts > 0) {
    return "Estás muy cerca de saldar tus deudas, último esfuerzo";
  }

  // Default
  return "Sigue controlando tus finanzas para alcanzar tus metas";
};

export default function DashboardPage() {
  const { profile, loading: profileLoading, getFirstName } = useProfile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [savingsSummary, setSavingsSummary] = useState<SavingsSummary | null>(null);
  const [debtsSummary, setDebtsSummary] = useState<DebtsSummary | null>(null);
  const [recentOperations, setRecentOperations] = useState<RecentOperation[]>([]);
  const [monthlyEvolution, setMonthlyEvolution] = useState<MonthlyEvolution[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
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

    // Fetch budget summary for the month
    const { data: budgetsData } = await supabase
      .from("budgets")
      .select(`
        amount,
        category:categories(type, segment)
      `)
      .eq("user_id", user.id)
      .eq("year", selectedYear)
      .eq("month", selectedMonth);

    if (budgetsData) {
      let totalBudgetedExpenses = 0;
      let totalBudgetedSavings = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      budgetsData.forEach((budget: any) => {
        const category = Array.isArray(budget.category) ? budget.category[0] : budget.category;
        if (category?.segment === 'savings') {
          totalBudgetedSavings += budget.amount || 0;
        } else {
          totalBudgetedExpenses += budget.amount || 0;
        }
      });

      setBudgetSummary({
        total_budgeted_income: 0, // No se presupuestan ingresos
        total_budgeted_expenses: totalBudgetedExpenses,
        total_budgeted_savings: totalBudgetedSavings,
      });
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
  const contextualPhrase = getContextualPhrase(monthlySummary, savingsSummary, debtsSummary);

  // FinyBuddy interpretation based on financial data - Estilo "Colega Crack"
  const getFinyBuddyMessage = () => {
    if (!monthlySummary) return null;

    const { total_income, total_expenses, needs_total, wants_total, savings_total } = monthlySummary;
    const balance = total_income - total_expenses;
    const ruleNeeds = profile?.rule_needs_percent ?? 50;
    const ruleWants = profile?.rule_wants_percent ?? 30;
    const ruleSavings = profile?.rule_savings_percent ?? 20;

    const messages: string[] = [];

    // Analyze income vs expenses
    if (balance < 0) {
      messages.push(`Ojo, este mes vas ${Math.abs(balance).toLocaleString("es-ES")} pavos en rojo. Toca recortar algo.`);
    } else if (balance > total_income * 0.3) {
      messages.push(`Vas muy bien, tienes ${balance.toLocaleString("es-ES")}e de margen. Mete algo a ahorro antes de que vuele.`);
    } else if (balance > 0) {
      messages.push(`Balance positivo de ${balance.toLocaleString("es-ES")}e. Vas muy bien.`);
    }

    // Analyze rule compliance
    if (total_income > 0) {
      const needsActualPercent = (needs_total / total_income) * 100;
      const wantsActualPercent = (wants_total / total_income) * 100;
      const savingsActualPercent = (savings_total / total_income) * 100;

      if (needsActualPercent > ruleNeeds * 1.2) {
        const excess = Math.round(needsActualPercent - ruleNeeds);
        messages.push(`Los gastos fijos se te van un ${excess}% por encima. Revisa si hay algo recortable.`);
      }
      if (wantsActualPercent > ruleWants * 1.2) {
        const excess = Math.round(wantsActualPercent - ruleWants);
        messages.push(`Te has pasado con el ocio: +${excess}% del objetivo. A ver si aguantamos lo que queda de mes.`);
      }
      if (savingsActualPercent < ruleSavings * 0.5 && total_income > 0) {
        messages.push("El ahorro va flojo. Intenta meter aunque sea 50 pavos este mes.");
      } else if (savingsActualPercent >= ruleSavings) {
        messages.push("Ahorro muy bien cubierto. Buen trabajo.");
      }
    }

    // Check savings goals
    if (savingsSummary && savingsSummary.active_goals > 0) {
      if (savingsSummary.overall_progress >= 90 && savingsSummary.overall_progress < 100) {
        messages.push(`Metas de ahorro al ${savingsSummary.overall_progress}%. Un ultimo empujon mas y lo clavas.`);
      } else if (savingsSummary.overall_progress < 30) {
        messages.push("Las metas van flojas. Necesitan mas chicha.");
      }
    }

    // Check debts
    if (debtsSummary && debtsSummary.active_debts > 0) {
      if (debtsSummary.overall_progress >= 80) {
        messages.push(`Deudas al ${debtsSummary.overall_progress}%. Casi lo tienes, no aflojes ahora.`);
      } else if (debtsSummary.overall_progress < 20) {
        messages.push("Las deudas van lentas. Prioriza pagarlas para quitarte intereses de encima.");
      }
    }

    return messages.length > 0 ? messages : ["Todo controlado, sigue asi."];
  };

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

  // Data for bar chart - using real savings from operations
  const barData = monthlyEvolution.map(item => ({
    name: item.month_name,
    Ingresos: item.total_income,
    Gastos: item.total_expenses,
    Ahorro: item.total_savings || 0,
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
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--background-secondary)]">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-gray)] hidden sm:block" />
              <span className="text-xs sm:text-sm font-medium capitalize">
                {format(selectedDate, "MMM yyyy", { locale: es })}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={addMonths(selectedDate, 1) > new Date()}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Frase contextual dinámica con mascota */}
        <div className="glass-brand p-3 sm:p-4 rounded-xl sm:rounded-2xl animate-slide-in-down">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="animate-float-slow flex-shrink-0">
              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBuddy"
                width={40}
                height={40}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-[var(--brand-purple)] mb-1 animate-fade-in">
                {loading ? "Analizando tus datos..." : contextualPhrase}
              </p>
              <p className="text-xs sm:text-sm text-[var(--brand-gray)] italic line-clamp-2">
                "{dailyQuote}"
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Ingresos */}
          <div className="kpi-glass hover-lift animate-slide-in-up stagger-1 !p-4 sm:!p-6">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-[var(--brand-gray)] mb-1">Ingresos del mes</p>
                <p className="text-xl sm:text-2xl font-bold text-[var(--success)] animate-count truncate">
                  {loading ? "..." : formatCurrency(monthlySummary?.total_income || 0)}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--success)]/10 hover-scale flex-shrink-0 ml-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--success)]" />
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="kpi-glass hover-lift animate-slide-in-up stagger-2 !p-4 sm:!p-6">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-[var(--brand-gray)] mb-1">Gastos del mes</p>
                <p className="text-xl sm:text-2xl font-bold text-[var(--danger)] animate-count truncate">
                  {loading ? "..." : formatCurrency(monthlySummary?.total_expenses || 0)}
                </p>
                {!loading && budgetSummary && budgetSummary.total_budgeted_expenses > 0 && (
                  <p className={`text-xs mt-1 ${
                    (monthlySummary?.total_expenses || 0) > budgetSummary.total_budgeted_expenses
                      ? "text-[var(--danger)]"
                      : "text-[var(--success)]"
                  }`}>
                    {(monthlySummary?.total_expenses || 0) > budgetSummary.total_budgeted_expenses
                      ? `+${formatCurrency((monthlySummary?.total_expenses || 0) - budgetSummary.total_budgeted_expenses)} vs plan`
                      : `${formatCurrency(budgetSummary.total_budgeted_expenses - (monthlySummary?.total_expenses || 0))} bajo plan`
                    }
                  </p>
                )}
              </div>
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--danger)]/10 hover-scale flex-shrink-0 ml-2">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--danger)]" />
              </div>
            </div>
          </div>

          {/* Ahorro */}
          <div className="kpi-glass hover-lift animate-slide-in-up stagger-3 !p-4 sm:!p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-[var(--brand-gray)] mb-1">Ahorro del mes</p>
                <p className="text-xl sm:text-2xl font-bold text-[var(--brand-cyan)] animate-count truncate">
                  {loading ? "..." : formatCurrency(monthlySummary?.total_savings || 0)}
                </p>
                {!loading && budgetSummary && budgetSummary.total_budgeted_savings > 0 && (
                  <p className={`text-xs mt-1 ${
                    (monthlySummary?.total_savings || 0) >= budgetSummary.total_budgeted_savings
                      ? "text-[var(--success)]"
                      : "text-[var(--warning)]"
                  }`}>
                    {(monthlySummary?.total_savings || 0) >= budgetSummary.total_budgeted_savings
                      ? `+${formatCurrency((monthlySummary?.total_savings || 0) - budgetSummary.total_budgeted_savings)} vs plan`
                      : `${formatCurrency(budgetSummary.total_budgeted_savings - (monthlySummary?.total_savings || 0))} bajo plan`
                    }
                  </p>
                )}
              </div>
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--brand-cyan)]/10 animate-piggy flex-shrink-0 ml-2">
                <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--brand-cyan)]" />
              </div>
            </div>
          </div>
        </div>


        {/* Evolución Mensual Chart - 3 barras por mes */}
        {barData.length > 0 && (
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Evolución mensual (últimos 6 meses)</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--brand-gray)"
                    tick={{ fontSize: 10 }}
                    tickMargin={5}
                  />
                  <YAxis
                    stroke="var(--brand-gray)"
                    tickFormatter={(value) => `${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}€`}
                    tick={{ fontSize: 10 }}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                  <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Ahorro" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Cumplimiento Regla + FinyBuddy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Cumplimiento Regla - Solo 3 barras de progreso */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              Regla {profile?.rule_needs_percent ?? 50}/{profile?.rule_wants_percent ?? 30}/{profile?.rule_savings_percent ?? 20}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {/* Necesidades */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium">Necesidades</span>
                  <span className="text-xs sm:text-sm text-[var(--brand-gray)]">
                    {Math.round(needsPercent)}% / {profile?.rule_needs_percent ?? 50}%
                  </span>
                </div>
                <div className="progress-bar h-2 sm:h-3">
                  <div
                    className={`progress-bar-fill ${getProgressColor(needsPercent, profile?.rule_needs_percent ?? 50, true)}`}
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
                  <span className="text-xs sm:text-sm font-medium">Deseos</span>
                  <span className="text-xs sm:text-sm text-[var(--brand-gray)]">
                    {Math.round(wantsPercent)}% / {profile?.rule_wants_percent ?? 30}%
                  </span>
                </div>
                <div className="progress-bar h-2 sm:h-3">
                  <div
                    className={`progress-bar-fill ${getProgressColor(wantsPercent, profile?.rule_wants_percent ?? 30, true)}`}
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
                  <span className="text-xs sm:text-sm font-medium">Ahorro</span>
                  <span className="text-xs sm:text-sm text-[var(--brand-gray)]">
                    {Math.round(savingsPercent)}% / {profile?.rule_savings_percent ?? 20}%
                  </span>
                </div>
                <div className="progress-bar h-2 sm:h-3">
                  <div
                    className={`progress-bar-fill ${getProgressColor(savingsPercent, profile?.rule_savings_percent ?? 20, false)}`}
                    style={{ width: `${Math.min(savingsPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--brand-gray)] mt-1">
                  {formatCurrency(monthlySummary?.savings_total || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* FinyBuddy Interpretation Panel */}
          <div className="glass-brand rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-slide-in-right">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="animate-bounce-subtle flex-shrink-0">
                <Image
                  src="/assets/finybuddy-mascot.png"
                  alt="FinyBuddy"
                  width={40}
                  height={40}
                  className="rounded-full w-10 h-10 sm:w-12 sm:h-12"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold animate-gradient-text">FinyBuddy</h3>
                <p className="text-xs text-[var(--brand-gray)]">Tu asistente financiero</p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-cyan)] animate-sparkle" />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--brand-cyan)] animate-typing-dot"></span>
                  <span className="w-2 h-2 rounded-full bg-[var(--brand-cyan)] animate-typing-dot"></span>
                  <span className="w-2 h-2 rounded-full bg-[var(--brand-cyan)] animate-typing-dot"></span>
                  <span className="text-xs sm:text-sm text-[var(--brand-gray)] ml-2">Analizando...</span>
                </div>
              ) : (
                getFinyBuddyMessage()?.map((message, index) => (
                  <div key={index} className={`flex items-start gap-2 animate-slide-in-left stagger-${index + 1}`}>
                    <span className="text-[var(--brand-cyan)] mt-0.5 animate-pulse flex-shrink-0">•</span>
                    <p className="text-xs sm:text-sm text-[var(--foreground)]">{message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Metas de ahorro */}
          <div className="card-glass p-4 sm:p-6 hover-lift animate-slide-in-left">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Metas de ahorro</h3>
              <Link
                href="/ahorro"
                className="text-xs sm:text-sm text-[var(--brand-cyan)] hover:underline hover-glow rounded px-2 py-1 transition-all"
              >
                Ver todas
              </Link>
            </div>
            {savingsSummary && savingsSummary.total_goals > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--brand-purple)]/10 hover-scale animate-pulse-ring">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-purple)]" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold animate-count">{savingsSummary.active_goals}</p>
                      <p className="text-xs sm:text-sm text-[var(--brand-gray)]">metas activas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-semibold text-[var(--brand-purple)] animate-count">
                      {Math.round(savingsSummary.overall_progress)}%
                    </p>
                    <p className="text-xs sm:text-sm text-[var(--brand-gray)]">progreso total</p>
                  </div>
                </div>
                <div className="progress-bar h-1.5 sm:h-2 overflow-hidden">
                  <div
                    className="progress-bar-fill bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] animate-shimmer"
                    style={{ width: `${Math.min(savingsSummary.overall_progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-[var(--brand-gray)]">
                  <span className="truncate mr-2">Ahorrado: {formatCurrency(savingsSummary.total_saved)}</span>
                  <span className="truncate">Meta: {formatCurrency(savingsSummary.total_target)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--background-secondary)] flex items-center justify-center mb-2 sm:mb-3 animate-bounce-subtle">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--brand-gray)]" />
                </div>
                <p className="text-xs sm:text-sm text-[var(--brand-gray)]">No hay metas de ahorro</p>
              </div>
            )}
          </div>

          {/* Deudas */}
          <div className="card-glass p-4 sm:p-6 hover-lift animate-slide-in-right">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Mis deudas</h3>
              <Link
                href="/deuda"
                className="text-xs sm:text-sm text-[var(--brand-cyan)] hover:underline hover-glow rounded px-2 py-1 transition-all"
              >
                Ver todas
              </Link>
            </div>
            {debtsSummary && debtsSummary.total_debts > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--danger)]/10 hover-scale">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--danger)]" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold animate-count">{debtsSummary.active_debts}</p>
                      <p className="text-xs sm:text-sm text-[var(--brand-gray)]">deudas activas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-semibold text-[var(--success)] animate-count">
                      {Math.round(debtsSummary.overall_progress)}%
                    </p>
                    <p className="text-xs sm:text-sm text-[var(--brand-gray)]">pagado</p>
                  </div>
                </div>
                <div className="progress-bar h-1.5 sm:h-2 overflow-hidden">
                  <div
                    className="progress-bar-fill bg-gradient-to-r from-[var(--warning)] to-[var(--success)]"
                    style={{ width: `${Math.min(debtsSummary.overall_progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-[var(--brand-gray)]">
                  <span className="truncate mr-2">Pendiente: {formatCurrency(debtsSummary.total_remaining)}</span>
                  <span className="truncate">Total: {formatCurrency(debtsSummary.total_original)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--background-secondary)] flex items-center justify-center mb-2 sm:mb-3">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--brand-gray)]" />
                </div>
                <p className="text-xs sm:text-sm text-[var(--brand-gray)]">No hay deudas registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
