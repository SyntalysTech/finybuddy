"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  GripVertical,
  Settings,
  ChevronDown,
  ChevronUp,
  BarChart3,
  History,
} from "lucide-react";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Cell,
  ReferenceLine,
  Label,
} from "recharts";
import { format, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import FinyInfoPanel from "@/components/ui/FinyInfoPanel";
import ProGate from "@/components/subscription/ProGate";

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

function PrevisionPageContent() {
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
  const [hasBudget, setHasBudget] = useState(false);  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    income: true,
    needs: true,
    wants: true,
    savings: true,
  });
  const [isRuleExpanded, setIsRuleExpanded] = useState(true);
  const [showHistoryCategory, setShowHistoryCategory] = useState<Category | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("finybuddy_prevision_expanded");
      if (saved) {
        setExpandedSections(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error reading expanded sections from localStorage");
    }
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newState = { ...prev, [section]: !prev[section] };
      try {
        localStorage.setItem("finybuddy_prevision_expanded", JSON.stringify(newState));
      } catch (e) {
        console.error("Error saving expanded sections to localStorage");
      }
      return newState;
    });
  };

  // Delete confirmation modal
  const [showDeleteBudgetModal, setShowDeleteBudgetModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  // Check if adjacent months have budget
  const [hasPreviousMonthBudget, setHasPreviousMonthBudget] = useState(false);
  const [hasNextMonthBudget, setHasNextMonthBudget] = useState(false);

  // Drag & drop state
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);

  const supabase = createClient();
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;

  // Get decimals preference from profile
  const showDecimals = profile?.show_decimals ?? true;

  // Fetch categories and budgets
  const fetchData = useCallback(async () => {
    // setLoading(true); // Removido para evitar parpadeo y pérdida de scroll
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch active categories (income, expense, and savings)
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("type", ["income", "expense", "savings"])
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

    // Check if previous month has budget
    const prevDate = subMonths(new Date(selectedYear, selectedMonth - 1), 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;

    const { data: prevBudgetsData } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("year", prevYear)
      .eq("month", prevMonth)
      .limit(1);

    const { data: prevPlannedSavingsData } = await supabase
      .from("planned_savings")
      .select("id")
      .eq("user_id", user.id)
      .eq("year", prevYear)
      .eq("month", prevMonth)
      .limit(1);

    setHasPreviousMonthBudget(
      Boolean((prevBudgetsData && prevBudgetsData.length > 0) ||
        (prevPlannedSavingsData && prevPlannedSavingsData.length > 0))
    );

    // Check if next month has budget
    const nextDate = addMonths(new Date(selectedYear, selectedMonth - 1), 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = nextDate.getMonth() + 1;

    const { data: nextBudgetsData } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("year", nextYear)
      .eq("month", nextMonth)
      .limit(1);

    const { data: nextPlannedSavingsData } = await supabase
      .from("planned_savings")
      .select("id")
      .eq("user_id", user.id)
      .eq("year", nextYear)
      .eq("month", nextMonth)
      .limit(1);

    setHasNextMonthBudget(
      Boolean((nextBudgetsData && nextBudgetsData.length > 0) ||
        (nextPlannedSavingsData && nextPlannedSavingsData.length > 0))
    );

    setLoading(false);
    setHasChanges(false);
  }, [selectedYear, selectedMonth, supabase]);

  const fetchCategoryHistory = async (category: Category) => {
    setLoadingHistory(true);
    setShowHistoryCategory(category);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoadingHistory(false);
      return;
    }

    const months: any[] = [];
    const today = new Date();

    for (let i = 3; i >= 0; i--) {
      const d = subMonths(today, i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthLabel = format(d, "MMM", { locale: es });

      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);

      months.push({
        year,
        month,
        monthLabel,
        startDate: format(start, "yyyy-MM-01"),
        endDate: format(end, "yyyy-MM-dd"),
        amount: 0
      });
    }

    const startDate = months[0].startDate;
    const endDate = months[months.length - 1].endDate;

    const { data: operations, error } = await supabase
      .from("operations")
      .select("amount, operation_date")
      .eq("user_id", user.id)
      .eq("category_id", category.id)
      .gte("operation_date", startDate)
      .lte("operation_date", endDate);

    if (error) {
      console.error("Error fetching operations history:", error);
      setLoadingHistory(false);
      return;
    }

    const processedData = months.map(m => {
      const totalAmount = operations?.reduce((sum, op) => {
        const opDate = new Date(op.operation_date);
        if (opDate.getMonth() + 1 === m.month && opDate.getFullYear() === m.year) {
          return sum + Number(op.amount);
        }
        return sum;
      }, 0) || 0;

      return {
        name: m.monthLabel.charAt(0).toUpperCase() + m.monthLabel.slice(1),
        amount: totalAmount
      };
    });

    const sum = processedData.reduce((s, d) => s + d.amount, 0);
    const average = sum / 4;

    const dataWithAverage = processedData.map(d => ({
      ...d,
      average: Number(average.toFixed(2))
    }));

    setHistoryData(dataWithAverage);
    setLoadingHistory(false);
  };

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
  const savingsBudgets = budgets.filter(b => b.category?.type === "savings");

  const totalIncome = incomeBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalExpenses = expenseBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSavings = savingsBudgets.reduce((sum, b) => sum + b.amount, 0);

  // Calculate available balance (what's left after expenses and savings)
  const availableBalance = totalIncome - totalExpenses - totalSavings;

  // Calculate by segment (expenses only)
  const needsBudgets = expenseBudgets.filter(b => b.category?.segment === "needs");
  const wantsBudgets = expenseBudgets.filter(b => b.category?.segment === "wants");

  const needsTotal = needsBudgets.reduce((sum, b) => sum + b.amount, 0);
  const wantsTotal = wantsBudgets.reduce((sum, b) => sum + b.amount, 0);
  const savingsTotal = totalSavings; // Using the type 'savings' instead of segment

  // Calculate percentages vs rule
  const needsPercent = totalIncome > 0 ? Math.round((needsTotal / totalIncome) * 100) : 0;
  const wantsPercent = totalIncome > 0 ? Math.round((wantsTotal / totalIncome) * 100) : 0;
  const savingsPercent = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

  // Calculate deviation in euros
  const ruleNeeds = profile?.rule_needs_percent ?? 50;
  const ruleWants = profile?.rule_wants_percent ?? 30;
  const ruleSavings = profile?.rule_savings_percent ?? 20;

  const needsTarget = totalIncome * ruleNeeds / 100;
  const wantsTarget = totalIncome * ruleWants / 100;
  const savingsTarget = totalIncome * ruleSavings / 100;

  const needsDeviation = needsTotal - needsTarget;
  const wantsDeviation = wantsTotal - wantsTarget;
  const savingsDeviation = totalSavings - savingsTarget;

  // Finy intelligent message - Dynamic messages based on budget data
  const getFinyDynamicMessages = (): string[] => {
    if (!hasBudget || loading) return [];

    const messages: string[] = [];

    // Check balance
    if (availableBalance < 0) {
      messages.push(`Tu previsión no cuadra. Te pasas ${formatCurrency(Math.abs(availableBalance))}. Revisa gastos o ahorro.`);
    } else if (availableBalance > totalIncome * 0.1) {
      messages.push(`Te quedan ${formatCurrency(availableBalance)} sin asignar. Puedes destinarlos al ahorro.`);
    }

    // Check savings
    if (savingsPercent < ruleSavings && totalSavings > 0) {
      // Mensaje eliminado por petición
    } else if (savingsPercent >= ruleSavings && totalSavings > 0) {
      // Mensaje eliminado por petición
    } else if (totalSavings === 0 && totalIncome > 0) {
      // Mensaje eliminado por petición
    }

    // Check needs
    if (needsPercent > ruleNeeds + 10) {
      // Mensaje eliminado por petición
    }

    // Check wants
    if (wantsPercent > ruleWants + 10) {
      // Mensaje eliminado por petición
    } else if (wantsPercent <= ruleWants && wantsTotal > 0) {
      // Mensaje eliminado por petición
    }

    // No budget set
    if (totalIncome === 0 && budgets.length === 0) {
      messages.push(`Sin previsión no hay control. Crea tu presupuesto para este mes.`);
    }

    return messages.length > 0 ? messages : [];
  };

  const finyDynamicMessages = getFinyDynamicMessages();



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

    setShowDeleteBudgetModal(false);
    setBudgets([]);
    setHasBudget(false);
    setHasChanges(false);
  };

  // Check if budget is effectively empty
  const isBudgetEmpty = budgets.length === 0;

  // Copy from previous month (with auto-save)
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
      // Insert budgets directly to database
      if (prevBudgets && prevBudgets.length > 0) {
        const budgetsToInsert = prevBudgets.map(b => ({
          user_id: user.id,
          category_id: b.category_id,
          amount: b.amount,
          month: selectedMonth,
          year: selectedYear,
        }));

        const { data: insertedBudgets, error } = await supabase
          .from("budgets")
          .insert(budgetsToInsert)
          .select();

        if (error) {
          console.error("Error copying budgets:", error);
          alert("Error al copiar el presupuesto");
          return;
        }

        const newBudgets = prevBudgets.map((b, index) => ({
          ...b,
          id: insertedBudgets[index]?.id,
          year: selectedYear,
          month: selectedMonth,
        }));
        setBudgets(newBudgets as BudgetWithCategory[]);
      }

      setHasBudget(true);
    } else {
      alert("No hay presupuesto del mes anterior para copiar");
    }
  };

  // Copy from next month
  const copyFromNextMonth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nextDate = addMonths(selectedDate, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = nextDate.getMonth() + 1;

    const { data: nextBudgets } = await supabase
      .from("budgets")
      .select(`*, category:categories(*)`)
      .eq("user_id", user.id)
      .eq("year", nextYear)
      .eq("month", nextMonth);

    if (nextBudgets && nextBudgets.length > 0) {
      if (nextBudgets && nextBudgets.length > 0) {
        const newBudgets = nextBudgets.map(b => ({
          ...b,
          id: undefined,
          year: selectedYear,
          month: selectedMonth,
        }));
        setBudgets(newBudgets as BudgetWithCategory[]);
      }
      setHasChanges(true);
      setHasBudget(true);
    } else {
      alert("No hay presupuesto del mes posterior para copiar");
    }
  };

  // Create new budget from all active categories (with auto-save)
  const createNewBudget = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newBudgets: BudgetWithCategory[] = categories.map(cat => ({
      category_id: cat.id,
      amount: 0,
      month: selectedMonth,
      year: selectedYear,
      category: cat,
    }));

    // Insert all budgets to database
    const budgetsToInsert = newBudgets.map(b => ({
      user_id: user.id,
      category_id: b.category_id,
      amount: 0,
      month: selectedMonth,
      year: selectedYear,
    }));

    const { data, error } = await supabase
      .from("budgets")
      .insert(budgetsToInsert)
      .select();

    if (error) {
      console.error("Error creating budget:", error);
      return;
    }

    // Update local state with IDs from database
    const budgetsWithIds = newBudgets.map((b, index) => ({
      ...b,
      id: data[index]?.id,
    }));

    setBudgets(budgetsWithIds);
    setHasBudget(true);
  };

  // Add category to budget (with auto-save)
  const addCategoryToBudget = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const exists = budgets.find(b => b.category_id === categoryId);
    if (exists) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert new budget directly to database
    const { data, error } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        category_id: categoryId,
        amount: 0,
        month: selectedMonth,
        year: selectedYear,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding category to budget:", error);
      return;
    }

    const newBudget: BudgetWithCategory = {
      id: data.id,
      category_id: categoryId,
      amount: 0,
      month: selectedMonth,
      year: selectedYear,
      category: category,
    };

    setBudgets([...budgets, newBudget]);
    setShowAddCategory(false);
  };

  // Remove category from budget - with confirmation modal
  const confirmRemoveCategoryFromBudget = async () => {
    if (!showDeleteCategoryModal) return;

    const categoryId = showDeleteCategoryModal;
    const budget = budgets.find(b => b.category_id === categoryId);

    // If budget has an ID (exists in DB), delete it
    if (budget?.id) {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budget.id);

      if (error) {
        console.error("Error deleting budget:", error);
        alert("Error al eliminar la categoría del presupuesto");
        setShowDeleteCategoryModal(null);
        return;
      }
    }

    // Update local state
    const newBudgets = budgets.filter(b => b.category_id !== categoryId);
    setBudgets(newBudgets);

    // Check if budget is now empty
    if (newBudgets.length === 0) {
      setHasBudget(false);
    }

    setShowDeleteCategoryModal(null);
  };

  // Start editing
  const startEditing = (categoryId: string, currentAmount: number) => {
    setEditingBudget(categoryId);
    setEditValue(currentAmount.toString());
  };

  // Save edit - immediate save to database
  const saveEdit = async (categoryId: string) => {
    const newAmount = parseFloat(editValue) || 0;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSavingCategory(categoryId);

    const budget = budgets.find(b => b.category_id === categoryId);

    try {
      if (budget?.id) {
        // Update existing budget
        const { error } = await supabase
          .from("budgets")
          .update({ amount: newAmount })
          .eq("id", budget.id);

        if (error) throw error;
      } else {
        // Insert new budget
        const { data, error } = await supabase
          .from("budgets")
          .insert({
            user_id: user.id,
            category_id: categoryId,
            amount: newAmount,
            month: selectedMonth,
            year: selectedYear,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state with the new ID
        setBudgets(budgets.map(b =>
          b.category_id === categoryId ? { ...b, id: data.id, amount: newAmount } : b
        ));
        setSavingCategory(null);
        setEditingBudget(null);
        return;
      }

      // Update local state
      setBudgets(budgets.map(b =>
        b.category_id === categoryId ? { ...b, amount: newAmount } : b
      ));
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Error al guardar el cambio");
    }

    setSavingCategory(null);
    setEditingBudget(null);
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

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategoryId(categoryId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", categoryId);
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    if (draggedCategoryId && draggedCategoryId !== categoryId) {
      setDragOverCategoryId(categoryId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCategoryId(null);
  };

  // Save reordered budgets immediately (without waiting for state update)
  const saveReorderedBudgets = async (reorderedBudgets: BudgetWithCategory[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete existing budgets for this month
    await supabase
      .from("budgets")
      .delete()
      .eq("user_id", user.id)
      .eq("year", selectedYear)
      .eq("month", selectedMonth);

    // Insert budgets in new order
    const budgetsToInsert = reorderedBudgets.map(b => ({
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
        console.error("Error saving reordered budgets:", error);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId: string, segment: "income" | "needs" | "wants" | "savings") => {
    e.preventDefault();
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }

    // Get budgets for this segment
    let segmentBudgets: BudgetWithCategory[];
    if (segment === "income") {
      segmentBudgets = budgets.filter(b => b.category?.type === "income");
    } else if (segment === "savings") {
      segmentBudgets = budgets.filter(b => b.category?.type === "savings");
    } else {
      segmentBudgets = budgets.filter(b => b.category?.type === "expense" && b.category?.segment === segment);
    }

    const draggedIndex = segmentBudgets.findIndex(b => b.category_id === draggedCategoryId);
    const targetIndex = segmentBudgets.findIndex(b => b.category_id === targetCategoryId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Reorder within segment
      const newSegmentBudgets = [...segmentBudgets];
      const [draggedItem] = newSegmentBudgets.splice(draggedIndex, 1);
      newSegmentBudgets.splice(targetIndex, 0, draggedItem);

      // Rebuild full budgets array preserving order
      let newBudgets: BudgetWithCategory[];
      if (segment === "income") {
        const otherBudgets = budgets.filter(b => b.category?.type !== "income");
        newBudgets = [...newSegmentBudgets, ...otherBudgets];
      } else {
        const incomeBudgets = budgets.filter(b => b.category?.type === "income");
        const needsBudgets = segment === "needs" ? newSegmentBudgets : budgets.filter(b => b.category?.segment === "needs");
        const wantsBudgets = segment === "wants" ? newSegmentBudgets : budgets.filter(b => b.category?.segment === "wants");
        const savingsBudgets = segment === "savings" ? newSegmentBudgets : budgets.filter(b => b.category?.type === "savings");
        newBudgets = [...incomeBudgets, ...needsBudgets, ...wantsBudgets, ...savingsBudgets];
      }

      setBudgets(newBudgets);
      // Auto-save the new order immediately
      saveReorderedBudgets(newBudgets);
    }

    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  const handleDragEnd = () => {
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  // Render budget row
  const renderBudgetRow = (budget: BudgetWithCategory, segment: "income" | "needs" | "wants" | "savings") => {
    const isEditing = editingBudget === budget.category_id;
    const isDragging = draggedCategoryId === budget.category_id;
    const isDragOver = dragOverCategoryId === budget.category_id;

    return (
      <div
        key={budget.category_id}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, budget.category_id)}
        onDragOver={(e) => handleDragOver(e, budget.category_id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, budget.category_id, segment)}
        onDragEnd={handleDragEnd}
        className={`flex items-center gap-2 p-4 hover:bg-[var(--background-secondary)] transition-colors ${isDragging ? "opacity-50" : ""} ${isDragOver ? "border-t-2 border-[var(--brand-cyan)]" : ""}`}
      >
        {/* Drag handle */}
        <div className="cursor-grab active:cursor-grabbing text-[var(--brand-gray)] hover:text-[var(--foreground)]">
          <GripVertical className="w-4 h-4" />
        </div>

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
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(budget.category_id);
                  if (e.key === "Escape") setEditingBudget(null);
                }}
                className="w-32 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--brand-cyan)] rounded-lg text-right font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
              <button
                onClick={() => saveEdit(budget.category_id)}
                className="p-2 rounded-lg bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingBudget(null)}
                className="p-2 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <span className={`font-semibold ${budget.category?.type === "income" ? "text-[var(--success)]" :
                  budget.category?.type === "savings" ? "text-[var(--brand-cyan)]" :
                    "text-[var(--danger)]"
                }`}>
                {formatCurrency(budget.amount)}
              </span>
              <button
                onClick={() => fetchCategoryHistory(budget.category)}
                className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors group relative"
                title="Ver historial y promedio"
              >
                <BarChart3 className="w-4 h-4 text-[var(--brand-cyan)]" />
              </button>
              <button
                onClick={() => startEditing(budget.category_id, budget.amount)}
                className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <Edit2 className="w-4 h-4 text-[var(--brand-gray)]" />
              </button>
              <button
                onClick={() => setShowDeleteCategoryModal(budget.category_id)}
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
        subtitle="Configura tu plan mensual por categorías"
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

      <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
        {/* Finy Info Panel */}
        <FinyInfoPanel
          messages={[
            "Planifica cuánto esperas ingresar, gastar y ahorrar este mes. No es un tope rígido, sino una guía para tomar mejores decisiones.",
          ]}
          tip="Cuanto más ajustada esté tu previsión, más útil será la comparativa en 'Previsión vs Realidad'."
          finybotMessage="Pregúntame cómo configurar tu previsión mensual."
          storageKey="prevision"
          defaultExpanded={true}
        />

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
                <p className={`text-xl font-bold ${totalSavings >= 0 ? "text-[var(--brand-cyan)]" : "text-[var(--danger)]"}`}>
                  {formatCurrency(totalSavings)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--brand-cyan)]/10">
                <PiggyBank className="w-5 h-5 text-[var(--brand-cyan)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Financial Rule Panel */}
        {hasBudget && totalIncome > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setIsRuleExpanded(!isRuleExpanded)}
              >
                <div className="p-2 rounded-lg bg-[var(--background-secondary)] flex items-center justify-center relative transition-all hover:scale-105 shadow-sm">
                  <Sparkles className="w-5 h-5 text-[var(--brand-cyan)]" />
                  <div className="absolute -right-2 -bottom-1 bg-[var(--brand-cyan)] rounded-full p-0.5 border-2 border-[var(--background)] shadow-sm">
                    {isRuleExpanded ? <ChevronUp className="w-3 h-3 text-white" /> : <ChevronDown className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <h3 className="font-semibold text-lg">Tu nueva regla financiera</h3>
              </div>
            </div>

            {isRuleExpanded && (
              <>
                {Math.abs(availableBalance) < 0.01 ? (
                  // Estado CONFIRMADA
                  <div>
                    <p className="text-sm text-[var(--foreground)] mb-1">
                      Genial, has creado tu propia regla financiera. La regla más común es la 50/30/20, pero esta es la tuya según tu presupuesto.
                    </p>
                    <p className="text-sm font-medium text-[var(--foreground)] mb-4">
                      {savingsPercent > 50
                        ? "Estupendo porcentaje de ahorro, sigue así."
                        : savingsPercent >= 20
                          ? "Es un muy buen porcentaje de ahorro."
                          : "Vamos a intentar mejorar ese ahorro. Quizá puedas ajustar algunos gastos."}
                    </p>

                    {/* Progress Bar Confirmada */}
                    <div className="progress-bar h-4 flex mb-6">
                      <div
                        className="transition-all"
                        style={{ width: `${needsPercent}%`, background: "linear-gradient(to right, #2EEB8F, #1EEA8A)" }}
                        title={`Necesidades: ${needsPercent}%`}
                      />
                      <div
                        className="transition-all"
                        style={{ width: `${wantsPercent}%`, background: "linear-gradient(to right, #3B82F6, #2563EB)" }}
                        title={`Deseos: ${wantsPercent}%`}
                      />
                      <div
                        className="transition-all"
                        style={{ width: `${savingsPercent}%`, background: "linear-gradient(to right, #00E5FF, #00DDF0)" }}
                        title={`Ahorro: ${savingsPercent}%`}
                      />
                    </div>

                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
                      {/* Needs Card */}
                      <div className="rounded-xl overflow-hidden flex flex-col h-full bg-[#EAFBF3] border border-transparent">
                        <div className="px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center text-white" style={{ background: "linear-gradient(to right, #2EEB8F, #1EEA8A)" }}>
                          <span className="font-bold text-sm sm:text-base">Necesidades</span>
                          <span className="font-bold text-sm sm:text-base">{needsPercent}%</span>
                        </div>
                        <div className="px-3 py-3 sm:px-4 sm:py-4 flex-1">
                          <span className="text-xs sm:text-sm text-[var(--brand-gray)] block">Gastos esenciales</span>
                        </div>
                      </div>

                      {/* Wants Card */}
                      <div className="rounded-xl overflow-hidden flex flex-col h-full bg-white border border-[var(--border)] shadow-sm">
                        <div className="px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center text-white" style={{ background: "linear-gradient(to right, #3B82F6, #2563EB)" }}>
                          <span className="font-bold text-sm sm:text-base">Deseos</span>
                          <span className="font-bold text-sm sm:text-base">{wantsPercent}%</span>
                        </div>
                        <div className="px-3 py-3 sm:px-4 sm:py-4 flex-1">
                          <span className="text-xs sm:text-sm text-[var(--brand-gray)] block">Gastos opcionales</span>
                        </div>
                      </div>

                      {/* Savings Card */}
                      <div className="rounded-xl overflow-hidden flex flex-col h-full bg-[#E5FAFD] border border-transparent">
                        <div className="px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center text-white" style={{ background: "linear-gradient(to right, #00E5FF, #00DDF0)" }}>
                          <span className="font-bold text-sm sm:text-base">Ahorro</span>
                          <span className="font-bold text-sm sm:text-base">{savingsPercent}%</span>
                        </div>
                        <div className="px-3 py-3 sm:px-4 sm:py-4 flex-1">
                          <span className="text-xs sm:text-sm text-[var(--brand-gray)] block">Ahorro e inversión</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Estado PENDIENTE (descuadrado)
                  <div className="opacity-60">
                    <p className="text-sm font-medium text-[var(--foreground)] mb-4">
                      Presupuesto pendiente de cuadrar
                    </p>

                    {/* Progress Bar Pendiente */}
                    <div className="progress-bar h-4 flex mb-6">
                      <div
                        className="transition-all opacity-50"
                        style={{ width: `${needsPercent}%`, background: "linear-gradient(to right, #2EEB8F, #1EEA8A)" }}
                      />
                      <div
                        className="transition-all opacity-50"
                        style={{ width: `${wantsPercent}%`, background: "linear-gradient(to right, #3B82F6, #2563EB)" }}
                      />
                      <div
                        className="transition-all opacity-50"
                        style={{ width: `${savingsPercent}%`, background: "linear-gradient(to right, #00E5FF, #00DDF0)" }}
                      />
                    </div>

                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4 opacity-70">
                      {/* Needs Card */}
                      <div className="rounded-xl overflow-hidden flex flex-col h-full bg-[#EAFBF3] border border-transparent">
                        <div className="px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center text-white" style={{ background: "linear-gradient(to right, #2EEB8F, #1EEA8A)" }}>
                          <span className="font-bold text-sm sm:text-base">Necesidades</span>
                          <span className="font-bold text-sm sm:text-base">{needsPercent}%</span>
                        </div>
                        <div className="px-3 py-3 sm:px-4 sm:py-4 flex-1">
                          <span className="text-xs sm:text-sm text-[var(--brand-gray)] block">Gastos esenciales</span>
                        </div>
                      </div>

                      {/* Wants Card */}
                      <div className="rounded-xl overflow-hidden flex flex-col h-full bg-white border border-[var(--border)] shadow-sm">
                        <div className="px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center text-white" style={{ background: "linear-gradient(to right, #3B82F6, #2563EB)" }}>
                          <span className="font-bold text-sm sm:text-base">Deseos</span>
                          <span className="font-bold text-sm sm:text-base">{wantsPercent}%</span>
                        </div>
                        <div className="px-3 py-3 sm:px-4 sm:py-4 flex-1">
                          <span className="text-xs sm:text-sm text-[var(--brand-gray)] block">Gastos opcionales</span>
                        </div>
                      </div>

                      {/* Savings Card */}
                      <div className="rounded-xl overflow-hidden flex flex-col h-full bg-[#E5FAFD] border border-transparent">
                        <div className="px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center text-white" style={{ background: "linear-gradient(to right, #00E5FF, #00DDF0)" }}>
                          <span className="font-bold text-sm sm:text-base">Ahorro</span>
                          <span className="font-bold text-sm sm:text-base">{savingsPercent}%</span>
                        </div>
                        <div className="px-3 py-3 sm:px-4 sm:py-4 flex-1">
                          <span className="text-xs sm:text-sm text-[var(--brand-gray)] block">Ahorro e inversión</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}



        {/* Balance warning if negative */}
        {hasBudget && availableBalance < 0 && (
          <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--danger)]">Tu presupuesto no cuadra</p>
              <p className="text-sm text-[var(--foreground)]">
                Tus gastos previstos ({formatCurrency(totalExpenses)}) + ahorro previsto ({formatCurrency(totalSavings)}) superan tus ingresos previstos ({formatCurrency(totalIncome)}) en <strong>{formatCurrency(Math.abs(availableBalance))}</strong>.
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
              <button
                onClick={createNewBudget}
                className="flex items-center gap-2 px-6 py-3 rounded-lg gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Crear presupuesto
              </button>
              {hasPreviousMonthBudget && (
                <button
                  onClick={copyFromPreviousMonth}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copiar del mes anterior
                </button>
              )}
            </div>
          </div>
        )}

        {/* Budget tables */}
        {hasBudget && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income budgets */}
            <div className="card overflow-hidden">
              <div
                className="px-6 py-4 border-b border-[var(--border)] bg-[var(--success)]/5 cursor-pointer hover:bg-[var(--success)]/10 transition-colors"
                onClick={() => toggleSection('income')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                    Ingresos previstos
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[var(--success)]">
                      {formatCurrency(totalIncome)}
                    </span>
                    {expandedSections.income ? (
                      <ChevronUp className="w-5 h-5 text-[var(--brand-gray)]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[var(--brand-gray)]" />
                    )}
                  </div>
                </div>
              </div>
              {expandedSections.income && (
                <div className="divide-y divide-[var(--border)]">
                  {incomeBudgets.length > 0 ? (
                    incomeBudgets.map(b => renderBudgetRow(b, "income"))
                  ) : (
                    <div className="p-6 text-center text-[var(--brand-gray)]">
                      No hay categorías de ingresos
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Expense budgets by segment */}
            <div className="space-y-6">
              {/* Needs */}
              <div className="card overflow-hidden">
                <div
                  className="px-6 py-4 border-b border-[var(--border)] bg-[var(--danger)]/5 cursor-pointer hover:bg-[var(--danger)]/10 transition-colors"
                  onClick={() => toggleSection('needs')}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
                      Necesidades previstas
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-bold text-[var(--danger)]">{formatCurrency(needsTotal)}</span>
                      </div>
                      {expandedSections.needs ? (
                        <ChevronUp className="w-5 h-5 text-[var(--brand-gray)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--brand-gray)]" />
                      )}
                    </div>
                  </div>
                </div>
                {expandedSections.needs && (
                  <div className="divide-y divide-[var(--border)]">
                    {needsBudgets.length > 0 ? (
                      needsBudgets.map(b => renderBudgetRow(b, "needs"))
                    ) : (
                      <div className="p-4 text-center text-sm text-[var(--brand-gray)]">
                        Sin categorías de necesidades
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wants */}
              <div className="card overflow-hidden">
                <div
                  className="px-6 py-4 border-b border-[var(--border)] bg-[var(--danger)]/5 cursor-pointer hover:bg-[var(--danger)]/10 transition-colors"
                  onClick={() => toggleSection('wants')}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
                      Deseos previstos
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-bold text-[var(--danger)]">{formatCurrency(wantsTotal)}</span>
                      </div>
                      {expandedSections.wants ? (
                        <ChevronUp className="w-5 h-5 text-[var(--brand-gray)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--brand-gray)]" />
                      )}
                    </div>
                  </div>
                </div>
                {expandedSections.wants && (
                  <div className="divide-y divide-[var(--border)]">
                    {wantsBudgets.length > 0 ? (
                      wantsBudgets.map(b => renderBudgetRow(b, "wants"))
                    ) : (
                      <div className="p-4 text-center text-sm text-[var(--brand-gray)]">
                        Sin categorías de deseos
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Savings */}
              <div className="card overflow-hidden">
                <div
                  className="px-6 py-4 border-b border-[var(--border)] bg-[var(--brand-cyan)]/5 cursor-pointer hover:bg-[var(--brand-cyan)]/10 transition-colors"
                  onClick={() => toggleSection('savings')}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <PiggyBank className="w-5 h-5 text-[var(--brand-cyan)]" />
                      Ahorro previsto
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-bold text-[var(--brand-cyan)]">
                          {formatCurrency(savingsTotal)}
                        </span>
                      </div>
                      {expandedSections.savings ? (
                        <ChevronUp className="w-5 h-5 text-[var(--brand-cyan)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--brand-cyan)]" />
                      )}
                    </div>
                  </div>
                </div>
                {expandedSections.savings && (
                  <div className="divide-y divide-[var(--border)]">
                    {savingsBudgets.length > 0 ? (
                      savingsBudgets.map(b => renderBudgetRow(b, "savings"))
                    ) : (
                      <div className="p-4 text-center text-sm text-[var(--brand-gray)]">
                        Sin categorías de ahorro
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                            cat.type === "savings" ? "Ahorro" :
                              cat.segment === "needs" ? "Necesidades" :
                                cat.segment === "wants" ? "Deseos" : "Gasto"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
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

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--danger)]">Eliminar categoría del presupuesto</h2>
              <button
                onClick={() => setShowDeleteCategoryModal(null)}
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
                  {(() => {
                    const categoryToDelete = budgets.find(b => b.category_id === showDeleteCategoryModal);
                    return (
                      <>
                        <p className="font-medium mb-2">
                          ¿Eliminar &quot;{categoryToDelete?.category?.name}&quot; del presupuesto?
                        </p>
                        <p className="text-sm text-[var(--brand-gray)]">
                          Se eliminará el importe previsto de {formatCurrency(categoryToDelete?.amount || 0)} para esta categoría en {format(selectedDate, "MMMM yyyy", { locale: es })}.
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteCategoryModal(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRemoveCategoryFromBudget}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--danger)] text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Category History Modal */}
      {showHistoryCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{showHistoryCategory.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold">{showHistoryCategory.name}</h2>
                  <p className="text-xs text-[var(--brand-gray)]">Historial últimos 4 meses</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryCategory(null)}
                className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {loadingHistory ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-[var(--brand-cyan)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[var(--brand-gray)]">Calculando promedios...</p>
                </div>
              ) : (
                <>
                  <div className="h-64 w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--brand-gray)', fontSize: 12 }}
                        />
                        <YAxis
                          hide
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Trackeado']}
                        />
                        <Bar
                          dataKey="amount"
                          fill="var(--brand-cyan)"
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                        />
                        <ReferenceLine
                          y={historyData[0]?.average || 0}
                          stroke="var(--danger)"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                        >
                          <Label
                            value="Media"
                            position="insideBottomLeft"
                            offset={5}
                            fill="var(--danger)"
                            fontSize={10}
                            className="font-medium"
                          />
                        </ReferenceLine>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--background-secondary)]">
                      <p className="text-xs text-[var(--brand-gray)] mb-1">Promedio mensual</p>
                      <p className="text-xl font-bold text-[var(--brand-cyan)]">
                        {formatCurrency(historyData[0]?.average || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--background-secondary)]">
                      <p className="text-xs text-[var(--brand-gray)] mb-1">Último mes</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(historyData[historyData.length - 1]?.amount || 0)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const avg = historyData[0]?.average || 0;
                      startEditing(showHistoryCategory.id, avg);
                      setShowHistoryCategory(null);
                    }}
                    className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)] font-medium hover:bg-[var(--brand-cyan)] hover:text-white transition-all"
                  >
                    Usar promedio como previsión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PrevisionPage() {
  return (
    <ProGate featureName="Prevision">
      <PrevisionPageContent />
    </ProGate>
  );
}
