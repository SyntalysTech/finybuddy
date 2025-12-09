"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLocalPage() {
  const [activeTab, setActiveTab] = useState<"create" | "reset">("create");

  // Create user states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reset password states
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("No se pudo crear el usuario");

      setMessage({
        type: "success",
        text: `Usuario creado: ${email}`,
      });
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar contraseña");
      }

      setResetMessage({
        type: "success",
        text: `Contraseña actualizada para: ${resetEmail}`,
      });
      setResetEmail("");
      setNewPassword("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setResetMessage({ type: "error", text: errorMessage });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl p-6">
        <h1 className="text-xl font-bold text-white mb-2">Admin Local</h1>
        <p className="text-gray-400 text-sm mb-6">Solo para uso local</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "create"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Crear Usuario
          </button>
          <button
            onClick={() => setActiveTab("reset")}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "reset"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Cambiar Contraseña
          </button>
        </div>

        {/* Create User Tab */}
        {activeTab === "create" && (
          <>
            {message && (
              <div
                className={`p-3 rounded-lg mb-4 text-sm ${
                  message.type === "success"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="cliente@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Contraseña</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Contraseña inicial"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creando..." : "Crear usuario"}
              </button>
            </form>
          </>
        )}

        {/* Reset Password Tab */}
        {activeTab === "reset" && (
          <>
            {resetMessage && (
              <div
                className={`p-3 rounded-lg mb-4 text-sm ${
                  resetMessage.type === "success"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {resetMessage.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email del usuario</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="cliente@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Nueva contraseña</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Nueva contraseña"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {resetLoading ? "Cambiando..." : "Cambiar contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
