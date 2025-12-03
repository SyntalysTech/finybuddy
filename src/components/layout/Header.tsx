"use client";

import NotificationsDropdown from "./NotificationsDropdown";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="h-16 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-between px-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--brand-gray)]">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Custom Actions (passed from each page) */}
        {actions}

        {/* Notifications */}
        <NotificationsDropdown />
      </div>
    </header>
  );
}
