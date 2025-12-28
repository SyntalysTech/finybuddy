"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Bell,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  Calendar,
  Database,
  HelpCircle,
  Settings,
  Home,
  Calculator,
  Sun,
  Moon,
} from "lucide-react";

const START_PAGES = [
  { value: "dashboard", label: "Dashboard" },
  { value: "prevision-vs-realidad", label: "Previsión vs Realidad" },
  { value: "calendario", label: "Calendario" },
  { value: "operaciones", label: "Operaciones" },
];

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
];

interface NotificationSettings {
  email_reminder_alerts: boolean;
  in_app_monthly_summary: boolean;
}

export default function AjustesPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exporting, setExporting] = useState(false);

  // Preferences
  const [startPage, setStartPage] = useState("dashboard");
  const [showDecimals, setShowDecimals] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_reminder_alerts: true,
    in_app_monthly_summary: true,
  });

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch profile preferences
      const { data: profileData } = await supabase
        .from("profiles")
        .select("start_page, show_decimals")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setStartPage(profileData.start_page || "dashboard");
        setShowDecimals(profileData.show_decimals ?? true);
      }

      const savedNotifications = localStorage.getItem("finybuddy_notifications");
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(newNotifications);
    localStorage.setItem("finybuddy_notifications", JSON.stringify(newNotifications));
    setSuccess("Preferencias actualizadas");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handlePreferenceChange = async (key: "start_page" | "show_decimals", value: string | boolean) => {
    setSavingPreferences(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: { start_page?: string; show_decimals?: boolean; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };

      if (key === "start_page") {
        updateData.start_page = value as string;
        setStartPage(value as string);
      } else {
        updateData.show_decimals = value as boolean;
        setShowDecimals(value as boolean);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess("Preferencias actualizadas");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("Error saving preference:", err);
      setError("Error al guardar la preferencia");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleExportData = async (format: "json" | "csv") => {
    setExporting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const [
        { data: operations },
        { data: categories },
        { data: budgets },
        { data: savingsGoals },
        { data: debts },
        { data: profile },
      ] = await Promise.all([
        supabase.from("operations").select("*").eq("user_id", user.id).order("operation_date", { ascending: false }),
        supabase.from("categories").select("*").eq("user_id", user.id),
        supabase.from("budgets").select("*").eq("user_id", user.id),
        supabase.from("savings_goals").select("*, savings_contributions(*)").eq("user_id", user.id),
        supabase.from("debts").select("*, debt_payments(*)").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          email: profile?.email,
          fullName: profile?.full_name,
          createdAt: profile?.created_at,
        },
        operations: operations || [],
        categories: categories || [],
        budgets: budgets || [],
        savingsGoals: savingsGoals || [],
        debts: debts || [],
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        content = JSON.stringify(exportData, null, 2);
        filename = `finybuddy-export-${format}-${new Date().toISOString().split("T")[0]}.json`;
        mimeType = "application/json";
      } else {
        const headers = ["Fecha", "Tipo", "Concepto", "Importe", "Categoría", "Descripción"];
        const rows = (operations || []).map((op) => {
          const category = categories?.find((c) => c.id === op.category_id);
          return [
            op.operation_date,
            op.type === "income" ? "Ingreso" : op.type === "expense" ? "Gasto" : "Transferencia",
            `"${op.concept}"`,
            op.amount,
            category ? `"${category.name}"` : "",
            `"${op.description || ""}"`,
          ].join(",");
        });
        content = [headers.join(","), ...rows].join("\n");
        filename = `finybuddy-operaciones-${new Date().toISOString().split("T")[0]}.csv`;
        mimeType = "text/csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`Datos exportados correctamente en formato ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al exportar datos";
      setError(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") {
      setError("Escribe ELIMINAR para confirmar");
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      await supabase.from("savings_contributions").delete().eq("savings_goal_id", supabase.from("savings_goals").select("id").eq("user_id", user.id));
      await supabase.from("debt_payments").delete().eq("debt_id", supabase.from("debts").select("id").eq("user_id", user.id));
      await supabase.from("savings_goals").delete().eq("user_id", user.id);
      await supabase.from("debts").delete().eq("user_id", user.id);
      await supabase.from("operations").delete().eq("user_id", user.id);
      await supabase.from("budgets").delete().eq("user_id", user.id);
      await supabase.from("categories").delete().eq("user_id", user.id);
      await supabase.from("notifications").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);

      await supabase.auth.signOut();
      router.push("/login");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar cuenta";
      setError(errorMessage);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Ajustes" subtitle="Configuración de la aplicación" />
        <div className="p-6">
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)] mx-auto"></div>
            <p className="mt-3 text-[var(--brand-gray)]">Cargando ajustes...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Ajustes" subtitle="Configuración de la aplicación" />

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

        {/* Preferences - Full width at top */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--brand-purple)]" />
            Preferencias
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Página de inicio */}
            <div>
              <label className="block text-sm font-medium mb-2">Página de inicio</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <select
                  value={startPage}
                  onChange={(e) => handlePreferenceChange("start_page", e.target.value)}
                  disabled={savingPreferences}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)] appearance-none disabled:opacity-50"
                >
                  {START_PAGES.map((page) => (
                    <option key={page.value} value={page.value}>
                      {page.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mostrar decimales */}
            <div>
              <label className="block text-sm font-medium mb-2">Mostrar decimales</label>
              <button
                onClick={() => handlePreferenceChange("show_decimals", !showDecimals)}
                disabled={savingPreferences}
                className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-colors disabled:opacity-50 ${
                  showDecimals
                    ? "border-[var(--brand-cyan)] bg-[var(--brand-cyan)]/10"
                    : "border-[var(--border)] bg-[var(--background-secondary)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[var(--brand-gray)]" />
                  <span>{showDecimals ? "1.234,56 €" : "1.235 €"}</span>
                </div>
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    showDecimals ? "bg-[var(--brand-cyan)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5"
                    style={{ marginLeft: showDecimals ? "18px" : "2px" }}
                  />
                </div>
              </button>
            </div>

            {/* Tema */}
            <div>
              <label className="block text-sm font-medium mb-2">Tema</label>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-[var(--brand-purple)] bg-[var(--brand-purple)]/10"
                          : "border-[var(--border)] hover:border-[var(--brand-gray)] bg-[var(--background-secondary)]"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-[var(--brand-purple)]" : "text-[var(--brand-gray)]"}`} />
                      <span className={`text-xs font-medium ${isSelected ? "text-[var(--brand-purple)]" : ""}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--brand-purple)]" />
              Notificaciones
            </h3>

            <div className="space-y-4">
              {/* Alerta de recordatorios */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)]">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[var(--brand-gray)]" />
                  <div>
                    <p className="font-medium text-sm">Alerta de recordatorios</p>
                    <p className="text-xs text-[var(--brand-gray)]">Recibe un email 1 día antes del vencimiento de un pago configurado en Calendario</p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationChange("email_reminder_alerts")}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications.email_reminder_alerts ? "bg-[var(--brand-cyan)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                      notifications.email_reminder_alerts ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Resumen mensual */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)]">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[var(--brand-gray)]" />
                  <div>
                    <p className="font-medium text-sm">Resumen mensual</p>
                    <p className="text-xs text-[var(--brand-gray)]">Recibe el día 2 de cada mes un resumen del mes anterior en el panel de notificaciones de la app</p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationChange("in_app_monthly_summary")}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications.in_app_monthly_summary ? "bg-[var(--brand-cyan)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                      notifications.in_app_monthly_summary ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--brand-purple)]" />
              Gestión de datos
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--border)] transition-colors"
              >
                <div className="p-2 rounded-lg bg-[var(--brand-cyan)]/10">
                  <Download className="w-5 h-5 text-[var(--brand-cyan)]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Exportar datos</p>
                  <p className="text-xs text-[var(--brand-gray)]">Descarga una copia de todas tus operaciones</p>
                </div>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--danger)]/5 hover:bg-[var(--danger)]/10 transition-colors"
              >
                <div className="p-2 rounded-lg bg-[var(--danger)]/10">
                  <Trash2 className="w-5 h-5 text-[var(--danger)]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-[var(--danger)]">Eliminar cuenta</p>
                  <p className="text-xs text-[var(--danger)]/70">Elimina permanentemente tu cuenta y todos los datos</p>
                </div>
              </button>
            </div>
          </div>

          {/* About */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[var(--brand-purple)]" />
              Acerca de
            </h3>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--background-secondary)]">
              <p className="font-semibold">FinyBuddy</p>
              <span className="text-[var(--brand-gray)]">•</span>
              <p className="text-sm text-[var(--brand-gray)]">Versión <span className="font-mono">1.0.0</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold">Exportar datos</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-[var(--brand-gray)]">
                Descarga todas tus operaciones en un archivo compatible con Excel y otras hojas de cálculo.
              </p>

              <button
                onClick={() => handleExportData("csv")}
                disabled={exporting}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-[var(--brand-cyan)] bg-[var(--brand-cyan)]/5 hover:bg-[var(--brand-cyan)]/10 transition-colors disabled:opacity-50"
              >
                <div className="p-3 rounded-lg bg-[var(--brand-cyan)]/10">
                  <Download className="w-6 h-6 text-[var(--brand-cyan)]" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Descargar operaciones</p>
                  <p className="text-xs text-[var(--brand-gray)]">Archivo CSV compatible con Excel</p>
                </div>
              </button>

              {exporting && (
                <div className="text-center py-2">
                  <p className="text-sm text-[var(--brand-gray)]">Exportando datos...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--danger)]">Eliminar cuenta</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="p-1 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-[var(--danger)]/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-[var(--danger)] mb-1">Esta acción es irreversible</p>
                    <p className="text-xs text-[var(--danger)]/80">
                      Se eliminarán permanentemente todos tus datos: operaciones, categorías,
                      presupuestos, metas de ahorro y deudas. No podrás recuperar esta información.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Escribe <span className="font-mono font-bold">ELIMINAR</span> para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--danger)] focus:ring-1 focus:ring-[var(--danger)]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] font-medium hover:bg-[var(--background-secondary)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "ELIMINAR" || deleting}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--danger)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {deleting ? "Eliminando..." : "Eliminar cuenta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
