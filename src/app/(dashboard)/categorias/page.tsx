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
  Info,
  LayoutGrid,
  List,
  TableProperties,
  ChevronDown,
  ChevronUp,
  User2,
  Lock,
  // Iconos para categorías
  Home, Building2, Sofa, Bed, Droplets, Zap, Utensils, Pizza, Coffee, Car, Bus, Plane, ShoppingBag, Shirt, Smartphone, Laptop, Gamepad2, Stethoscope, Pill, GraduationCap, Briefcase, Wallet, CreditCard, Banknote, Palmtree, Music, Camera, Heart, Gift, Baby, Dog, Cat, Hammer, Wrench, Lightbulb, Users, Dumbbell, Theater, Brush, Guitar, Package, Radio, Trash,
  Shield, Flame, Globe, Fuel, Activity, FileText, Tv, Mail, FileEdit, Target
} from "lucide-react";
import DeleteConfirmModal from "@/components/operations/DeleteConfirmModal";
import FinyInfoPanel from "@/components/ui/FinyInfoPanel";

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
  { value: "income", label: "Ingreso", icon: TrendingUp, color: "text-[var(--success)]" },
  { value: "expense", label: "Gasto", icon: TrendingDown, color: "text-[var(--danger)]" },
  { value: "savings", label: "Ahorro", icon: PiggyBank, color: "text-[var(--brand-cyan)]" },
];

const SEGMENTS = [
  { value: "needs", label: "Necesidades", description: "Gastos esenciales", color: "#10B981" },
  { value: "wants", label: "Deseos", description: "Gastos opcionales", color: "#3B82F6" },
];

const ICON_OPTIONS = [
  "Home", "Building2", "Sofa", "Bed", "Droplets", "Zap", "Utensils", "Pizza", "Coffee", "Car",
  "Bus", "Plane", "ShoppingBag", "Shirt", "Smartphone", "Laptop", "Gamepad2", "Stethoscope", "Pill", "GraduationCap",
  "Briefcase", "Wallet", "CreditCard", "Banknote", "PiggyBank", "Palmtree", "Music", "Camera", "Heart", "Gift",
  "Baby", "Dog", "Cat", "Hammer", "Wrench", "Lightbulb", "Users", "Dumbbell", "Theater", "Brush",
  "Guitar", "Package", "Radio", "Trash", "TrendingUp", "TrendingDown", "Plus", "Shield", "Flame", "Globe", "Fuel", "Activity", "FileText", "Tv", "Mail", "FileEdit", "Target"
];

const EMOJI_TO_ICON: Record<string, string> = {
  '💼': 'Briefcase', '💻': 'Laptop', '📈': 'TrendingUp', '🏠': 'Home', '🛒': 'ShoppingBag',
  '🎁': 'Gift', '💰': 'Banknote', '➕': 'Plus', '🏢': 'Building2', '🛡️': 'Shield',
  '⚡': 'Zap', '🔥': 'Flame', '💧': 'Droplets', '🌐': 'Globe', '📱': 'Smartphone',
  '⛽': 'Fuel', '🚌': 'Bus', '🚗': 'Car', '🔧': 'Wrench', '💊': 'Pill',
  '🏥': 'Stethoscope', '🩺': 'Activity', '📚': 'GraduationCap', '📋': 'FileText',
  '📄': 'FileText', '🍽️': 'Utensils', '🎮': 'Gamepad2', '📺': 'Tv', '👕': 'Shirt',
  '💪': 'Dumbbell', '✈️': 'Plane', '💅': 'Heart', '🎨': 'Brush', '📧': 'Mail',
  '🍫': 'Pizza', '🐾': 'Dog', '📝': 'FileEdit', '🆘': 'Heart', '🐷': 'PiggyBank',
  '📊': 'TrendingUp', '👴': 'Users', '🎯': 'Target'
};

