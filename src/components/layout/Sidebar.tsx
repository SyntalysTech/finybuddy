"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  Calculator,
  Calendar,
  PiggyBank,
  CreditCard,
  FolderOpen,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bot,
  Scale,
  ShieldCheck,
  Menu,
  X,
  Crown,
  Globe,
  Briefcase,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { useSubscription } from "@/hooks/useSubscription";
import ProBadge from "@/components/subscription/ProBadge";

const PRO_ROUTES = ["/prevision-vs-realidad", "/prevision", "/ahorro", "/deuda", "/chat"];

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  gradient?: string;
}

const mainNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-[#02EAFF]", gradient: "from-[#02EAFF]/20 to-transparent" },
  { name: "Previsión vs Realidad", href: "/prevision-vs-realidad", icon: ArrowLeftRight, color: "text-[#7739FE]", gradient: "from-[#7739FE]/20 to-transparent" },
  { name: "FinyBot", href: "/chat", icon: Bot, color: "text-[#02EAFF]", gradient: "from-[#02EAFF]/20 via-[#7739FE]/15 to-transparent" },
  { name: "Calendario", href: "/calendario", icon: Calendar, color: "text-[#EC4899]", gradient: "from-[#EC4899]/20 to-transparent" },
  { name: "Ahorro", href: "/ahorro", icon: PiggyBank, color: "text-[#22C55E]", gradient: "from-[#22C55E]/20 to-transparent" },
  { name: "Deuda", href: "/deuda", icon: CreditCard, color: "text-[#EF4444]", gradient: "from-[#EF4444]/20 to-transparent" },
  { name: "Operaciones", href: "/operaciones", icon: Briefcase, color: "text-[#10B981]", gradient: "from-[#10B981]/20 to-transparent" },
  { name: "Previsión", href: "/prevision", icon: Calculator, color: "text-[#F59E0B]", gradient: "from-[#F59E0B]/20 to-transparent" },
];

