"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Tag,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle,
  Search,
  Settings,
  Info
} from "lucide-react";
import DeleteConfirmModal from "@/components/operations/DeleteConfirmModal";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "savings";
  segment: "needs" | "wants" | "savings" | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  operation_count?: number;
}

const CATEGORY_TYPES = [
  { value: "expense", label: "Gasto", icon: TrendingDown, color: "text-[var(--danger)]" },
  { value: "income", label: "Ingreso", icon: TrendingUp, color: "text-[var(--success)]" },
  { value: "savings", label: "Ahorro", icon: PiggyBank, color: "text-[var(--brand-cyan)]" },
];

const SEGMENTS = [
  { value: "needs", label: "Necesidades", description: "50% - Gastos esenciales", color: "#02EAFF" },
  { value: "wants", label: "Deseos", description: "30% - Gastos opcionales", color: "#9945FF" },
  { value: "savings", label: "Ahorro", description: "20% - Ahorro e inversión", color: "#14F195" },
];

const ICON_OPTIONS = [
  // Hogar y vivienda
  "🏠", "🏡", "🏢", "🛋️", "🛏️", "🚿", "🧹", "🧺", "💡", "🔑",
  // Comida y bebida
  "🍽️", "🍕", "🍔", "🥗", "🍜", "🍣", "🥐", "☕", "🍺", "🍷",
  // Transporte
  "🚗", "🚌", "🚇", "🚲", "✈️", "⛽", "🚕", "🛵", "🚂", "⛵",
  // Compras y moda
  "🛒", "🛍️", "👕", "👗", "👟", "👜", "💄", "💍", "🕶️", "👔",
  // Tecnología y entretenimiento
  "📱", "💻", "🎮", "🎬", "🎵", "📺", "🎧", "📷", "🖥️", "⌚",
  // Salud y bienestar
  "💊", "🏥", "🏋️", "🧘", "💇", "🦷", "👁️", "💉", "🩺", "🧴",
  // Educación y trabajo
  "📚", "🎓", "💼", "📝", "🖊️", "📊", "💡", "🗂️", "📌", "🎯",
  // Finanzas
  "💰", "💳", "🏦", "📈", "📉", "💵", "🪙", "💎", "🧾", "📑",
  // Ocio y viajes
  "🏖️", "⛷️", "🎪", "🎡", "🏕️", "🗺️", "🎢", "🎭", "🎨", "🎸",
  // Familia y mascotas
  "👶", "👨‍👩‍👧", "🐕", "🐈", "🎁", "🎂", "💐", "🧸", "👪", "❤️",
  // Servicios y otros
  "📦", "🔧", "🔌", "📡", "🗑️", "♻️", "📬", "🏷️", "⚡", "💧"
];

const COLOR_OPTIONS = [
  "#02EAFF", "#9945FF", "#14F195", "#F97316", "#EF4444",
  "#EC4899", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B",
  "#6366F1", "#84CC16", "#F43F5E", "#0EA5E9", "#A855F7"
];

