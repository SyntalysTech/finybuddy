"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Trash2,
  Search,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  Key,
  Mail,
  UserX,
  UserCheck,
  Newspaper,
  Send,
  MailX,
  MailCheck,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  is_active: boolean;
  created_at: string;
  unsubscribed_at: string | null;
}

type Tab = "users" | "newsletter";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);

  // Selected user for actions
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Menu position for dropdown
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit user form
  const [editFullName, setEditFullName] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  // Password change form
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Newsletter form
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterContent, setNewsletterContent] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar usuarios");
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Error al cargar usuarios");
    }
  }, []);

  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/newsletter");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar suscriptores");
      }

      setSubscribers(data.subscribers || []);
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      setError("Error al cargar suscriptores");
    }
  }, []);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (profile?.is_admin) {
          setIsAdmin(true);
          await Promise.all([fetchUsers(), fetchSubscribers()]);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error checking admin:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetch();
  }, [supabase, fetchUsers, fetchSubscribers]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowActionsMenu(null);
      setMenuPosition(null);
    };
    if (showActionsMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showActionsMenu]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          fullName: newFullName,
          isAdmin: newIsAdmin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear usuario");
      }

      setSuccess(`Usuario ${newEmail} creado correctamente`);
      setShowCreateModal(false);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewIsAdmin(false);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear usuario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          fullName: editFullName,
          isAdmin: editIsAdmin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar usuario");
      }

      setSuccess(`Usuario ${selectedUser.email} actualizado`);
      setShowEditModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar usuario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newUserPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar contraseña");
      }

      setSuccess(`Contraseña de ${selectedUser.email} actualizada`);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewUserPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar contraseña");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMagicLink = async (user: User) => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/users/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar magic link");
      }

      setSuccess(`Magic link enviado a ${user.email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar magic link");
    } finally {
      setActionLoading(false);
      setShowActionsMenu(null);
    }
  };

  const handleToggleActive = async (user: User) => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/users/toggle-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          isActive: !user.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar estado");
      }

      setSuccess(`Usuario ${user.email} ${user.is_active ? "desactivado" : "activado"}`);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado");
    } finally {
      setActionLoading(false);
      setShowActionsMenu(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || deleteConfirmText !== "ELIMINAR") {
      setError("Escribe ELIMINAR para confirmar");
      return;
    }

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar usuario");
      }

      setSuccess(`Usuario ${selectedUser.email} eliminado`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDeleteConfirmText("");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar usuario");
    } finally {
      setActionLoading(false);
    }
  };

  // Newsletter functions
  const handleToggleSubscriber = async (subscriber: Subscriber) => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberId: subscriber.id,
          isActive: !subscriber.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar suscriptor");
      }

      setSuccess(`Suscriptor ${subscriber.email} ${subscriber.is_active ? "dado de baja" : "reactivado"}`);
      await fetchSubscribers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar suscriptor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubscriber = async (subscriber: Subscriber) => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId: subscriber.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar suscriptor");
      }

      setSuccess(`Suscriptor ${subscriber.email} eliminado`);
      await fetchSubscribers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar suscriptor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendNewsletter = async (isTest: boolean) => {
    if (!newsletterSubject.trim() || !newsletterContent.trim()) {
      setError("El asunto y contenido son requeridos");
      return;
    }

    if (isTest && !testEmail.trim()) {
      setError("Introduce un email de prueba");
      return;
    }

    setError("");
    setSuccess("");
    setSendingNewsletter(true);

    try {
      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newsletterSubject,
          content: newsletterContent,
          testEmail: isTest ? testEmail : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar newsletter");
      }

      if (isTest) {
        setSuccess(`Email de prueba enviado a ${testEmail}`);
      } else {
        setSuccess(`Newsletter enviada a ${data.sent} suscriptores`);
        setShowNewsletterModal(false);
        setNewsletterSubject("");
        setNewsletterContent("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar newsletter");
    } finally {
      setSendingNewsletter(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFullName(user.full_name || "");
    setEditIsAdmin(user.is_admin);
    setShowEditModal(true);
    setShowActionsMenu(null);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewUserPassword("");
    setShowPasswordModal(true);
    setShowActionsMenu(null);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
    setShowActionsMenu(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubscribers = subscribers.filter(
    (subscriber) =>
      subscriber.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <Header title="Admin" subtitle="Panel de administración" />
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-purple)]" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header title="Admin" subtitle="Panel de administración" />
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-[var(--brand-gray)]">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Admin"
        subtitle="Gestiona usuarios y newsletter de FinyBuddy"
        actions={
          activeTab === "users" ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Crear Usuario</span>
            </button>
          ) : (
            <button
              onClick={() => setShowNewsletterModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Enviar Newsletter</span>
            </button>
          )
        }
      />

      <div className="p-6 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4 text-red-400 hover:text-red-300" />
            </button>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
            <button onClick={() => setSuccess("")} className="ml-auto">
              <X className="w-4 h-4 text-green-400 hover:text-green-300" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-[var(--background-secondary)] rounded-xl w-fit">
          <button
            onClick={() => { setActiveTab("users"); setSearchTerm(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "users"
                ? "bg-[var(--card-bg)] text-white shadow-sm"
                : "text-[var(--brand-gray)] hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Usuarios
          </button>
          <button
            onClick={() => { setActiveTab("newsletter"); setSearchTerm(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "newsletter"
                ? "bg-[var(--card-bg)] text-white shadow-sm"
                : "text-[var(--brand-gray)] hover:text-white"
            }`}
          >
            <Newspaper className="w-4 h-4" />
            Newsletter
          </button>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
            <input
              type="text"
              placeholder={activeTab === "users" ? "Buscar por email o nombre..." : "Buscar suscriptor..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20"
            />
          </div>
          {activeTab === "users" ? (
            <div className="flex gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                <span className="text-[var(--brand-gray)] text-sm">Total:</span>
                <span className="ml-2 font-bold">{users.length}</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                <span className="text-[var(--brand-gray)] text-sm">Admins:</span>
                <span className="ml-2 font-bold text-[var(--brand-purple)]">
                  {users.filter((u) => u.is_admin).length}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                <span className="text-[var(--brand-gray)] text-sm">Total:</span>
                <span className="ml-2 font-bold">{subscribers.length}</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                <span className="text-[var(--brand-gray)] text-sm">Activos:</span>
                <span className="ml-2 font-bold text-[var(--success)]">
                  {subscribers.filter((s) => s.is_active).length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        {activeTab === "users" && (
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Usuario</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Rol</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Estado</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Registro</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--background-secondary)]/50 transition-colors ${
                        user.is_active === false ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{user.full_name || "Sin nombre"}</p>
                          <p className="text-sm text-[var(--brand-gray)]">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--brand-purple)]/10 text-[var(--brand-purple)]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--background-secondary)] text-[var(--brand-gray)]">
                            <Users className="w-3.5 h-3.5" />
                            Usuario
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active !== false ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--success)]/10 text-[var(--success)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--brand-gray)]">
                        {new Date(user.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (showActionsMenu === user.id) {
                                setShowActionsMenu(null);
                                setMenuPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPosition({ top: rect.bottom + 4, left: rect.right - 192 });
                                setShowActionsMenu(user.id);
                              }
                            }}
                            disabled={actionLoading}
                            className="p-2 rounded-lg bg-[var(--background-secondary)] hover:bg-[var(--border)] transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[var(--brand-gray)]">
                        {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Newsletter Subscribers Table */}
        {activeTab === "newsletter" && (
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Nombre</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Origen</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Estado</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Fecha</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--brand-gray)]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((subscriber) => (
                    <tr
                      key={subscriber.id}
                      className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--background-secondary)]/50 transition-colors ${
                        !subscriber.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium">{subscriber.email}</p>
                      </td>
                      <td className="px-6 py-4 text-[var(--brand-gray)]">{subscriber.name || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)]">
                          {subscriber.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {subscriber.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--success)]/10 text-[var(--success)]">
                            <MailCheck className="w-3.5 h-3.5" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                            <MailX className="w-3.5 h-3.5" />
                            Baja
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--brand-gray)]">
                        {new Date(subscriber.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleSubscriber(subscriber)}
                            disabled={actionLoading}
                            className={`p-2 rounded-lg transition-colors ${
                              subscriber.is_active
                                ? "bg-[var(--warning)]/10 text-[var(--warning)] hover:bg-[var(--warning)]/20"
                                : "bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20"
                            }`}
                            title={subscriber.is_active ? "Dar de baja" : "Reactivar"}
                          >
                            {subscriber.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber)}
                            disabled={actionLoading}
                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSubscribers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[var(--brand-gray)]">
                        {searchTerm ? "No se encontraron suscriptores" : "No hay suscriptores registrados"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions Dropdown */}
        {showActionsMenu && menuPosition && (
          <div
            className="fixed w-48 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl z-50 py-1"
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const user = users.find((u) => u.id === showActionsMenu);
              if (!user) return null;
              return (
                <>
                  <button onClick={() => openEditModal(user)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--background-secondary)] transition-colors">
                    <Pencil className="w-4 h-4 text-[var(--brand-gray)]" />
                    Editar usuario
                  </button>
                  <button onClick={() => openPasswordModal(user)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--background-secondary)] transition-colors">
                    <Key className="w-4 h-4 text-[var(--brand-gray)]" />
                    Cambiar contraseña
                  </button>
                  <button onClick={() => handleSendMagicLink(user)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--background-secondary)] transition-colors">
                    <Mail className="w-4 h-4 text-[var(--brand-gray)]" />
                    Enviar magic link
                  </button>
                  <div className="border-t border-[var(--border)] my-1" />
                  <button onClick={() => handleToggleActive(user)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--background-secondary)] transition-colors">
                    {user.is_active !== false ? (
                      <>
                        <UserX className="w-4 h-4 text-[var(--warning)]" />
                        <span className="text-[var(--warning)]">Dar de baja</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 text-[var(--success)]" />
                        <span className="text-[var(--success)]">Reactivar</span>
                      </>
                    )}
                  </button>
                  <button onClick={() => openDeleteModal(user)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--background-secondary)] transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">Eliminar usuario</span>
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[var(--brand-purple)]" />
                  Crear Usuario
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20" placeholder="usuario@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2.5 pr-12 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20" placeholder="Mínimo 6 caracteres" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--brand-gray)] hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre completo</label>
                  <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20" placeholder="Nombre del usuario" />
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <input type="checkbox" id="isAdmin" checked={newIsAdmin} onChange={(e) => setNewIsAdmin(e.target.checked)} className="w-5 h-5 rounded border-[var(--border)] text-[var(--brand-purple)] focus:ring-[var(--brand-purple)]" />
                  <label htmlFor="isAdmin" className="flex-1">
                    <span className="font-medium">Permisos de administrador</span>
                    <p className="text-xs text-[var(--brand-gray)] mt-0.5">Podrá gestionar usuarios y acceder al panel admin</p>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors">Cancelar</button>
                  <button type="submit" disabled={actionLoading || !newEmail || !newPassword} className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {actionLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Creando...</>) : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-[var(--brand-purple)]" />
                  Editar Usuario
                </h2>
                <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={selectedUser.email} disabled className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-[var(--brand-gray)] mt-1">El email no se puede cambiar</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre completo</label>
                  <input type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20" placeholder="Nombre del usuario" />
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <input type="checkbox" id="editIsAdmin" checked={editIsAdmin} onChange={(e) => setEditIsAdmin(e.target.checked)} className="w-5 h-5 rounded border-[var(--border)] text-[var(--brand-purple)] focus:ring-[var(--brand-purple)]" />
                  <label htmlFor="editIsAdmin" className="flex-1">
                    <span className="font-medium">Permisos de administrador</span>
                    <p className="text-xs text-[var(--brand-gray)] mt-0.5">Podrá gestionar usuarios y acceder al panel admin</p>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors">Cancelar</button>
                  <button type="submit" disabled={actionLoading} className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {actionLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>) : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Key className="w-5 h-5 text-[var(--brand-purple)]" />
                  Cambiar Contraseña
                </h2>
                <button onClick={() => { setShowPasswordModal(false); setSelectedUser(null); setNewUserPassword(""); }} className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <p className="text-sm">Cambiar contraseña de <strong>{selectedUser.email}</strong></p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nueva contraseña *</label>
                  <div className="relative">
                    <input type={showNewPassword ? "text" : "password"} value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2.5 pr-12 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20" placeholder="Mínimo 6 caracteres" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--brand-gray)] hover:text-white transition-colors">
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowPasswordModal(false); setSelectedUser(null); setNewUserPassword(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors">Cancelar</button>
                  <button type="submit" disabled={actionLoading || !newUserPassword || newUserPassword.length < 6} className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {actionLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Cambiando...</>) : "Cambiar Contraseña"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  Eliminar Usuario
                </h2>
                <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); setDeleteConfirmText(""); }} className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">Esta acción eliminará permanentemente la cuenta de <strong>{selectedUser.email}</strong> y todos sus datos financieros. Esta acción no se puede deshacer.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Escribe <strong>ELIMINAR</strong> para confirmar</label>
                  <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" placeholder="ELIMINAR" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowDeleteModal(false); setSelectedUser(null); setDeleteConfirmText(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors">Cancelar</button>
                  <button onClick={handleDeleteUser} disabled={actionLoading || deleteConfirmText !== "ELIMINAR"} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {actionLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Eliminando...</>) : "Eliminar Usuario"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Newsletter Modal */}
        {showNewsletterModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Send className="w-5 h-5 text-[var(--brand-purple)]" />
                  Enviar Newsletter
                </h2>
                <button onClick={() => { setShowNewsletterModal(false); setNewsletterSubject(""); setNewsletterContent(""); setTestEmail(""); }} className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)]">
                  <p className="text-sm text-[var(--brand-gray)]">Se enviará a <strong className="text-white">{subscribers.filter(s => s.is_active).length}</strong> suscriptores activos</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Asunto *</label>
                  <input type="text" value={newsletterSubject} onChange={(e) => setNewsletterSubject(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20" placeholder="Asunto del email..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contenido *</label>
                  <textarea value={newsletterContent} onChange={(e) => setNewsletterContent(e.target.value)} rows={8} className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 resize-none" placeholder="Escribe el contenido del newsletter..." />
                </div>
                <div className="border-t border-[var(--border)] pt-4">
                  <label className="block text-sm font-medium mb-2">Email de prueba</label>
                  <div className="flex gap-2">
                    <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20" placeholder="tu@email.com" />
                    <button type="button" onClick={() => handleSendNewsletter(true)} disabled={sendingNewsletter || !newsletterSubject || !newsletterContent || !testEmail} className="px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      {sendingNewsletter ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Probar
                    </button>
                  </div>
                  <p className="text-xs text-[var(--brand-gray)] mt-1">Envía una prueba antes de enviar a todos</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowNewsletterModal(false); setNewsletterSubject(""); setNewsletterContent(""); setTestEmail(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors">Cancelar</button>
                  <button onClick={() => handleSendNewsletter(false)} disabled={sendingNewsletter || !newsletterSubject || !newsletterContent || subscribers.filter(s => s.is_active).length === 0} className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {sendingNewsletter ? (<><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>) : (<><Send className="w-4 h-4" />Enviar a Todos</>)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
