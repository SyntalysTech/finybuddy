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
  Edit2,
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


  const handleEdit = (operation: Operation) => {
    setEditingOperation(operation);
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingOperationId(id);
    setShowDeleteModal(true);
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

      <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
        {/* Resumen del mes */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="card p-2 sm:p-4">
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-[var(--brand-gray)] truncate">Ingresos</p>
                <p className="text-sm sm:text-xl font-bold text-[var(--success)] truncate">{formatCurrency(monthTotals.income)}</p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--success)]/10 shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--success)]" />
              </div>
            </div>
          </div>
          <div className="card p-2 sm:p-4">
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-[var(--brand-gray)] truncate">Gastos</p>
                <p className="text-sm sm:text-xl font-bold text-[var(--danger)] truncate">{formatCurrency(monthTotals.expense)}</p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--danger)]/10 shrink-0">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--danger)]" />
              </div>
            </div>
          </div>
          <div className="card p-2 sm:p-4">
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-[var(--brand-gray)] truncate">Ahorro</p>
                <p className="text-sm sm:text-xl font-bold text-[var(--brand-cyan)] truncate">{formatCurrency(monthTotals.savings)}</p>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--brand-cyan)]/10 shrink-0">
                <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-cyan)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
            {/* Selector de mes */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Calendar className="w-4 h-4 text-[var(--brand-gray)] hidden sm:block" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 sm:py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--brand-gray)]" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 pr-8 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2224%22%20height%3d%2224%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%236b7280%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat"
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
                className="px-3 py-2 pr-8 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2224%22%20height%3d%2024%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%236b7280%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat"
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
                    className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 hover:bg-[var(--background-secondary)] transition-colors"
                  >
                    {/* Icono tipo */}
                    <div className={`p-1.5 sm:p-2 rounded-lg ${config.bg} shrink-0`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.color}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-medium truncate">{operation.concept}</p>
                        {operation.category && (
                          <span
                            className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-[var(--background-secondary)]"
                            style={{ color: operation.category.color }}
                          >
                            {operation.category.icon} {operation.category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-sm text-[var(--brand-gray)]">
                        {format(new Date(operation.operation_date), "d MMM", { locale: es })}
                        {operation.category && (
                          <span className="sm:hidden" style={{ color: operation.category.color }}>
                            {" "}{operation.category.icon}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Importe */}
                    <div className={`text-right text-xs sm:text-sm font-semibold ${config.color} shrink-0`}>
                      {operation.type === "expense" ? "-" : "+"}{formatCurrency(operation.amount)}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => handleEdit(operation)}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-gray)]" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(operation.id)}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--danger)]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 border-t border-[var(--border)] gap-2">
              <div className="text-xs sm:text-sm text-[var(--brand-gray)] order-2 sm:order-1">
                {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount}
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 order-1 sm:order-2">
                {/* First page */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={!canGoPrevious}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                {/* Previous page */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!canGoPrevious}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-1 sm:px-2 text-[var(--brand-gray)] text-xs sm:text-sm">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page as number)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                {/* Last page */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={!canGoNext}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  <ChevronsRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