interface FinancialRule {
  needs: number;
  wants: number;
  savings: number;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [filter, setFilter] = useState<"all" | "expense" | "income" | "savings">("all");
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [financialRule, setFinancialRule] = useState<FinancialRule>({ needs: 50, wants: 30, savings: 20 });

  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's financial rule
      const { data: profileData } = await supabase
        .from("profiles")
        .select("rule_needs_percent, rule_wants_percent, rule_savings_percent")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setFinancialRule({
          needs: profileData.rule_needs_percent || 50,
          wants: profileData.rule_wants_percent || 30,
          savings: profileData.rule_savings_percent || 20,
        });
      }

      // Get categories with operation count
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("type")
        .order("name");

      if (categoriesData) {
        // Get operation counts for each category
        const { data: operationCounts } = await supabase
          .from("operations")
          .select("category_id")
          .eq("user_id", user.id);

        const countMap: Record<string, number> = {};
        operationCounts?.forEach((op) => {
          if (op.category_id) {
            countMap[op.category_id] = (countMap[op.category_id] || 0) + 1;
          }
        });

        const categoriesWithCount = categoriesData.map((cat) => ({
          ...cat,
          operation_count: countMap[cat.id] || 0,
        }));

        setCategories(categoriesWithCount);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", category.id);

      if (error) throw error;
      fetchCategories();
    } catch (error) {
      console.error("Error toggling category:", error);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    // Check if category has operations
    if (deletingCategory.operation_count && deletingCategory.operation_count > 0) {
      alert(`No se puede eliminar la categoría "${deletingCategory.name}" porque tiene ${deletingCategory.operation_count} operaciones asociadas. Desactívala en su lugar.`);
      setShowDeleteModal(false);
      setDeletingCategory(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deletingCategory.id);

      if (error) throw error;
      setShowDeleteModal(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const getTypeInfo = (type: string) => {
    return CATEGORY_TYPES.find((t) => t.value === type) || CATEGORY_TYPES[0];
  };

  const getSegmentInfo = (segment: string | null) => {
    return SEGMENTS.find((s) => s.value === segment);
  };

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    // Type filter
    if (filter !== "all" && cat.type !== filter) return false;
    // Active filter
    if (!showInactive && !cat.is_active) return false;
    // Search filter
    if (searchQuery && !cat.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group by type
  const groupedCategories = {
    expense: filteredCategories.filter((c) => c.type === "expense"),
    income: filteredCategories.filter((c) => c.type === "income"),
    savings: filteredCategories.filter((c) => c.type === "savings"),
  };

  // Summary stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.is_active).length;
  const expenseCategories = categories.filter((c) => c.type === "expense").length;
  const incomeCategories = categories.filter((c) => c.type === "income").length;
  const savingsCategories = categories.filter((c) => c.type === "savings").length;

  const renderCategoryCard = (category: Category) => {
    const typeInfo = getTypeInfo(category.type);
    const segmentInfo = getSegmentInfo(category.segment);

    return (
      <div
        key={category.id}
        className={`p-4 rounded-xl border-l-4 border transition-all ${
          category.is_active
            ? "bg-[var(--background)] border-[var(--border)] hover:border-[var(--brand-gray)]"
            : "bg-[var(--background-secondary)]/50 border-[var(--border)] opacity-60"
        }`}
        style={{ borderLeftColor: category.color }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${category.color}30` }}
          >
            {category.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{category.name}</h3>
              {!category.is_active && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--brand-gray)]/20 text-[var(--brand-gray)]">
                  Inactiva
                </span>
              )}
              {category.is_default && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--brand-purple)]/10 text-[var(--brand-purple)]">
                  Por defecto
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1">
              {/* Segment badge for expenses */}
              {category.type === "expense" && segmentInfo && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${segmentInfo.color}20`,
                    color: segmentInfo.color
                  }}
                >
                  {segmentInfo.label}
                </span>
              )}

              {/* Operation count */}
              {category.operation_count !== undefined && category.operation_count > 0 && (
                <span className="text-xs text-[var(--brand-gray)]">
                  {category.operation_count} operacion{category.operation_count !== 1 ? "es" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleToggleActive(category)}
              className={`p-2 rounded-lg transition-colors ${
                category.is_active
                  ? "hover:bg-[var(--warning)]/10"
                  : "hover:bg-[var(--success)]/10"
              }`}
              title={category.is_active ? "Desactivar" : "Activar"}
            >
              {category.is_active ? (
                <EyeOff className="w-4 h-4 text-[var(--brand-gray)]" />
              ) : (
                <Eye className="w-4 h-4 text-[var(--success)]" />
              )}
            </button>
            <button
              onClick={() => {
                setEditingCategory(category);
                setShowCategoryModal(true);
              }}
              className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              title="Editar"
            >
              <Edit2 className="w-4 h-4 text-[var(--brand-gray)]" />
            </button>
            {!category.is_default && (
              <button
                onClick={() => {
                  setDeletingCategory(category);
                  setShowDeleteModal(true);
                }}
                className="p-2 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-[var(--danger)]" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header
        title="Mis Categorías"
        subtitle="Gestiona tus categorías de ingresos y gastos"
        actions={
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva categoría</span>
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--brand-purple)]/10">
                <Tag className="w-5 h-5 text-[var(--brand-purple)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Total</p>
                <p className="text-xl font-bold">{totalCategories}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <CheckCircle className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Activas</p>
                <p className="text-xl font-bold">{activeCategories}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--danger)]/10">
                <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Gastos</p>
                <p className="text-xl font-bold">{expenseCategories}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <TrendingUp className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Ingresos</p>
                <p className="text-xl font-bold">{incomeCategories}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--brand-cyan)]/10">
                <PiggyBank className="w-5 h-5 text-[var(--brand-cyan)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Ahorro</p>
                <p className="text-xl font-bold">{savingsCategories}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Rule Info */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Info className="w-5 h-5 text-[var(--brand-purple)]" />
              Tu regla financiera
            </h3>
            <Link
              href="/regla-financiera"
              className="flex items-center gap-1.5 text-sm text-[var(--brand-cyan)] hover:underline"
            >
              <Settings className="w-4 h-4" />
              Configurar
            </Link>
          </div>

          <p className="text-sm text-[var(--brand-gray)] mb-4">
            Asigna un segmento a tus categorías de gastos para distribuir tu presupuesto según tu regla financiera personalizada.
          </p>

          {/* Visual bar */}
          <div className="h-3 rounded-full overflow-hidden flex mb-4">
            <div
              className="transition-all"
              style={{ width: `${financialRule.needs}%`, backgroundColor: "#02EAFF" }}
            />
            <div
              className="transition-all"
              style={{ width: `${financialRule.wants}%`, backgroundColor: "#9945FF" }}
            />
            <div
              className="transition-all"
              style={{ width: `${financialRule.savings}%`, backgroundColor: "#14F195" }}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "#02EAFF10" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold" style={{ color: "#02EAFF" }}>
                  Necesidades
                </span>
                <span className="text-lg font-bold" style={{ color: "#02EAFF" }}>
                  {financialRule.needs}%
                </span>
              </div>
              <p className="text-sm text-[var(--brand-gray)]">Gastos esenciales</p>
            </div>
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "#9945FF10" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold" style={{ color: "#9945FF" }}>
                  Deseos
                </span>
                <span className="text-lg font-bold" style={{ color: "#9945FF" }}>
                  {financialRule.wants}%
                </span>
              </div>
              <p className="text-sm text-[var(--brand-gray)]">Gastos opcionales</p>
            </div>
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "#14F19510" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold" style={{ color: "#14F195" }}>
                  Ahorro
                </span>
                <span className="text-lg font-bold" style={{ color: "#14F195" }}>
                  {financialRule.savings}%
                </span>
              </div>
              <p className="text-sm text-[var(--brand-gray)]">Ahorro e inversión</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            {[
              { value: "all", label: "Todas" },
              { value: "income", label: "Ingresos" },
              { value: "expense", label: "Gastos" },
              { value: "savings", label: "Ahorro" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? "bg-[var(--brand-purple)] text-white"
                    : "bg-[var(--background-secondary)] hover:bg-[var(--border)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Toggle */}
          <div className="flex items-center gap-3 sm:ml-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-gray)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--brand-cyan)] w-40"
              />
            </div>

            {/* Show inactive toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              <span className="text-[var(--brand-gray)]">Mostrar inactivas</span>
            </label>
          </div>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)] mx-auto"></div>
            <p className="mt-3 text-[var(--brand-gray)]">Cargando categorías...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="card p-12 text-center">
            <Tag className="w-16 h-16 text-[var(--brand-gray)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay categorías</h3>
            <p className="text-[var(--brand-gray)] mb-6">
              {searchQuery ? "No se encontraron categorías con ese nombre" : "Crea tu primera categoría personalizada"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                Crear categoría
              </button>
            )}
          </div>
        ) : filter === "all" ? (
          // Grouped view
          <div className="space-y-6">
            {/* Expenses */}
            {groupedCategories.expense.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
                  <h2 className="font-semibold">Categorías de Gastos</h2>
                  <span className="text-sm text-[var(--brand-gray)]">({groupedCategories.expense.length})</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedCategories.expense.map(renderCategoryCard)}
                </div>
              </div>
            )}

            {/* Income */}
            {groupedCategories.income.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                  <h2 className="font-semibold">Categorías de Ingresos</h2>
                  <span className="text-sm text-[var(--brand-gray)]">({groupedCategories.income.length})</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedCategories.income.map(renderCategoryCard)}
                </div>
              </div>
            )}

            {/* Savings */}
            {groupedCategories.savings.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PiggyBank className="w-5 h-5 text-[var(--brand-cyan)]" />
                  <h2 className="font-semibold">Categorías de Ahorro</h2>
                  <span className="text-sm text-[var(--brand-gray)]">({groupedCategories.savings.length})</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedCategories.savings.map(renderCategoryCard)}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Flat view when filtered
          <div className="card p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map(renderCategoryCard)}
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
          fetchCategories();
        }}
        category={editingCategory}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleDeleteCategory}
        title="Eliminar categoría"
        message={
          deletingCategory?.operation_count && deletingCategory.operation_count > 0
            ? `La categoría "${deletingCategory?.name}" tiene ${deletingCategory.operation_count} operaciones asociadas. ¿Quieres desactivarla en lugar de eliminarla?`
            : `¿Estás seguro de que quieres eliminar la categoría "${deletingCategory?.name}"?`
        }
      />
    </>
  );
}

