"use client";

import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import TrialBanner from "@/components/subscription/TrialBanner";
import { useEffect } from "react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobile } = useSidebar();

  useEffect(() => {
    // Comprobar y disparar recordatorios automáticos (emails) una vez al día por dispositivo
    const today = new Date().toISOString().split("T")[0];
    const lastCheck = localStorage.getItem("lastReminderCheck");

    if (lastCheck !== today) {
      fetch("/api/check-my-reminders", { method: "POST" })
        .then(() => localStorage.setItem("lastReminderCheck", today))
        .catch((e) => console.error("Error comprobando recordatorios:", e));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Sidebar />
      <main
        className={`min-h-screen transition-[margin-left] duration-300 ease-in-out ${isMobile
            ? "ml-0 pt-16"
            : collapsed
              ? "ml-20"
              : "ml-[280px]"
          }`}
      >
        <TrialBanner />
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </ThemeProvider>
  );
}
