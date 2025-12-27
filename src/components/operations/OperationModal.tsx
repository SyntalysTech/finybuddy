"use client";

import { useState, useEffect, useRef } from "react";
import { X, TrendingUp, TrendingDown, PiggyBank, Calendar, Tag, FileText, Euro, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

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

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  operation?: Operation | null;
  preselectedDate?: string | null;
}

const operationTypes = [
  { value: "income", label: "Ingreso", icon: TrendingUp, color: "text-[var(--success)]", bg: "bg-[var(--success)]/10" },
  { value: "expense", label: "Gasto", icon: TrendingDown, color: "text-[var(--danger)]", bg: "bg-[var(--danger)]/10" },
  { value: "savings", label: "Ahorro", icon: PiggyBank, color: "text-[var(--brand-cyan)]", bg: "bg-[var(--brand-cyan)]/10" },
];

const STORAGE_KEY_LAST_DATE = "finybuddy_last_operation_date";

export default function OperationModal({ isOpen, onClose, onSave, operation, preselectedDate }: OperationModalProps) {
  const [type, setType] = useState<"income" | "expense" | "savings">("expense");
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [description, setDescription] = useState("");
  const [operationDate, setOperationDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Track if form has unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const initialValuesRef = useRef<{
    type: string;
    amount: string;
    concept: string;
    description: string;
    operationDate: string;
    categoryId: string;
  } | null>(null);

  const supabase = createClient();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (data) setCategories(data);
    };

    if (isOpen) fetchCategories();
  }, [isOpen, supabase]);

  // Cargar datos si es edición o resetear para nueva operación
  useEffect(() => {
    if (operation) {
      // Editing existing operation
      setType(operation.type);
      setAmount(operation.amount.toString());
      setConcept(operation.concept);
      setDescription(operation.description || "");
      setOperationDate(operation.operation_date);
      setCategoryId(operation.category_id || "");

      initialValuesRef.current = {
        type: operation.type,
        amount: operation.amount.toString(),
        concept: operation.concept,
        description: operation.description || "",
        operationDate: operation.operation_date,
        categoryId: operation.category_id || "",
      };
    } else {
      // New operation - priority: preselectedDate > localStorage > today
      let dateToUse: string;
      if (preselectedDate) {
        dateToUse = preselectedDate;
      } else {
        const lastDate = typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY_LAST_DATE)
          : null;
        dateToUse = lastDate || format(new Date(), "yyyy-MM-dd");
      }

      setType("expense");
      setAmount("");
      setConcept("");
      setDescription("");
      setOperationDate(dateToUse);
      setCategoryId("");

      initialValuesRef.current = {
        type: "expense",
        amount: "",
        concept: "",
        description: "",
        operationDate: dateToUse,
        categoryId: "",
      };
    }
    setError("");
    setHasChanges(false);
    setShowExitConfirm(false);
  }, [operation, isOpen, preselectedDate]);

  // Track changes
  useEffect(() => {
    if (initialValuesRef.current) {
      const changed =
        type !== initialValuesRef.current.type ||
        amount !== initialValuesRef.current.amount ||
        concept !== initialValuesRef.current.concept ||
        description !== initialValuesRef.current.description ||
        operationDate !== initialValuesRef.current.operationDate ||
        categoryId !== initialValuesRef.current.categoryId;
      setHasChanges(changed);
    }
  }, [type, amount, concept, description, operationDate, categoryId]);

  // Filtrar categorías por tipo
  const filteredCategories = categories.filter((cat) => {
    if (type === "income") return cat.type === "income";
    if (type === "expense") return cat.type === "expense";
    return cat.type === "savings"; // savings
  });

  const handleClose = () => {
    if (hasChanges) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Introduce un importe válido");
      return;
    }
    if (!concept.trim()) {
      setError("Introduce un concepto");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const operationData = {
        user_id: user.id,
        type,
        amount: parseFloat(amount),
        concept: concept.trim(),
        description: description.trim() || null,
        operation_date: operationDate,
        category_id: categoryId || null,
      };

      if (operation) {
        // Actualizar
        const { error: updateError } = await supabase
          .from("operations")
          .update(operationData)
          .eq("id", operation.id);

        if (updateError) throw updateError;
      } else {
        // Crear
        const { error: insertError } = await supabase
          .from("operations")
          .insert(operationData);

        if (insertError) throw insertError;
      }

      // Save the last used date to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_LAST_DATE, operationDate);
      }

      onSave();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar la operación";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-60">
          <div className="bg-[var(--background)] rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[var(--warning)]/10">
                <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <h3 className="font-semibold">¿Salir sin guardar?</h3>
            </div>
            <p className="text-sm text-[var(--brand-gray)] mb-6">
              Tienes cambios sin guardar. Si sales ahora, se perderán.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
              >
                Continuar editando
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--danger)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal - NO onClick on backdrop to prevent accidental close */}
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {operation ? "Editar operación" : "Nueva operación"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo de operación - Siempre ocupa todo el ancho */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de operación</label>
            <div className="grid grid-cols-3 gap-2">
              {operationTypes.map((op) => {
                const Icon = op.icon;
                const isSelected = type === op.value;
                return (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => {
                      setType(op.value as "income" | "expense" | "savings");
                      setCategoryId("");
                    }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `border-current ${op.color} ${op.bg}`
                        : "border-[var(--border)] hover:border-[var(--brand-gray)]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? op.color : "text-[var(--brand-gray)]"}`} />
                    <span className={`text-xs font-medium ${isSelected ? op.color : ""}`}>
                      {op.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de 2 columnas para pantallas medianas y grandes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] appearance-none"
                >
                  <option value="">Sin categoría</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Concepto */}
            <div>
              <label className="block text-sm font-medium mb-2">Concepto</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Ej: Compra supermercado"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
            </div>

            {/* Importe */}
            <div>
              <label className="block text-sm font-medium mb-2">Importe</label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-lg font-semibold focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium mb-2">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="date"
                  value={operationDate}
                  onChange={(e) => setOperationDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                />
              </div>
              <p className="text-xs text-[var(--brand-gray)] mt-1">
                La fecha se recordará para la próxima operación
              </p>
            </div>
          </div>

          {/* Descripción - Siempre ocupa todo el ancho */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción <span className="text-[var(--brand-gray)] font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade más detalles..."
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

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Guardando..." : operation ? "Guardar cambios" : "Crear operación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