// Category Create/Edit Modal
function CategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  category: Category | null;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState("#9945FF");
  const [type, setType] = useState<"income" | "expense" | "savings">("expense");
  const [segment, setSegment] = useState<"needs" | "wants" | "savings" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
      setType(category.type);
      setSegment(category.segment);
    } else {
      setName("");
      setIcon("📁");
      setColor("#9945FF");
      setType("expense");
      setSegment(null);
    }
    setError("");
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Introduce un nombre para la categoría");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const categoryData = {
        user_id: user.id,
        name: name.trim(),
        icon,
        color,
        type,
        segment: type === "expense" ? segment : null,
        updated_at: new Date().toISOString(),
      };

      if (category) {
        const { error: updateError } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", category.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("categories")
          .insert(categoryData);

        if (insertError) {
          if (insertError.code === "23505") {
            throw new Error("Ya existe una categoría con ese nombre");
          }
          throw insertError;
        }
      }

      onSave();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {category ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setType(t.value as typeof type);
                      if (t.value !== "expense") setSegment(null);
                    }}
                    disabled={category?.is_default}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-[var(--brand-purple)] bg-[var(--brand-purple)]/10"
                        : "border-[var(--border)] hover:border-[var(--brand-gray)]"
                    } ${category?.is_default ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? t.color : "text-[var(--brand-gray)]"}`} />
                    <span className={`text-xs font-medium ${isSelected ? "text-[var(--brand-purple)]" : ""}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Supermercado"
              className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium mb-2">Icono</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-[var(--background-secondary)] rounded-xl">
              {ICON_OPTIONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border-2 transition-all ${
                    icon === i
                      ? "border-[var(--brand-purple)] bg-[var(--brand-purple)]/10"
                      : "border-transparent hover:border-[var(--border)]"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all relative ${
                    color === c ? "border-white scale-110 ring-2 ring-offset-2 ring-offset-[var(--background)] ring-white" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <CheckCircle className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Segment (only for expenses) */}
          {type === "expense" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Segmento (regla 50/30/20)
              </label>
              <div className="space-y-2">
                {SEGMENTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSegment(s.value as typeof segment)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      segment === s.value
                        ? "border-current"
                        : "border-[var(--border)] hover:border-[var(--brand-gray)]"
                    }`}
                    style={{
                      borderColor: segment === s.value ? s.color : undefined,
                      backgroundColor: segment === s.value ? `${s.color}10` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium" style={{ color: segment === s.value ? s.color : undefined }}>
                        {s.label}
                      </span>
                      <span className="text-sm text-[var(--brand-gray)]">{s.description}</span>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSegment(null)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    segment === null
                      ? "border-[var(--brand-purple)] bg-[var(--brand-purple)]/10"
                      : "border-[var(--border)] hover:border-[var(--brand-gray)]"
                  }`}
                >
                  <span className={`font-medium ${segment === null ? "text-[var(--brand-purple)]" : ""}`}>
                    Sin segmento
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium mb-2">Vista previa</label>
            <div className="p-4 rounded-xl bg-[var(--background-secondary)] flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${color}20` }}
              >
                {icon}
              </div>
              <div>
                <p className="font-medium">{name || "Nombre de categoría"}</p>
                <p className="text-sm text-[var(--brand-gray)]">
                  {CATEGORY_TYPES.find((t) => t.value === type)?.label}
                  {segment && ` • ${SEGMENTS.find((s) => s.value === segment)?.label}`}
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Guardando..." : category ? "Guardar cambios" : "Crear categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
