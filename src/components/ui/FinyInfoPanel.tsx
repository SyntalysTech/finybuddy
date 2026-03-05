"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronDown, MessageCircle, Mic, Sparkles } from "lucide-react";
import Link from "next/link";

interface FinyInfoPanelProps {
  messages: string[];
  dynamicMessages?: string[];
  tip?: string;
  showFinybot?: boolean;
  finybotMessage?: string;
  defaultExpanded?: boolean;
  storageKey?: string;
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`finy-panel-${storageKey}`);
      if (saved !== null) {
        setIsExpanded(saved === "true");
      }
    }
  }, [storageKey]);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight);
        }
      });
      observer.observe(contentRef.current);
      return () => observer.disconnect();
    }
  }, [messages, dynamicMessages, tip]);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (storageKey) {
      localStorage.setItem(`finy-panel-${storageKey}`, String(newState));
    }
  };

  const defaultFinybotMessage = "Puedes preguntarme cualquier duda usando Finybot, ya sea por texto o por audio.";

  return (
    <div className={`rounded-xl sm:rounded-2xl border border-[var(--brand-cyan)]/20 bg-gradient-to-br from-[var(--brand-cyan)]/5 via-transparent to-[var(--brand-purple)]/5 overflow-hidden backdrop-blur-sm transition-all duration-300 ${className}`}>
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 hover:bg-[var(--brand-cyan)]/5 transition-all duration-200 group"
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 relative shrink-0">
          <Image
            src="/assets/finy-mascota-minimalista.png"
            alt="Finy"
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-sm text-[var(--brand-cyan)]">Finy</h4>
            <Sparkles className="w-3 h-3 text-[var(--brand-cyan)] opacity-60" />
          </div>
          <p className="text-xs text-[var(--brand-gray)] truncate">Tu asistente financiero</p>
        </div>
        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-gray)] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {/* Content - Smooth collapse */}
      <div
        style={{ maxHeight: isExpanded ? (contentHeight ?? 500) + "px" : "0px" }}
        className="transition-[max-height] duration-300 ease-in-out overflow-hidden"
      >
        <div ref={contentRef} className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2.5 sm:space-y-3">
          {/* Educational messages */}
          {messages.length > 0 && (
            <div className="space-y-1.5">
              {messages.map((message, index) => (
                <p key={index} className="text-xs sm:text-sm text-[var(--foreground)]/80 leading-relaxed">
                  {message}
                </p>
              ))}
            </div>
          )}

          {/* Dynamic messages */}
          {dynamicMessages && dynamicMessages.length > 0 && (
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20 space-y-1.5">
              {dynamicMessages.map((message, index) => (
                <p key={index} className="text-xs sm:text-sm text-[var(--foreground)] flex items-start gap-2">
                  <span className="text-[var(--brand-cyan)] mt-0.5 shrink-0 text-base leading-none">&#x2022;</span>
                  <span>{message}</span>
                </p>
              ))}
            </div>
          )}

          {/* Tip */}
          {tip && (
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--brand-yellow)]/8 border border-[var(--brand-yellow)]/15">
              <p className="text-xs sm:text-sm text-[var(--foreground)]/90">
                <span className="font-semibold text-[var(--brand-yellow)]">Tip:</span>{" "}
                {tip}
              </p>
            </div>
          )}

          {/* Finybot reference */}
          {showFinybot && (
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--background-secondary)]/80 border border-[var(--border)]/50">
              <div className="flex items-center gap-1 text-[var(--brand-cyan)] shrink-0">
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--brand-gray)] flex-1 leading-relaxed">
                {finybotMessage || defaultFinybotMessage}
              </p>
              <Link
                href="/chat"
                className="text-[10px] sm:text-xs text-[var(--brand-cyan)] hover:text-[var(--brand-purple)] font-semibold shrink-0 transition-colors"
              >
                Ir a Finybot
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