const settingsNavItems: NavItem[] = [
  { name: "Mis Categorías", href: "/categorias", icon: FolderOpen, color: "text-[#8B5CF6]", gradient: "from-[#8B5CF6]/20 to-transparent" },
  { name: "Perfil", href: "/perfil", icon: User, color: "text-[#F97316]", gradient: "from-[#F97316]/20 to-transparent" },
  { name: "Ajustes", href: "/ajustes", icon: Settings, color: "text-[#6B7280]", gradient: "from-[#6B7280]/20 to-transparent" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle, mobileOpen, setMobileOpen, isMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isPro } = useSubscription();

  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(profile?.is_admin || false);
      }
    };
    checkAdmin();
  }, [supabase]);

  // Cerrar sidebar móvil al navegar
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [pathname, isMobile, setMobileOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleNavClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={`h-16 ${collapsed && !isMobile ? "px-0 justify-center" : "px-4"} border-b border-[var(--sidebar-border)] flex items-center relative transition-all duration-300`}>
        <Link href="/dashboard" className="flex items-center justify-center overflow-hidden w-full" onClick={handleNavClick}>
          {/* Finy Logo Extendido */}
          <div
            className={`transition-all duration-300 ease-in-out flex items-center justify-center ${collapsed && !isMobile ? "w-0 opacity-0 hidden" : "w-[140px] opacity-100"
              }`}
          >
            <Image
              src="/assets/logo-finybuddy-wordmark.png"
              alt="FinyBuddy"
              width={140}
              height={32}
              className="object-contain flex-shrink-0"
            />
          </div>
          {/* Finy Mascota Colapsado */}
          <div
            className={`transition-all duration-300 ease-in-out flex items-center justify-center ${collapsed && !isMobile ? "w-10 opacity-100" : "w-0 opacity-0 hidden"
              }`}
          >
            <Image
              src="/assets/finy-mascota-minimalista.png"
              alt="FinyBuddy"
              width={34}
              height={34}
              className="object-contain flex-shrink-0 drop-shadow-[0_0_8px_rgba(2,234,255,0.4)]"
            />
          </div>
        </Link>
        {/* Botón cerrar en móvil */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 p-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Main Navigation */}
        <div className="px-3 mb-2">
          <div
            className={`px-3 mb-2 overflow-hidden transition-all duration-300 ease-in-out ${collapsed && !isMobile ? "h-0 opacity-0" : "h-5 opacity-60"
              }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-text)] whitespace-nowrap">
              Principal
            </p>
          </div>
          <ul className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={`relative w-full flex items-center ${collapsed && !isMobile ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"} rounded-xl transition-all duration-300 group overflow-hidden ${active
                      ? `bg-gradient-to-r ${item.gradient} border border-white/10`
                      : "hover:bg-[var(--sidebar-hover)] hover:scale-[1.02]"
                      }`}
                    title={collapsed && !isMobile ? item.name : undefined}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-[#02EAFF] to-[#7739FE] animate-pulse" />
                    )}
                    <div className={`p-1.5 rounded-lg transition-all duration-300 flex-shrink-0 ${active ? "bg-white/10" : "group-hover:bg-white/5"
                      }`}>
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${active
                          ? item.color
                          : `text-[var(--sidebar-text)] group-hover:${item.color}`
                          } ${active ? "scale-110" : "group-hover:scale-110"}`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${active ? "text-white font-semibold" : "group-hover:text-white"
                        } ${collapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100"}`}
                    >
                      {item.name}
                    </span>
                    {!isPro && PRO_ROUTES.includes(item.href) && !collapsed && !isMobile && (
                      <ProBadge className="ml-auto shrink-0" />
                    )}
                    {active && !collapsed && !isMobile && (
                      <div className="ml-auto flex-shrink-0 relative flex items-center justify-center w-4 h-4 mr-1">
                        <div className="absolute inset-0 rounded-full bg-[var(--brand-cyan)] opacity-20 animate-ping" />
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#02EAFF] to-[#7739FE] shadow-[0_0_10px_rgba(2,234,255,0.8)] z-10" />
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Divider */}
        <div className="px-5 mb-4">
          <div className="h-px bg-[var(--sidebar-border)]" />
        </div>

        {/* Settings Navigation */}
        <div className="px-3">
          <div
            className={`px-3 mb-2 overflow-hidden transition-all duration-300 ease-in-out ${collapsed && !isMobile ? "h-0 opacity-0" : "h-5 opacity-60"
              }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-text)] whitespace-nowrap">
              Configuración
            </p>
          </div>
          <ul className="space-y-1">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={`relative w-full flex items-center ${collapsed && !isMobile ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"} rounded-xl transition-all duration-300 group overflow-hidden ${active
                      ? `bg-gradient-to-r ${item.gradient} border border-white/10`
                      : "hover:bg-[var(--sidebar-hover)] hover:scale-[1.02]"
                      }`}
                    title={collapsed && !isMobile ? item.name : undefined}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-[#02EAFF] to-[#7739FE] animate-pulse" />
                    )}
                    <div className={`p-1.5 rounded-lg transition-all duration-300 flex-shrink-0 ${active ? "bg-white/10" : "group-hover:bg-white/5"
                      }`}>
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${active
                          ? item.color
                          : `text-[var(--sidebar-text)] group-hover:${item.color}`
                          } ${active ? "scale-110" : "group-hover:scale-110"}`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${active ? "text-white font-semibold" : "group-hover:text-white"
                        } ${collapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100"}`}
                    >
                      {item.name}
                    </span>
                    {!isPro && PRO_ROUTES.includes(item.href) && !collapsed && !isMobile && (
                      <ProBadge className="ml-auto shrink-0" />
                    )}
                    {active && !collapsed && !isMobile && (
                      <div
                        className={`ml-auto w-2 h-2 rounded-full bg-gradient-to-br from-[#02EAFF] to-[#7739FE] flex-shrink-0 transition-all duration-300 ease-in-out shadow-lg shadow-[#02EAFF]/30 ${collapsed && !isMobile ? "opacity-0 scale-0" : "opacity-100 scale-100 animate-pulse"
                          }`}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div className="px-5 mt-4 mb-4">
              <div className="h-px bg-[var(--sidebar-border)]" />
            </div>
            <div className="px-3">
              <div
                className={`px-3 mb-2 overflow-hidden transition-all duration-300 ease-in-out ${collapsed && !isMobile ? "h-0 opacity-0" : "h-5 opacity-60"
                  }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sidebar-text)] whitespace-nowrap">
                  Administración
                </p>
              </div>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/admin"
                    onClick={handleNavClick}
                    className={`relative w-full flex items-center ${collapsed && !isMobile ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"} rounded-xl transition-all duration-300 group overflow-hidden ${isActive("/admin")
                      ? "bg-gradient-to-r from-[#F59E0B]/20 to-transparent border border-white/10"
                      : "hover:bg-[var(--sidebar-hover)] hover:scale-[1.02]"
                      }`}
                    title={collapsed && !isMobile ? "Admin" : undefined}
                  >
                    {isActive("/admin") && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-[#F59E0B] to-[#EF4444] animate-pulse" />
                    )}
                    <div className={`p-1.5 rounded-lg transition-all duration-300 flex-shrink-0 ${isActive("/admin") ? "bg-white/10" : "group-hover:bg-white/5"
                      }`}>
                      <ShieldCheck
                        className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive("/admin") ? "text-[#F59E0B] scale-110" : "text-[var(--sidebar-text)] group-hover:text-[#F59E0B] group-hover:scale-110"
                          }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isActive("/admin") ? "text-white font-semibold" : "group-hover:text-white"
                        } ${collapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100"}`}
                    >
                      Admin
                    </span>
                    {isActive("/admin") && !collapsed && !isMobile && (
                      <div
                        className={`ml-auto w-2 h-2 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex-shrink-0 transition-all duration-300 ease-in-out shadow-lg shadow-[#F59E0B]/30 opacity-100 scale-100 animate-pulse`}
                      />
                    )}
                  </Link>
                </li>
              </ul>
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--sidebar-border)]">
        {/* Collapse Button - solo en desktop */}
        {!isMobile && (
          <button
            onClick={toggle}
            className={`w-full flex items-center ${collapsed ? "justify-center p-2.5" : "gap-2 px-3 py-2"} rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors duration-200 mb-2 overflow-hidden`}
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-[var(--sidebar-text)]" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 flex-shrink-0 text-[var(--sidebar-text)]" />
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out text-[var(--sidebar-text)]">Colapsar</span>
              </>
            )}
          </button>
        )}

        {/* Back to website */}
        <Link
          href="/"
          className={`w-full flex items-center ${collapsed && !isMobile ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"} rounded-lg text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] transition-colors duration-200 overflow-hidden`}
          title={collapsed && !isMobile ? "Volver a la web" : undefined}
        >
          <Globe className="w-5 h-5 flex-shrink-0 text-[var(--sidebar-text)]" />
          <span
            className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
          >
            Volver a la web
          </span>
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`w-full flex items-center mt-1 ${collapsed && !isMobile ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"} rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-200 disabled:opacity-50 overflow-hidden`}
          title={collapsed && !isMobile ? "Cerrar sesión" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span
            className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
          >
            {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
          </span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header con hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--sidebar-bg)] border-b border-[var(--sidebar-border)] flex items-center px-4 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors text-[var(--sidebar-text)]"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 flex justify-center">
          <Link href="/dashboard">
            <Image
              src="/assets/logo-finybuddy-wordmark.png"
              alt="FinyBuddy"
              width={120}
              height={28}
              className="object-contain"
            />
          </Link>
        </div>
        <div className="w-10" /> {/* Spacer para centrar logo */}
      </div>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar móvil (drawer) */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-screen w-[280px] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col z-50 transition-transform duration-300 ease-in-out border-r border-[var(--sidebar-border)] shadow-xl ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <NavContent />
      </aside>

      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex-col z-40 transition-[width] duration-300 ease-in-out border-r border-[var(--sidebar-border)] ${collapsed ? "w-20" : "w-[280px]"
          }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