const CategoryIcon = ({ name, color, className }: { name: string; color?: string; className?: string }) => {
  const icons: any = {
    Home, Building2, Sofa, Bed, Droplets, Zap, Utensils, Pizza, Coffee, Car,
    Bus, Plane, ShoppingBag, Shirt, Smartphone, Laptop, Gamepad2, Stethoscope, Pill, GraduationCap,
    Briefcase, Wallet, CreditCard, Banknote, PiggyBank, Palmtree, Music, Camera, Heart, Gift,
    Baby, Dog, Cat, Hammer, Wrench, Lightbulb, Users, Dumbbell, Theater, Brush,
    Guitar, Package, Radio, Trash, TrendingUp, TrendingDown, Plus, Shield, Flame, Globe, Fuel, Activity, FileText, Tv, Mail, FileEdit, Target
  };

  const mappedName = EMOJI_TO_ICON[name] || name;
  const IconComp = icons[mappedName];

  if (!IconComp) {
    // Si sigue siendo un emoji no mapeado, lo mostramos
    const isEmoji = /[\u1000-\uFFFF]/.test(name) || name.length <= 2;
    if (isEmoji) return <span className={className}>{name}</span>;
    return <Tag className={className} style={{ color }} />;
  }

  return <IconComp className={className} style={{ color }} />;
};

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
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list" | "table">("cards");
  const [financialRule, setFinancialRule] = useState<FinancialRule>({ needs: 50, wants: 30, savings: 20 });
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [isProcessingDefault, setIsProcessingDefault] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    income: true,
    expense: true,
    savings: true
  });

  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    // setLoading(true); // Removido para evitar parpadeo y pérdida de scroll
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
          needs: profileData.rule_needs_percent ?? 50,
          wants: profileData.rule_wants_percent ?? 30,
          savings: profileData.rule_savings_percent ?? 20,
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  const handleToggleAllDefault = async (activate: boolean) => {
    setIsProcessingDefault(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("categories")
        .update({
          is_active: activate,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (error) throw error;

      await fetchCategories();
      setShowDefaultModal(false);
    } catch (error) {
      console.error("Error toggling default categories:", error);
      alert("Error al procesar las categorías predeterminadas");
    } finally {
      setIsProcessingDefault(false);
    }
  };

  const handleRestoreDefault = async () => {
    setIsProcessingDefault(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const DEFAULT_CATEGORIES_DATA = [
        // Ingresos
        { name: 'Nómina', icon: 'Briefcase', color: '#10B981', type: 'income', is_default: true, segment: null },
        { name: 'Freelance', icon: 'Laptop', color: '#06B6D4', type: 'income', is_default: true, segment: null },
        { name: 'Inversiones', icon: 'TrendingUp', color: '#8B5CF6', type: 'income', is_default: true, segment: null },
        { name: 'Alquiler', icon: 'Home', color: '#F59E0B', type: 'income', is_default: true, segment: null },
        { name: 'Ventas', icon: 'ShoppingBag', color: '#EC4899', type: 'income', is_default: true, segment: null },
        { name: 'Regalos', icon: 'Gift', color: '#EF4444', type: 'income', is_default: true, segment: null },
        { name: 'Reembolsos', icon: 'Banknote', color: '#14B8A6', type: 'income', is_default: true, segment: null },
        { name: 'Otros ingresos', icon: 'Plus', color: '#6B7280', type: 'income', is_default: true, segment: null },

        // Gastos - Necesidades
        { name: 'Alquiler/Hipoteca', icon: 'Home', color: '#EF4444', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Comunidad', icon: 'Building2', color: '#F97316', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Seguro hogar', icon: 'Shield', color: '#F59E0B', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Electricidad', icon: 'Zap', color: '#FBBF24', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Gas', icon: 'Flame', color: '#F97316', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Agua', icon: 'Droplets', color: '#06B6D4', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Internet', icon: 'Globe', color: '#8B5CF6', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Teléfono', icon: 'Smartphone', color: '#A855F7', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Supermercado', icon: 'ShoppingBag', color: '#10B981', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Gasolina', icon: 'Fuel', color: '#6366F1', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Transporte público', icon: 'Bus', color: '#3B82F6', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Seguro coche', icon: 'Car', color: '#0EA5E9', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Mantenimiento vehículo', icon: 'Wrench', color: '#14B8A6', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Farmacia', icon: 'Pill', color: '#EC4899', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Médico/Dentista', icon: 'Stethoscope', color: '#F43F5E', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Seguro médico', icon: 'Activity', color: '#FB7185', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Educación', icon: 'GraduationCap', color: '#8B5CF6', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Impuestos', icon: 'FileText', color: '#6B7280', type: 'expense', segment: 'needs', is_default: true },
        { name: 'Seguros otros', icon: 'FileText', color: '#9CA3AF', type: 'expense', segment: 'needs', is_default: true },

        // Gastos - Deseos
        { name: 'Restaurantes', icon: 'Utensils', color: '#F97316', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Ocio', icon: 'Gamepad2', color: '#8B5CF6', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Streaming', icon: 'Tv', color: '#EF4444', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Ropa', icon: 'Shirt', color: '#EC4899', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Gimnasio', icon: 'Dumbbell', color: '#10B981', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Viajes', icon: 'Plane', color: '#06B6D4', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Belleza/Cuidado personal', icon: 'Heart', color: '#F472B6', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Hobbies', icon: 'Brush', color: '#A855F7', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Regalos dados', icon: 'Gift', color: '#FB923C', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Suscripciones', icon: 'Mail', color: '#6366F1', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Caprichos', icon: 'Pizza', color: '#FBBF24', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Mascotas', icon: 'Dog', color: '#F59E0B', type: 'expense', segment: 'wants', is_default: true },
        { name: 'Otros gastos', icon: 'FileEdit', color: '#6B7280', type: 'expense', segment: 'wants', is_default: true },

        // Ahorro
        { name: 'Fondo de emergencia', icon: 'Heart', color: '#EF4444', type: 'savings', segment: 'savings', is_default: true },
        { name: 'Ahorro general', icon: 'PiggyBank', color: '#F97316', type: 'savings', segment: 'savings', is_default: true },
        { name: 'Inversiones', icon: 'TrendingUp', color: '#10B981', type: 'savings', segment: 'savings', is_default: true },
        { name: 'Jubilación', icon: 'Users', color: '#8B5CF6', type: 'savings', segment: 'savings', is_default: true },
        { name: 'Meta específica', icon: 'Target', color: '#06B6D4', type: 'savings', segment: 'savings', is_default: true },
      ];

      // Insert missing categories
      for (const cat of DEFAULT_CATEGORIES_DATA) {
        const exists = categories.find(c => c.name === cat.name && c.is_default);
        if (!exists) {
          await supabase.from('categories').insert({ ...cat, user_id: user.id });
        } else {
          // Si existe pero tiene un emoji o icono viejo, lo actualizamos al nuevo premium
          await supabase.from('categories').update({ icon: cat.icon, is_active: true }).eq('id', exists.id);
        }
      }

      await fetchCategories();
      setShowDefaultModal(false);
      alert("Categorías premium restauradas con éxito.");
    } catch (error) {
      console.error("Error restoring default categories:", error);
      alert("Error al restaurar las categorías");
    } finally {
      setIsProcessingDefault(false);
    }
  };

  const getTypeInfo = (type: string) => {
    return CATEGORY_TYPES.find((t) => t.value === type) || CATEGORY_TYPES[0];
  };

  const getSegmentInfo = (segment: string | null) => {
    return SEGMENTS.find((s) => s.value === segment);
  };

  // Filter and sort categories
  const filteredCategories = categories.filter((cat) => {
    // Type filter
    if (filter !== "all" && cat.type !== filter) return false;
    // Segment filter (only applies to expenses)
    if (segmentFilter !== "all" && cat.type === "expense" && cat.segment !== segmentFilter) return false;
    // Active filter
    if (!showInactive && !cat.is_active) return false;
    // Search filter
    if (searchQuery && !cat.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    // Ordenar gastos por segmento (necesidades -> deseos)
    if (a.type === "expense" && b.type === "expense") {
      const segmentOrder = { needs: 1, wants: 2, savings: 3, null: 4 } as const;
      const orderA = segmentOrder[(a.segment as keyof typeof segmentOrder) || "null"];
      const orderB = segmentOrder[(b.segment as keyof typeof segmentOrder) || "null"];
      if (orderA !== orderB) return orderA - orderB;
    }
    // Mantener orden alfabético original para el resto
    return a.name.localeCompare(b.name);
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
        className={`p-2.5 sm:p-4 rounded-lg sm:rounded-xl border-l-4 border transition-all ${category.is_active
          ? "bg-[var(--background)] border-[var(--border)] hover:border-[var(--brand-gray)]"
          : "bg-[var(--background-secondary)]/50 border-[var(--border)] opacity-60"
          }`}
        style={{ borderLeftColor: category.color }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Icon */}
          <div
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${category.color}30` }}
          >
            <CategoryIcon name={category.icon} color={category.color} className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <h3 className="text-xs sm:text-base font-semibold truncate max-w-[100px] sm:max-w-none">{category.name}</h3>
              {category.is_default && (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] whitespace-nowrap">
                  <span className="hidden sm:inline">Por defecto</span>
                  <span className="sm:hidden">Def</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1">
              {/* Segment badge for expenses */}
              {category.type === "expense" && segmentInfo && (
                <span
                  className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full"
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
                <span className="text-[10px] sm:text-xs text-[var(--brand-gray)]">
                  {category.operation_count} op.
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => handleToggleActive(category)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${category.is_active
                ? "hover:bg-[var(--warning)]/10"
                : "hover:bg-[var(--success)]/10"
                }`}
              title={category.is_active ? "Desactivar" : "Activar"}
            >
              {category.is_active ? (
                <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-gray)]" />
              ) : (
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--success)]" />
              )}
            </button>
            <button
              onClick={() => {
                setEditingCategory(category);
                setShowCategoryModal(true);
              }}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              title="Editar"
            >
              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-gray)]" />
            </button>
            {(!category.operation_count || category.operation_count === 0) && (
              <button
                onClick={() => {
                  setDeletingCategory(category);
                  setShowDeleteModal(true);
                }}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--danger)]" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryListItem = (category: Category) => {
    const typeInfo = getTypeInfo(category.type);
    const segmentInfo = getSegmentInfo(category.segment);
    const TypeIcon = typeInfo.icon;

    return (
      <div
        key={category.id}
        className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2.5 border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--background-secondary)]/50 ${!category.is_active ? "opacity-60" : ""
          }`}
      >
        <div
          className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${category.color}30` }}
        >
          <CategoryIcon name={category.icon} color={category.color} className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <h3 className="text-xs sm:text-sm font-medium truncate flex-1 min-w-0">{category.name}</h3>
        <TypeIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${typeInfo.color}`} />
        {category.type === "expense" && segmentInfo && (
          <span
            className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline"
            style={{ backgroundColor: `${segmentInfo.color}20`, color: segmentInfo.color }}
          >
            {segmentInfo.label}
          </span>
        )}
        {category.operation_count !== undefined && category.operation_count > 0 && (
          <span className="text-[10px] sm:text-xs text-[var(--brand-gray)] shrink-0">{category.operation_count} op.</span>
        )}
        {category.is_default && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] shrink-0 hidden sm:inline">Def</span>
        )}
        <div className="flex items-center shrink-0">
          <button onClick={() => handleToggleActive(category)} className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition-colors" title={category.is_active ? "Desactivar" : "Activar"}>
            {category.is_active ? <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--brand-gray)]" /> : <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--success)]" />}
          </button>
          <button onClick={() => { setEditingCategory(category); setShowCategoryModal(true); }} className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition-colors" title="Editar">
            <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--brand-gray)]" />
          </button>
          {(!category.operation_count || category.operation_count === 0) && (
            <button onClick={() => { setDeletingCategory(category); setShowDeleteModal(true); }} className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--danger)]/10 transition-colors" title="Eliminar">
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--danger)]" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCategoryTable = (cats: Category[]) => {
    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-medium text-[var(--brand-gray)]">Categoría</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-medium text-[var(--brand-gray)]">Tipo</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-medium text-[var(--brand-gray)] hidden sm:table-cell">Segmento</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium text-[var(--brand-gray)]">Ops.</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-medium text-[var(--brand-gray)]">Estado</th>
                <th className="text-right px-2 sm:px-4 py-2 sm:py-3 font-medium text-[var(--brand-gray)]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((category) => {
                const typeInfo = getTypeInfo(category.type);
                const segmentInfo = getSegmentInfo(category.segment);
                return (
                  <tr key={category.id} className={`border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--background-secondary)]/50 transition-colors ${!category.is_active ? "opacity-60" : ""}`}>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-2">
                        <CategoryIcon name={category.icon} color={category.color} className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-medium truncate max-w-[100px] sm:max-w-none">{category.name}</span>
                        {category.is_default && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] hidden sm:inline">Def</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={typeInfo.color}>{typeInfo.label}</span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                      {segmentInfo ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${segmentInfo.color}20`, color: segmentInfo.color }}>
                          {segmentInfo.label}
                        </span>
                      ) : (
                        <span className="text-[var(--brand-gray)]">—</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[var(--brand-gray)]">
                      {category.operation_count || 0}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                      <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full ${category.is_active ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--danger)]/10 text-[var(--danger)]"}`}>
                        {category.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center justify-end">
                        <button onClick={() => handleToggleActive(category)} className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition-colors" title={category.is_active ? "Desactivar" : "Activar"}>
                          {category.is_active ? <EyeOff className="w-3.5 h-3.5 text-[var(--brand-gray)]" /> : <Eye className="w-3.5 h-3.5 text-[var(--success)]" />}
                        </button>
                        <button onClick={() => { setEditingCategory(category); setShowCategoryModal(true); }} className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition-colors" title="Editar">
                          <Edit2 className="w-3.5 h-3.5 text-[var(--brand-gray)]" />
                        </button>
                        {(!category.operation_count || category.operation_count === 0) && (
                          <button onClick={() => { setDeletingCategory(category); setShowDeleteModal(true); }} className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--danger)]/10 transition-colors" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5 text-[var(--danger)]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCategories = (cats: Category[], type: "income" | "expense" | "savings", groupTitle: string, groupIcon: React.ReactNode) => {
    if (cats.length === 0) return null;

    const isExpanded = expandedSections[type];

    return (
      <div className="space-y-3">
        <button
          onClick={() => toggleSection(type)}
          className="w-full flex items-center justify-between p-3 sm:px-4 bg-[var(--background-secondary)]/50 hover:bg-[var(--background-secondary)] rounded-xl border border-[var(--border)] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-[var(--background)] border border-[var(--border)] group-hover:border-[var(--brand-purple)] transition-colors`}>
              {groupIcon}
            </div>
            <div className="text-left">
              <h2 className="text-sm sm:text-base font-bold">{groupTitle}</h2>
              <p className="text-[10px] sm:text-xs text-[var(--brand-gray)]">{cats.length} categorías {type === 'expense' ? 'de gasto' : type === 'income' ? 'de ingreso' : 'de ahorro'}</p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--brand-gray)]" /> : <ChevronDown className="w-5 h-5 text-[var(--brand-gray)]" />}
        </button>

        {isExpanded && (
          <div className="animate-fade-in">
            {viewMode === "table" ? (
              renderCategoryTable(cats)
            ) : viewMode === "list" ? (
              <div className="card overflow-hidden">
                {cats.map(renderCategoryListItem)}
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {cats.map(renderCategoryCard)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header
        title="Mis Categorías"
        subtitle="Gestiona tus categorías de ingresos, gastos y ahorro"
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

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Finy Info Panel */}
        <FinyInfoPanel
          messages={[
            "Las categorías organizan tus ingresos, gastos y ahorro en toda la app.",
          ]}
          tip="En gastos, asigna segmento: Necesidades (alquiler, luz, comida) o Deseos (restaurantes, viajes). Esto mejora tus indicadores."
          finybotMessage="Pregúntame si no sabes en qué segmento clasificar una categoría."
          storageKey="categorias"
          defaultExpanded={true}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <div className="card p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--brand-purple)]/10">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-purple)]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm text-[var(--brand-gray)]">Total</p>
                <p className="text-base sm:text-xl font-bold">{totalCategories}</p>
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--success)]/10">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--success)]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm text-[var(--brand-gray)]">Activas</p>
                <p className="text-base sm:text-xl font-bold">{activeCategories}</p>
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4 hidden lg:block">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--success)]/10">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--success)]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm text-[var(--brand-gray)]">Ingresos</p>
                <p className="text-base sm:text-xl font-bold">{incomeCategories}</p>
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4 hidden lg:block">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--danger)]/10">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--danger)]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm text-[var(--brand-gray)]">Gastos</p>
                <p className="text-base sm:text-xl font-bold">{expenseCategories}</p>
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--brand-cyan)]/10">
                <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-cyan)]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm text-[var(--brand-gray)]">Ahorro</p>
                <p className="text-base sm:text-xl font-bold">{savingsCategories}</p>
              </div>
            </div>
          </div>
        </div>



        {/* Filters */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Type Filter - scrollable on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
            {[
              { value: "all", label: "Todas" },
              { value: "income", label: "Ingresos" },
              { value: "expense", label: "Gastos" },
              { value: "savings", label: "Ahorro" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as typeof filter)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${filter === tab.value
                  ? "bg-[var(--brand-purple)] text-white"
                  : "bg-[var(--background-secondary)] hover:bg-[var(--border)]"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search, Segment Toggle, View Toggle & Inactive Toggle */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-gray)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full sm:w-40 pl-9 pr-4 py-1.5 sm:py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[var(--brand-cyan)]"
              />
            </div>

            {/* Segment Filter (only shown when 'Gastos' or 'Todas' is selected) */}
            {(filter === "all" || filter === "expense") && (
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="px-3 py-1.5 sm:py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[var(--brand-cyan)] cursor-pointer"
              >
                <option value="all">Todos los segmentos</option>
                <option value="needs">Necesidades</option>
                <option value="wants">Deseos</option>
              </select>
            )}

            {/* View mode toggle */}
            <div className="flex items-center bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg overflow-hidden">
              {([
                { mode: "cards" as const, icon: LayoutGrid, title: "Tarjetas" },
                { mode: "list" as const, icon: List, title: "Lista" },
                { mode: "table" as const, icon: TableProperties, title: "Tabla" },
              ]).map(({ mode, icon: Icon, title }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-1.5 sm:p-2 transition-colors ${viewMode === mode
                    ? "bg-[var(--brand-purple)] text-white"
                    : "text-[var(--brand-gray)] hover:text-[var(--foreground)]"
                    }`}
                  title={title}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              ))}
            </div>

            {/* Show inactive toggle */}
            <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded w-3.5 h-3.5 sm:w-4 sm:h-4"
              />
              <span className="text-[var(--brand-gray)]">
                <span className="hidden sm:inline">Mostrar inactivas</span>
                <span className="sm:hidden">Inactivas</span>
              </span>
            </label>

            {/* Default Categories Toggle Button */}
            <button
              onClick={() => setShowDefaultModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 sm:py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-xs sm:text-sm font-medium hover:border-[var(--brand-purple)] transition-colors ml-auto"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-purple)]" />
              <span>Categorías Predeterminadas</span>
            </button>
          </div>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)] mx-auto"></div>
            <p className="mt-3 text-[var(--brand-gray)]">Cargando categorías...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex items-center justify-center p-12 bg-[var(--background)] rounded-2xl border-2 border-dashed border-[var(--border)]">
            <div className="text-center">
              <Tag className="w-16 h-16 text-[var(--brand-gray)] mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold mb-2">No se encontraron categorías</h3>
              <p className="text-[var(--brand-gray)] max-w-xs mx-auto mb-6">
                {searchQuery
                  ? "No hay resultados para tu búsqueda actual."
                  : "Organiza tus finanzas creando tus propias categorías o usando las predeterminadas."}
              </p>
            </div>
          </div>
        ) : filter === "all" ? (
          // Grouped view
          <div className="space-y-4 sm:space-y-6">
            {renderCategories(groupedCategories.income, "income", "Ingresos", <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--success)]" />)}
            {renderCategories(groupedCategories.expense, "expense", "Gastos", <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--danger)]" />)}
            {renderCategories(groupedCategories.savings, "savings", "Ahorro", <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-cyan)]" />)}
          </div>
        ) : (
          // Flat view when filtered
          viewMode === "table" ? renderCategoryTable(filteredCategories) : (
            viewMode === "list" ? (
              <div className="card overflow-hidden">
                {filteredCategories.map(renderCategoryListItem)}
              </div>
            ) : (
              <div className="card p-3 sm:p-5">
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCategories.map(renderCategoryCard)}
                </div>
              </div>
            )
          )
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

      {/* Default Categories Toggle Modal */}
      {showDefaultModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold">Categorías Predeterminadas</h2>
              <button
                onClick={() => setShowDefaultModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--brand-purple)]/5 border border-[var(--brand-purple)]/20">
                <Info className="w-5 h-5 text-[var(--brand-purple)] shrink-0" />
                <p className="text-sm">
                  Puedes activar o desactivar todas las categorías que FinyBuddy crea por defecto. Esto no afectará a tus categorías personalizadas.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={handleRestoreDefault}
                  disabled={isProcessingDefault}
                  className="flex items-center justify-center gap-2 w-full p-4 rounded-xl gradient-brand text-white font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  title="Carga de nuevo las categorías predeterminadas o restaura iconos premium"
                >
                  <Plus className="w-5 h-5" />
                  Restaurar categorías originales
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleToggleAllDefault(true)}
                    disabled={isProcessingDefault}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-[var(--success)] text-[var(--success)] font-semibold hover:bg-[var(--success)]/10 transition-all disabled:opacity-50"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-xs">Activar todas</span>
                  </button>

                  <button
                    onClick={() => handleToggleAllDefault(false)}
                    disabled={isProcessingDefault}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-[var(--danger)] text-[var(--danger)] font-semibold hover:bg-[var(--danger)]/10 transition-all disabled:opacity-50"
                  >
                    <EyeOff className="w-5 h-5" />
                    <span className="text-xs">Ocultar todas</span>
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-[var(--brand-gray)] text-center italic mt-4">
                * Las categorías con operaciones asociadas seguirán mostrándose en tus informes aunque estén inactivas.
              </p>
            </div>

            <div className="px-6 py-4 bg-[var(--background-secondary)] text-right">
              <button
                onClick={() => setShowDefaultModal(false)}
                className="px-6 py-2 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--border-light)] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
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
      setIcon("ShoppingBag");
      setColor("#9945FF");
      setType("expense");
      setSegment("needs"); // Default to "needs" for new expense categories
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

      // Determine segment based on type
      let finalSegment: "needs" | "wants" | "savings" | null = null;
      if (type === "expense") {
        finalSegment = segment || "needs"; // Default to "needs" if not selected
      } else if (type === "savings") {
        finalSegment = "savings"; // Savings categories auto-assign to savings segment
      }

      const categoryData = {
        user_id: user.id,
        name: name.trim(),
        icon,
        color,
        type,
        segment: finalSegment,
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
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${isSelected
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
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-[var(--background-secondary)] rounded-xl max-h-48 overflow-y-auto">
              {ICON_OPTIONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all ${icon === i
                    ? "border-[var(--brand-purple)] bg-[var(--brand-purple)]/20"
                    : "border-transparent hover:border-[var(--border)] bg-[var(--background)]"
                    }`}
                >
                  <CategoryIcon name={i} className="w-5 h-5" />
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
                  className={`w-10 h-10 rounded-lg border-2 transition-all relative ${color === c ? "border-white scale-110 ring-2 ring-offset-2 ring-offset-[var(--background)] ring-white" : "border-transparent hover:scale-105"
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
                Segmento (regla financiera)
              </label>
              <div className="space-y-2">
                {SEGMENTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSegment(s.value as typeof segment)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${segment === s.value
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
              </div>
            </div>
          )}

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium mb-2">Vista previa</label>
            <div className="p-4 rounded-xl bg-[var(--background-secondary)] flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}20` }}
              >
                <CategoryIcon name={icon} color={color} className="w-7 h-7" />
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
