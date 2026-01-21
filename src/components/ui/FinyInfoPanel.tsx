"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, MessageCircle, Mic } from "lucide-react";
import Link from "next/link";

interface FinyInfoPanelProps {
  /**
   * Array of educational messages to display.
   * Can be static strings or dynamic content.
   */
  messages: string[];

  /**
   * Optional array of dynamic/motivational messages based on user data.
   * These will be shown with a different visual style.
   */
  dynamicMessages?: string[];

  /**
   * Optional tip message to show at the bottom.
   */
  tip?: string;

  /**
   * Whether to show the Finybot reference.
   * Default: true
   */
  showFinybot?: boolean;

  /**
   * Custom Finybot message.
   * Default: standard message about using Finybot
   */
  finybotMessage?: string;

  /**
   * Whether the panel should be expanded by default.
   * Default: true
   */
  defaultExpanded?: boolean;

  /**
   * Unique identifier for localStorage persistence.
   * If provided, the expanded state will be saved.
   */
  storageKey?: string;

  /**
   * Custom CSS class name for additional styling.
   */
  className?: string;
}

export default function FinyInfoPanel({
  messages,
  dynamicMessages,
  tip,
  showFinybot = true,
  finybotMessage,
  defaultExpanded = true,
  storageKey,
  className = "",
}: FinyInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load expanded state from localStorage if storageKey is provided
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`finy-panel-${storageKey}`);
      if (saved !== null) {
        setIsExpanded(saved === "true");
      }
    }
  }, [storageKey]);

  // Save expanded state to localStorage when changed
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (storageKey) {
      localStorage.setItem(`finy-panel-${storageKey}`, String(newState));
    }
  };

  const defaultFinybotMessage = "Puedes preguntarme cualquier duda usando Finybot, ya sea por texto o por audio.";

  return (
    <div className={`rounded-xl border border-[var(--brand-cyan)]/20 bg-gradient-to-r from-[var(--brand-cyan)]/5 to-[var(--brand-purple)]/5 overflow-hidden ${className}`}>
      {/* Header - Always visible */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--brand-cyan)]/5 transition-colors"
      >
        <div className="w-10 h-10 relative shrink-0">
          <Image
            src="/assets/finybuddy-mascot.png"
            alt="Finy"
            fill
            className="object-contain"
          />
        </div>
        <div className="flex-1 text-left">
          <h4 className="font-semibold text-sm text-[var(--brand-purple)]">Finy</h4>
          <p className="text-xs text-[var(--brand-gray)]">Tu asistente financiero</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[var(--brand-gray)]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--brand-gray)]" />
        )}
      </button>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Educational messages */}
          {messages.length > 0 && (
            <div className="space-y-2">
              {messages.map((message, index) => (
                <p key={index} className="text-sm text-[var(--foreground)] leading-relaxed">
                  {message}
                </p>
              ))}
            </div>
          )}

          {/* Dynamic/Motivational messages */}
          {dynamicMessages && dynamicMessages.length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--brand-purple)]/10 space-y-1.5">
              {dynamicMessages.map((message, index) => (
                <p key={index} className="text-sm text-[var(--brand-purple)] flex items-start gap-2">
                  <span className="text-[var(--brand-cyan)] mt-0.5 shrink-0">•</span>
                  <span>{message}</span>
                </p>
              ))}
            </div>
          )}

          {/* Tip */}
          {tip && (
            <div className="p-3 rounded-lg bg-[var(--brand-yellow)]/10 border border-[var(--brand-yellow)]/20">
              <p className="text-sm text-[var(--foreground)]">
                <span className="font-medium text-[var(--brand-yellow)]">Consejo:</span>{" "}
                {tip}
              </p>
            </div>
          )}

          {/* Finybot reference */}
          {showFinybot && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-secondary)]">
              <div className="flex items-center gap-1.5 text-[var(--brand-cyan)]">
                <MessageCircle className="w-4 h-4" />
                <Mic className="w-4 h-4" />
              </div>
              <p className="text-xs text-[var(--brand-gray)] flex-1">
                {finybotMessage || defaultFinybotMessage}
              </p>
              <Link
                href="/chat"
                className="text-xs text-[var(--brand-cyan)] hover:underline font-medium shrink-0"
              >
                Ir a Finybot
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
