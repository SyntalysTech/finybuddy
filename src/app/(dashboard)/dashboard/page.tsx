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
  Bot,
  Receipt,
  Gamepad2,
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
  debtsSummary: DebtsSummary | null,
  formatCurrency: (amount: number) => string
): string => {
  if (!summary) return "Sincronizando tus finanzas en tiempo real...";

  const { total_income, total_expenses, total_savings, balance } = summary;

  // Cálculo de ahorro real basado exclusivamente en operaciones de ahorro
  const actualSavingsRate = total_income > 0 ? (total_savings / total_income) * 100 : 0;
  const isExcellent = actualSavingsRate >= 30;
  const isGood = actualSavingsRate >= 20;
  const isOk = actualSavingsRate >= 10;

  if (total_income === 0 && total_expenses === 0) {
    return "Tu panel está listo. Empieza a registrar ingresos y gastos para ver tu análisis.";
  }

  // 1. Prioridad: Alertas Críticas (Basadas en balance/disponibilidad)
  if (balance < 0) {
    return `¡Ojo! Este mes tienes un descubierto de ${formatCurrency(Math.abs(balance))}. Toca revisar prioridades y controlar los gastos.`;
  }

  // 2. Prioridad: Insights de Ahorro basados en operaciones reales
  if (total_income > 0 && total_savings > 0) {
    const pctStr = Math.round(actualSavingsRate);
    if (isExcellent) {
      return `¡Espectacular! Estás ahorrando el ${pctStr}% de lo que ganas (${formatCurrency(total_savings)}). Gestión de nivel experto.`;
    }
    if (isGood) {
      return `Buen trabajo: has destinado un ${pctStr}% a ahorro (${formatCurrency(total_savings)}) este mes. ¡Sigue así!`;
    }
    if (isOk) {
      return `Vas por buen camino: tu ahorro trackeado es del ${pctStr}% de tus ingresos (${formatCurrency(total_savings)}).`;
    }
  }

  // 3. Situación ajustada o sin ahorro trackeado
  if (total_income > 0 && total_savings === 0) {
    if (balance > 100) {
      return `Tienes ${formatCurrency(balance)} disponibles. Sería un buen momento para mover algo a ahorro y empezar a trackearlo.`;
    }
    return "Aún no he detectado operaciones de ahorro este mes. ¡Recuerda pagarte a ti mismo primero!";
  }

  // 4. Metas y Deudas
  if (savingsSummary && savingsSummary.overall_progress >= 90 && savingsSummary.overall_progress < 100) {
    return "¡Casi lo tienes! Tu meta de ahorro principal está al 90%. Falta el último empujón.";
  }

  if (debtsSummary && debtsSummary.overall_progress >= 90 && debtsSummary.active_debts > 0) {
    return "Liquidación inminente: estás a punto de saldar tus deudas. ¡Libertad financiera a la vista!";
  }

  return "Sigue trackeando tus operaciones para que pueda darte mejores consejos financieros.";
};

