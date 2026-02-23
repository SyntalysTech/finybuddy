"use client";

import { useEffect } from "react";
import { CheckCircle, AlertTriangle, X } from "lucide-react";

interface ToastProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

export default function Toast({ type, message, onClose }: ToastProps) {
  useEffect(() => {
    if (type === "success") {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [type, message, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div
        className={`px-4 py-3 rounded-xl shadow-lg shadow-black/20 backdrop-blur-md flex items-center gap-3 min-w-[200px] max-w-[90vw] ${
          isSuccess
            ? "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25"
            : "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/25"
        }`}
        style={{
          animation: "toast-slide-in 0.3s ease-out",
        }}
      >
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 opacity-60 hover:opacity-100 transition-opacity shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
