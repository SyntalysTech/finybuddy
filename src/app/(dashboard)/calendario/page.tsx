"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  X,
  Edit2,
  Trash2,
  PiggyBank,
  Bell,
  Clock
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
  type: "income" | "expense" | "savings";
  amount: number;
  concept: string;
  description: string | null;
  operation_date: string;
  category_id: string | null;
  category?: Category;
}

// SavingsContribution interface removed - calendar will no longer show contributions from savings goals

interface Reminder {
  id: string;
  name: string;
  description: string | null;
  reminder_date: string;
  amount: number | null;
  is_completed: boolean;
}

interface DayData {
  date: Date;
  operations: Operation[];
  reminders: Reminder[];
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDecimals, setShowDecimals] = useState(true);
  const [monthSummary, setMonthSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    operationCount: 0,
  });

  // Operation modal states
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOperation, setDeletingOperation] = useState<Operation | null>(null);

  // Reminder modal states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showDeleteReminderModal, setShowDeleteReminderModal] = useState(false);
  const [deletingReminder, setDeletingReminder] = useState<Reminder | null>(null);

  const supabase = createClient();

  // Fetch user preferences
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("show_decimals")
          .eq("id", user.id)
          .single();
        if (profile) {
          setShowDecimals(profile.show_decimals ?? true);
        }
      }
    };
    fetchProfile();
  }, [supabase]);

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

      // Fetch reminders for the visible calendar range
      const { data: reminders } = await supabase
        .from("calendar_reminders")
        .select("*")
        .eq("user_id", user.id)
        .gte("reminder_date", format(calendarStart, "yyyy-MM-dd"))
        .lte("reminder_date", format(calendarEnd, "yyyy-MM-dd"))
        .order("reminder_date", { ascending: true });

      // Build calendar days array
      const days: DayData[] = [];
      let day = calendarStart;

      while (day <= calendarEnd) {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayOperations = (operations || []).filter(
          (op) => op.operation_date === dayStr
        );
        const dayReminders = (reminders || []).filter(
          (r) => r.reminder_date === dayStr
        );

        const totalIncome = dayOperations
          .filter((op) => op.type === "income")
          .reduce((sum, op) => sum + op.amount, 0);

        const totalExpenses = dayOperations
          .filter((op) => op.type === "expense")
          .reduce((sum, op) => sum + op.amount, 0);

        // Calculate savings from operations of type 'savings' only
        const totalSavings = dayOperations
          .filter((op) => op.type === "savings")
          .reduce((sum, op) => sum + op.amount, 0);

        days.push({
          date: new Date(day),
          operations: dayOperations,
          reminders: dayReminders,
          totalIncome,
          totalExpenses,
          totalSavings,
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

      // Calculate savings from operations of type 'savings' only
      const totalSavings = monthOperations
        .filter((op) => op.type === "savings")
        .reduce((sum, op) => sum + op.amount, 0);

      setMonthSummary({
        totalIncome,
        totalExpenses,
        totalSavings,
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
      case "savings":
        return <PiggyBank className="w-4 h-4 text-[var(--brand-cyan)]" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  };

  // FinyBuddy intelligent message
  const getFinyBuddyMessage = (): string[] => {
    if (loading) return [];

    const messages: string[] = [];
    const balance = monthSummary.totalIncome - monthSummary.totalExpenses;
    const pendingReminders = calendarDays
      .filter(d => isSameMonth(d.date, currentDate))
      .flatMap(d => d.reminders)
      .filter(r => !r.is_completed);

    // Check balance
    if (balance < 0) {
      messages.push(`Este mes vas en rojo: ${Math.abs(balance).toLocaleString("es-ES")}e mas de gastos que ingresos. Cuidado.`);
    } else if (balance > 0 && monthSummary.totalIncome > 0) {
      const savingsRate = Math.round((balance / monthSummary.totalIncome) * 100);
      if (savingsRate >= 20) {
        messages.push(`Llevas ${savingsRate}% de margen este mes. Muy bien, crack.`);
      } else if (savingsRate > 0) {
        messages.push(`Margen del ${savingsRate}% este mes. No esta mal, pero se puede mejorar.`);
      }
    }

    // Check pending reminders
    if (pendingReminders.length > 0) {
      const totalPending = pendingReminders.reduce((sum, r) => sum + (r.amount || 0), 0);
      if (totalPending > 0) {
        messages.push(`Tienes ${pendingReminders.length} recordatorio${pendingReminders.length > 1 ? "s" : ""} pendiente${pendingReminders.length > 1 ? "s" : ""} por ${totalPending.toLocaleString("es-ES")}e. No los pierdas de vista.`);
      } else {
        messages.push(`${pendingReminders.length} recordatorio${pendingReminders.length > 1 ? "s" : ""} pendiente${pendingReminders.length > 1 ? "s" : ""}. Revisa que no se te pase nada.`);
      }
    }

    // Check if no operations this month
    if (monthSummary.operationCount === 0 && isSameMonth(currentDate, new Date())) {
      messages.push(`Sin operaciones este mes. Empieza a registrar para tener control.`);
    }

    return messages;
  };

  const finyBuddyMessages = getFinyBuddyMessage();

  const handleAddReminder = (date?: Date) => {
    if (date) {
      setPreselectedDate(format(date, "yyyy-MM-dd"));
    } else {
      setPreselectedDate(null);
    }
    setEditingReminder(null);
    setShowReminderModal(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setPreselectedDate(null);
    setShowReminderModal(true);
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    setDeletingReminder(reminder);
    setShowDeleteReminderModal(true);
  };

  const confirmDeleteReminder = async () => {
    if (!deletingReminder) return;

    try {
      const { error } = await supabase
        .from("calendar_reminders")
        .delete()
        .eq("id", deletingReminder.id);

      if (error) throw error;

      // Update selectedDay immediately to remove the deleted reminder
      if (selectedDay) {
        setSelectedDay({
          ...selectedDay,
          reminders: selectedDay.reminders.filter(r => r.id !== deletingReminder.id)
        });
      }

      setShowDeleteReminderModal(false);
      setDeletingReminder(null);
      fetchMonthOperations();
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  };

  const handleToggleReminderComplete = async (reminder: Reminder) => {
    try {
      const { error } = await supabase
        .from("calendar_reminders")
        .update({ is_completed: !reminder.is_completed })
        .eq("id", reminder.id);

      if (error) throw error;
      fetchMonthOperations();
    } catch (error) {
      console.error("Error updating reminder:", error);
    }
  };

  return (
    <>
      <Header
        title="Calendario"
        subtitle="Vista calendario de tus operaciones y recordatorios"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddReminder()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo recordatorio</span>
            </button>
            <button
              onClick={() => handleAddOperation()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva operación</span>
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* FinyBuddy Vineta */}
        {finyBuddyMessages.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--brand-purple)]/5 border border-[var(--brand-purple)]/20">
            <div className="w-12 h-12 relative shrink-0">
              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBuddy"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1">
              {finyBuddyMessages.map((msg, i) => (
                <p key={i} className="text-sm text-[var(--foreground)] mb-1 last:mb-0">
                  {msg}
                </p>
              ))}
            </div>
          </div>
        )}

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

              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[var(--brand-cyan)]" />
                <input
                  type="month"
                  value={format(currentDate, "yyyy-MM")}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split("-");
                    setCurrentDate(new Date(parseInt(year), parseInt(month) - 1, 1));
                  }}
                  className="px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm font-semibold focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
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
            <div className="flex items-center gap-6 text-sm flex-wrap">
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
              {monthSummary.totalSavings > 0 && (
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-[var(--brand-cyan)]" />
                  <span className="text-[var(--brand-gray)]">Ahorro:</span>
                  <span className="font-semibold text-[var(--brand-cyan)]">
                    {formatCurrency(monthSummary.totalSavings)}
                  </span>
                </div>
              )}
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
                const hasReminders = dayData.reminders.length > 0;
                const totalItems = dayData.operations.length + dayData.reminders.length;

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
                      {totalItems > 0 && (
                        <span className="text-xs text-[var(--brand-gray)]">
                          {totalItems}
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
                        {dayData.totalSavings > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <PiggyBank className="w-3 h-3 text-[var(--brand-cyan)]" />
                            <span className="text-[var(--brand-cyan)] font-medium truncate">
                              {formatCurrency(dayData.totalSavings)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reminders preview */}
                    {hasReminders && (
                      <div className="mt-1">
                        {dayData.reminders.slice(0, 2).map((reminder) => (
                          <div
                            key={reminder.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)] truncate mb-0.5 ${
                              reminder.is_completed ? "line-through opacity-50" : ""
                            }`}
                            title={reminder.name}
                          >
                            {reminder.name}
                          </div>
                        ))}
                        {dayData.reminders.length > 2 && (
                          <span className="text-[10px] text-[var(--brand-gray)]">
                            +{dayData.reminders.length - 2} más
                          </span>
                        )}
                      </div>
                    )}

                    {/* Operation dots (max 3) */}
                    {hasOperations && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {dayData.operations.slice(0, 3).map((op) => (
                          <div
                            key={op.id}
                            className={`
                              w-2 h-2 rounded-full
                              ${op.type === "income" ? "bg-[var(--success)]" : ""}
                              ${op.type === "expense" ? "bg-[var(--danger)]" : ""}
                              ${op.type === "savings" ? "bg-[var(--brand-cyan)]" : ""}
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
        <div className="flex items-center justify-center gap-4 text-sm text-[var(--brand-gray)] flex-wrap">
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
            <span>Ahorro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[var(--warning)]/30" />
            <span>Recordatorios</span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col my-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold">
                  {format(selectedDay.date, "EEEE, d ", { locale: es }).charAt(0).toUpperCase() + format(selectedDay.date, "EEEE, d ", { locale: es }).slice(1).toLowerCase()}de {format(selectedDay.date, "MMMM", { locale: es }).toLowerCase()}
                </h2>
                <p className="text-sm text-[var(--brand-gray)]">
                  {selectedDay.operations.length + selectedDay.reminders.length} registro{(selectedDay.operations.length + selectedDay.reminders.length) !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowDayModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {/* Day Totals */}
              {selectedDay.operations.length > 0 && (
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[var(--border)] flex-wrap">
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
                  {selectedDay.totalSavings > 0 && (
                    <div className="flex items-center gap-2">
                      <PiggyBank className="w-4 h-4 text-[var(--brand-cyan)]" />
                      <span className="text-[var(--brand-cyan)] font-semibold">
                        {formatCurrency(selectedDay.totalSavings)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Reminders Section */}
              {selectedDay.reminders.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-[var(--brand-gray)] mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Recordatorios
                  </h3>
                  <div className="space-y-2">
                    {selectedDay.reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`p-3 rounded-xl bg-[var(--warning)]/5 border border-[var(--warning)]/20 ${
                          reminder.is_completed ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleReminderComplete(reminder)}
                              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                reminder.is_completed
                                  ? "bg-[var(--success)] border-[var(--success)]"
                                  : "border-[var(--warning)] hover:bg-[var(--warning)]/10"
                              }`}
                            >
                              {reminder.is_completed && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <span className={`font-medium ${reminder.is_completed ? "line-through" : ""}`}>
                                {reminder.name}
                              </span>
                              {reminder.description && (
                                <p className="text-sm text-[var(--brand-gray)] mt-0.5">{reminder.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {reminder.amount && (
                              <span className="text-[var(--warning)] font-semibold">
                                {formatCurrency(reminder.amount)}
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setShowDayModal(false);
                                  handleEditReminder(reminder);
                                }}
                                className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4 text-[var(--brand-gray)]" />
                              </button>
                              <button
                                onClick={() => handleDeleteReminder(reminder)}
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
                </div>
              )}

              {/* Operations Section */}
              {selectedDay.operations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--brand-gray)] mb-2 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Operaciones
                  </h3>
                  <div className="space-y-2">
                    {selectedDay.operations.map((op) => (
                      <div
                        key={op.id}
                        className="p-3 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--background-secondary)]/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`
                              p-2 rounded-lg shrink-0
                              ${op.type === "income" ? "bg-[var(--success)]/10" : ""}
                              ${op.type === "expense" ? "bg-[var(--danger)]/10" : ""}
                              ${op.type === "savings" ? "bg-[var(--brand-cyan)]/10" : ""}
                            `}>
                              {getOperationIcon(op.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
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
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`
                              font-semibold
                              ${op.type === "income" ? "text-[var(--success)]" : ""}
                              ${op.type === "expense" ? "text-[var(--danger)]" : ""}
                              ${op.type === "savings" ? "text-[var(--brand-cyan)]" : ""}
                            `}>
                              {op.type === "income" ? "+" : "-"}{formatCurrency(op.amount)}
                            </span>
                            <div className="flex items-center gap-1">
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
                </div>
              )}

              {/* Empty State */}
              {selectedDay.operations.length === 0 && selectedDay.reminders.length === 0 && (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-[var(--brand-gray)] mx-auto mb-3" />
                  <p className="text-[var(--brand-gray)]">No hay registros este día</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDayModal(false);
                    handleAddReminder(selectedDay.date);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  Recordatorio
                </button>
                <button
                  onClick={() => {
                    setShowDayModal(false);
                    handleAddOperation(selectedDay.date);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Operación
                </button>
              </div>
            </div>
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

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setEditingReminder(null);
          setPreselectedDate(null);
        }}
        onSave={() => {
          setShowReminderModal(false);
          setEditingReminder(null);
          setPreselectedDate(null);
          fetchMonthOperations();
        }}
        reminder={editingReminder}
        preselectedDate={preselectedDate}
      />

      {/* Delete Reminder Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteReminderModal}
        onClose={() => {
          setShowDeleteReminderModal(false);
          setDeletingReminder(null);
        }}
        onConfirm={confirmDeleteReminder}
        title="Eliminar recordatorio"
        message={`¿Estás seguro de que quieres eliminar "${deletingReminder?.name}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}

// Reminder Modal Component
function ReminderModal({
  isOpen,
  onClose,
  onSave,
  reminder,
  preselectedDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  reminder: Reminder | null;
  preselectedDate: string | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (reminder) {
      setName(reminder.name);
      setDescription(reminder.description || "");
      setReminderDate(reminder.reminder_date);
      setAmount(reminder.amount?.toString() || "");
    } else {
      setName("");
      setDescription("");
      setReminderDate(preselectedDate || format(new Date(), "yyyy-MM-dd"));
      setAmount("");
    }
    setError("");
  }, [reminder, preselectedDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Introduce un nombre para el recordatorio");
      return;
    }
    if (!reminderDate) {
      setError("Selecciona una fecha");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const reminderData = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        reminder_date: reminderDate,
        amount: amount ? parseFloat(amount) : null,
      };

      if (reminder) {
        const { error: updateError } = await supabase
          .from("calendar_reminders")
          .update(reminderData)
          .eq("id", reminder.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("calendar_reminders")
          .insert(reminderData);

        if (insertError) throw insertError;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {reminder ? "Editar recordatorio" : "Nuevo recordatorio"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pago ITV, Renovar seguro..."
              className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Fecha</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
              />
            </div>
          </div>

          {/* Amount (optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Importe <span className="text-[var(--brand-gray)] font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-gray)]">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción <span className="text-[var(--brand-gray)] font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
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
              {loading ? "Guardando..." : reminder ? "Guardar cambios" : "Crear recordatorio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
