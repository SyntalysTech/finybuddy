"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  CreditCard,
  Home,
  Car,
  GraduationCap,
  Wallet,
  HelpCircle,
  Calendar,
  Edit2,
  Trash2,
  Pause,
  Play,
  CheckCircle,
  TrendingDown,
  Percent,
  Euro,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Building2
} from "lucide-react";
import { format, differenceInMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import DeleteConfirmModal from "@/components/operations/DeleteConfirmModal";

interface Debt {
  id: string;
  name: string;
  description: string | null;
  creditor: string | null;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number | null;
  start_date: string;
  due_date: string | null;
  status: "active" | "paused" | "paid";
  debt_type: "mortgage" | "car_loan" | "personal_loan" | "credit_card" | "student_loan" | "other";
  created_at: string;
  paid_at: string | null;
}

interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  notes: string | null;
  payment_date: string;
  created_at: string;
}

const DEBT_TYPES = [
  { value: "mortgage", label: "Hipoteca", icon: Home },
  { value: "car_loan", label: "Préstamo coche", icon: Car },
  { value: "personal_loan", label: "Préstamo personal", icon: Wallet },
  { value: "credit_card", label: "Tarjeta de crédito", icon: CreditCard },
  { value: "student_loan", label: "Préstamo estudios", icon: GraduationCap },
  { value: "other", label: "Otro", icon: HelpCircle },
];

const getDebtTypeInfo = (type: string) => {
  return DEBT_TYPES.find((t) => t.value === type) || DEBT_TYPES[5];
};