// Auditoría Finy IA dinámica basada en los datos del mes
const generateFinyInsights = (
  summary: MonthlySummary | null,
  savingsSummary: SavingsSummary | null,
  debtsSummary: DebtsSummary | null,
  monthlyEvolution: MonthlyEvolution[],
  categoryDistribution: CategoryDistribution[],
  formatCurrency: (amount: number) => string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any
): string[] => {
  if (!summary) return ["Analizando tus movimientos financieros..."];

  const insights: string[] = [];
  const { total_income, total_expenses } = summary;

  const ruleNeeds = profile?.rule_needs_percent ?? 50;
  const ruleWants = profile?.rule_wants_percent ?? 30;

  if (total_income === 0 && total_expenses === 0) {
    return ["Tu panel está listo. Empieza a registrar ingresos y gastos para ver tu análisis."];
  }

  // 1. Análisis de Evolución Mensual (Últimos 6 meses)
  if (monthlyEvolution.length >= 2) {
    const currentMonth = monthlyEvolution[monthlyEvolution.length - 1];
    const previousMonth = monthlyEvolution[monthlyEvolution.length - 2];

    if (currentMonth.total_savings > previousMonth.total_savings) {
      insights.push(`¡Gran progreso en tu evolución mensual! Has ahorrado ${formatCurrency(currentMonth.total_savings - previousMonth.total_savings)} más que el mes pasado. Esta es la constancia que construye riqueza a largo plazo.`);
    } else if (currentMonth.total_expenses < previousMonth.total_expenses) {
      insights.push(`Vas por excelente camino. Lograste reducir tus gastos en ${formatCurrency(previousMonth.total_expenses - currentMonth.total_expenses)} respecto al mes anterior. ¡Sigue así!`);
    } else {
      insights.push(`Revisando los últimos meses, tus gastos han subido respecto al promedio reciente. Identifica esa fuga de capital esta semana para volver rápidamente a tu ritmo de ahorro ideal.`);
    }
  } else {
    insights.push(`¡Empieza fuerte! Sigo estudiando tus primeros meses para detectar tu tendencia mensual de crecimiento.`);
  }

  // 2. Patrones de Gasto y Malas Prácticas (Distribución de Deseos / Gastos Hormiga)
  const wantsCategories = categoryDistribution.filter(c => c.segment === "wants");
  if (wantsCategories.length > 0) {
    wantsCategories.sort((a, b) => b.amount - a.amount);
    const topWant = wantsCategories[0];

    if (topWant.amount > 0) {
      const suggestedGoal = savingsSummary && savingsSummary.active_goals > 0 ? "una de tus metas de ahorro" : "crear un fondo de emergencia";
      insights.push(`Detecto un patrón potencial de fuga: has destinado ${formatCurrency(topWant.amount)} a "${topWant.name}". Si limitas este gasto y rediriges solo un 30% a ${suggestedGoal}, avanzarías muchísimo más rápido.`);
    }
  }

  // 3. Insight de Distribución Estratégica
  const totalCategorized = summary.needs_total + summary.wants_total + summary.total_savings;
  if (totalCategorized > 0) {
    const needsPct = Math.round((summary.needs_total / totalCategorized) * 100);
    const wantsPct = Math.round((summary.wants_total / totalCategorized) * 100);
    if (needsPct > ruleNeeds + 10) {
      insights.push(`Revisando tu gráfico de distribución, tus "Necesidades" consumen el ${needsPct}% de tus salidas. Estás algo por encima del ${ruleNeeds}% ideal fijado para ti. Cuidado con la inflación de estilo de vida fijo.`);
    } else if (wantsPct > ruleWants + 10) {
      insights.push(`Tus "Deseos" representan ahora mismo el ${wantsPct}% de la distribución del mes. Intenta ajustar este porcentaje hacia tu meta personal del ${ruleWants}% para blindar tu planificación mensual.`);
    } else if (wantsPct > 0 || needsPct > 0) {
      insights.push(`¡Excelente equilibrio! Tienes una distribución muy sana entre tus necesidades (${needsPct}%) y deseos (${wantsPct}%). Estás demostrando un perfil ahorrador ejemplar.`);
    }
  }

  // 4. Progreso de Metas de Ahorro
  if (savingsSummary && savingsSummary.total_goals > 0) {
    if (savingsSummary.overall_progress >= 100) {
      insights.push(`¡Felicidades absolutas! Has completado al 100% tus metas de ahorro. Es el momento perfecto para fijar horizontes aún más ambiciosos.`);
    } else {
      insights.push(`Sobre tu plan futuro: el progreso general de tus metas de ahorro va por el ${Math.round(savingsSummary.overall_progress)}%. Fíjate como objetivo aportar lo antes posible para alcanzar los ${formatCurrency(savingsSummary.total_target)}.`);
    }
  }

  // 5. Progreso de Deudas
  if (debtsSummary && debtsSummary.total_debts > 0) {
    if (debtsSummary.active_debts === 0) {
      insights.push(`¡Estás oficialmente libre de deudas! Tienes todo bajo control, no permitas adquirir nueva deuda mala.`);
    } else {
      insights.push(`Tu estrategia contra la deuda funciona: llevas saldado un ${Math.round(debtsSummary.overall_progress)}% de tus pasivos. Estás acortando el camino hacia la verdadera tranquilidad financiera.`);
    }
  }

  // Fallback if not much data yet
  if (insights.length < 2) {
    insights.push(`Sigue trackeando fielmente tus operaciones para que pueda hilar cada vez más fino en mis análisis.`);
  }

  return insights;
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

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

      allOpsData.forEach((op: any) => {
        const cat = Array.isArray(op.category) ? op.category[0] : op.category;

        if (op.type === "savings") {
          // Si tiene categoría, usamos su nombre real (Ej: Fondo Libertad, Coche...)
          if (cat) {
            if (!merged[cat.id]) {
              merged[cat.id] = { id: cat.id, name: cat.name, color: "#02EAFF", amount: 0, segment: "savings" };
            }
            merged[cat.id].amount += op.amount;
          } else {
            const savingsId = "savings-total";
            if (!merged[savingsId]) {
              merged[savingsId] = { id: savingsId, name: "Ahorro", color: "#02EAFF", amount: 0, segment: "savings" };
            }
            merged[savingsId].amount += op.amount;
          }
        }
        else if (op.type === "expense") {
          if (!cat) return;
          let segment = (cat.segment || "needs").trim().toLowerCase();
          if (segment !== "needs" && segment !== "wants" && segment !== "savings") {
            segment = "needs";
          }

          if (!merged[cat.id]) {
            const finalColor = segment === "needs" ? "#2EEB8F" : (segment === "wants" ? "#3B82F6" : (cat.color || "#02EAFF"));
            merged[cat.id] = { id: cat.id, name: cat.name, color: finalColor, amount: 0, segment: segment as "needs" | "wants" | "savings" };
          }
          merged[cat.id].amount += op.amount;
        }
      });

      setCategoryDistribution(Object.values(merged).filter(c => Math.abs(c.amount) > 0).sort((a, b) => b.amount - a.amount));
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
  const contextualPhrase = getContextualPhrase(monthlySummary, savingsSummary, debtsSummary, formatCurrency);
  const finyInsights = generateFinyInsights(monthlySummary, savingsSummary, debtsSummary, monthlyEvolution, categoryDistribution, formatCurrency, profile);

  // Finy intelligence data computation replaced by finyInsights


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
    { name: "Deseos", value: monthlySummary?.wants_total || 0, color: "#3B82F6", segment: "wants" },
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
        const baseColor = selectedSegment === "needs" ? "#2EEB8F" : (selectedSegment === "wants" ? "#3B82F6" : "#02EAFF");

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
  const PieWithProps = Pie as any;

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

  const handleDeepScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);

    // Simular escaneo profundo con pasos de progresión
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            fetchDashboardData();
          }, 800);
          return 100;
        }
        // Incrementos aleatorios para que parezca más "humano/IA"
        const next = prev + Math.floor(Math.random() * 15) + 5;
        return next > 100 ? 100 : next;
      });
    }, 200);
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
        <div className="glass-brand p-3 sm:p-4 rounded-xl sm:rounded-2xl animate-slide-in-down relative overflow-hidden mb-5">
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
              <p className="text-sm sm:text-base font-bold text-white mb-0.5 leading-normal">
                {loading ? "Analizando tus datos..." : contextualPhrase}
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--brand-gray)] italic line-clamp-2 leading-relaxed opacity-90">
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
                                {monthlySummary && monthlySummary.total_income > 0
                                  ? Math.round((displayData[activeIndex].value / monthlySummary.total_income) * 100)
                                  : 0}%
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
                      <span className="text-xs text-[var(--foreground)] font-medium">
                        {macro.name}: {formatCurrency(macro.value)}
                      </span>
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




          {/* Finy Intelligence Column */}
          <div className="flex flex-col gap-4 sm:gap-6">

            {/* AI Audit Panel */}
            <div className="glass-brand p-5 sm:p-6 rounded-xl sm:rounded-2xl animate-slide-in-right relative overflow-hidden flex-1 shadow-2xl">
              {/* Subtle gradient glow in background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--brand-cyan)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative">
                {/* Mascot Element */}
                <div className="flex-shrink-0 flex sm:flex-col items-center gap-4 sm:gap-2">
                  <div className="relative animate-float-slow">
                    <div className="absolute inset-0 bg-[var(--brand-cyan)]/20 blur-xl rounded-full" />
                    <Image
                      src="/assets/finy-mascota-minimalista.png"
                      alt="FinyBuddy AI"
                      width={56}
                      height={56}
                      className="rounded-xl w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10 drop-shadow-xl"
                    />
                  </div>
                  <div className="hidden sm:flex flex-col items-center mt-1">
                    <span className="text-[10px] font-bold tracking-widest text-[var(--brand-cyan)] uppercase">Auditoría</span>
                    <span className="text-xs text-[var(--brand-gray)]">Finy IA</span>
                  </div>
                </div>

                {/* Content Element */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[var(--brand-cyan)]" />
                      <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                        Análisis de Finy AI
                      </h3>
                    </div>
                    <button
                      onClick={handleDeepScan}
                      disabled={isScanning}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20 text-[10px] font-black text-[var(--brand-cyan)] uppercase hover:bg-[var(--brand-cyan)] hover:text-white transition-all group/btn disabled:opacity-50"
                    >
                      <Rocket className={`w-3.5 h-3.5 ${isScanning ? 'animate-bounce' : 'group-hover/btn:-translate-y-0.5 transition-transform'}`} />
                      {isScanning ? 'Escaneando...' : 'Deep Scan'}
                    </button>
                  </div>

                  {isScanning && (
                    <div className="mb-5 mt-2 space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black text-[var(--brand-cyan)] uppercase tracking-[0.2em]">Escaneo Profundo en curso...</p>
                        <p className="text-xs font-black text-[var(--brand-cyan)]">{scanProgress}%</p>
                      </div>
                      <div className="progress-bar h-2.5">
                        <div
                          className="progress-bar-fill bg-[var(--brand-cyan)]"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="flex items-center gap-3 py-4">
                      <div className="w-4 h-4 rounded-full border-2 border-[var(--brand-cyan)] border-t-transparent animate-spin" />
                      <p className="text-sm text-[var(--foreground)] opacity-80">Procesando millones de datos en milisegundos...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {finyInsights.map((insight, idx) => (
                        <div key={idx} className="flex gap-3 items-start group p-3 rounded-2xl bg-[var(--foreground)]/5 border border-transparent hover:border-[var(--brand-cyan)]/20 transition-all hover:bg-[var(--foreground)]/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] mt-2 flex-shrink-0 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(2,234,255,0.8)]" />
                          <p className="text-sm sm:text-[14px] text-[var(--foreground)] opacity-90 leading-relaxed flex-1">
                            {insight}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Metarverso 3D */}
        <Link href="/finyverse" className="block w-full mb-6 rounded-2xl bg-gradient-to-r from-[var(--brand-purple)] via-[var(--brand-cyan)] to-[var(--brand-purple)] p-[1px] group hover:shadow-[0_0_20px_rgba(2,234,255,0.4)] transition-all animate-slide-in-up md:hover:scale-[1.01] duration-500 overflow-hidden relative">
          <div className="bg-[var(--background)]/90 backdrop-blur-xl p-4 sm:p-5 rounded-[15px] flex items-center justify-between relative z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-purple)]/10 to-[var(--brand-cyan)]/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="flex items-center gap-4 relative">
              <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-cyan)] flex items-center justify-center animate-pulse shadow-lg shadow-[var(--brand-cyan)]/30">
                <Gamepad2 className="w-6 h-6 text-white drop-shadow-md" />
              </div>
              <div className="min-w-0 pr-2">
                <h3 className="text-sm sm:text-lg font-black text-[var(--foreground)] uppercase tracking-tighter mb-0.5 group-hover:text-[var(--brand-cyan)] transition-colors">
                  FinyVerse 3D <span className="text-[10px] sm:text-xs ml-2 bg-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] px-2 py-0.5 rounded-full uppercase border border-[var(--brand-cyan)]/30">Beta</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--brand-gray)] line-clamp-2 md:line-clamp-none leading-relaxed">
                  Adéntrate en tu ciudad financiera holográfica y camina entre tus gastos, metas y métricas en un entorno tridimensional impulsado por Three.js.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex flex-shrink-0 ml-4 px-4 py-2.5 rounded-xl bg-[var(--foreground)]/10 text-xs font-bold text-[var(--foreground)] group-hover:bg-[var(--foreground)] transition-all transform group-hover:text-[var(--background)]">
              Explorar Ahora <ChevronRight className="w-4 h-4 ml-1 inline-block opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>

        {/* Recientes y Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Operaciones Recientes - Viñetas Premium */}
          <div className="lg:col-span-1 card-glass p-5 sm:p-7 animate-slide-in-up stagger-1 border border-white/10 dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-[var(--brand-gray)] opacity-80">Actividad Reciente</h3>
              <Link href="/operaciones" className="text-[10px] font-black text-[var(--brand-cyan)] uppercase hover:underline">Ver Historial</Link>
            </div>

            <div className="space-y-4">
              {recentOperations.length > 0 ? (
                recentOperations.slice(0, 4).map((op, idx) => {
                  const Config = typeConfig[op.type];
                  return (
                    <div key={op.id} className={`group/op flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all animate-slide-in-left stagger-${idx + 1}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${Config.bg} flex items-center justify-center group-hover/op:scale-110 transition-transform shadow-lg`}>
                          <Config.icon className={`w-5 h-5 ${Config.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate text-[var(--foreground)]">{op.concept}</p>
                          <p className="text-[10px] text-[var(--brand-gray)] font-medium uppercase tracking-tighter">
                            {op.category?.name || Config.label} • {format(new Date(op.operation_date), "dd MMM", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black tabular-nums ${op.type === "income" ? "text-[var(--success)]" : "text-[var(--foreground)]"}`}>
                          {op.type === "income" ? "+" : "-"}{formatCurrency(op.amount)}
                        </p>
                        <div className="flex justify-end mt-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${Config.color} animate-pulse shadow-[0_0_8px_currentColor]`} />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-3">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center">Sin actividad este mes</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                  <div className="progress-bar h-4">
                    <div
                      className="progress-bar-fill bg-gradient-to-r from-[var(--brand-cyan)] to-[#3B82F6] shadow-[0_0_15px_rgba(2,234,255,0.4)]"
                      style={{ width: `${Math.max(Math.min(savingsSummary.overall_progress, 100), 2)}%` }}
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
                      <p className="text-base sm:text-lg font-semibold text-[var(--danger)] animate-count">
                        {Math.round(debtsSummary.overall_progress)}%
                      </p>
                      <p className="text-xs sm:text-sm text-[var(--brand-gray)]">pagado</p>
                    </div>
                  </div>
                  <div className="progress-bar h-4">
                    <div
                      className="progress-bar-fill bg-gradient-to-r from-[var(--danger)] to-[var(--danger)] shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      style={{ width: `${Math.max(Math.min(debtsSummary.overall_progress, 100), 2)}%` }}
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
      </div>
    </>
  );
}
