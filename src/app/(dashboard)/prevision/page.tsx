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
  AlertTriangle,
  X,
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

  // Planned savings state
  const [plannedSavings, setPlannedSavings] = useState<number>(0);
  const [editingPlannedSavings, setEditingPlannedSavings] = useState(false);
  const [plannedSavingsValue, setPlannedSavingsValue] = useState<string>("");

  // Delete confirmation modal
  const [showDeleteBudgetModal, setShowDeleteBudgetModal] = useState(false);

  const supabase = createClient();
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;

  // Get decimals preference from profile
  const showDecimals = profile?.show_decimals ?? true;

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

    // Fetch planned savings for selected month
    const { data: plannedSavingsData } = await supabase
      .from("planned_savings")
      .select("amount")
      .eq("user_id", user.id)
      .eq("year", selectedYear)
      .eq("month", selectedMonth)
      .single();

    if (plannedSavingsData) {
      setPlannedSavings(plannedSavingsData.amount);
    } else {
      setPlannedSavings(0);
    }

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
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
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
  // Use plannedSavings configured by user instead of calculating from difference
  const totalSavings = plannedSavings;
  // Calculate available balance (what's left after expenses and planned savings)
  const availableBalance = totalIncome - totalExpenses - plannedSavings;

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
  const savingsPercent = totalIncome > 0 ? Math.round((plannedSavings / totalIncome) * 100) : 0;

  // Calculate deviation in euros
  const ruleNeeds = profile?.rule_needs_percent || 50;
  const ruleWants = profile?.rule_wants_percent || 30;
  const ruleSavings = profile?.rule_savings_percent || 20;

  const needsTarget = totalIncome * ruleNeeds / 100;
  const wantsTarget = totalIncome * ruleWants / 100;
  const savingsTarget = totalIncome * ruleSavings / 100;

  const needsDeviation = needsTotal - needsTarget;
  const wantsDeviation = wantsTotal - wantsTarget;
  const savingsDeviation = plannedSavings - savingsTarget;

  // Start editing planned savings
  const startEditingPlannedSavings = () => {
    setPlannedSavingsValue(plannedSavings.toString());
    setEditingPlannedSavings(true);
  };

  // Save planned savings edit
  const savePlannedSavingsEdit = () => {
    const newAmount = parseFloat(plannedSavingsValue) || 0;
    setPlannedSavings(newAmount);
    setEditingPlannedSavings(false);
    setHasChanges(true);
  };

  // Delete entire budget
  const deleteEntireBudget = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete all budgets for this month
    await supabase
      .from("budgets")
      .delete()
      .eq("user_id", user.id)
      .eq("year", selectedYear)
      .eq("month", selectedMonth);

    // Delete planned savings for this month
    await supabase
      .from("planned_savings")
      .delete()
      .eq("user_id", user.id)
      .eq("year", selectedYear)
      .eq("month", selectedMonth);

    setShowDeleteBudgetModal(false);
    setBudgets([]);
    setPlannedSavings(0);
    setHasBudget(false);
    setHasChanges(false);
  };

  // Check if budget is effectively empty
  const isBudgetEmpty = budgets.length === 0 && plannedSavings === 0;

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

    // Also copy planned savings
    const { data: prevPlannedSavings } = await supabase
      .from("planned_savings")
      .select("amount")
      .eq("user_id", user.id)
      .eq("year", prevYear)
      .eq("month", prevMonth)
      .single();

    if ((prevBudgets && prevBudgets.length > 0) || prevPlannedSavings) {
      if (prevBudgets && prevBudgets.length > 0) {
        const newBudgets = prevBudgets.map(b => ({
          ...b,
          id: undefined,
          year: selectedYear,
          month: selectedMonth,
        }));
        setBudgets(newBudgets as BudgetWithCategory[]);
      }
      if (prevPlannedSavings) {
        setPlannedSavings(prevPlannedSavings.amount);
      }
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
    // Check if budget is empty - if so, return to empty state
    if (isBudgetEmpty) {
      await deleteEntireBudget();
      return;
    }

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

    // Delete existing planned savings for this month
    await supabase
      .from("planned_savings")
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

    let hasError = false;

    if (budgetsToInsert.length > 0) {
      const { error } = await supabase
        .from("budgets")
        .insert(budgetsToInsert);

      if (error) {
        console.error("Error saving budgets:", error);
        hasError = true;
      }
    }

    // Insert planned savings
    if (plannedSavings > 0) {
      const { error } = await supabase
        .from("planned_savings")
        .insert({
          user_id: user.id,
          amount: plannedSavings,
          month: selectedMonth,
          year: selectedYear,
        });

      if (error) {
        console.error("Error saving planned savings:", error);
        hasError = true;
      }
    }

    if (hasError) {
      alert("Error al guardar el presupuesto");
    } else {
      setHasChanges(false);
      fetchData();
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
                {hasBudget && totalIncome > 0 && (
                  <p className="text-xs text-[var(--brand-gray)] mt-1">
                    {Math.round((totalExpenses / totalIncome) * 100)}% de tus ingresos
                  </p>
                )}
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
                <p className={`text-xl font-bold ${plannedSavings >= 0 ? "text-[var(--brand-purple)]" : "text-[var(--danger)]"}`}>
                  {formatCurrency(plannedSavings)}
                </p>
                {hasBudget && totalIncome > 0 && (
                  <p className="text-xs text-[var(--brand-gray)] mt-1">
                    {savingsPercent}% de tus ingresos
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-[var(--brand-purple)]/10">
                <PiggyBank className="w-5 h-5 text-[var(--brand-purple)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Balance warning if negative */}
        {hasBudget && availableBalance < 0 && (
          <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--danger)]">Tu presupuesto no cuadra</p>
              <p className="text-sm text-[var(--foreground)]">
                Tus gastos previstos ({formatCurrency(totalExpenses)}) + ahorro previsto ({formatCurrency(plannedSavings)}) superan tus ingresos previstos ({formatCurrency(totalIncome)}) en <strong>{formatCurrency(Math.abs(availableBalance))}</strong>.
              </p>
            </div>
          </div>
        )}

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

              {/* Planned Savings Panel - User defined savings */}
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--brand-purple)]/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <PiggyBank className="w-5 h-5 text-[var(--brand-purple)]" />
                      Ahorro previsto ({ruleSavings}%)
                    </h3>
                    <div className="text-right">
                      <span className="text-lg font-bold text-[var(--brand-purple)]">
                        {formatCurrency(plannedSavings)}
                      </span>
                      {totalIncome > 0 && (
                        <span className={`text-sm ml-2 ${savingsPercent >= ruleSavings ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                          ({savingsPercent}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {editingPlannedSavings ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-sm text-[var(--brand-gray)] mb-2">
                          Importe de ahorro mensual previsto
                        </label>
                        <input
                          type="number"
                          value={plannedSavingsValue}
                          onChange={(e) => setPlannedSavingsValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") savePlannedSavingsEdit();
                            if (e.key === "Escape") setEditingPlannedSavings(false);
                          }}
                          className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--brand-cyan)] rounded-lg text-lg font-semibold focus:outline-none"
                          autoFocus
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <button
                        onClick={savePlannedSavingsEdit}
                        className="p-3 rounded-lg bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--brand-gray)]">
                          Define cuánto quieres ahorrar este mes
                        </p>
                        {totalIncome > 0 && (
                          <p className="text-xs text-[var(--brand-gray)] mt-1">
                            Objetivo según tu regla: {formatCurrency(savingsTarget)} ({ruleSavings}% de {formatCurrency(totalIncome)})
                          </p>
                        )}
                      </div>
                      <button
                        onClick={startEditingPlannedSavings}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] hover:bg-[var(--brand-purple)]/20 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Savings segment (if any expense categories are marked as savings) */}
              {savingsBudgets.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--brand-cyan)]/5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Gastos de ahorro</h3>
                      <span className="text-lg font-bold text-[var(--brand-cyan)]">
                        {formatCurrency(savingsTotal)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--brand-gray)] mt-1">
                      Categorías de gasto etiquetadas como ahorro
                    </p>
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
              <>
                {/* Backdrop to close on click outside */}
                <div
                  className="fixed inset-0 z-[5]"
                  onClick={() => setShowAddCategory(false)}
                />
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
                        <span className="ml-auto text-xs text-[var(--brand-gray)]">
                          {cat.type === "income" ? "Ingreso" :
                            cat.segment === "needs" ? "Necesidades" :
                            cat.segment === "wants" ? "Deseos" :
                            cat.segment === "savings" ? "Ahorro" : "Gasto"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
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
                  Objetivo: {formatCurrency(needsTarget)} ({ruleNeeds}%)
                </p>
                <p className="text-sm">
                  Previsto: <span className="font-semibold">{formatCurrency(needsTotal)}</span> ({needsPercent}%)
                </p>
                <p className={`text-sm font-semibold mt-2 ${needsPercent <= ruleNeeds ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {needsDeviation === 0 ? (
                    "En el objetivo"
                  ) : needsDeviation < 0 ? (
                    <>-{Math.abs(needsPercent - ruleNeeds)}% / {formatCurrency(Math.abs(needsDeviation))}</>
                  ) : (
                    <>+{needsPercent - ruleNeeds}% / +{formatCurrency(needsDeviation)}</>
                  )}
                </p>
                <p className="text-xs text-[var(--brand-gray)] mt-1">
                  {needsPercent <= ruleNeeds ? "Por debajo del objetivo" : "Por encima del objetivo"}
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
                  Objetivo: {formatCurrency(wantsTarget)} ({ruleWants}%)
                </p>
                <p className="text-sm">
                  Previsto: <span className="font-semibold">{formatCurrency(wantsTotal)}</span> ({wantsPercent}%)
                </p>
                <p className={`text-sm font-semibold mt-2 ${wantsPercent <= ruleWants ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {wantsDeviation === 0 ? (
                    "En el objetivo"
                  ) : wantsDeviation < 0 ? (
                    <>-{Math.abs(wantsPercent - ruleWants)}% / {formatCurrency(Math.abs(wantsDeviation))}</>
                  ) : (
                    <>+{wantsPercent - ruleWants}% / +{formatCurrency(wantsDeviation)}</>
                  )}
                </p>
                <p className="text-xs text-[var(--brand-gray)] mt-1">
                  {wantsPercent <= ruleWants ? "Por debajo del objetivo" : "Por encima del objetivo"}
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
                  Objetivo: {formatCurrency(savingsTarget)} ({ruleSavings}%)
                </p>
                <p className="text-sm">
                  Previsto: <span className="font-semibold">{formatCurrency(plannedSavings)}</span> ({savingsPercent}%)
                </p>
                <p className={`text-sm font-semibold mt-2 ${savingsPercent >= ruleSavings ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                  {savingsDeviation === 0 ? (
                    "En el objetivo"
                  ) : savingsDeviation > 0 ? (
                    <>+{savingsPercent - ruleSavings}% / +{formatCurrency(savingsDeviation)}</>
                  ) : (
                    <>-{Math.abs(savingsPercent - ruleSavings)}% / {formatCurrency(Math.abs(savingsDeviation))}</>
                  )}
                </p>
                <p className="text-xs text-[var(--brand-gray)] mt-1">
                  {savingsPercent >= ruleSavings ? "Por encima del objetivo" : "Por debajo del objetivo"}
                </p>
              </div>
            </div>

            {/* AI Message */}
            {(needsPercent > ruleNeeds || wantsPercent > ruleWants || savingsPercent < ruleSavings) && (
              <div className="mt-4 p-4 rounded-lg bg-[var(--brand-purple)]/5 border border-[var(--brand-purple)]/20">
                <p className="text-sm text-[var(--foreground)]">
                  <strong className="text-[var(--brand-purple)]">Consejo:</strong>{" "}
                  {needsPercent > ruleNeeds && (
                    <>Tus necesidades superan tu objetivo en {formatCurrency(needsDeviation)} (+{needsPercent - ruleNeeds}%). </>
                  )}
                  {wantsPercent > ruleWants && (
                    <>Tus deseos superan tu objetivo en {formatCurrency(wantsDeviation)} (+{wantsPercent - ruleWants}%). </>
                  )}
                  {savingsPercent < ruleSavings && (
                    <>Tu ahorro está {formatCurrency(Math.abs(savingsDeviation))} por debajo de tu meta (-{ruleSavings - savingsPercent}%). </>
                  )}
                  Si esto se repite varios meses, puede afectar tus objetivos de ahorro a largo plazo. Revisa si puedes ajustar alguna categoría.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Delete budget button */}
        {hasBudget && !hasChanges && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowDeleteBudgetModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar presupuesto del mes
            </button>
          </div>
        )}

        {/* Save button */}
        {hasChanges && (
          <div className="sticky bottom-6">
            <button
              onClick={saveAllBudgets}
              disabled={saving || isBudgetEmpty}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl gradient-brand text-white font-medium text-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? "Guardando..." : isBudgetEmpty ? "Sin datos para guardar" : "Guardar Previsión"}
            </button>
          </div>
        )}
      </div>

      {/* Delete Budget Confirmation Modal */}
      {showDeleteBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--danger)]">Eliminar presupuesto</h2>
              <button
                onClick={() => setShowDeleteBudgetModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-full bg-[var(--danger)]/10">
                  <AlertTriangle className="w-6 h-6 text-[var(--danger)]" />
                </div>
                <div>
                  <p className="font-medium mb-2">
                    ¿Eliminar el presupuesto de {format(selectedDate, "MMMM yyyy", { locale: es })}?
                  </p>
                  <p className="text-sm text-[var(--brand-gray)]">
                    Se eliminarán todos los importes previstos de ingresos, gastos y ahorro para este mes. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteBudgetModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteEntireBudget}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--danger)] text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
