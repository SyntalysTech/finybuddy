"use client";

import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Sidebar />
      <main
        className={`min-h-screen transition-[margin-left] duration-300 ease-in-out ${
          isMobile
            ? "ml-0 pt-16"
            : collapsed
              ? "ml-20"
              : "ml-[280px]"
        }`}
      >
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
