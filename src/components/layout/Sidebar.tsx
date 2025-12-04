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
  GraduationCap,
  Bot,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Previsión vs Realidad", href: "/prevision-vs-realidad", icon: ArrowLeftRight },
  { name: "Operaciones", href: "/operaciones", icon: Receipt },
  { name: "Previsión", href: "/prevision", icon: Calculator },
  { name: "Calendario", href: "/calendario", icon: Calendar },
  { name: "Ahorro", href: "/ahorro", icon: PiggyBank },
  { name: "Deuda", href: "/deuda", icon: CreditCard },
  { name: "FinyBot", href: "/chat", icon: Bot },
  { name: "Aprender", href: "/aprender", icon: GraduationCap },
];

const settingsNavItems: NavItem[] = [
  { name: "Mis Categorías", href: "/categorias", icon: FolderOpen },
  { name: "Perfil", href: "/perfil", icon: User },
  { name: "Ajustes", href: "/ajustes", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col z-40 transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-[280px]"
      }`}
    >
      {/* Logo */}
      <div className="h-16 px-4 border-b border-[var(--sidebar-border)] flex items-center">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 relative flex-shrink-0">
            <Image
              src="/assets/finybuddy-mascot.png"
              alt="FinyBuddy"
              fill
              className="object-contain"
            />
          </div>
          <div
            className={`transition-all duration-300 ease-in-out ${
              collapsed ? "w-0 opacity-0" : "w-[140px] opacity-100"
            }`}
          >
            <Image
              src="/assets/logo-finybuddy-wordmark.png"
              alt="FinyBuddy"
              width={140}
              height={32}
              className="object-contain"
            />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Main Navigation */}
        <div className="px-3 mb-6">
          <div
            className={`px-3 mb-2 overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed ? "h-0 opacity-0" : "h-5 opacity-60"
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group overflow-hidden ${
                      active
                        ? "bg-[var(--sidebar-active)] text-[var(--brand-cyan)]"
                        : "hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                        active ? "text-[var(--brand-cyan)]" : "group-hover:text-[var(--brand-cyan)]"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
                        active ? "text-white" : ""
                      } ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
                    >
                      {item.name}
                    </span>
                    {active && (
                      <div
                        className={`ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] flex-shrink-0 transition-all duration-300 ease-in-out ${
                          collapsed ? "opacity-0 scale-0" : "opacity-100 scale-100"
                        }`}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Settings Navigation */}
        <div className="px-3">
          <div
            className={`px-3 mb-2 overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed ? "h-0 opacity-0" : "h-5 opacity-60"
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group overflow-hidden ${
                      active
                        ? "bg-[var(--sidebar-active)] text-[var(--brand-cyan)]"
                        : "hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                        active ? "text-[var(--brand-cyan)]" : "group-hover:text-[var(--brand-cyan)]"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
                        active ? "text-white" : ""
                      } ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
                    >
                      {item.name}
                    </span>
                    {active && (
                      <div
                        className={`ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] flex-shrink-0 transition-all duration-300 ease-in-out ${
                          collapsed ? "opacity-0 scale-0" : "opacity-100 scale-100"
                        }`}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--sidebar-border)]">
        {/* Collapse Button */}
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors duration-200 mb-2 overflow-hidden ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm whitespace-nowrap">Colapsar</span>
            </>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-200 disabled:opacity-50 overflow-hidden ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span
            className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
          </span>
        </button>
      </div>
    </aside>
  );
}
