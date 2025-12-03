"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Calendar as CalendarIcon,
  X,
  Edit2,
  Trash2,
  Euro
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from "date-fns";
import { es } from "date-fns/locale";
import OperationModal from "@/components/operations/OperationModal";
import DeleteConfirmModal from "@/components/operations/DeleteConfirmModal";

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
  type: "income" | "expense" | "transfer";
  amount: number;
  concept: string;
  description: string | null;
  operation_date: string;
  category_id: string | null;
  category?: Category;
}

interface DayData {
  date: Date;
  operations: Operation[];
  totalIncome: number;
  totalExpenses: number;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monthSummary, setMonthSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    operationCount: 0,
  });

  // Operation modal states
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOperation, setDeletingOperation] = useState<Operation | null>(null);

  const supabase = createClient();

  const fetchMonthOperations = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Get calendar range (including days from prev/next months shown in grid)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

      // Fetch operations for the visible calendar range
      const { data: operations } = await supabase
        .from("operations")
        .select(`
          *,
          category:categories(id, name, icon, color, type)
        `)
        .eq("user_id", user.id)
        .gte("operation_date", format(calendarStart, "yyyy-MM-dd"))
        .lte("operation_date", format(calendarEnd, "yyyy-MM-dd"))
        .order("operation_date", { ascending: true });

      // Build calendar days array
      const days: DayData[] = [];
      let day = calendarStart;

      while (day <= calendarEnd) {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayOperations = (operations || []).filter(
          (op) => op.operation_date === dayStr
        );

        const totalIncome = dayOperations
          .filter((op) => op.type === "income")
          .reduce((sum, op) => sum + op.amount, 0);

        const totalExpenses = dayOperations
          .filter((op) => op.type === "expense")
          .reduce((sum, op) => sum + op.amount, 0);

        days.push({
          date: new Date(day),
          operations: dayOperations,
          totalIncome,
          totalExpenses,
        });

        day = addDays(day, 1);
      }

      setCalendarDays(days);

      // Calculate month summary (only for current month)
      const monthOperations = (operations || []).filter(
        (op) => {
          const opDate = parseISO(op.operation_date);
          return isSameMonth(opDate, currentDate);
        }
      );

      const totalIncome = monthOperations
        .filter((op) => op.type === "income")
        .reduce((sum, op) => sum + op.amount, 0);

      const totalExpenses = monthOperations
        .filter((op) => op.type === "expense")
        .reduce((sum, op) => sum + op.amount, 0);

      setMonthSummary({
        totalIncome,
        totalExpenses,
        operationCount: monthOperations.length,
      });

    } catch (error) {
      console.error("Error fetching operations:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, supabase]);

  useEffect(() => {
    fetchMonthOperations();
  }, [fetchMonthOperations]);

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (dayData: DayData) => {
    setSelectedDay(dayData);
    setShowDayModal(true);
  };

  const handleAddOperation = (date?: Date) => {
    if (date) {
      setPreselectedDate(format(date, "yyyy-MM-dd"));
    } else {
      setPreselectedDate(null);
    }
    setEditingOperation(null);
    setShowOperationModal(true);
  };

  const handleEditOperation = (operation: Operation) => {
    setEditingOperation(operation);
    setPreselectedDate(null);
    setShowOperationModal(true);
  };

  const handleDeleteOperation = (operation: Operation) => {
    setDeletingOperation(operation);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingOperation) return;

    try {
      const { error } = await supabase
        .from("operations")
        .delete()
        .eq("id", deletingOperation.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setDeletingOperation(null);

      // Refresh and update selected day if open
      await fetchMonthOperations();

      if (selectedDay) {
        const updatedDay = calendarDays.find(d =>
          isSameDay(d.date, selectedDay.date)
        );
        if (updatedDay) {
          setSelectedDay({
            ...updatedDay,
            operations: updatedDay.operations.filter(op => op.id !== deletingOperation.id)
          });
        }
      }
    } catch (error) {
      console.error("Error deleting operation:", error);
    }
  };

  const handleOperationSaved = () => {
    fetchMonthOperations();
    // Close day modal to refresh
    if (showDayModal && selectedDay) {
      setShowDayModal(false);
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUp className="w-4 h-4 text-[var(--success)]" />;
      case "expense":
        return <TrendingDown className="w-4 h-4 text-[var(--danger)]" />;
      case "transfer":
        return <ArrowLeftRight className="w-4 h-4 text-[var(--brand-cyan)]" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <>
      <Header
        title="Calendario"
        subtitle="Vista calendario de tus operaciones"
        actions={
          <button
            onClick={() => handleAddOperation()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva operación</span>
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Month Navigation & Summary */}
        <div className="card p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Month Navigator */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-[var(--brand-cyan)]" />
                <h2 className="text-xl font-semibold capitalize">
                  {format(currentDate, "MMMM yyyy", { locale: es })}
                </h2>
              </div>

              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors"
              >
                Hoy
              </button>
            </div>

            {/* Month Summary */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                <span className="text-[var(--brand-gray)]">Ingresos:</span>
                <span className="font-semibold text-[var(--success)]">
                  {formatCurrency(monthSummary.totalIncome)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[var(--danger)]" />
                <span className="text-[var(--brand-gray)]">Gastos:</span>
                <span className="font-semibold text-[var(--danger)]">
                  {formatCurrency(monthSummary.totalExpenses)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--brand-gray)]">Operaciones:</span>
                <span className="font-semibold">{monthSummary.operationCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="card overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-[var(--brand-gray)] bg-[var(--background-secondary)]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)] mx-auto"></div>
              <p className="mt-3 text-[var(--brand-gray)]">Cargando calendario...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((dayData, index) => {
                const isCurrentMonth = isSameMonth(dayData.date, currentDate);
                const isTodayDate = isToday(dayData.date);
                const hasOperations = dayData.operations.length > 0;

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(dayData)}
                    className={`
                      min-h-[100px] p-2 border-b border-r border-[var(--border)] cursor-pointer
                      transition-colors hover:bg-[var(--background-secondary)]
                      ${!isCurrentMonth ? "bg-[var(--background-secondary)]/50" : ""}
                      ${isTodayDate ? "bg-[var(--brand-cyan)]/5" : ""}
                    `}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`
                          w-7 h-7 flex items-center justify-center rounded-full text-sm
                          ${isTodayDate
                            ? "bg-[var(--brand-purple)] text-white font-bold"
                            : isCurrentMonth
                              ? "font-medium"
                              : "text-[var(--brand-gray)]"
                          }
                        `}
                      >
                        {format(dayData.date, "d")}
                      </span>
                      {hasOperations && (
                        <span className="text-xs text-[var(--brand-gray)]">
                          {dayData.operations.length}
                        </span>
                      )}
                    </div>

                    {/* Day Totals */}
                    {hasOperations && (
                      <div className="space-y-1">
                        {dayData.totalIncome > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <TrendingUp className="w-3 h-3 text-[var(--success)]" />
                            <span className="text-[var(--success)] font-medium truncate">
                              +{formatCurrency(dayData.totalIncome)}
                            </span>
                          </div>
                        )}
                        {dayData.totalExpenses > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <TrendingDown className="w-3 h-3 text-[var(--danger)]" />
                            <span className="text-[var(--danger)] font-medium truncate">
                              -{formatCurrency(dayData.totalExpenses)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Operation dots/preview (max 3) */}
                    {hasOperations && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {dayData.operations.slice(0, 3).map((op) => (
                          <div
                            key={op.id}
                            className={`
                              w-2 h-2 rounded-full
                              ${op.type === "income" ? "bg-[var(--success)]" : ""}
                              ${op.type === "expense" ? "bg-[var(--danger)]" : ""}
                              ${op.type === "transfer" ? "bg-[var(--brand-cyan)]" : ""}
                            `}
                            title={op.concept}
                          />
                        ))}
                        {dayData.operations.length > 3 && (
                          <span className="text-[10px] text-[var(--brand-gray)]">
                            +{dayData.operations.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm text-[var(--brand-gray)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--success)]" />
            <span>Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--danger)]" />
            <span>Gastos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--brand-cyan)]" />
            <span>Transferencias</span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold capitalize">
                  {format(selectedDay.date, "EEEE, d 'de' MMMM", { locale: es })}
                </h2>
                <p className="text-sm text-[var(--brand-gray)]">
                  {selectedDay.operations.length} operacion{selectedDay.operations.length !== 1 ? "es" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowDayModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Day Totals */}
              {selectedDay.operations.length > 0 && (
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[var(--border)]">
                  {selectedDay.totalIncome > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                      <span className="text-[var(--success)] font-semibold">
                        +{formatCurrency(selectedDay.totalIncome)}
                      </span>
                    </div>
                  )}
                  {selectedDay.totalExpenses > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-[var(--danger)]" />
                      <span className="text-[var(--danger)] font-semibold">
                        -{formatCurrency(selectedDay.totalExpenses)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <Euro className="w-4 h-4 text-[var(--brand-gray)]" />
                    <span className="font-semibold">
                      Balance: {formatCurrency(selectedDay.totalIncome - selectedDay.totalExpenses)}
                    </span>
                  </div>
                </div>
              )}

              {/* Operations List */}
              {selectedDay.operations.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-[var(--brand-gray)] mx-auto mb-3" />
                  <p className="text-[var(--brand-gray)]">No hay operaciones este día</p>
                  <button
                    onClick={() => {
                      setShowDayModal(false);
                      handleAddOperation(selectedDay.date);
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir operación
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDay.operations.map((op) => (
                    <div
                      key={op.id}
                      className="p-4 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--background-secondary)]/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Type Icon */}
                          <div className={`
                            p-2 rounded-lg shrink-0
                            ${op.type === "income" ? "bg-[var(--success)]/10" : ""}
                            ${op.type === "expense" ? "bg-[var(--danger)]/10" : ""}
                            ${op.type === "transfer" ? "bg-[var(--brand-cyan)]/10" : ""}
                          `}>
                            {getOperationIcon(op.type)}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{op.concept}</span>
                              {op.category && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--border)] shrink-0">
                                  {op.category.icon} {op.category.name}
                                </span>
                              )}
                            </div>
                            {op.description && (
                              <p className="text-sm text-[var(--brand-gray)] mt-1 line-clamp-2">
                                {op.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`
                            font-semibold
                            ${op.type === "income" ? "text-[var(--success)]" : ""}
                            ${op.type === "expense" ? "text-[var(--danger)]" : ""}
                            ${op.type === "transfer" ? "text-[var(--brand-cyan)]" : ""}
                          `}>
                            {op.type === "income" ? "+" : "-"}{formatCurrency(op.amount)}
                          </span>

                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => {
                                setShowDayModal(false);
                                handleEditOperation(op);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4 text-[var(--brand-gray)]" />
                            </button>
                            <button
                              onClick={() => handleDeleteOperation(op)}
                              className="p-1.5 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-[var(--danger)]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedDay.operations.length > 0 && (
              <div className="px-6 py-4 border-t border-[var(--border)]">
                <button
                  onClick={() => {
                    setShowDayModal(false);
                    handleAddOperation(selectedDay.date);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Añadir operación a este día
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Operation Modal */}
      <OperationModal
        isOpen={showOperationModal}
        onClose={() => {
          setShowOperationModal(false);
          setEditingOperation(null);
          setPreselectedDate(null);
        }}
        onSave={handleOperationSaved}
        operation={editingOperation}
        preselectedDate={preselectedDate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingOperation(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar operación"
        message={`¿Estás seguro de que quieres eliminar "${deletingOperation?.concept}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}
