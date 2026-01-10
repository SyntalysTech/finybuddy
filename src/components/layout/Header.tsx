"use client";

import NotificationsDropdown from "./NotificationsDropdown";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="min-h-[56px] sm:h-16 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-between px-3 sm:px-6 py-2 sm:py-0 gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
      {/* Title */}
      <div className="min-w-0 flex-shrink">
        <h1 className="text-base sm:text-xl font-semibold text-[var(--foreground)] truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[var(--brand-gray)] truncate hidden sm:block">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Custom Actions (passed from each page) */}
        {actions}

        {/* Notifications */}
        <NotificationsDropdown />
      </div>
    </header>
  );
}