export default function DeudaPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "paid">("all");

  const supabase = createClient();

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", user.id)
        .order("current_balance", { ascending: false });

      if (data) setDebts(data);
    } catch (error) {
      console.error("Error fetching debts:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchPayments = useCallback(async (debtId: string) => {
    try {
      const { data } = await supabase
        .from("debt_payments")
        .select("*")
        .eq("debt_id", debtId)
        .order("payment_date", { ascending: false })
        .limit(10);

      if (data) setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  useEffect(() => {
    if (expandedDebt) {
      fetchPayments(expandedDebt);
    }
  }, [expandedDebt, fetchPayments]);

  const handleToggleStatus = async (debt: Debt) => {
    const newStatus = debt.status === "active" ? "paused" : "active";
    try {
      const { error } = await supabase
        .from("debts")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", debt.id);

      if (error) throw error;
      fetchDebts();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleMarkPaid = async (debt: Debt) => {
    try {
      const { error } = await supabase
        .from("debts")
        .update({
          status: "paid",
          current_balance: 0,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", debt.id);

      if (error) throw error;
      fetchDebts();
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const handleDeleteDebt = async () => {
    if (!deletingDebt) return;
    try {
      const { error } = await supabase
        .from("debts")
        .delete()
        .eq("id", deletingDebt.id);

      if (error) throw error;
      setShowDeleteModal(false);
      setDeletingDebt(null);
      fetchDebts();
    } catch (error) {
      console.error("Error deleting debt:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getProgress = (debt: Debt) => {
    const paid = debt.original_amount - debt.current_balance;
    return Math.min((paid / debt.original_amount) * 100, 100);
  };

  const getMonthsRemaining = (debt: Debt) => {
    if (!debt.monthly_payment || debt.monthly_payment <= 0) return null;
    return Math.ceil(debt.current_balance / debt.monthly_payment);
  };

  const filteredDebts = debts.filter((debt) => {
    if (filter === "all") return true;
    if (filter === "active") return debt.status === "active" || debt.status === "paused";
    if (filter === "paid") return debt.status === "paid";
    return true;
  });

  // Summary stats
  const totalDebt = debts.filter(d => d.status !== "paid").reduce((sum, d) => sum + d.current_balance, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.original_amount, 0);
  const totalPaid = totalOriginal - debts.reduce((sum, d) => sum + d.current_balance, 0);
  const activeDebts = debts.filter(d => d.status === "active").length;
  const paidDebts = debts.filter(d => d.status === "paid").length;
  const totalMonthlyPayment = debts.filter(d => d.status === "active").reduce((sum, d) => sum + (d.monthly_payment || 0), 0);

  return (
    <>
      <Header
        title="Deuda"
        subtitle="Gestiona y controla tus deudas"
        actions={
          <button
            onClick={() => {
              setEditingDebt(null);
              setShowDebtModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva deuda</span>
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--danger)]/10">
                <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Deuda total</p>
                <p className="text-xl font-bold text-[var(--danger)]">{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <CheckCircle className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Total pagado</p>
                <p className="text-xl font-bold text-[var(--success)]">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--warning)]/10">
                <Calendar className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Cuota mensual</p>
                <p className="text-xl font-bold">{formatCurrency(totalMonthlyPayment)}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--brand-purple)]/10">
                <CreditCard className="w-5 h-5 text-[var(--brand-purple)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Deudas activas</p>
                <p className="text-xl font-bold">{activeDebts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {[
            { value: "all", label: "Todas" },
            { value: "active", label: "Activas" },
            { value: "paid", label: "Pagadas" },
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

        {/* Debts List */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)] mx-auto"></div>
            <p className="mt-3 text-[var(--brand-gray)]">Cargando deudas...</p>
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="card p-12 text-center">
            <CreditCard className="w-16 h-16 text-[var(--brand-gray)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes deudas registradas</h3>
            <p className="text-[var(--brand-gray)] mb-6">
              Añade tus deudas para llevar un control de tus pagos
            </p>
            <button
              onClick={() => {
                setEditingDebt(null);
                setShowDebtModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Añadir deuda
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDebts.map((debt) => {
              const progress = getProgress(debt);
              const monthsRemaining = getMonthsRemaining(debt);
              const isExpanded = expandedDebt === debt.id;
              const typeInfo = getDebtTypeInfo(debt.debt_type);
              const TypeIcon = typeInfo.icon;
              const isOverdue = debt.due_date && parseISO(debt.due_date) < new Date() && debt.status === "active";

              return (
                <div
                  key={debt.id}
                  className={`card overflow-hidden ${debt.status === "paid" ? "opacity-75" : ""}`}
                >
                  {/* Main Content */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--danger)]/10 shrink-0">
                        <TypeIcon className="w-6 h-6 text-[var(--danger)]" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{debt.name}</h3>
                              <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--background-secondary)]">
                                {typeInfo.label}
                              </span>
                              {debt.status === "paused" && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--warning)]/10 text-[var(--warning)]">
                                  Pausada
                                </span>
                              )}
                              {debt.status === "paid" && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--success)]/10 text-[var(--success)]">
                                  Pagada
                                </span>
                              )}
                              {isOverdue && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--danger)]/10 text-[var(--danger)]">
                                  Vencida
                                </span>
                              )}
                            </div>
                            {debt.creditor && (
                              <p className="text-sm text-[var(--brand-gray)] mt-0.5 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {debt.creditor}
                              </p>
                            )}
                            {debt.description && (
                              <p className="text-sm text-[var(--brand-gray)] mt-1">{debt.description}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {debt.status !== "paid" && (
                              <>
                                <button
                                  onClick={() => {
                                    setPayingDebt(debt);
                                    setShowPaymentModal(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-[var(--success)]/10 transition-colors"
                                  title="Registrar pago"
                                >
                                  <Euro className="w-4 h-4 text-[var(--success)]" />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(debt)}
                                  className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                                  title={debt.status === "active" ? "Pausar" : "Reanudar"}
                                >
                                  {debt.status === "active" ? (
                                    <Pause className="w-4 h-4 text-[var(--brand-gray)]" />
                                  ) : (
                                    <Play className="w-4 h-4 text-[var(--brand-gray)]" />
                                  )}
                                </button>
                                {debt.current_balance <= 0 && (
                                  <button
                                    onClick={() => handleMarkPaid(debt)}
                                    className="p-2 rounded-lg hover:bg-[var(--success)]/10 transition-colors"
                                    title="Marcar como pagada"
                                  >
                                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => {
                                setEditingDebt(debt);
                                setShowDebtModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4 text-[var(--brand-gray)]" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingDebt(debt);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-[var(--danger)]" />
                            </button>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[var(--brand-gray)]">
                              Pagado: {formatCurrency(debt.original_amount - debt.current_balance)} de {formatCurrency(debt.original_amount)}
                            </span>
                            <span className="text-sm font-semibold text-[var(--success)]">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-3 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-[var(--success)]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1 text-[var(--danger)]">
                            <TrendingDown className="w-4 h-4" />
                            <span className="font-semibold">Pendiente: {formatCurrency(debt.current_balance)}</span>
                          </div>
                          {debt.monthly_payment && debt.monthly_payment > 0 && (
                            <div className="flex items-center gap-1 text-[var(--brand-gray)]">
                              <Calendar className="w-4 h-4" />
                              <span>{formatCurrency(debt.monthly_payment)}/mes</span>
                            </div>
                          )}
                          {debt.interest_rate > 0 && (
                            <div className="flex items-center gap-1 text-[var(--brand-gray)]">
                              <Percent className="w-4 h-4" />
                              <span>{debt.interest_rate}% TAE</span>
                            </div>
                          )}
                          {monthsRemaining !== null && monthsRemaining > 0 && debt.status === "active" && (
                            <div className="flex items-center gap-1 text-[var(--brand-gray)]">
                              <Calendar className="w-4 h-4" />
                              <span>~{monthsRemaining} meses restantes</span>
                            </div>
                          )}
                          {debt.due_date && (
                            <div className={`flex items-center gap-1 ${isOverdue ? "text-[var(--danger)]" : "text-[var(--brand-gray)]"}`}>
                              <AlertTriangle className="w-4 h-4" />
                              <span>Vence: {format(parseISO(debt.due_date), "d MMM yyyy", { locale: es })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse for payments */}
                  <button
                    onClick={() => setExpandedDebt(isExpanded ? null : debt.id)}
                    className="w-full px-5 py-2 border-t border-[var(--border)] flex items-center justify-center gap-2 text-sm text-[var(--brand-gray)] hover:bg-[var(--background-secondary)] transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Ocultar historial
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Ver historial de pagos
                      </>
                    )}
                  </button>

                  {/* Payments History */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-[var(--border)]">
                      <div className="pt-4">
                        {payments.length === 0 ? (
                          <p className="text-sm text-[var(--brand-gray)] text-center py-4">
                            No hay pagos registrados
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {payments.map((payment) => (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-secondary)]"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 rounded-lg bg-[var(--success)]/10">
                                    <Euro className="w-4 h-4 text-[var(--success)]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-[var(--success)]">
                                      -{formatCurrency(payment.amount)}
                                    </p>
                                    {payment.notes && (
                                      <p className="text-xs text-[var(--brand-gray)]">{payment.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-[var(--brand-gray)]">
                                  {format(parseISO(payment.payment_date), "d MMM yyyy", { locale: es })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debt Modal */}
      <DebtModal
        isOpen={showDebtModal}
        onClose={() => {
          setShowDebtModal(false);
          setEditingDebt(null);
        }}
        onSave={() => {
          setShowDebtModal(false);
          setEditingDebt(null);
          fetchDebts();
        }}
        debt={editingDebt}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPayingDebt(null);
        }}
        onSave={() => {
          setShowPaymentModal(false);
          setPayingDebt(null);
          fetchDebts();
          if (expandedDebt) fetchPayments(expandedDebt);
        }}
        debt={payingDebt}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingDebt(null);
        }}
        onConfirm={handleDeleteDebt}
        title="Eliminar deuda"
        message={`¿Estás seguro de que quieres eliminar "${deletingDebt?.name}"? Se eliminarán también todos los pagos asociados.`}
      />
    </>
  );
}

// Debt Create/Edit Modal
function DebtModal({
  isOpen,
  onClose,
  onSave,
  debt,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  debt: Debt | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creditor, setCreditor] = useState("");
  const [debtType, setDebtType] = useState<Debt["debt_type"]>("other");
  const [originalAmount, setOriginalAmount] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setDescription(debt.description || "");
      setCreditor(debt.creditor || "");
      setDebtType(debt.debt_type);
      setOriginalAmount(debt.original_amount.toString());
      setCurrentBalance(debt.current_balance.toString());
      setInterestRate(debt.interest_rate?.toString() || "");
      setMonthlyPayment(debt.monthly_payment?.toString() || "");
      setStartDate(debt.start_date);
      setDueDate(debt.due_date || "");
    } else {
      setName("");
      setDescription("");
      setCreditor("");
      setDebtType("other");
      setOriginalAmount("");
      setCurrentBalance("");
      setInterestRate("");
      setMonthlyPayment("");
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setDueDate("");
    }
    setError("");
  }, [debt, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Introduce un nombre para la deuda");
      return;
    }
    if (!originalAmount || parseFloat(originalAmount) <= 0) {
      setError("Introduce un importe original válido");
      return;
    }

    const balance = currentBalance ? parseFloat(currentBalance) : parseFloat(originalAmount);

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const debtData = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        creditor: creditor.trim() || null,
        debt_type: debtType,
        original_amount: parseFloat(originalAmount),
        current_balance: balance,
        interest_rate: interestRate ? parseFloat(interestRate) : 0,
        monthly_payment: monthlyPayment ? parseFloat(monthlyPayment) : null,
        start_date: startDate,
        due_date: dueDate || null,
        updated_at: new Date().toISOString(),
      };

      if (debt) {
        const { error: updateError } = await supabase
          .from("debts")
          .update(debtData)
          .eq("id", debt.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("debts")
          .insert(debtData);

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {debt ? "Editar deuda" : "Nueva deuda"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Debt Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de deuda</label>
            <div className="grid grid-cols-3 gap-2">
              {DEBT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = debtType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setDebtType(type.value as Debt["debt_type"])}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-[var(--brand-purple)] bg-[var(--brand-purple)]/10"
                        : "border-[var(--border)] hover:border-[var(--brand-gray)]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "text-[var(--brand-purple)]" : "text-[var(--brand-gray)]"}`} />
                    <span className={`text-xs font-medium ${isSelected ? "text-[var(--brand-purple)]" : ""}`}>
                      {type.label}
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
              placeholder="Ej: Hipoteca vivienda"
              className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
            />
          </div>

          {/* Creditor */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Acreedor <span className="text-[var(--brand-gray)] font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
              <input
                type="text"
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                placeholder="Ej: Banco Santander"
                className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
              />
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Importe original</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Saldo pendiente</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  placeholder={originalAmount || "0.00"}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>
          </div>

          {/* Interest & Monthly Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Interés TAE <span className="text-[var(--brand-gray)] font-normal">(%)</span>
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cuota mensual</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fecha inicio</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Fecha vencimiento <span className="text-[var(--brand-gray)] font-normal">(opc.)</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>
          </div>

          {/* Description */}
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
              {loading ? "Guardando..." : debt ? "Guardar cambios" : "Añadir deuda"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Payment Modal
function PaymentModal({
  isOpen,
  onClose,
  onSave,
  debt,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  debt: Debt | null;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && debt) {
      setAmount(debt.monthly_payment?.toString() || "");
      setNote("");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setError("");
    }
  }, [isOpen, debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!debt) return;
    if (!amount || parseFloat(amount) <= 0) {
      setError("Introduce un importe válido");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Insert payment
      const { error: insertError } = await supabase
        .from("debt_payments")
        .insert({
          debt_id: debt.id,
          amount: parseFloat(amount),
          notes: note.trim() || null,
          payment_date: paymentDate,
        });

      if (insertError) throw insertError;

      // Update debt current_balance
      const newBalance = Math.max(0, debt.current_balance - parseFloat(amount));
      const updateData: Record<string, unknown> = {
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      };

      // If balance is 0, mark as paid
      if (newBalance <= 0) {
        updateData.status = "paid";
        updateData.paid_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("debts")
        .update(updateData)
        .eq("id", debt.id);

      if (updateError) throw updateError;

      onSave();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !debt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Registrar pago</h2>
            <p className="text-sm text-[var(--brand-gray)]">{debt.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Balance */}
          <div className="p-4 rounded-xl bg-[var(--background-secondary)]">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--brand-gray)]">Saldo pendiente</span>
              <span className="font-semibold text-[var(--danger)]">
                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(debt.current_balance)}
              </span>
            </div>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--success)]"
                style={{
                  width: `${Math.min(((debt.original_amount - debt.current_balance) / debt.original_amount) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-[var(--brand-gray)] mt-2">
              Pagado: {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(debt.original_amount - debt.current_balance)} de {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(debt.original_amount)}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Importe del pago</label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-lg font-semibold focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                autoFocus
              />
            </div>
            <div className="flex gap-2 mt-2">
              {debt.monthly_payment && debt.monthly_payment > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(debt.monthly_payment!.toString())}
                  className="text-xs text-[var(--brand-cyan)] hover:underline"
                >
                  Cuota mensual ({new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(debt.monthly_payment)})
                </button>
              )}
              <button
                type="button"
                onClick={() => setAmount(debt.current_balance.toString())}
                className="text-xs text-[var(--success)] hover:underline"
              >
                Liquidar deuda ({new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(debt.current_balance)})
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Fecha del pago</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nota <span className="text-[var(--brand-gray)] font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Pago mensual de diciembre"
              className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
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
              {loading ? "Guardando..." : "Registrar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
