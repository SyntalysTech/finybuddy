"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Sparkles, Info, AlertTriangle, AlertCircle, CheckCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "welcome";
  icon: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const typeColors: Record<string, string> = {
  info: "text-[var(--brand-cyan)]",
  success: "text-[var(--success)]",
  warning: "text-[var(--warning)]",
  error: "text-[var(--danger)]",
  welcome: "text-[var(--brand-purple)]",
};

const typeBgColors: Record<string, string> = {
  info: "bg-[var(--brand-cyan)]/10",
  success: "bg-[var(--success)]/10",
  warning: "bg-[var(--warning)]/10",
  error: "bg-[var(--danger)]/10",
  welcome: "bg-[var(--brand-purple)]/10",
};

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Cargar notificaciones
  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
    setLoading(false);
  };

  // Marcar como leída
  const markAsRead = async (id: string) => {
    await supabase.rpc("mark_notification_read", { p_notification_id: id });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Abrir notificación en modal
  const openNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsOpen(false);
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    await supabase.rpc("mark_all_notifications_read");
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cargar al montar
  useEffect(() => {
    fetchNotifications();

    // Suscribirse a nuevas notificaciones en tiempo real
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getIcon = (notification: Notification) => {
    const iconName = notification.icon || notification.type;
    const Icon = iconMap[iconName] || Info;
    return Icon;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
      >
        <Bell className="w-5 h-5 text-[var(--brand-gray)]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[8px] h-2 px-0.5 bg-[var(--brand-cyan)] rounded-full text-[10px] font-medium flex items-center justify-center">
            {unreadCount > 9 ? "" : ""}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[var(--brand-cyan)] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-[var(--brand-gray)]">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-[var(--brand-gray)] mx-auto mb-2 opacity-50" />
                <p className="text-sm text-[var(--brand-gray)]">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = getIcon(notification);
                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--background-secondary)] transition-colors cursor-pointer ${
                      !notification.is_read ? "bg-[var(--brand-cyan)]/5" : ""
                    }`}
                    onClick={() => openNotification(notification)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          typeBgColors[notification.type]
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${typeColors[notification.type]}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[var(--brand-cyan)] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--brand-gray)] mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-[var(--brand-gray)] mt-1 opacity-60">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal de notificación */}
      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className={`px-6 py-4 ${typeBgColors[selectedNotification.type]}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = getIcon(selectedNotification);
                    return (
                      <div className={`w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${typeColors[selectedNotification.type]}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="font-semibold text-lg">{selectedNotification.title}</h3>
                    <p className="text-xs text-[var(--brand-gray)]">
                      {format(new Date(selectedNotification.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 py-5">
              <p className="text-[var(--foreground)] leading-relaxed">
                {selectedNotification.message}
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-lg gradient-brand text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
