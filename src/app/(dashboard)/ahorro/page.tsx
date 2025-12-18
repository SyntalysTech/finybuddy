"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  Edit2,
  Trash2,
  Pause,
  Play,
  CheckCircle,
  PiggyBank,
  Sparkles,
  Clock,
  AlertTriangle,
  Euro,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import DeleteConfirmModal from "@/components/operations/DeleteConfirmModal";
import { useProfile } from "@/hooks/useProfile";

interface SavingsGoal {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: "active" | "paused" | "completed" | "cancelled";
  priority: number;
  created_at: string;
  completed_at: string | null;
}

interface SavingsContribution {
  id: string;
  savings_goal_id: string;
  amount: number;
  notes: string | null;
  contribution_date: string;
  created_at: string;
}

const ICON_OPTIONS = ["🎯", "🏠", "🚗", "✈️", "💻", "📱", "🎓", "💍", "🏖️", "🎁", "💰", "🏦", "📈", "🛡️", "🎮", "📸"];
const COLOR_OPTIONS = ["#02EAFF", "#9945FF", "#14F195", "#F97316", "#EF4444", "#EC4899", "#8B5CF6", "#06B6D4"];
const PRIORITY_LABELS = ["Muy baja", "Baja", "Media", "Alta", "Muy alta"];

