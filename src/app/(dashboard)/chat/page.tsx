"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  TrendingUp,
  PiggyBank,
  CreditCard,
  HelpCircle,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, text: "¿Cómo van mis finanzas este mes?", color: "text-[var(--success)]" },
  { icon: PiggyBank, text: "¿Cómo puedo ahorrar más?", color: "text-[var(--brand-purple)]" },
  { icon: CreditCard, text: "Analiza mis gastos", color: "text-[var(--danger)]" },
  { icon: HelpCircle, text: "Dame consejos personalizados", color: "text-[var(--brand-cyan)]" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const supabase = createClient();

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
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
    <>
      <Header
        title="FinyBot"
        subtitle="Tu asistente financiero personal con IA"
      />

      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            // Welcome screen
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">¡Hola! Soy FinyBot</h2>
              <p className="text-[var(--brand-gray)] mb-8">
                Tu asistente financiero personal. Tengo acceso a todos tus datos financieros
                y puedo ayudarte a entender mejor tu situación, darte consejos personalizados
                y responder cualquier pregunta sobre tus finanzas.
              </p>

              {/* Quick prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {QUICK_PROMPTS.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className="flex items-center gap-3 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-cyan)] transition-colors text-left"
                    >
                      <Icon className={`w-5 h-5 ${prompt.color}`} />
                      <span className="text-sm">{prompt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Chat messages
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user"
                        ? "bg-[var(--brand-purple)]"
                        : "gradient-brand"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message content */}
                  <div
                    className={`flex-1 p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-[var(--brand-purple)] text-white"
                        : "bg-[var(--background-secondary)] border border-[var(--border)]"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {message.content.split("\n").map((line, i) => (
                        <p key={i} className={`${i > 0 ? "mt-2" : ""} ${message.role === "user" ? "text-white" : ""}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[var(--brand-gray)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analizando tus datos...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[var(--border)] p-4 bg-[var(--background)]">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregúntame sobre tus finanzas..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:border-[var(--brand-cyan)] focus:ring-1 focus:ring-[var(--brand-cyan)]"
                  disabled={loading}
                />
                <div className="absolute right-3 bottom-3">
                  <Sparkles className="w-4 h-4 text-[var(--brand-gray)]" />
                </div>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 rounded-xl gradient-brand text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-[var(--brand-gray)] text-center mt-2">
              FinyBot tiene acceso a todos tus datos financieros para darte consejos personalizados
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
