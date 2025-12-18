"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import OperationModal from "@/components/operations/OperationModal";
import DeleteConfirmModal from "@/components/operations/DeleteConfirmModal";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Filter,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  segment: string | null;
}

interface Operation {
  id: string;
  type: "income" | "expense" | "savings";
  amount: number;
  concept: string;
  description: string | null;
  operation_date: string;
  category_id: string | null;
  category?: Category;
  created_at: string;
}

const typeConfig = {
  income: { label: "Ingreso", icon: TrendingUp, color: "text-[var(--success)]", bg: "bg-[var(--success)]/10" },
  expense: { label: "Gasto", icon: TrendingDown, color: "text-[var(--danger)]", bg: "bg-[var(--danger)]/10" },
  savings: { label: "Ahorro", icon: PiggyBank, color: "text-[var(--brand-cyan)]", bg: "bg-[var(--brand-cyan)]/10" },
};

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100];
const STORAGE_KEY_FILTER_MONTH = "finybuddy_operations_filter_month";
const STORAGE_KEY_ITEMS_PER_PAGE = "finybuddy_operations_per_page";

export default function OperacionesPage() {
  const { profile } = useProfile();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOperationId, setDeletingOperationId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Totales calculados del rango de fechas completo (no de la lista paginada)
  const [monthTotals, setMonthTotals] = useState({ income: 0, expense: 0, savings: 0 });

  // Filtros - inicializar desde localStorage
  const [filterType, setFilterType] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY_FILTER_MONTH) || format(new Date(), "yyyy-MM");
    }
    return format(new Date(), "yyyy-MM");
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY_ITEMS_PER_PAGE);
      return stored ? parseInt(stored) : 50;
    }
    return 50;
  });

  const supabase = createClient();

  // Guardar filtro de mes en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_FILTER_MONTH, filterMonth);
    }
  }, [filterMonth]);

  // Guardar items per page en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ITEMS_PER_PAGE, itemsPerPage.toString());
    }
  }, [itemsPerPage]);

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calcular fechas del mes seleccionado
    const [year, month] = filterMonth.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];

    // Query para obtener totales del mes completo (independiente de filtro de tipo)
    const { data: allMonthOps } = await supabase
      .from("operations")
      .select("type, amount")
      .eq("user_id", user.id)
      .gte("operation_date", startDate)
      .lte("operation_date", endDate);

    if (allMonthOps) {
      const totals = allMonthOps.reduce(
        (acc, op) => {
          if (op.type === "income") acc.income += op.amount;
          if (op.type === "expense") acc.expense += op.amount;
          if (op.type === "savings") acc.savings += op.amount;
          return acc;
        },
        { income: 0, expense: 0, savings: 0 }
      );
      setMonthTotals(totals);
    }

    // Build query for count (con filtros aplicados)
    let countQuery = supabase
      .from("operations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("operation_date", startDate)
      .lte("operation_date", endDate);

    // Build query for data
    let dataQuery = supabase
      .from("operations")
      .select(`
        *,
        category:categories(id, name, icon, color, type, segment)
      `)
      .eq("user_id", user.id)
      .gte("operation_date", startDate)
      .lte("operation_date", endDate)
      .order("operation_date", { ascending: false })
      .order("created_at", { ascending: false });

    // Filtro por tipo
    if (filterType) {
      countQuery = countQuery.eq("type", filterType);
      dataQuery = dataQuery.eq("type", filterType);
    }

    // Get total count
    const { count } = await countQuery;
    setTotalCount(count || 0);

    // Apply pagination
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    dataQuery = dataQuery.range(from, to);

    const { data, error } = await dataQuery;

    if (!error && data) {
      setOperations(data);
    }
    setLoading(false);
  }, [filterType, filterMonth, currentPage, itemsPerPage, supabase]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterMonth, itemsPerPage]);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // No cerrar si el click es dentro del menú o botón
      if (target.closest('[data-menu-container]')) return;
      setActiveMenu(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleEdit = (operation: Operation) => {
    setEditingOperation(operation);
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingOperationId(id);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOperationId) return;

    setDeleteLoading(true);
    const { error } = await supabase.from("operations").delete().eq("id", deletingOperationId);
    setDeleteLoading(false);

    if (!error) {
      fetchOperations();
    }
    setShowDeleteModal(false);
    setDeletingOperationId(null);
  };

  const handleNewOperation = () => {
    setEditingOperation(null);
    setShowModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: profile?.currency || "EUR",
      minimumFractionDigits: profile?.show_decimals ? 2 : 0,
      maximumFractionDigits: profile?.show_decimals ? 2 : 0,
    }).format(amount);
  };


  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <>
      <Header
        title="Operaciones"
        subtitle="Gestiona tus ingresos, gastos y ahorro"
        actions={
          <button
            onClick={handleNewOperation}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Operación</span>
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Resumen del mes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Ingresos del mes</p>
                <p className="text-xl font-bold text-[var(--success)]">{formatCurrency(monthTotals.income)}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <TrendingUp className="w-5 h-5 text-[var(--success)]" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Gastos del mes</p>
                <p className="text-xl font-bold text-[var(--danger)]">{formatCurrency(monthTotals.expense)}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--danger)]/10">
                <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Ahorro del mes</p>
                <p className="text-xl font-bold text-[var(--brand-cyan)]">{formatCurrency(monthTotals.savings)}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--brand-cyan)]/10">
                <PiggyBank className="w-5 h-5 text-[var(--brand-cyan)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Selector de mes */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--brand-gray)]" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--brand-gray)]" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
              >
                <option value="">Todos los tipos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Gastos</option>
                <option value="savings">Ahorros</option>
              </select>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--brand-gray)]">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                className="px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
              >
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option} por página</option>
                ))}
              </select>
            </div>

            {/* Contador */}
            <div className="ml-auto text-sm text-[var(--brand-gray)]">
              {totalCount} operaciones en total
            </div>
          </div>
        </div>

        {/* Lista de operaciones */}
        <div className="card">
          {loading ? (
            <div className="p-8 text-center text-[var(--brand-gray)]">
              Cargando operaciones...
            </div>
          ) : operations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--background-secondary)] flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-[var(--brand-gray)]" />
              </div>
              <p className="text-[var(--brand-gray)] mb-2">No hay operaciones</p>
              <p className="text-sm text-[var(--brand-gray)] mb-4">
                Registra tu primera operación para empezar a controlar tus finanzas
              </p>
              <button
                onClick={handleNewOperation}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Nueva Operación
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {operations.map((operation) => {
                const config = typeConfig[operation.type];
                const Icon = config.icon;

                return (
                  <div
                    key={operation.id}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--background-secondary)] transition-colors"
                  >
                    {/* Icono tipo */}
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{operation.concept}</p>
                        {operation.category && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full bg-[var(--background-secondary)]"
                            style={{ color: operation.category.color }}
                          >
                            {operation.category.icon} {operation.category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--brand-gray)]">
                        {format(new Date(operation.operation_date), "d MMM yyyy", { locale: es })}
                      </p>
                      {/* Mostrar descripción debajo si existe */}
                      {operation.description && (
                        <p className="text-sm text-[var(--brand-gray)] mt-1 italic">
                          {operation.description}
                        </p>
                      )}
                    </div>

                    {/* Importe */}
                    <div className={`text-right font-semibold ${config.color}`}>
                      {operation.type === "expense" ? "-" : "+"}{formatCurrency(operation.amount)}
                    </div>

                    {/* Menú acciones */}
                    <div className="relative" data-menu-container>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === operation.id ? null : operation.id);
                        }}
                        className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-[var(--brand-gray)]" />
                      </button>

                      {activeMenu === operation.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(operation);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--background-secondary)] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(operation.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
              <div className="text-sm text-[var(--brand-gray)]">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount}
              </div>
              <div className="flex items-center gap-1">
                {/* First page */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={!canGoPrevious}
                  className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                {/* Previous page */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!canGoPrevious}
                  className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-[var(--brand-gray)]">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page as number)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-[var(--brand-cyan)] text-white"
                          : "hover:bg-[var(--background-secondary)]"
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}

                {/* Next page */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!canGoNext}
                  className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Last page */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={!canGoNext}
                  className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Ya no se cierra al hacer clic fuera */}
      <OperationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingOperation(null);
        }}
        onSave={fetchOperations}
        operation={editingOperation}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingOperationId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar operación?"
        message="Esta acción no se puede deshacer. La operación será eliminada permanentemente."
        loading={deleteLoading}
      />
    </>
  );
}
