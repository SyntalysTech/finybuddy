"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { format, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "savings";
  segment: "needs" | "wants" | "savings" | null;
}

interface BudgetVsActual {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  segment: string | null;
  type: string;
  budgeted: number;
  actual: number;
  difference: number;
  percentage: number;
}

export default function PrevisionVsRealidadPage() {
  const { profile } = useProfile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<BudgetVsActual[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;

  // Fetch budget vs actual data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get budgets for the month
    const { data: budgetsData } = await supabase
      .from("budgets")
      .select(`
        *,
        category:categories(id, name, icon, color, type, segment)
      `)
      .eq("user_id", user.id)
      .eq("year", selectedYear)
      .eq("month", selectedMonth);

    // Get actual operations for the month
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];

    const { data: operationsData } = await supabase
      .from("operations")
      .select(`
        amount,
        type,
        category_id,
        category:categories(id, name, icon, color, type, segment)
      `)
      .eq("user_id", user.id)
      .gte("operation_date", startDate)
      .lte("operation_date", endDate);

    // Aggregate operations by category
    const actualByCategory: Record<string, number> = {};
    operationsData?.forEach(op => {
      if (op.category_id) {
        actualByCategory[op.category_id] = (actualByCategory[op.category_id] || 0) + op.amount;
      }
    });

    // Build comparison data
    const comparisonData: BudgetVsActual[] = [];

    // Add budgeted categories
    budgetsData?.forEach(budget => {
      const cat = budget.category as Category;
      if (!cat) return;

      const actual = actualByCategory[cat.id] || 0;
      const budgeted = budget.amount;
      const difference = budgeted - actual;
      const percentage = budgeted > 0 ? (actual / budgeted) * 100 : (actual > 0 ? 100 : 0);

      comparisonData.push({
        category_id: cat.id,
        category_name: cat.name,
        category_icon: cat.icon,
        category_color: cat.color,
        segment: cat.segment,
        type: cat.type,
        budgeted,
        actual,
        difference,
        percentage,
      });

      // Remove from actualByCategory so we don't double count
      delete actualByCategory[cat.id];
    });

    // Add categories with actual spending but no budget
    for (const categoryId of Object.keys(actualByCategory)) {
      const op = operationsData?.find(o => o.category_id === categoryId);
      if (op?.category) {
        const cat = (Array.isArray(op.category) ? op.category[0] : op.category) as Category;
        comparisonData.push({
          category_id: cat.id,
          category_name: cat.name,
          category_icon: cat.icon,
          category_color: cat.color,
          segment: cat.segment,
          type: cat.type,
          budgeted: 0,
          actual: actualByCategory[categoryId],
          difference: -actualByCategory[categoryId],
          percentage: 100,
        });
      }
    }

    setData(comparisonData);
    setLoading(false);
  }, [selectedYear, selectedMonth, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: profile?.currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  // Filter by type
  const incomeData = data.filter(d => d.type === "income");
  const expenseData = data.filter(d => d.type === "expense");

  // Calculate totals
  const totalBudgetedIncome = incomeData.reduce((sum, d) => sum + d.budgeted, 0);
  const totalActualIncome = incomeData.reduce((sum, d) => sum + d.actual, 0);
  const totalBudgetedExpenses = expenseData.reduce((sum, d) => sum + d.budgeted, 0);
  const totalActualExpenses = expenseData.reduce((sum, d) => sum + d.actual, 0);

  const budgetedSavings = totalBudgetedIncome - totalBudgetedExpenses;
  const actualSavings = totalActualIncome - totalActualExpenses;

  // Calculate by segment
  const needsData = expenseData.filter(d => d.segment === "needs");
  const wantsData = expenseData.filter(d => d.segment === "wants");
  const savingsSegmentData = expenseData.filter(d => d.segment === "savings");

  const needsBudgeted = needsData.reduce((sum, d) => sum + d.budgeted, 0);
  const needsActual = needsData.reduce((sum, d) => sum + d.actual, 0);
  const wantsBudgeted = wantsData.reduce((sum, d) => sum + d.budgeted, 0);
  const wantsActual = wantsData.reduce((sum, d) => sum + d.actual, 0);
  const savingsSegmentBudgeted = savingsSegmentData.reduce((sum, d) => sum + d.budgeted, 0);
  const savingsSegmentActual = savingsSegmentData.reduce((sum, d) => sum + d.actual, 0);

  // Calculate percentages based on actual income
  const needsPercent = totalActualIncome > 0 ? Math.round((needsActual / totalActualIncome) * 100) : 0;
  const wantsPercent = totalActualIncome > 0 ? Math.round((wantsActual / totalActualIncome) * 100) : 0;
  const savingsPercent = totalActualIncome > 0 ? Math.round((actualSavings / totalActualIncome) * 100) : 0;

  const ruleNeeds = profile?.rule_needs_percent || 50;
  const ruleWants = profile?.rule_wants_percent || 30;
  const ruleSavings = profile?.rule_savings_percent || 20;

  // Pie chart data for budgeted
  const budgetedPieData = [
    { name: "Necesidades", value: needsBudgeted, color: "#10b981" },
    { name: "Deseos", value: wantsBudgeted, color: "#f59e0b" },
    { name: "Ahorro", value: budgetedSavings > 0 ? budgetedSavings : 0, color: "#8b5cf6" },
  ].filter(d => d.value > 0);

  // Pie chart data for actual
  const actualPieData = [
    { name: "Necesidades", value: needsActual, color: "#10b981" },
    { name: "Deseos", value: wantsActual, color: "#f59e0b" },
    { name: "Ahorro", value: actualSavings > 0 ? actualSavings : 0, color: "#8b5cf6" },
  ].filter(d => d.value > 0);

  // Bar chart data for comparison
  const barChartData = [
    { name: "Ingresos", Previsto: totalBudgetedIncome, Real: totalActualIncome },
    { name: "Gastos", Previsto: totalBudgetedExpenses, Real: totalActualExpenses },
    { name: "Ahorro", Previsto: budgetedSavings, Real: actualSavings },
  ];

  // Get variance icon
  const getVarianceIcon = (budgeted: number, actual: number, isExpense: boolean) => {
    const diff = budgeted - actual;
    if (Math.abs(diff) < 1) return <Minus className="w-4 h-4 text-[var(--brand-gray)]" />;

    if (isExpense) {
      // For expenses: under budget is good (green arrow down)
      if (diff > 0) return <ArrowDown className="w-4 h-4 text-[var(--success)]" />;
      return <ArrowUp className="w-4 h-4 text-[var(--danger)]" />;
    } else {
      // For income: over budget is good (green arrow up)
      if (diff < 0) return <ArrowUp className="w-4 h-4 text-[var(--success)]" />;
      return <ArrowDown className="w-4 h-4 text-[var(--danger)]" />;
    }
  };

  // Get progress bar color
  const getProgressColor = (percentage: number, isExpense: boolean) => {
    if (isExpense) {
      if (percentage <= 80) return "bg-[var(--success)]";
      if (percentage <= 100) return "bg-[var(--warning)]";
      return "bg-[var(--danger)]";
    } else {
      if (percentage >= 100) return "bg-[var(--success)]";
      if (percentage >= 80) return "bg-[var(--warning)]";
      return "bg-[var(--danger)]";
    }
  };

  const renderComparisonRow = (item: BudgetVsActual) => {
    const isExpense = item.type === "expense";
    const progressColor = getProgressColor(item.percentage, isExpense);
    const varianceIcon = getVarianceIcon(item.budgeted, item.actual, isExpense);

    return (
      <div
        key={item.category_id}
        className="flex items-center gap-4 p-4 hover:bg-[var(--background-secondary)] transition-colors"
      >
        {/* Category */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xl" style={{ color: item.category_color }}>
            {item.category_icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{item.category_name}</p>
            <div className="mt-1">
              <div className="progress-bar h-2">
                <div
                  className={`progress-bar-fill ${progressColor}`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Budgeted */}
        <div className="w-24 text-right">
          <p className="text-xs text-[var(--brand-gray)]">Previsto</p>
          <p className="font-medium">{formatCurrency(item.budgeted)}</p>
        </div>

        {/* Actual */}
        <div className="w-24 text-right">
          <p className="text-xs text-[var(--brand-gray)]">Real</p>
          <p className={`font-medium ${item.type === "income" ? "text-[var(--success)]" : ""}`}>
            {formatCurrency(item.actual)}
          </p>
        </div>

        {/* Variance */}
        <div className="w-24 text-right flex items-center justify-end gap-1">
          {varianceIcon}
          <span className={`font-medium ${
            item.difference >= 0
              ? (isExpense ? "text-[var(--success)]" : "text-[var(--danger)]")
              : (isExpense ? "text-[var(--danger)]" : "text-[var(--success)]")
          }`}>
            {formatCurrency(Math.abs(item.difference))}
          </span>
        </div>

        {/* Percentage */}
        <div className="w-16 text-right">
          <span className={`text-sm font-semibold ${
            item.percentage > 100 && isExpense ? "text-[var(--danger)]" : ""
          }`}>
            {Math.round(item.percentage)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header
        title="Previsión vs Realidad"
        subtitle="Compara tus presupuestos con los gastos reales"
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Income */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[var(--success)]/10">
                  <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                </div>
                <span className="font-medium">Ingresos</span>
              </div>
              {totalActualIncome >= totalBudgetedIncome ? (
                <CheckCircle className="w-5 h-5 text-[var(--success)]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brand-gray)]">Previsto</span>
                <span>{formatCurrency(totalBudgetedIncome)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brand-gray)]">Real</span>
                <span className="font-semibold text-[var(--success)]">{formatCurrency(totalActualIncome)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-[var(--border)]">
                <span className="text-[var(--brand-gray)]">Diferencia</span>
                <span className={totalActualIncome >= totalBudgetedIncome ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                  {totalActualIncome >= totalBudgetedIncome ? "+" : ""}{formatCurrency(totalActualIncome - totalBudgetedIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[var(--danger)]/10">
                  <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
                </div>
                <span className="font-medium">Gastos</span>
              </div>
              {totalActualExpenses <= totalBudgetedExpenses ? (
                <CheckCircle className="w-5 h-5 text-[var(--success)]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brand-gray)]">Previsto</span>
                <span>{formatCurrency(totalBudgetedExpenses)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brand-gray)]">Real</span>
                <span className="font-semibold text-[var(--danger)]">{formatCurrency(totalActualExpenses)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-[var(--border)]">
                <span className="text-[var(--brand-gray)]">Diferencia</span>
                <span className={totalActualExpenses <= totalBudgetedExpenses ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                  {totalBudgetedExpenses - totalActualExpenses >= 0 ? "+" : ""}{formatCurrency(totalBudgetedExpenses - totalActualExpenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Savings */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[var(--brand-purple)]/10">
                  <PiggyBank className="w-5 h-5 text-[var(--brand-purple)]" />
                </div>
                <span className="font-medium">Ahorro</span>
              </div>
              {actualSavings >= budgetedSavings ? (
                <CheckCircle className="w-5 h-5 text-[var(--success)]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brand-gray)]">Previsto</span>
                <span>{formatCurrency(budgetedSavings)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brand-gray)]">Real</span>
                <span className={`font-semibold ${actualSavings >= 0 ? "text-[var(--brand-purple)]" : "text-[var(--danger)]"}`}>
                  {formatCurrency(actualSavings)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-[var(--border)]">
                <span className="text-[var(--brand-gray)]">Diferencia</span>
                <span className={actualSavings >= budgetedSavings ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                  {actualSavings >= budgetedSavings ? "+" : ""}{formatCurrency(actualSavings - budgetedSavings)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Charts Comparison */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">
              Distribución: Regla {ruleNeeds}/{ruleWants}/{ruleSavings}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Budgeted Distribution */}
              <div>
                <p className="text-sm text-[var(--brand-gray)] text-center mb-2">Previsto</p>
                {budgetedPieData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={budgetedPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {budgetedPieData.map((entry, index) => (
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
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-[var(--brand-gray)]">
                    Sin datos
                  </div>
                )}
              </div>

              {/* Actual Distribution */}
              <div>
                <p className="text-sm text-[var(--brand-gray)] text-center mb-2">Real</p>
                {actualPieData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={actualPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {actualPieData.map((entry, index) => (
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
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-[var(--brand-gray)]">
                    Sin datos
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                <span className="text-sm">Necesidades</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <span className="text-sm">Deseos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                <span className="text-sm">Ahorro</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Comparison */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Comparativa General</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--brand-gray)" />
                  <YAxis stroke="var(--brand-gray)" tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Previsto" fill="#6b7280" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Real" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Rule Compliance */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Cumplimiento de tu Regla {ruleNeeds}/{ruleWants}/{ruleSavings}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Needs */}
            <div className={`p-4 rounded-lg ${needsPercent <= ruleNeeds ? "bg-[var(--success)]/10" : "bg-[var(--danger)]/10"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Necesidades</span>
                {needsPercent <= ruleNeeds ? (
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
                )}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{needsPercent}%</span>
                <span className="text-sm text-[var(--brand-gray)] mb-1">/ {ruleNeeds}%</span>
              </div>
              <p className="text-sm text-[var(--brand-gray)] mt-1">
                {formatCurrency(needsActual)} de {formatCurrency(totalActualIncome)}
              </p>
            </div>

            {/* Wants */}
            <div className={`p-4 rounded-lg ${wantsPercent <= ruleWants ? "bg-[var(--success)]/10" : "bg-[var(--danger)]/10"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Deseos</span>
                {wantsPercent <= ruleWants ? (
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
                )}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{wantsPercent}%</span>
                <span className="text-sm text-[var(--brand-gray)] mb-1">/ {ruleWants}%</span>
              </div>
              <p className="text-sm text-[var(--brand-gray)] mt-1">
                {formatCurrency(wantsActual)} de {formatCurrency(totalActualIncome)}
              </p>
            </div>

            {/* Savings */}
            <div className={`p-4 rounded-lg ${savingsPercent >= ruleSavings ? "bg-[var(--success)]/10" : "bg-[var(--warning)]/10"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Ahorro</span>
                {savingsPercent >= ruleSavings ? (
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
                )}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{savingsPercent}%</span>
                <span className="text-sm text-[var(--brand-gray)] mb-1">/ {ruleSavings}%</span>
              </div>
              <p className="text-sm text-[var(--brand-gray)] mt-1">
                {formatCurrency(actualSavings)} de {formatCurrency(totalActualIncome)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        {loading ? (
          <div className="card p-8 text-center text-[var(--brand-gray)]">
            Cargando datos...
          </div>
        ) : data.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-[var(--brand-gray)] mb-2">No hay datos para comparar</p>
            <p className="text-sm text-[var(--brand-gray)]">
              Crea un presupuesto en la sección de Previsión y registra operaciones para ver la comparativa
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Income Table */}
            {incomeData.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--success)]/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                      Ingresos
                    </h3>
                    <div className="text-right">
                      <span className="text-sm text-[var(--brand-gray)]">Real: </span>
                      <span className="font-bold text-[var(--success)]">{formatCurrency(totalActualIncome)}</span>
                      <span className="text-sm text-[var(--brand-gray)]"> / Previsto: </span>
                      <span className="font-medium">{formatCurrency(totalBudgetedIncome)}</span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {incomeData.map(renderComparisonRow)}
                </div>
              </div>
            )}

            {/* Expenses by Segment */}
            {needsData.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--success)]/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Necesidades</h3>
                    <div className="text-right">
                      <span className="text-sm text-[var(--brand-gray)]">Real: </span>
                      <span className="font-bold">{formatCurrency(needsActual)}</span>
                      <span className="text-sm text-[var(--brand-gray)]"> / Previsto: </span>
                      <span className="font-medium">{formatCurrency(needsBudgeted)}</span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {needsData.map(renderComparisonRow)}
                </div>
              </div>
            )}

            {wantsData.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--warning)]/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Deseos</h3>
                    <div className="text-right">
                      <span className="text-sm text-[var(--brand-gray)]">Real: </span>
                      <span className="font-bold">{formatCurrency(wantsActual)}</span>
                      <span className="text-sm text-[var(--brand-gray)]"> / Previsto: </span>
                      <span className="font-medium">{formatCurrency(wantsBudgeted)}</span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {wantsData.map(renderComparisonRow)}
                </div>
              </div>
            )}

            {savingsSegmentData.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--brand-purple)]/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Ahorro planificado</h3>
                    <div className="text-right">
                      <span className="text-sm text-[var(--brand-gray)]">Real: </span>
                      <span className="font-bold text-[var(--brand-purple)]">{formatCurrency(savingsSegmentActual)}</span>
                      <span className="text-sm text-[var(--brand-gray)]"> / Previsto: </span>
                      <span className="font-medium">{formatCurrency(savingsSegmentBudgeted)}</span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {savingsSegmentData.map(renderComparisonRow)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
