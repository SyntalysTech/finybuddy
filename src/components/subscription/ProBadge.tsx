"use client";

import { Crown } from "lucide-react";

interface ProBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export default function ProBadge({
  size = "sm",
  className = "",
}: ProBadgeProps) {
  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-1 gap-1",
  };

  const iconSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
  };

  return (
    <span
      className={`inline-flex items-center ${sizes[size]} rounded-full bg-gradient-to-r from-[#02EAFF]/20 to-[#7739FE]/20 text-[#7739FE] font-semibold ${className}`}
    >
      <Crown className={iconSizes[size]} />
      PRO
    </span>
  );
}
