"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Save,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { format, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "savings";
  segment: "needs" | "wants" | "savings" | null;
  is_active: boolean;
}

interface Budget {
  id?: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
}

interface BudgetWithCategory extends Budget {
  category: Category;
}

export default function PrevisionPage() {
  const { profile } = useProfile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasBudget, setHasBudget] = useState(false);

  const supabase = createClient();
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;

  // Fetch categories and budgets
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch active categories (income and expense)
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("type", ["income", "expense"])
      .order("type")
      .order("name");

    if (categoriesData) {
      setCategories(categoriesData);
    }

    // Fetch budgets for selected month
    const { data: budgetsData } = await supabase
      .from("budgets")
      .select(`
        *,
        category:categories(*)
      `)
      .eq("user_id", user.id)
      .eq("year", selectedYear)
      .eq("month", selectedMonth);

    if (budgetsData && budgetsData.length > 0) {
      setBudgets(budgetsData as BudgetWithCategory[]);
      setHasBudget(true);
    } else {
      setBudgets([]);
      setHasBudget(false);
    }

    setLoading(false);
    setHasChanges(false);
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
    setSelectedDate(addMonths(selectedDate, 1));
  };

  // Calculate totals
  const incomeBudgets = budgets.filter(b => b.category?.type === "income");
  const expenseBudgets = budgets.filter(b => b.category?.type === "expense");

  const totalIncome = incomeBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalExpenses = expenseBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSavings = totalIncome - totalExpenses;

  // Calculate by segment
  const needsBudgets = expenseBudgets.filter(b => b.category?.segment === "needs");
  const wantsBudgets = expenseBudgets.filter(b => b.category?.segment === "wants");
  const savingsBudgets = expenseBudgets.filter(b => b.category?.segment === "savings");

  const needsTotal = needsBudgets.reduce((sum, b) => sum + b.amount, 0);
  const wantsTotal = wantsBudgets.reduce((sum, b) => sum + b.amount, 0);
  const savingsTotal = savingsBudgets.reduce((sum, b) => sum + b.amount, 0);

  // Calculate percentages vs rule
  const needsPercent = totalIncome > 0 ? Math.round((needsTotal / totalIncome) * 100) : 0;
  const wantsPercent = totalIncome > 0 ? Math.round((wantsTotal / totalIncome) * 100) : 0;
  const savingsPercent = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

  const ruleNeeds = profile?.rule_needs_percent || 50;
  const ruleWants = profile?.rule_wants_percent || 30;
  const ruleSavings = profile?.rule_savings_percent || 20;

  // Copy from previous month
  const copyFromPreviousMonth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const prevDate = subMonths(selectedDate, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;

    const { data: prevBudgets } = await supabase
      .from("budgets")
      .select(`*, category:categories(*)`)
      .eq("user_id", user.id)
      .eq("year", prevYear)
      .eq("month", prevMonth);

    if (prevBudgets && prevBudgets.length > 0) {
      const newBudgets = prevBudgets.map(b => ({
        ...b,
        id: undefined,
        year: selectedYear,
        month: selectedMonth,
      }));
      setBudgets(newBudgets as BudgetWithCategory[]);
      setHasChanges(true);
      setHasBudget(true);
    } else {
      alert("No hay presupuesto del mes anterior para copiar");
    }
  };

  // Create new budget from all active categories
  const createNewBudget = () => {
    const newBudgets: BudgetWithCategory[] = categories.map(cat => ({
      category_id: cat.id,
      amount: 0,
      month: selectedMonth,
      year: selectedYear,
      category: cat,
    }));
    setBudgets(newBudgets);
    setHasChanges(true);
    setHasBudget(true);
  };

  // Add category to budget
  const addCategoryToBudget = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const exists = budgets.find(b => b.category_id === categoryId);
    if (exists) return;

    const newBudget: BudgetWithCategory = {
      category_id: categoryId,
      amount: 0,
      month: selectedMonth,
      year: selectedYear,
      category: category,
    };

    setBudgets([...budgets, newBudget]);
    setHasChanges(true);
    setShowAddCategory(false);
  };

  // Remove category from budget
  const removeCategoryFromBudget = (categoryId: string) => {
    setBudgets(budgets.filter(b => b.category_id !== categoryId));
    setHasChanges(true);
  };

  // Start editing
  const startEditing = (categoryId: string, currentAmount: number) => {
    setEditingBudget(categoryId);
    setEditValue(currentAmount.toString());
  };

  // Save edit
  const saveEdit = (categoryId: string) => {
    const newAmount = parseFloat(editValue) || 0;
    setBudgets(budgets.map(b =>
      b.category_id === categoryId ? { ...b, amount: newAmount } : b
    ));
    setEditingBudget(null);
    setHasChanges(true);
  };

  // Save all budgets
  const saveAllBudgets = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete existing budgets for this month
    await supabase
      .from("budgets")
      .delete()
      .eq("user_id", user.id)
      .eq("year", selectedYear)
      .eq("month", selectedMonth);

    // Insert new budgets (only those with amount > 0 or explicitly set)
    const budgetsToInsert = budgets.map(b => ({
      user_id: user.id,
      category_id: b.category_id,
      amount: b.amount,
      month: selectedMonth,
      year: selectedYear,
    }));

    if (budgetsToInsert.length > 0) {
      const { error } = await supabase
        .from("budgets")
        .insert(budgetsToInsert);

      if (error) {
        console.error("Error saving budgets:", error);
        alert("Error al guardar el presupuesto");
      } else {
        setHasChanges(false);
        fetchData();
      }
    }

    setSaving(false);
  };

  // Get categories not in budget
  const availableCategories = categories.filter(
    c => !budgets.find(b => b.category_id === c.id)
  );

  // Render budget row
  const renderBudgetRow = (budget: BudgetWithCategory) => {
    const isEditing = editingBudget === budget.category_id;

    return (
      <div
        key={budget.category_id}
        className="flex items-center gap-4 p-4 hover:bg-[var(--background-secondary)] transition-colors"
      >
        {/* Category icon and name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="text-xl"
            style={{ color: budget.category?.color }}
          >
            {budget.category?.icon}
          </span>
          <div className="min-w-0">
            <p className="font-medium truncate">{budget.category?.name}</p>
            <p className="text-xs text-[var(--brand-gray)] capitalize">
              {budget.category?.segment === "needs" && "Necesidad"}
              {budget.category?.segment === "wants" && "Deseo"}
              {budget.category?.segment === "savings" && "Ahorro"}
              {!budget.category?.segment && budget.category?.type === "income" && "Ingreso"}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(budget.category_id);
                  if (e.key === "Escape") setEditingBudget(null);
                }}
                className="w-32 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--brand-cyan)] rounded-lg text-right font-semibold focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => saveEdit(budget.category_id)}
                className="p-2 rounded-lg bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <span className={`font-semibold ${budget.category?.type === "income" ? "text-[var(--success)]" : ""}`}>
                {formatCurrency(budget.amount)}
              </span>
              <button
                onClick={() => startEditing(budget.category_id, budget.amount)}
                className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <Edit2 className="w-4 h-4 text-[var(--brand-gray)]" />
              </button>
              <button
                onClick={() => removeCategoryFromBudget(budget.category_id)}
                className="p-2 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-[var(--danger)]" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Header
        title="Previsión"
        subtitle="Configura tu presupuesto mensual por categorías"
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
              className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Ingresos previstos</p>
                <p className="text-xl font-bold text-[var(--success)]">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <TrendingUp className="w-5 h-5 text-[var(--success)]" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Gastos previstos</p>
                <p className="text-xl font-bold text-[var(--danger)]">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--danger)]/10">
                <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Ahorro previsto</p>
                <p className={`text-xl font-bold ${totalSavings >= 0 ? "text-[var(--brand-purple)]" : "text-[var(--danger)]"}`}>
                  {formatCurrency(totalSavings)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--brand-purple)]/10">
                <PiggyBank className="w-5 h-5 text-[var(--brand-purple)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!hasBudget && !loading && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--background-secondary)] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[var(--brand-gray)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay presupuesto para este mes</h3>
            <p className="text-[var(--brand-gray)] mb-6">
              Crea tu presupuesto mensual para planificar tus finanzas
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={createNewBudget}
                className="flex items-center gap-2 px-6 py-3 rounded-lg gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Crear presupuesto
              </button>
              <button
                onClick={copyFromPreviousMonth}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copiar del mes anterior
              </button>
            </div>
          </div>
        )}

        {/* Budget tables */}
        {hasBudget && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income budgets */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--success)]/5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                    Ingresos previstos
                  </h3>
                  <span className="text-lg font-bold text-[var(--success)]">
                    {formatCurrency(totalIncome)}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {incomeBudgets.length > 0 ? (
                  incomeBudgets.map(renderBudgetRow)
                ) : (
                  <div className="p-6 text-center text-[var(--brand-gray)]">
                    No hay categorías de ingresos
                  </div>
                )}
              </div>
            </div>

            {/* Expense budgets by segment */}
            <div className="space-y-6">
              {/* Needs */}
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--success)]/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Necesidades ({ruleNeeds}%)</h3>
                    <div className="text-right">
                      <span className="text-lg font-bold">{formatCurrency(needsTotal)}</span>
                      <span className={`text-sm ml-2 ${needsPercent <= ruleNeeds ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        ({needsPercent}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {needsBudgets.length > 0 ? (
                    needsBudgets.map(renderBudgetRow)
                  ) : (
                    <div className="p-4 text-center text-sm text-[var(--brand-gray)]">
                      Sin categorías de necesidades
                    </div>
                  )}
                </div>
              </div>

              {/* Wants */}
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--warning)]/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Deseos ({ruleWants}%)</h3>
                    <div className="text-right">
                      <span className="text-lg font-bold">{formatCurrency(wantsTotal)}</span>
                      <span className={`text-sm ml-2 ${wantsPercent <= ruleWants ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        ({wantsPercent}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {wantsBudgets.length > 0 ? (
                    wantsBudgets.map(renderBudgetRow)
                  ) : (
                    <div className="p-4 text-center text-sm text-[var(--brand-gray)]">
                      Sin categorías de deseos
                    </div>
                  )}
                </div>
              </div>

              {/* Savings segment (if any expense categories are marked as savings) */}
              {savingsBudgets.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--brand-purple)]/5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Ahorro planificado</h3>
                      <span className="text-lg font-bold text-[var(--brand-purple)]">
                        {formatCurrency(savingsTotal)}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {savingsBudgets.map(renderBudgetRow)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add category button */}
        {hasBudget && availableCategories.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[var(--border)] text-[var(--brand-gray)] hover:border-[var(--brand-cyan)] hover:text-[var(--brand-cyan)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Añadir categoría al presupuesto
            </button>

            {showAddCategory && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-10">
                <div className="p-3 border-b border-[var(--border)]">
                  <p className="text-sm font-medium">Selecciona una categoría</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {availableCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => addCategoryToBudget(cat.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-secondary)] transition-colors"
                    >
                      <span style={{ color: cat.color }}>{cat.icon}</span>
                      <span>{cat.name}</span>
                      <span className="ml-auto text-xs text-[var(--brand-gray)] capitalize">
                        {cat.type === "income" ? "Ingreso" : cat.segment || "Gasto"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rule comparison card */}
        {hasBudget && totalIncome > 0 && (
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[var(--brand-purple)]/10">
                <Sparkles className="w-5 h-5 text-[var(--brand-purple)]" />
              </div>
              <div>
                <h3 className="font-semibold">Comparativa con tu regla {ruleNeeds}/{ruleWants}/{ruleSavings}</h3>
                <p className="text-sm text-[var(--brand-gray)]">
                  Según tus ingresos previstos de {formatCurrency(totalIncome)}, deberías destinar:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Needs comparison */}
              <div className={`p-4 rounded-lg ${needsPercent <= ruleNeeds ? "bg-[var(--success)]/10" : "bg-[var(--danger)]/10"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Necesidades</span>
                  {needsPercent <= ruleNeeds ? (
                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[var(--danger)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--brand-gray)]">
                  Objetivo: {formatCurrency(totalIncome * ruleNeeds / 100)}
                </p>
                <p className="text-sm">
                  Previsto: <span className="font-semibold">{formatCurrency(needsTotal)}</span>
                </p>
                <p className={`text-xs mt-1 ${needsPercent <= ruleNeeds ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {needsPercent <= ruleNeeds
                    ? `${ruleNeeds - needsPercent} puntos por debajo`
                    : `${needsPercent - ruleNeeds} puntos por encima`
                  }
                </p>
              </div>

              {/* Wants comparison */}
              <div className={`p-4 rounded-lg ${wantsPercent <= ruleWants ? "bg-[var(--success)]/10" : "bg-[var(--danger)]/10"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Deseos</span>
                  {wantsPercent <= ruleWants ? (
                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[var(--danger)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--brand-gray)]">
                  Objetivo: {formatCurrency(totalIncome * ruleWants / 100)}
                </p>
                <p className="text-sm">
                  Previsto: <span className="font-semibold">{formatCurrency(wantsTotal)}</span>
                </p>
                <p className={`text-xs mt-1 ${wantsPercent <= ruleWants ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {wantsPercent <= ruleWants
                    ? `${ruleWants - wantsPercent} puntos por debajo`
                    : `${wantsPercent - ruleWants} puntos por encima`
                  }
                </p>
              </div>

              {/* Savings comparison */}
              <div className={`p-4 rounded-lg ${savingsPercent >= ruleSavings ? "bg-[var(--success)]/10" : "bg-[var(--warning)]/10"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Ahorro</span>
                  {savingsPercent >= ruleSavings ? (
                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[var(--warning)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--brand-gray)]">
                  Objetivo: {formatCurrency(totalIncome * ruleSavings / 100)}
                </p>
                <p className="text-sm">
                  Previsto: <span className="font-semibold">{formatCurrency(totalSavings)}</span>
                </p>
                <p className={`text-xs mt-1 ${savingsPercent >= ruleSavings ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                  {savingsPercent >= ruleSavings
                    ? `${savingsPercent - ruleSavings} puntos por encima`
                    : `${ruleSavings - savingsPercent} puntos por debajo`
                  }
                </p>
              </div>
            </div>

            {/* AI Message */}
            {(needsPercent > ruleNeeds || wantsPercent > ruleWants || savingsPercent < ruleSavings) && (
              <div className="mt-4 p-4 rounded-lg bg-[var(--brand-purple)]/5 border border-[var(--brand-purple)]/20">
                <p className="text-sm text-[var(--foreground)]">
                  <strong className="text-[var(--brand-purple)]">Mensaje personalizado:</strong>{" "}
                  {needsPercent > ruleNeeds && `Tu presupuesto de necesidades está ${needsPercent - ruleNeeds} puntos por encima de tu regla. `}
                  {wantsPercent > ruleWants && `Tu presupuesto de deseos está ${wantsPercent - ruleWants} puntos por encima. `}
                  {savingsPercent < ruleSavings && `Tu ahorro previsto está ${ruleSavings - savingsPercent} puntos por debajo de tu objetivo. `}
                  No pasa nada si es algo puntual, pero si se repite varios meses puede afectar a tus objetivos de ahorro a largo plazo.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        {hasChanges && (
          <div className="sticky bottom-6">
            <button
              onClick={saveAllBudgets}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl gradient-brand text-white font-medium text-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? "Guardando..." : "Guardar Previsión"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
