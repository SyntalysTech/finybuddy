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
  Shield,
  Rocket,
  Zap,
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
  PieChart,
  Pie,
  Cell,
  Sector,
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

interface CategoryDistribution {
  id: string;
  name: string;
  color: string;
  amount: number;
  segment: "needs" | "wants" | "savings";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
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
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<"needs" | "wants" | "savings" | null>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const supabase = createClient();

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;

  const fetchDashboardData = useCallback(async () => {
    // setLoading(true); // Removido para evitar parpadeo y pérdida de scroll
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
      let totalBudgetedIncome = 0;
      let totalBudgetedExpenses = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      budgetsData.forEach((budget: any) => {
        const category = Array.isArray(budget.category) ? budget.category[0] : budget.category;
        if (category?.type === 'income') {
          totalBudgetedIncome += budget.amount || 0;
        } else if (category?.type === 'expense') {
          totalBudgetedExpenses += budget.amount || 0;
        }
      });

      // Obtener ahorro previsto de planned_savings (como en Previsión)
      const { data: plannedSavingsData } = await supabase
        .from("planned_savings")
        .select("amount")
        .eq("user_id", user.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth)
        .single();

      setBudgetSummary({
        total_budgeted_income: totalBudgetedIncome,
        total_budgeted_expenses: totalBudgetedExpenses,
        total_budgeted_savings: plannedSavingsData?.amount || 0,
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

    // Fetch all for category distribution
    const { data: allOpsData } = await supabase
      .from("operations")
      .select(`
        type,
        amount,
        category:categories(id, name, color, segment, type)
      `)
      .eq("user_id", user.id)
      .gte("operation_date", startDate)
      .lte("operation_date", endDate);

    if (allOpsData) {
      const merged: Record<string, CategoryDistribution> = {};

      // Procesar gastos y ahorros para el gráfico de distribución
      allOpsData.forEach((op: any) => {
        const cat = Array.isArray(op.category) ? op.category[0] : op.category;

        // Si es ahorro, se agrupa siempre en el segmento de ahorro
        if (op.type === "savings") {
          const savingsId = "savings-total";
          if (!merged[savingsId]) {
            merged[savingsId] = {
              id: savingsId,
              name: "Ahorro",
              color: "#02EAFF", // Cyan FinyBuddy
              amount: 0,
              segment: "savings"
            };
          }
          merged[savingsId].amount += op.amount;
        }
        // Si es gasto, se agrupa por categoría y segmento (necesidades/deseos)
        else if (op.type === "expense") {
          if (!cat) return;
          // Normalizar segmento para evitar fallos (trim y lowercase)
          let segment = (cat.segment || "needs").trim().toLowerCase();
          if (segment !== "needs" && segment !== "wants" && segment !== "savings") {
            segment = "needs"; // Default de seguridad
          }

          if (!merged[cat.id]) {
            // Asignar el color base según el segmento para garantizar coherencia
            const segmentColor = segment === "needs" ? "#2EEB8F" : (segment === "wants" ? "#8B4DFF" : "#02EAFF");

            merged[cat.id] = {
              id: cat.id,
              name: cat.name,
              // Forzamos el color del segmento si no hay uno muy específico, 
              // para evitar el error del "morado" en necesidades.
              color: cat.color || segmentColor,
              amount: 0,
              segment: segment as "needs" | "wants" | "savings"
            };
          }
          merged[cat.id].amount += op.amount;
        }
      });

      setCategoryDistribution(Object.values(merged).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount));
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

  // Finy interpretation based on financial data - Tono cercano y educativo
  const getFinyMessage = () => {
    if (!monthlySummary) return null;

    const { total_income, total_expenses, total_savings, needs_total, wants_total, savings_total } = monthlySummary;
    const balance = total_income - total_expenses - total_savings;
    const ruleNeeds = profile?.rule_needs_percent ?? 50;
    const ruleWants = profile?.rule_wants_percent ?? 30;
    const ruleSavings = profile?.rule_savings_percent ?? 20;

    const messages: string[] = [];

    // Analyze income vs expenses
    if (balance < 0) {
      messages.push(`Este mes los gastos superan a los ingresos en ${formatCurrency(Math.abs(balance))}. Conviene revisar dónde puedes ajustar.`);
    } else if (balance > total_income * 0.3) {
      messages.push(`Tienes ${formatCurrency(balance)} de margen este mes. Buen momento para destinar parte al ahorro.`);
    } else if (balance > 0) {
      messages.push(`Balance positivo de ${formatCurrency(balance)}. Vas por buen camino.`);
    }

    // Analyze rule compliance
    if (total_income > 0) {
      const needsActualPercent = (needs_total / total_income) * 100;
      const wantsActualPercent = (wants_total / total_income) * 100;
      const savingsActualPercent = (savings_total / total_income) * 100;

      if (needsActualPercent > ruleNeeds * 1.2) {
        const excess = Math.round(needsActualPercent - ruleNeeds);
        messages.push(`Las necesidades están un ${excess}% por encima del objetivo. Revisa si hay algún gasto recortable.`);
      }
      if (wantsActualPercent > ruleWants * 1.2) {
        const excess = Math.round(wantsActualPercent - ruleWants);
        messages.push(`Los deseos superan el objetivo en un ${excess}%. Puede ser buena idea moderar los siguientes días.`);
      }
      if (savingsActualPercent < ruleSavings * 0.5 && total_income > 0) {
        messages.push("El ahorro va por debajo de lo esperado. Cualquier aportación, por pequeña que sea, suma.");
      } else if (savingsActualPercent >= ruleSavings) {
        messages.push("Ahorro bien cubierto este mes. Buen trabajo.");
      }
    }

    // Check savings goals
    if (savingsSummary && savingsSummary.active_goals > 0) {
      if (savingsSummary.overall_progress >= 90 && savingsSummary.overall_progress < 100) {
        messages.push(`Metas de ahorro al ${savingsSummary.overall_progress}%. Ya casi lo consigues.`);
      } else if (savingsSummary.overall_progress < 30) {
        messages.push("Las metas de ahorro avanzan despacio. Puedes revisarlas cuando quieras.");
      }
    }

    // Check debts
    if (debtsSummary && debtsSummary.active_debts > 0) {
      if (debtsSummary.overall_progress >= 80) {
        messages.push(`Deudas al ${debtsSummary.overall_progress}% pagadas. Ya casi las eliminas.`);
      } else if (debtsSummary.overall_progress < 20) {
        messages.push("Las deudas avanzan despacio. Priorizar los pagos puede reducir el coste total en intereses.");
      }
    }

    return messages.length > 0 ? messages : ["Todo controlado por ahora. Sigue así."];
  };

  // Data for bar chart - using real savings from operations
  const barData = monthlyEvolution.map(item => ({
    name: item.month_name,
    Ingresos: item.total_income,
    Gastos: item.total_expenses,
    Ahorro: item.total_savings || 0,
  }));

  // Helper variables para el super gráfico
  const innerData = [
    { name: "Necesidades", value: monthlySummary?.needs_total || 0, color: "#2EEB8F", segment: "needs" },
    { name: "Deseos", value: monthlySummary?.wants_total || 0, color: "#8B4DFF", segment: "wants" },
    { name: "Ahorro", value: monthlySummary?.total_savings || 0, color: "#02EAFF", segment: "savings" },
  ].filter(item => item.value > 0);

  const totalDistAmount = innerData.reduce((acc, curr) => acc + curr.value, 0);

  // Datos activos para mostrar: Por defecto Macros, si seleccionamos uno, mostramos su detalle
  const displayData = selectedSegment
    ? categoryDistribution
      .filter(c => c.segment === selectedSegment)
      .map((c, idx, arr) => {
        // Si estamos en drill-down, forzamos una coherencia cromática para que sea "el mejor gráfico"
        // Mantenemos el color de la DB si existe, si no, generamos variaciones del color base del segmento
        const baseColor = selectedSegment === "needs" ? "#2EEB8F" : (selectedSegment === "wants" ? "#8B4DFF" : "#02EAFF");

        // Generamos una variación elegante del color base (gradiente visual)
        // Esto soluciona que aparezcan categorías "moradas" dentro de Necesidades (Verde)
        const step = 0.4 / Math.max(arr.length, 1);
        const opacityVal = 1 - (idx * step);
        const opacityHex = Math.round(opacityVal * 255).toString(16).padStart(2, '0');

        return {
          name: c.name,
          value: c.amount,
          // Si la categoría tiene un color propio y es del mismo "tono" lo respetamos, 
          // si no, forzamos un matiz del color del segmento para que sea Pura Delicia Visual.
          color: selectedSegment === "needs" && !c.color?.startsWith('#2E') ? `${baseColor}${opacityHex}` :
            selectedSegment === "wants" && !c.color?.startsWith('#8B') ? `${baseColor}${opacityHex}` :
              c.color || baseColor,
          segment: c.segment,
          isSub: true,
          glowColor: baseColor
        };
      })
    : innerData;

  const currentTotal = displayData.reduce((acc, curr) => acc + curr.value, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PieWithProps = Pie as React.ElementType<any>;

  // Renderizador simplificado para hover
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 12}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={fill}
          strokeWidth={2}
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 12px ${fill}40)`,
          }}
        />
      </g>
    );
  };

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
        <div className="glass-brand p-3 sm:p-4 rounded-xl sm:rounded-2xl animate-slide-in-down relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[var(--brand-cyan)]/8 to-transparent rounded-br-full pointer-events-none" />
          <div className="flex items-center gap-2.5 sm:gap-3 relative">
            <div className="animate-float-slow flex-shrink-0">
              <Image
                src="/assets/finy-mascota-minimalista.png"
                alt="FinyBuddy"
                width={40}
                height={40}
                className="rounded-xl w-9 h-9 sm:w-11 sm:h-11 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-[var(--brand-cyan)] mb-0.5 animate-fade-in leading-tight">
                {loading ? "Analizando tus datos..." : contextualPhrase}
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--brand-gray)] italic line-clamp-2 leading-relaxed">
                &ldquo;{dailyQuote}&rdquo;
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
                {!loading && budgetSummary && budgetSummary.total_budgeted_income > 0 && (
                  <p className={`text-xs mt-1 ${(monthlySummary?.total_income || 0) >= budgetSummary.total_budgeted_income
                    ? "text-[var(--success)]"
                    : "text-[var(--warning)]"
                    }`}>
                    {(monthlySummary?.total_income || 0) >= budgetSummary.total_budgeted_income
                      ? `+${formatCurrency((monthlySummary?.total_income || 0) - budgetSummary.total_budgeted_income)} vs previsión`
                      : `-${formatCurrency(budgetSummary.total_budgeted_income - (monthlySummary?.total_income || 0))} vs previsión`
                    }
                  </p>
                )}
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
                  <p className={`text-xs mt-1 ${(monthlySummary?.total_expenses || 0) > budgetSummary.total_budgeted_expenses
                    ? "text-[var(--danger)]"
                    : "text-[var(--success)]"
                    }`}>
                    {(monthlySummary?.total_expenses || 0) > budgetSummary.total_budgeted_expenses
                      ? `+${formatCurrency((monthlySummary?.total_expenses || 0) - budgetSummary.total_budgeted_expenses)} vs previsión`
                      : `-${formatCurrency(budgetSummary.total_budgeted_expenses - (monthlySummary?.total_expenses || 0))} vs previsión`
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
                  <p className={`text-xs mt-1 ${(monthlySummary?.total_savings || 0) >= budgetSummary.total_budgeted_savings
                    ? "text-[var(--success)]"
                    : "text-[var(--warning)]"
                    }`}>
                    {(monthlySummary?.total_savings || 0) >= budgetSummary.total_budgeted_savings
                      ? `+${formatCurrency((monthlySummary?.total_savings || 0) - budgetSummary.total_budgeted_savings)} vs previsión`
                      : `-${formatCurrency(budgetSummary.total_budgeted_savings - (monthlySummary?.total_savings || 0))} vs previsión`
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
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorAhorro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--brand-gray)"
                    tick={{ fontSize: 10 }}
                    tickMargin={5}
                  />
                  <YAxis
                    stroke="var(--brand-gray)"
                    tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}€`}
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
                    itemSorter={(item) => {
                      const order: Record<string, number> = { Ingresos: 0, Gastos: 1, Ahorro: 2 };
                      return order[item.dataKey as string] ?? 3;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    content={() => (
                      <div style={{ display: "flex", justifyContent: "center", gap: "16px", paddingTop: "10px" }}>
                        {[
                          { label: "Ingresos", color: "#10b981" },
                          { label: "Gastos", color: "#ef4444" },
                          { label: "Ahorro", color: "#06b6d4" },
                        ].map((item) => (
                          <span key={item.label} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--brand-gray)" }}>
                            <span style={{ width: 10, height: 10, backgroundColor: item.color, display: "inline-block", borderRadius: 2 }} />
                            {item.label}
                          </span>
                        ))}
                      </div>
                    )}
                  />
                  <Bar dataKey="Ingresos" fill="url(#colorIngresos)" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="Gastos" fill="url(#colorGastos)" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="Ahorro" fill="url(#colorAhorro)" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Distribución del mes + Finy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gráfico de tarta - Distribución real del mes */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              Distribución del mes
            </h3>
            {totalDistAmount > 0 ? (
              <div className="flex flex-col items-center w-full">
                {/* Contenedor del gráfico con tamaño expandido */}
                <div className="relative h-64 sm:h-80 w-full max-w-sm mx-auto flex items-center justify-center">

                  {/* Etiqueta central flotante (absoluta) con diseño espacial */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                    <div className={`bg-[var(--background)]/80 backdrop-blur-2xl px-6 py-6 rounded-full shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-[var(--border)]/50 flex flex-col items-center justify-center text-center transition-all duration-700 min-w-[175px] aspect-square pointer-events-auto ${selectedSegment ? 'cursor-pointer hover:scale-110 active:scale-95 group' : ''}`}
                      onClick={() => { if (selectedSegment) { setSelectedSegment(null); setActiveIndex(null); } }}>
                      <div className="relative z-10">
                        {activeIndex !== null && displayData[activeIndex] ? (
                          <div className="animate-in fade-in zoom-in duration-500">
                            <p className="text-[9px] sm:text-[10px] font-black text-[var(--brand-gray)] uppercase tracking-[0.3em] mb-1 px-2 line-clamp-1 opacity-70">{displayData[activeIndex].name}</p>
                            <p className="text-xl sm:text-2xl font-black tabular-nums tracking-tighter leading-none mb-1.5" style={{ color: displayData[activeIndex].color }}>
                              {formatCurrency(displayData[activeIndex].value)}
                            </p>
                            <div className="flex items-center justify-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-white/5 border border-white/10" style={{ color: displayData[activeIndex].color }}>
                                {currentTotal > 0 ? Math.round((displayData[activeIndex].value / currentTotal) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        ) : selectedSegment ? (
                          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                            <div className="mb-2 p-1.5 rounded-full bg-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] group-hover:bg-[var(--brand-cyan)] group-hover:text-white transition-all duration-500 shadow-lg shadow-[var(--brand-cyan)]/20">
                              <ChevronLeft className="w-4 h-4" />
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tighter leading-none mb-1">
                              {formatCurrency(currentTotal)}
                            </p>
                            <p className="text-[9px] text-[var(--brand-gray)] font-black uppercase tracking-[0.2em] opacity-60">
                              Total {selectedSegment === "needs" ? "Necesidades" : selectedSegment === "wants" ? "Deseos" : "Ahorro"}
                            </p>
                          </div>
                        ) : (
                          <div className="animate-in fade-in duration-1000 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--brand-cyan)]/20 to-transparent flex items-center justify-center mb-2">
                              <TrendingUp className="w-4 h-4 text-[var(--brand-cyan)]" />
                            </div>
                            <p className="text-[9px] sm:text-[10px] font-black text-[var(--brand-gray)] uppercase tracking-[0.4em] mb-1 opacity-50">Distribución</p>
                            <p className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tightest leading-none">
                              {formatCurrency(currentTotal)}
                            </p>
                          </div>
                        )}
                      </div>


                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" floodColor="currentColor" />
                        </filter>
                      </defs>

                      <PieWithProps
                        data={displayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={selectedSegment ? "65%" : "60%"}
                        outerRadius={selectedSegment ? "85%" : "80%"}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="var(--background)"
                        strokeWidth={2}
                        activeIndex={activeIndex ?? -1}
                        activeShape={renderActiveShape}
                        onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        onClick={(data: any) => {
                          if (!selectedSegment && data?.payload?.segment) {
                            setSelectedSegment(data.payload.segment);
                            setActiveIndex(null);
                          }
                        }}
                        style={{ cursor: selectedSegment ? "default" : "pointer", filter: "url(#shadow)" }}
                      >
                        {displayData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            className="transition-all duration-300 ease-in-out"
                          />
                        ))}
                      </PieWithProps>


                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Leyenda y Botones Macros */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-2 w-full">
                  {innerData.map((macro) => (
                    <div
                      key={macro.segment}
                      onClick={() => {
                        setSelectedSegment(selectedSegment === macro.segment ? null : macro.segment as any);
                        setActiveIndex(null);
                      }}
                      className={`flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity ${selectedSegment && selectedSegment !== macro.segment ? "opacity-30" : ""}`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }}></div>
                      <span className="text-xs text-[var(--foreground)] font-medium">{macro.name}: {formatCurrency(macro.value)}</span>
                    </div>
                  ))}
                </div>

                {/* Detalle Categorías (Se muestra al hacer click) - REDISEÑO PREMIUM */}
                <div className="mt-8 pt-6 border-t border-[var(--border)] w-full">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-[0.1em] text-[var(--brand-gray)]">
                      {selectedSegment
                        ? `Desglose: ${selectedSegment === "needs" ? "Necesidades" : selectedSegment === "wants" ? "Deseos" : "Ahorro"}`
                        : "Detalles por categorías"}
                    </h4>
                    {selectedSegment && (
                      <button
                        onClick={() => { setSelectedSegment(null); setActiveIndex(null); }}
                        className="text-[10px] font-bold text-[var(--brand-cyan)] hover:opacity-70 transition-all flex items-center gap-1 bg-[var(--brand-cyan)]/5 px-2 py-1 rounded-lg"
                      >
                        <ChevronLeft className="w-3 h-3" /> VOLVER
                      </button>
                    )}
                  </div>

                  {selectedSegment ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {categoryDistribution
                        .filter(c => c.segment === selectedSegment)
                        .sort((a, b) => b.amount - a.amount)
                        .map(c => (
                          <div key={c.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]/50 hover:border-[var(--brand-cyan)]/30 transition-all duration-300 group hover:shadow-md">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-8 rounded-full opacity-60 group-hover:opacity-100 transition-all" style={{ backgroundColor: c.color }}></div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[var(--foreground)] line-clamp-1">{c.name}</span>
                                <span className="text-[10px] font-medium text-[var(--brand-gray)]">{Math.round((c.amount / currentTotal) * 100)}% del total</span>
                              </div>
                            </div>
                            <span className="font-black text-sm tabular-nums" style={{ color: c.color }}>{formatCurrency(c.amount)}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {innerData.map(macro => (
                        <div
                          key={macro.segment}
                          onClick={() => setSelectedSegment(macro.segment as any)}
                          className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-transparent hover:border-[var(--brand-cyan)]/30 cursor-pointer transition-all duration-300 flex flex-col items-center text-center group active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ backgroundColor: `${macro.color}15`, color: macro.color }}>
                            {macro.segment === 'needs' ? <Shield className="w-5 h-5" /> : macro.segment === 'wants' ? <Sparkles className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                          </div>
                          <span className="text-[10px] font-bold text-[var(--brand-gray)] uppercase tracking-wider mb-1">{macro.name}</span>
                          <span className="text-base font-black text-[var(--foreground)]">{formatCurrency(macro.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--background-secondary)] flex items-center justify-center mb-3">
                  <Wallet className="w-6 h-6 text-[var(--brand-gray)]" />
                </div>
                <p className="text-sm text-[var(--brand-gray)]">Sin movimientos este mes</p>
              </div>
            )}
          </div>



          {/* SURPRESA: Finy Time Machine / Predictive Analysis */}
          <div className="group relative card-glass p-4 sm:p-6 overflow-hidden animate-slide-in-right stagger-2">
            {/* Background interactive particles decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-[var(--brand-purple)]/10 via-[var(--brand-cyan)]/5 to-transparent rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--brand-cyan)] to-[var(--brand-purple)] flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Rocket className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight">Finy Predictor <span className="text-[10px] text-white/40 font-mono ml-1">AI 1.0</span></h3>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)] text-[10px] font-black uppercase tracking-widest animate-pulse">En Tiempo Real</div>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                  <p className="text-[10px] text-[var(--brand-gray)] uppercase font-bold tracking-widest mb-1">Proyección Fin de Mes</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tighter tabular-nums">
                        {loading ? "..." : formatCurrency(
                          (monthlySummary?.total_income || 0) - ((monthlySummary?.total_expenses || 0) / (new Date().getDate() || 1)) * new Date(selectedYear, selectedMonth, 0).getDate()
                        )}
                      </p>
                      <p className="text-[10px] text-[var(--brand-gray)] flex items-center gap-1 mt-0.5">
                        <TrendingDown className="w-3 h-3 text-[var(--danger)]" /> Basado en tu ritmo actual
                      </p>
                    </div>
                    {(monthlySummary?.total_income || 0) > 0 && (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-[var(--brand-cyan)]/30 flex items-center justify-center relative">
                          <span className="text-[10px] font-black text-[var(--brand-cyan)]">
                            {Math.max(0, Math.round(((monthlySummary?.total_income || 0) - (monthlySummary?.total_expenses || 0)) / (monthlySummary?.total_income || 1) * 100))}%
                          </span>
                          <div className="absolute inset-0 rounded-full border-2 border-[var(--brand-cyan)] border-t-transparent animate-spin-slow"></div>
                        </div>
                        <span className="text-[8px] font-bold text-[var(--brand-gray)] mt-1 uppercase">Salud</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-[var(--success)]/5 border border-[var(--success)]/10 hover:bg-[var(--success)]/10 transition-colors">
                    <p className="text-[10px] text-[var(--success)] font-black uppercase tracking-tighter mb-1">Margen diario</p>
                    <p className="text-base font-bold text-[var(--foreground)] tabular-nums">
                      {formatCurrency(Math.max(0, ((monthlySummary?.total_income || 0) - (monthlySummary?.total_expenses || 0)) / 30))}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--brand-purple)]/5 border border-[var(--brand-purple)]/10 hover:bg-[var(--brand-purple)]/10 transition-colors">
                    <p className="text-[10px] text-[var(--brand-purple)] font-black uppercase tracking-tighter mb-1">Libertad</p>
                    <p className="text-base font-bold text-[var(--foreground)]">+15 días</p>
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-purple)] text-white text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4 animate-bounce-subtle" /> Deep Scan de Cartera
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                </button>
              </div>
            </div>
            {/* Finy Interpretation Panel */}
            <div className="glass-brand rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-slide-in-right relative overflow-hidden flex-1 mt-4 sm:mt-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--brand-cyan)]/5 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 relative">
                <div className="animate-bounce-subtle flex-shrink-0">
                  <Image
                    src="/assets/finy-mascota-minimalista.png"
                    alt="Finy"
                    width={40}
                    height={40}
                    className="rounded-xl w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-[var(--brand-cyan)]">Finy AI</h3>
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-cyan)] opacity-60 animate-sparkle" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-[var(--brand-gray)]">Tu asistente financiero v1.5</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-2.5 relative">
                {loading ? (
                  <div className="flex items-center gap-2 py-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--brand-cyan)] animate-typing-dot"></span>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--brand-cyan)] animate-typing-dot"></span>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--brand-cyan)] animate-typing-dot"></span>
                    <span className="text-xs sm:text-sm text-[var(--brand-gray)] ml-1">Analizando...</span>
                  </div>
                ) : (
                  getFinyMessage()?.map((message, index) => (
                    <div key={index} className={`flex items-start gap-2 animate-slide-in-left stagger-${Math.min(index + 1, 3)}`}>
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--brand-cyan)] mt-1.5 sm:mt-1 flex-shrink-0 animate-pulse" />
                      <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed">{message}</p>
                    </div>
                  ))
                )}
              </div>
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
                <div className="h-2 sm:h-2.5 rounded-full overflow-hidden bg-slate-200/50 dark:bg-white/5 shadow-inner border border-black/5 dark:border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--brand-cyan)] via-[var(--brand-cyan)] to-[var(--brand-purple)] animate-shimmer shadow-[0_0_12px_-2px_rgba(2,234,255,0.6)]"
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
                <div className="progress-bar h-1.5 sm:h-2 overflow-hidden bg-slate-200/50 dark:bg-white/5 shadow-inner border border-black/5 dark:border-white/5">
                  <div
                    className="progress-bar-fill bg-gradient-to-r from-[#FF4D4D] via-[#F59E0B] to-[#10B981]"
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
