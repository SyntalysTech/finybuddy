"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import {
  Scale,
  Info,
  Save,
  AlertTriangle,
  CheckCircle,
  X,
  Minus,
  Plus,
} from "lucide-react";

export default function ReglaFinancieraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Rule states
  const [ruleNeeds, setRuleNeeds] = useState(50);
  const [ruleWants, setRuleWants] = useState(30);
  const [ruleSavings, setRuleSavings] = useState(20);

  // Track if form has unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const initialValuesRef = useRef<{
    ruleNeeds: number;
    ruleWants: number;
    ruleSavings: number;
  } | null>(null);

  const supabase = createClient();

  const fetchRule = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("rule_needs_percent, rule_wants_percent, rule_savings_percent")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        const initialRuleNeeds = profileData.rule_needs_percent ?? 50;
        const initialRuleWants = profileData.rule_wants_percent ?? 30;
        const initialRuleSavings = profileData.rule_savings_percent ?? 20;

        setRuleNeeds(initialRuleNeeds);
        setRuleWants(initialRuleWants);
        setRuleSavings(initialRuleSavings);

        initialValuesRef.current = {
          ruleNeeds: initialRuleNeeds,
          ruleWants: initialRuleWants,
          ruleSavings: initialRuleSavings,
        };
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error fetching rule:", error);
      setError("Error al cargar la regla financiera");
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchRule();
  }, [fetchRule]);

  // Detect changes
  useEffect(() => {
    if (initialValuesRef.current) {
      const changed =
        ruleNeeds !== initialValuesRef.current.ruleNeeds ||
        ruleWants !== initialValuesRef.current.ruleWants ||
        ruleSavings !== initialValuesRef.current.ruleSavings;
      setHasChanges(changed);
    }
  }, [ruleNeeds, ruleWants, ruleSavings]);

  const handleSave = async () => {
    if (!userId) return;

    // Validate rule
    if (ruleNeeds + ruleWants + ruleSavings !== 100) {
      setError("La suma de los porcentajes debe ser 100%");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          rule_needs_percent: ruleNeeds,
          rule_wants_percent: ruleWants,
          rule_savings_percent: ruleSavings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      initialValuesRef.current = {
        ruleNeeds,
        ruleWants,
        ruleSavings,
      };
      setHasChanges(false);

      setSuccess("Regla financiera guardada correctamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const ruleTotal = ruleNeeds + ruleWants + ruleSavings;
  const isRuleValid = ruleTotal === 100;

  if (loading) {
    return (
      <>
        <Header title="Mi Regla financiera" subtitle="Personaliza la distribución de tus ingresos" />
        <div className="p-6">
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)] mx-auto"></div>
            <p className="mt-3 text-[var(--brand-gray)]">Cargando...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Mi Regla financiera" subtitle="Personaliza la distribución de tus ingresos" />

      <div className="p-6 space-y-6">
        {/* Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-[var(--success)]/10 text-[var(--success)] flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Financial Rule Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--brand-purple)]" />
              Regla 50/30/20
            </h3>
            <button
              onClick={() => {
                setRuleNeeds(50);
                setRuleWants(30);
                setRuleSavings(20);
              }}
              className="text-sm text-[var(--brand-cyan)] hover:underline"
            >
              Restaurar valores por defecto
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[var(--background-secondary)] mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[var(--brand-cyan)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--brand-gray)]">
                Personaliza los porcentajes de distribución de tus ingresos. La suma debe ser 100%.
                Los valores por defecto son 50% necesidades, 30% deseos y 20% ahorro. Esta configuración
                se aplica en Dashboard, Previsión y Previsión vs Realidad.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--brand-cyan)]">
                Necesidades
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRuleNeeds(Math.max(0, ruleNeeds - 1))}
                  disabled={ruleNeeds <= 0}
                  className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-cyan)] hover:bg-[var(--brand-cyan)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={ruleNeeds}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRuleNeeds(Math.max(0, Math.min(100, parseInt(val) || 0)));
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setRuleNeeds(Math.max(0, Math.min(100, val)));
                    }}
                    className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-center text-lg font-semibold focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-gray)]">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRuleNeeds(Math.min(100, ruleNeeds + 1))}
                  disabled={ruleNeeds >= 100}
                  className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-cyan)] hover:bg-[var(--brand-cyan)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[var(--brand-gray)] mt-1 text-center">Gastos esenciales</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--brand-purple)]">
                Deseos
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRuleWants(Math.max(0, ruleWants - 1))}
                  disabled={ruleWants <= 0}
                  className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-purple)] hover:bg-[var(--brand-purple)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={ruleWants}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRuleWants(Math.max(0, Math.min(100, parseInt(val) || 0)));
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setRuleWants(Math.max(0, Math.min(100, val)));
                    }}
                    className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-center text-lg font-semibold focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-gray)]">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRuleWants(Math.min(100, ruleWants + 1))}
                  disabled={ruleWants >= 100}
                  className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-purple)] hover:bg-[var(--brand-purple)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[var(--brand-gray)] mt-1 text-center">Gastos opcionales</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--success)]">
                Ahorro
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRuleSavings(Math.max(0, ruleSavings - 1))}
                  disabled={ruleSavings <= 0}
                  className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--success)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={ruleSavings}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setRuleSavings(Math.max(0, Math.min(100, parseInt(val) || 0)));
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setRuleSavings(Math.max(0, Math.min(100, val)));
                    }}
                    className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-center text-lg font-semibold focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-gray)]">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRuleSavings(Math.min(100, ruleSavings + 1))}
                  disabled={ruleSavings >= 100}
                  className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--success)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[var(--brand-gray)] mt-1 text-center">Ahorro e inversión</p>
            </div>
          </div>

          {/* Visual bar */}
          <div className="mt-6">
            <div className="h-4 rounded-full overflow-hidden flex">
              <div
                className="bg-[var(--brand-cyan)] transition-all"
                style={{ width: `${ruleNeeds}%` }}
              />
              <div
                className="bg-[var(--brand-purple)] transition-all"
                style={{ width: `${ruleWants}%` }}
              />
              <div
                className="bg-[var(--success)] transition-all"
                style={{ width: `${ruleSavings}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={isRuleValid ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                Total: {ruleTotal}%
              </span>
              {!isRuleValid && (
                <span className="text-[var(--danger)]">
                  {ruleTotal > 100 ? `Sobra ${ruleTotal - 100}%` : `Falta ${100 - ruleTotal}%`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button
            onClick={handleSave}
            disabled={saving || !isRuleValid}
            className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-medium shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </>
  );
}