export default function AhorroPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "completed">("all");
  const [editingContribution, setEditingContribution] = useState<SavingsContribution | null>(null);
  const [showDeleteContributionModal, setShowDeleteContributionModal] = useState(false);
  const [deletingContribution, setDeletingContribution] = useState<SavingsContribution | null>(null);

  const { profile } = useProfile();
  const showDecimals = profile?.show_decimals ?? true;

  const supabase = createClient();

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (data) setGoals(data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchContributions = useCallback(async (goalId: string) => {
    try {
      const { data } = await supabase
        .from("savings_contributions")
        .select("*")
        .eq("savings_goal_id", goalId)
        .order("contribution_date", { ascending: false })
        .limit(10);

      if (data) setContributions(data);
    } catch (error) {
      console.error("Error fetching contributions:", error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    if (expandedGoal) {
      fetchContributions(expandedGoal);
    }
  }, [expandedGoal, fetchContributions]);

  const handleToggleStatus = async (goal: SavingsGoal) => {
    const newStatus = goal.status === "active" ? "paused" : "active";
    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", goal.id);

      if (error) throw error;
      fetchGoals();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleMarkComplete = async (goal: SavingsGoal) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", goal.id);

      if (error) throw error;
      fetchGoals();
    } catch (error) {
      console.error("Error completing goal:", error);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    try {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", deletingGoal.id);

      if (error) throw error;
      setShowDeleteModal(false);
      setDeletingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: profile?.currency || "EUR",
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  };

  const getProgress = (goal: SavingsGoal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string | null) => {
    if (!targetDate) return null;
    const days = differenceInDays(parseISO(targetDate), new Date());
    return days;
  };

  const getMonthlyRequired = (goal: SavingsGoal) => {
    if (!goal.target_date) return null;
    const remaining = goal.target_amount - goal.current_amount;
    if (remaining <= 0) return 0;
    const days = getDaysRemaining(goal.target_date);
    if (!days || days <= 0) return remaining;
    const months = days / 30;
    return remaining / months;
  };

  const filteredGoals = goals.filter((goal) => {
    if (filter === "all") return true;
    if (filter === "active") return goal.status === "active";
    if (filter === "paused") return goal.status === "paused";
    if (filter === "completed") return goal.status === "completed";
    return true;
  });

  const handleDeleteContribution = async () => {
    if (!deletingContribution || !expandedGoal) return;

    try {
      const goal = goals.find(g => g.id === expandedGoal);
      if (!goal) return;

      // Delete the contribution
      const { error: deleteError } = await supabase
        .from("savings_contributions")
        .delete()
        .eq("id", deletingContribution.id);

      if (deleteError) throw deleteError;

      // Recalculate current_amount
      const newAmount = Math.max(0, goal.current_amount - deletingContribution.amount);

      // Determine new status
      let newStatus: SavingsGoal["status"] = goal.status;
      let completedAt = goal.completed_at;

      // If was completed and now amount is less than target, reactivate
      if (goal.status === "completed" && newAmount < goal.target_amount) {
        newStatus = "active";
        completedAt = null;
      }

      const { error: updateError } = await supabase
        .from("savings_goals")
        .update({
          current_amount: newAmount,
          status: newStatus,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (updateError) throw updateError;

      setShowDeleteContributionModal(false);
      setDeletingContribution(null);
      fetchGoals();
      fetchContributions(expandedGoal);
    } catch (error) {
      console.error("Error deleting contribution:", error);
    }
  };

  // Summary stats
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.filter(g => g.status !== "completed").reduce((sum, g) => sum + g.target_amount, 0);
  const activeGoals = goals.filter(g => g.status === "active").length;
  const completedGoals = goals.filter(g => g.status === "completed").length;

  return (
    <>
      <Header
        title="Ahorro"
        subtitle="Gestiona tus metas de ahorro"
        actions={
          <button
            onClick={() => {
              setEditingGoal(null);
              setShowGoalModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva meta</span>
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--brand-cyan)]/10">
                <Target className="w-5 h-5 text-[var(--brand-cyan)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Objetivo total</p>
                <p className="text-xl font-bold">{formatCurrency(totalTarget)}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <PiggyBank className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Total ahorrado</p>
                <p className="text-xl font-bold text-[var(--success)]">{formatCurrency(totalSaved)}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--brand-purple)]/10">
                <Sparkles className="w-5 h-5 text-[var(--brand-purple)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Metas activas</p>
                <p className="text-xl font-bold">{activeGoals}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <CheckCircle className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--brand-gray)]">Completadas</p>
                <p className="text-xl font-bold">{completedGoals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {[
            { value: "all", label: "Todas" },
            { value: "active", label: "Activas" },
            { value: "paused", label: "Pausadas" },
            { value: "completed", label: "Completadas" },
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

        {/* Goals List */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)] mx-auto"></div>
            <p className="mt-3 text-[var(--brand-gray)]">Cargando metas...</p>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="card p-12 text-center">
            <PiggyBank className="w-16 h-16 text-[var(--brand-gray)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes metas de ahorro</h3>
            <p className="text-[var(--brand-gray)] mb-6">
              Crea tu primera meta para empezar a ahorrar
            </p>
            <button
              onClick={() => {
                setEditingGoal(null);
                setShowGoalModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Crear meta de ahorro
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGoals.map((goal) => {
              const progress = getProgress(goal);
              const daysRemaining = getDaysRemaining(goal.target_date);
              const monthlyRequired = getMonthlyRequired(goal);
              const isExpanded = expandedGoal === goal.id;
              const isOverdue = daysRemaining !== null && daysRemaining < 0 && goal.status === "active";

              return (
                <div
                  key={goal.id}
                  className={`card overflow-hidden ${goal.status === "completed" ? "opacity-75" : ""}`}
                >
                  {/* Main Content */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: `${goal.color}20` }}
                      >
                        {goal.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{goal.name}</h3>
                              {goal.status === "paused" && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--warning)]/10 text-[var(--warning)]">
                                  Pausada
                                </span>
                              )}
                              {goal.status === "completed" && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--success)]/10 text-[var(--success)]">
                                  Completada
                                </span>
                              )}
                              {isOverdue && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--danger)]/10 text-[var(--danger)]">
                                  Vencida
                                </span>
                              )}
                            </div>
                            {goal.description && (
                              <p className="text-sm text-[var(--brand-gray)] mt-1">{goal.description}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {goal.status !== "completed" && (
                              <>
                                <button
                                  onClick={() => {
                                    setContributingGoal(goal);
                                    setShowContributionModal(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-[var(--success)]/10 transition-colors"
                                  title="Añadir aporte"
                                >
                                  <Plus className="w-4 h-4 text-[var(--success)]" />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(goal)}
                                  className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                                  title={goal.status === "active" ? "Pausar" : "Reanudar"}
                                >
                                  {goal.status === "active" ? (
                                    <Pause className="w-4 h-4 text-[var(--brand-gray)]" />
                                  ) : (
                                    <Play className="w-4 h-4 text-[var(--brand-gray)]" />
                                  )}
                                </button>
                                {progress >= 100 && (
                                  <button
                                    onClick={() => handleMarkComplete(goal)}
                                    className="p-2 rounded-lg hover:bg-[var(--success)]/10 transition-colors"
                                    title="Marcar como completada"
                                  >
                                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => {
                                setEditingGoal(goal);
                                setShowGoalModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4 text-[var(--brand-gray)]" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingGoal(goal);
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
                              {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
                            </span>
                            <span
                              className="text-sm font-semibold"
                              style={{ color: goal.color }}
                            >
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-3 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: goal.color,
                              }}
                            />
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          {goal.target_date && (
                            <div className="flex items-center gap-1 text-[var(--brand-gray)]">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(parseISO(goal.target_date), "d MMM yyyy", { locale: es })}
                                {daysRemaining !== null && daysRemaining > 0 && (
                                  <span className="ml-1">({daysRemaining} días)</span>
                                )}
                              </span>
                            </div>
                          )}
                          {monthlyRequired !== null && monthlyRequired > 0 && goal.status === "active" && (
                            <div className="flex items-center gap-1 text-[var(--brand-gray)]">
                              <TrendingUp className="w-4 h-4" />
                              <span>{formatCurrency(monthlyRequired)}/mes</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((p) => (
                              <div
                                key={p}
                                className={`w-2 h-2 rounded-full ${
                                  p <= goal.priority ? "bg-[var(--brand-cyan)]" : "bg-[var(--border)]"
                                }`}
                              />
                            ))}
                            <span className="text-[var(--brand-gray)] ml-1">{PRIORITY_LABELS[goal.priority - 1]}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse for contributions */}
                  <button
                    onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
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
                        Ver historial de aportes
                      </>
                    )}
                  </button>

                  {/* Contributions History */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-[var(--border)]">
                      <div className="pt-4">
                        {contributions.length === 0 ? (
                          <p className="text-sm text-[var(--brand-gray)] text-center py-4">
                            No hay aportes registrados
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {contributions.map((contrib) => (
                              <div
                                key={contrib.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-secondary)]"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 rounded-lg bg-[var(--success)]/10">
                                    <Plus className="w-4 h-4 text-[var(--success)]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-[var(--success)]">
                                      +{formatCurrency(contrib.amount)}
                                    </p>
                                    {contrib.notes && (
                                      <p className="text-xs text-[var(--brand-gray)]">{contrib.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[var(--brand-gray)]">
                                    {format(parseISO(contrib.contribution_date), "d MMM yyyy", { locale: es })}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingContribution(contrib);
                                      setContributingGoal(goal);
                                      setShowContributionModal(true);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-[var(--background)] transition-colors"
                                    title="Editar aporte"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-[var(--brand-gray)]" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingContribution(contrib);
                                      setShowDeleteContributionModal(true);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
                                    title="Eliminar aporte"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-[var(--danger)]" />
                                  </button>
                                </div>
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

      {/* Goal Modal */}
      <GoalModal
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setEditingGoal(null);
        }}
        onSave={() => {
          setShowGoalModal(false);
          setEditingGoal(null);
          fetchGoals();
        }}
        goal={editingGoal}
      />

      {/* Contribution Modal */}
      <ContributionModal
        isOpen={showContributionModal}
        onClose={() => {
          setShowContributionModal(false);
          setContributingGoal(null);
          setEditingContribution(null);
        }}
        onSave={() => {
          setShowContributionModal(false);
          setContributingGoal(null);
          setEditingContribution(null);
          fetchGoals();
          if (expandedGoal) fetchContributions(expandedGoal);
        }}
        goal={contributingGoal}
        contribution={editingContribution}
      />

      {/* Delete Goal Confirmation */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingGoal(null);
        }}
        onConfirm={handleDeleteGoal}
        title="Eliminar meta de ahorro"
        message={`¿Estás seguro de que quieres eliminar "${deletingGoal?.name}"? Se eliminarán también todos los aportes asociados.`}
      />

      {/* Delete Contribution Confirmation */}
      <DeleteConfirmModal
        isOpen={showDeleteContributionModal}
        onClose={() => {
          setShowDeleteContributionModal(false);
          setDeletingContribution(null);
        }}
        onConfirm={handleDeleteContribution}
        title="Eliminar aporte"
        message={`¿Estás seguro de que quieres eliminar este aporte de ${deletingContribution ? formatCurrency(deletingContribution.amount) : ""}? El saldo de la meta se recalculará automáticamente.`}
      />
    </>
  );
}

// Goal Create/Edit Modal
function GoalModal({
  isOpen,
  onClose,
  onSave,
  goal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  goal: SavingsGoal | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState("#02EAFF");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setDescription(goal.description || "");
      setIcon(goal.icon);
      setColor(goal.color);
      setTargetAmount(goal.target_amount.toString());
      setCurrentAmount(goal.current_amount.toString());
      setTargetDate(goal.target_date || "");
      setPriority(goal.priority);
    } else {
      setName("");
      setDescription("");
      setIcon("🎯");
      setColor("#02EAFF");
      setTargetAmount("");
      setCurrentAmount("0");
      setTargetDate("");
      setPriority(3);
    }
    setError("");
  }, [goal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Introduce un nombre para la meta");
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError("Introduce un objetivo válido");
      return;
    }

    const current = parseFloat(currentAmount) || 0;
    const target = parseFloat(targetAmount);

    // Validate current amount doesn't exceed target
    if (current > target) {
      setError("El ahorrado actual no puede superar el objetivo");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Auto-complete/reactivate logic
      let newStatus: SavingsGoal["status"] = goal?.status || "active";
      let completedAt = goal?.completed_at || null;

      if (current >= target) {
        // Auto-complete if current equals or exceeds target
        newStatus = "completed";
        completedAt = completedAt || new Date().toISOString();
      } else if (goal?.status === "completed") {
        // Reactivate if was completed but now current is less than target
        newStatus = "active";
        completedAt = null;
      }

      const goalData = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        icon,
        color,
        target_amount: target,
        current_amount: current,
        target_date: targetDate || null,
        priority,
        status: newStatus,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      };

      if (goal) {
        const { error: updateError } = await supabase
          .from("savings_goals")
          .update(goalData)
          .eq("id", goal.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("savings_goals")
          .insert(goalData);

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
            {goal ? "Editar meta" : "Nueva meta de ahorro"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Nombre de la meta</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Vacaciones de verano"
              className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción <span className="text-[var(--brand-gray)] font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu meta..."
              rows={2}
              className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] resize-none"
            />
          </div>

          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Icono</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border-2 transition-all ${
                      icon === i
                        ? "border-[var(--brand-cyan)] bg-[var(--brand-cyan)]/10"
                        : "border-[var(--border)] hover:border-[var(--brand-gray)]"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
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
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Objetivo</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ahorrado actual</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Fecha objetivo <span className="text-[var(--brand-gray)] font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-2">Prioridad</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="5"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium min-w-[80px]">{PRIORITY_LABELS[priority - 1]}</span>
            </div>
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
              {loading ? "Guardando..." : goal ? "Guardar cambios" : "Crear meta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Contribution Modal
function ContributionModal({
  isOpen,
  onClose,
  onSave,
  goal,
  contribution,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  goal: SavingsGoal | null;
  contribution?: SavingsContribution | null;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [contributionDate, setContributionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();
  const isEditing = !!contribution;

  useEffect(() => {
    if (isOpen) {
      if (contribution) {
        setAmount(contribution.amount.toString());
        setNote(contribution.notes || "");
        setContributionDate(contribution.contribution_date);
      } else {
        setAmount("");
        setNote("");
        setContributionDate(format(new Date(), "yyyy-MM-dd"));
      }
      setError("");
    }
  }, [isOpen, contribution]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!goal) return;
    if (!amount || parseFloat(amount) <= 0) {
      setError("Introduce un importe válido");
      return;
    }

    const newContribAmount = parseFloat(amount);

    // Validate that the new contribution doesn't exceed the remaining target
    if (!isEditing) {
      const wouldExceed = goal.current_amount + newContribAmount > goal.target_amount;
      if (wouldExceed) {
        setError("El aporte haría que el ahorrado supere el objetivo");
        return;
      }
    } else if (contribution) {
      const difference = newContribAmount - contribution.amount;
      const wouldExceed = goal.current_amount + difference > goal.target_amount;
      if (wouldExceed) {
        setError("El aporte haría que el ahorrado supere el objetivo");
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      let newGoalAmount: number;

      if (isEditing && contribution) {
        // Update existing contribution
        const { error: updateContribError } = await supabase
          .from("savings_contributions")
          .update({
            amount: newContribAmount,
            notes: note.trim() || null,
            contribution_date: contributionDate,
          })
          .eq("id", contribution.id);

        if (updateContribError) throw updateContribError;

        // Recalculate goal amount based on difference
        const difference = newContribAmount - contribution.amount;
        newGoalAmount = goal.current_amount + difference;
      } else {
        // Insert new contribution
        const { error: insertError } = await supabase
          .from("savings_contributions")
          .insert({
            user_id: user.id,
            savings_goal_id: goal.id,
            amount: newContribAmount,
            notes: note.trim() || null,
            contribution_date: contributionDate,
          });

        if (insertError) throw insertError;

        newGoalAmount = goal.current_amount + newContribAmount;
      }

      // Determine new status
      let newStatus: SavingsGoal["status"] = goal.status;
      let completedAt = goal.completed_at;

      if (newGoalAmount >= goal.target_amount) {
        // Auto-complete
        newStatus = "completed";
        completedAt = completedAt || new Date().toISOString();
      } else if (goal.status === "completed") {
        // Reactivate
        newStatus = "active";
        completedAt = null;
      }

      // Update goal current_amount and status
      const { error: updateError } = await supabase
        .from("savings_goals")
        .update({
          current_amount: newGoalAmount,
          status: newStatus,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (updateError) throw updateError;

      onSave();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !goal) return null;

  const remaining = isEditing && contribution
    ? goal.target_amount - goal.current_amount + contribution.amount
    : goal.target_amount - goal.current_amount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? "Editar aporte" : "Añadir aporte"}</h2>
            <p className="text-sm text-[var(--brand-gray)]">{goal.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Progress */}
          <div className="p-4 rounded-xl bg-[var(--background-secondary)]">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[var(--brand-gray)]">Progreso actual</span>
              <span className="font-semibold">
                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(goal.current_amount)}
                {" / "}
                {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(goal.target_amount)}
              </span>
            </div>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%`,
                  backgroundColor: goal.color,
                }}
              />
            </div>
            {remaining > 0 && (
              <p className="text-xs text-[var(--brand-gray)] mt-2">
                Te faltan {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(remaining)} para completar tu meta
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Importe del aporte</label>
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
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setAmount(remaining.toString())}
                className="mt-2 text-xs text-[var(--brand-cyan)] hover:underline"
              >
                Completar meta ({new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(remaining)})
              </button>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
              <input
                type="date"
                value={contributionDate}
                onChange={(e) => setContributionDate(e.target.value)}
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
              placeholder="Ej: Ahorro del mes de enero"
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
              {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Añadir aporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
