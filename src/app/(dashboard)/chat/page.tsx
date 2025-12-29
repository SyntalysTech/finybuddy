"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import {
  Send,
  User,
  Loader2,
  Wallet,
  Activity,
  TrendingDown,
  Target,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  { icon: Wallet, text: "¿Cuánto puedo gastar hoy?", color: "text-[var(--success)]" },
  { icon: Activity, text: "¿Cómo voy este mes?", color: "text-[var(--brand-cyan)]" },
  { icon: TrendingDown, text: "¿Cuál es mi mayor fuga de dinero?", color: "text-[var(--danger)]" },
  { icon: Target, text: "Reto semanal", color: "text-[var(--brand-purple)]" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const supabase = createClient();

  // Get user ID and avatar on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Get user's avatar from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        if (profile?.avatar_url) {
          setUserAvatar(profile.avatar_url);
        }
      }
    };
    getUser();
  }, [supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !userId) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickPrompt = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header integrado */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 relative shrink-0">
            <Image
              src="/assets/finybuddy-mascot.png"
              alt="FinyBot"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold">FinyBot</h1>
            <p className="text-xs text-[var(--brand-gray)]">Tu asistente financiero personal</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--success)]/10 text-[var(--success)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages area - ocupa todo el espacio disponible */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Welcome screen - centrado vertical y horizontal
          <div className="h-full flex flex-col items-center justify-center px-6 py-12">
            <div className="w-20 h-20 relative mb-5">
              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBot"
                fill
                className="object-contain"
              />
            </div>
            <h2 className="text-xl font-bold mb-2">¿En qué te puedo ayudar?</h2>
            <p className="text-[var(--brand-gray)] text-sm mb-8 max-w-md text-center">
              Tengo acceso a todos tus datos financieros para darte consejos personalizados.
            </p>

            {/* Quick prompts - grid responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl">
              {QUICK_PROMPTS.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt.text)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-purple)] hover:bg-[var(--brand-purple)]/5 transition-all text-center group"
                  >
                    <div className={`p-2 rounded-lg bg-[var(--background)] group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${prompt.color}`} />
                    </div>
                    <span className="text-xs font-medium leading-tight">{prompt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Chat messages - full width con padding adaptativo
          <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 max-w-4xl ${
                  message.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                {message.role === "user" ? (
                  <div className="w-8 h-8 rounded-full shrink-0 bg-[var(--brand-purple)] overflow-hidden relative">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt="Tu avatar"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 relative shrink-0">
                    <Image
                      src="/assets/finybuddy-mascot.png"
                      alt="FinyBot"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                {/* Message content */}
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-[75%] ${
                    message.role === "user"
                      ? "bg-[var(--brand-purple)] text-white rounded-br-md"
                      : "bg-[var(--background-secondary)] border border-[var(--border)] rounded-bl-md"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm text-white">{message.content}</p>
                  ) : (
                    <div className="text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-[var(--brand-cyan)] [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-2 [&_li]:my-0.5">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3 max-w-4xl">
                <div className="w-8 h-8 relative shrink-0">
                  <Image
                    src="/assets/finybuddy-mascot.png"
                    alt="FinyBot"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--background-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 text-[var(--brand-gray)]">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-purple)] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-purple)] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-purple)] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area - fijado abajo */}
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--background)] p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl resize-none focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 text-sm"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 rounded-2xl gradient-brand text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
