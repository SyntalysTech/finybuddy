"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import Toast from "@/components/ui/Toast";
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
  Bold,
  Italic,
  Underline,
  Link2,
  Image,
  Video,
  Type,
  List,
  Code,
  FileText,
  Check,
  Save,
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
type EditorMode = "visual" | "html";

const DRAFT_KEY = "finybuddy_newsletter_draft";

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

  // Newsletter editor
  const [editorMode, setEditorMode] = useState<EditorMode>("visual");
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

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

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        setNewsletterSubject(draft.subject || "");
        setHtmlContent(draft.content || "");
        setDraftSaved(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync visual editor when switching to visual mode or when content loads
  useEffect(() => {
    if (editorMode === "visual" && editorRef.current && htmlContent) {
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [editorMode, htmlContent]);

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

  // Editor functions
  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt("URL del enlace:");
    if (url) execCmd("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("URL de la imagen:");
    if (url) {
      execCmd("insertHTML", `<img src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0;" alt="imagen" />`);
    }
  };

  const insertVideo = () => {
    const url = prompt("URL del video (YouTube o Vimeo):");
    if (!url) return;

    let embedUrl = url;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    execCmd(
      "insertHTML",
      `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:8px;" allowfullscreen></iframe></div>`
    );
  };

  const syncFromVisual = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  const switchEditorMode = (mode: EditorMode) => {
    if (mode === "html" && editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
    setEditorMode(mode);
  };

  const saveDraft = () => {
    const content = editorMode === "visual" && editorRef.current
      ? editorRef.current.innerHTML
      : htmlContent;

    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      subject: newsletterSubject,
      content,
    }));

    if (editorMode === "visual" && editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }

    setDraftSaved(true);
    setSuccess("Borrador guardado");
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setNewsletterSubject("");
    setHtmlContent("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setDraftSaved(false);
    setSentTo(new Set());
  };

  const getEditorContent = () => {
    if (editorMode === "visual" && editorRef.current) {
      return editorRef.current.innerHTML;
    }
    return htmlContent;
  };

  const handleSendTest = async () => {
    const content = getEditorContent();
    if (!newsletterSubject.trim() || !content.trim()) {
      setError("El asunto y contenido son requeridos");
      return;
    }
    if (!testEmail.trim()) {
      setError("Introduce un email de prueba");
      return;
    }

    setSendingTest(true);
    setError("");

    try {
      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newsletterSubject,
          content,
          testEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar");

      setSuccess(`Email de prueba enviado a ${testEmail}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar prueba");
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendToSubscriber = async (email: string) => {
    const content = getEditorContent();
    if (!newsletterSubject.trim() || !content.trim()) {
      setError("Guarda un borrador primero");
      return;
    }

    setSendingTo(email);
    setError("");

    try {
      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newsletterSubject,
          content,
          subscriberEmail: email,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar");

      setSentTo((prev) => new Set([...prev, email]));
      setSuccess(`Newsletter enviada a ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSendingTo(null);
    }
  };

  // User handlers (unchanged)
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

  // Newsletter subscriber handlers
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

  const activeSubscribers = subscribers.filter((s) => s.is_active);
  const filteredActiveSubscribers = activeSubscribers.filter(
    (s) =>
      s.email?.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
      s.name?.toLowerCase().includes(subscriberSearch.toLowerCase())
  );

  const hasContent = newsletterSubject.trim() && (
    editorMode === "visual"
      ? editorRef.current?.innerHTML?.trim()
      : htmlContent.trim()
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
          ) : undefined
        }
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Toast notifications */}
        {error && <Toast type="error" message={error} onClose={() => setError("")} />}
        {success && <Toast type="success" message={success} onClose={() => setSuccess("")} />}

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-[var(--background-secondary)] rounded-xl w-fit">
          <button
            onClick={() => { setActiveTab("users"); setSearchTerm(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "users"
                ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--brand-gray)] hover:text-[var(--foreground)]"
            }`}
          >
            <Users className="w-4 h-4" />
            Usuarios
          </button>
          <button
            onClick={() => { setActiveTab("newsletter"); setSearchTerm(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "newsletter"
                ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--brand-gray)] hover:text-[var(--foreground)]"
            }`}
          >
            <Newspaper className="w-4 h-4" />
            Newsletter
          </button>
        </div>

        {/* ===== USERS TAB ===== */}
        {activeTab === "users" && (
          <>
            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-gray)]" />
                <input
                  type="text"
                  placeholder="Buscar por email o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20"
                />
              </div>
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
            </div>

            {/* Users Table */}
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
          </>
        )}

        {/* ===== NEWSLETTER TAB ===== */}
        {activeTab === "newsletter" && (
          <>
            {/* Editor Section */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
              {/* Editor Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[var(--brand-purple)]" />
                  <h3 className="font-semibold text-sm sm:text-base">Editor de Newsletter</h3>
                </div>
                <div className="flex items-center gap-2">
                  {draftSaved && (
                    <button
                      onClick={clearDraft}
                      className="text-xs text-[var(--brand-gray)] hover:text-red-400 transition-colors px-2 py-1"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    onClick={saveDraft}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl gradient-brand text-white text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Save className="w-4 h-4" />
                    Guardar borrador
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium mb-2">Asunto</label>
                  <input
                    type="text"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20"
                    placeholder="Asunto del email..."
                  />
                </div>

                {/* Editor Mode Toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 p-1 bg-[var(--background-secondary)] rounded-lg">
                    <button
                      onClick={() => switchEditorMode("visual")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        editorMode === "visual"
                          ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
                          : "text-[var(--brand-gray)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Visual
                    </button>
                    <button
                      onClick={() => switchEditorMode("html")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        editorMode === "html"
                          ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
                          : "text-[var(--brand-gray)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      HTML
                    </button>
                  </div>
                </div>

                {/* Visual Editor */}
                {editorMode === "visual" && (
                  <div>
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-t-xl border-b-0">
                      <button type="button" onClick={() => execCmd("bold")} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors" title="Negrita">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => execCmd("italic")} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors" title="Cursiva">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => execCmd("underline")} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors" title="Subrayado">
                        <Underline className="w-4 h-4" />
                      </button>
                      <div className="w-px h-6 bg-[var(--border)] mx-1" />
                      <button type="button" onClick={() => execCmd("formatBlock", "H2")} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors" title="Encabezado">
                        <Type className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => execCmd("insertUnorderedList")} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors" title="Lista">
                        <List className="w-4 h-4" />
                      </button>
                      <div className="w-px h-6 bg-[var(--border)] mx-1" />
                      <button type="button" onClick={insertLink} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors" title="Enlace">
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={insertImage} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors" title="Imagen (URL)">
                        <Image className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={insertVideo} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors" title="Video (URL)">
                        <Video className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content Editable */}
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={syncFromVisual}
                      className="min-h-[200px] sm:min-h-[300px] max-h-[400px] sm:max-h-[500px] overflow-y-auto px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-b-xl focus:outline-none focus:border-[var(--brand-purple)] focus:ring-1 focus:ring-[var(--brand-purple)]/20 prose prose-sm max-w-none text-[var(--foreground)] [&_a]:text-[var(--brand-cyan)] [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_img]:rounded-lg [&_img]:max-w-full [&_ul]:list-disc [&_ul]:pl-5"
                      suppressContentEditableWarning
                    />
                  </div>
                )}

                {/* HTML Editor */}
                {editorMode === "html" && (
                  <div>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      rows={10}
                      className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 font-mono text-xs sm:text-sm resize-y min-h-[200px] sm:min-h-[300px]"
                      placeholder="<h2>Tu newsletter aquí...</h2>&#10;<p>Escribe HTML directamente...</p>"
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* Test Email */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[var(--border)]">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-gray)]" />
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 text-sm"
                      placeholder="Email de prueba..."
                    />
                  </div>
                  <button
                    onClick={handleSendTest}
                    disabled={sendingTest || !newsletterSubject || !testEmail}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shrink-0"
                  >
                    {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Enviar prueba
                  </button>
                </div>
              </div>
            </div>

            {/* Subscribers Section - Send individually */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Send className="w-5 h-5 text-[var(--brand-cyan)]" />
                    <h3 className="font-semibold text-sm sm:text-base">Enviar a suscriptores</h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
                    <span className="text-[var(--brand-gray)]">Activos:</span>
                    <span className="ml-1 font-bold text-[var(--success)]">{activeSubscribers.length}</span>
                  </div>
                  <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
                    <span className="text-[var(--brand-gray)]">Enviados:</span>
                    <span className="ml-1 font-bold text-[var(--brand-cyan)]">{sentTo.size}</span>
                  </div>
                  <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
                    <span className="text-[var(--brand-gray)]">Total:</span>
                    <span className="ml-1 font-bold">{subscribers.length}</span>
                  </div>
                </div>
              </div>

              {!hasContent && (
                <div className="px-4 sm:px-6 py-8 text-center text-[var(--brand-gray)]">
                  <Newspaper className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Escribe el asunto y contenido de la newsletter y guarda el borrador para poder enviar</p>
                </div>
              )}

              {hasContent && (
                <div>
                  {/* Search */}
                  <div className="px-4 sm:px-6 py-3 border-b border-[var(--border)]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-gray)]" />
                      <input
                        type="text"
                        value={subscriberSearch}
                        onChange={(e) => setSubscriberSearch(e.target.value)}
                        placeholder="Buscar suscriptor..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--brand-purple)] text-sm"
                      />
                    </div>
                  </div>

                  {/* Subscriber List */}
                  <div className="divide-y divide-[var(--border)]">
                    {filteredActiveSubscribers.map((subscriber) => {
                      const isSent = sentTo.has(subscriber.email);
                      const isSending = sendingTo === subscriber.email;

                      return (
                        <div
                          key={subscriber.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 gap-2 hover:bg-[var(--background-secondary)]/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{subscriber.email}</p>
                            {subscriber.name && (
                              <p className="text-xs text-[var(--brand-gray)] truncate">{subscriber.name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-[var(--brand-gray)] px-2 py-0.5 rounded bg-[var(--background-secondary)] hidden sm:inline">
                              {subscriber.source}
                            </span>
                            {isSent ? (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium">
                                <Check className="w-3.5 h-3.5" />
                                Enviado
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSendToSubscriber(subscriber.email)}
                                disabled={isSending}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)] hover:bg-[var(--brand-cyan)]/20 transition-colors text-xs font-medium disabled:opacity-50"
                              >
                                {isSending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                Enviar
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleSubscriber(subscriber)}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)] hover:bg-[var(--warning)]/20 transition-colors"
                              title="Dar de baja"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriber(subscriber)}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {filteredActiveSubscribers.length === 0 && (
                      <div className="px-6 py-8 text-center text-[var(--brand-gray)] text-sm">
                        {subscriberSearch ? "No se encontraron suscriptores" : "No hay suscriptores activos"}
                      </div>
                    )}
                  </div>

                  {/* Inactive subscribers toggle */}
                  {subscribers.filter((s) => !s.is_active).length > 0 && (
                    <div className="px-6 py-3 border-t border-[var(--border)] text-center">
                      <p className="text-xs text-[var(--brand-gray)]">
                        {subscribers.filter((s) => !s.is_active).length} suscriptor(es) inactivo(s) no mostrado(s)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
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
      </div>
    </>
  );
}
