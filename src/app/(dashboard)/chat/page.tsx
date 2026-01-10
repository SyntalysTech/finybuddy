"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Mic,
  Square,
  MessageSquare,
  Plus,
  Trash2,
  ChevronLeft,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const supabase = createClient();

  // Load conversations list
  const loadConversations = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data) {
      setConversations(data);
    }
  }, [supabase]);

  // Load messages for a conversation
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data.filter(m => m.role !== "system") as Message[]);
    }
    setCurrentConversationId(conversationId);
    setShowHistory(false);
    setLoadingHistory(false);
  }, [supabase]);

  // Save message to conversation
  const saveMessage = useCallback(async (conversationId: string, role: string, content: string) => {
    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });

    // Update conversation timestamp and title if first message
    const updates: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
    if (role === "user" && messages.length === 0) {
      updates.title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
    }
    await supabase.from("ai_conversations").update(updates).eq("id", conversationId);
  }, [supabase, messages.length]);

  // Create new conversation
  const createNewConversation = useCallback(async () => {
    if (!userId) return null;

    const { data } = await supabase
      .from("ai_conversations")
      .insert({ user_id: userId, title: "Nueva conversación" })
      .select()
      .single();

    if (data) {
      setCurrentConversationId(data.id);
      setMessages([]);
      await loadConversations(userId);
      return data.id;
    }
    return null;
  }, [userId, supabase, loadConversations]);

  // Delete conversation
  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("ai_conversations").delete().eq("id", conversationId);
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
    if (userId) {
      await loadConversations(userId);
    }
  };

  // Start new chat
  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };

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
        // Load conversations
        await loadConversations(user.id);
      }
    };
    getUser();
  }, [supabase, loadConversations]);

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

    // Create conversation if needed
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation();
      if (!convId) {
        setLoading(false);
        return;
      }
    }

    // Save user message
    await saveMessage(convId, "user", text.trim());

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

      // Save assistant message
      await saveMessage(convId, "assistant", data.message);

      // Reload conversations list to update titles
      await loadConversations(userId);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: errorMessage,
      }]);
      await saveMessage(convId, "assistant", errorMessage);
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

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        });

        // Transcribe the audio
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono. Por favor, permite el acceso.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      // Convert to a proper file with extension
      const extension = audioBlob.type.includes("webm") ? "webm" : "mp4";
      const audioFile = new File([audioBlob], `audio.${extension}`, { type: audioBlob.type });
      formData.append("audio", audioFile);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();

      if (data.text && data.text.trim()) {
        // Send the transcribed text directly as a message
        sendMessage(data.text.trim());
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Error al transcribir el audio. Por favor, inténtalo de nuevo.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex h-screen">
      {/* Panel lateral de historial */}
      <div
        className={`${
          showHistory ? "w-72" : "w-0"
        } transition-all duration-300 border-r border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden shrink-0`}
      >
        <div className="w-72 h-full flex flex-col">
          {/* Header del historial */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-semibold text-sm">Historial</h2>
            <button
              onClick={startNewChat}
              className="p-2 rounded-lg hover:bg-[var(--background)] transition-colors"
              title="Nueva conversación"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto p-2">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-gray)]" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-[var(--brand-gray)] text-center py-8">
                No hay conversaciones
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversationMessages(conv.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors group flex items-start gap-2 ${
                      currentConversationId === conv.id
                        ? "bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/30"
                        : "hover:bg-[var(--background)]"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-[var(--brand-gray)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-[var(--brand-gray)]">
                        {new Date(conv.updated_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-all"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal del chat */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Header integrado */}
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="px-6 py-4 flex items-center gap-4">
            {/* Botón toggle historial */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${
                showHistory
                  ? "bg-[var(--brand-purple)]/10 text-[var(--brand-purple)]"
                  : "hover:bg-[var(--background-secondary)]"
              }`}
              title={showHistory ? "Cerrar historial" : "Ver historial"}
            >
              {showHistory ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </button>

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
              {/* Botón nueva conversación */}
              <button
                onClick={startNewChat}
                className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                title="Nueva conversación"
              >
                <Plus className="w-5 h-5" />
              </button>
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
            {/* Mic button */}
            <button
              type="button"
              onClick={handleMicClick}
              disabled={loading || isTranscribing}
              className={`p-3 rounded-2xl transition-all shrink-0 ${
                isRecording
                  ? "bg-[var(--danger)] text-white animate-pulse"
                  : "bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--brand-gray)] hover:text-[var(--foreground)] hover:border-[var(--brand-purple)]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? "Detener grabación" : "Grabar mensaje de voz"}
            >
              {isTranscribing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRecording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Grabando... pulsa el botón para enviar" : "Escribe tu mensaje..."}
                rows={1}
                className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl resize-none focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 text-sm"
                disabled={loading || isRecording}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading || isRecording}
              className="p-3 rounded-2xl gradient-brand text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          {isRecording && (
            <p className="text-xs text-[var(--danger)] mt-2 text-center animate-pulse">
              Grabando audio... Pulsa el botón rojo para enviar
            </p>
          )}
        </form>
      </div>
      </div>{/* Fin contenido principal del chat */}
    </div>
  );
}
