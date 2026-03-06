"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  Phone,
  PhoneOff,
  Volume2,
  MicOff,
  Bot
} from "lucide-react";
import ProGate from "@/components/subscription/ProGate";
import { useProfile } from "@/hooks/useProfile";
import NotificationsDropdown from "@/components/layout/NotificationsDropdown";

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
  { icon: Wallet, text: "Analiza mi presupuesto del mes", label: "Presupuesto", color: "text-[var(--success)]", bg: "bg-[var(--success)]/10" },
  { icon: Activity, text: "¿Cómo van mis metas de ahorro?", label: "Ahorro", color: "text-[var(--brand-cyan)]", bg: "bg-[var(--brand-cyan)]/10" },
  { icon: TrendingDown, text: "Busca fugas en mis gastos hormiga", label: "Gastos", color: "text-[var(--danger)]", bg: "bg-[var(--danger)]/10" },
  { icon: Bot, text: "Dame un consejo financiero proactivo", label: "Estrategia", color: "text-[var(--brand-purple)]", bg: "bg-[var(--brand-purple)]/10" },
];

function ChatPageContent() {
  const { profile, getFirstName } = useProfile();
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

  // Voice Call State
  const [isCallMode, setIsCallMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const transcriptRef = useRef("");
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Refs to avoid stale closures in voice handlers
  const isCallModeRef = useRef(false);
  const callStatusRef = useRef<"idle" | "listening" | "thinking" | "speaking">("idle");

  useEffect(() => {
    isCallModeRef.current = isCallMode;
  }, [isCallMode]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  const supabase = useMemo(() => createClient(), []);

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
      setMessages(data.filter((m: any) => m.role !== "system") as Message[]);
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
      // setMessages([]) REMOVIDO: No borramos los mensajes porque sendMessage ya puso el mensaje del usuario
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

    // Initialize Speech Synth
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [supabase, loadConversations]);

  // Auto-scroll logic refined to prevent jumpiness
  useEffect(() => {
    if (messages.length === 0) return;

    // Si estamos cargando el inicio de la respuesta, usamos smooth
    // pero si ya estamos recibiendo texto (streaming), usamos auto para no saturar al navegador
    const isStreaming = messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      messages[messages.length - 1].content.length > 5;

    messagesEndRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
      block: "end"
    });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !userId) return;

    const uId = userId;
    const userMessage: Message = { role: "user", content: text.trim() };

    // Immediately show user message and loading state - no delay!
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, userMessage, { role: "assistant", content: "" }]);

    // Create conversation if needed (in background, user already sees their message)
    let convId = currentConversationId;
    if (!convId) {
      // Creamos la conversación pero NO bloqueamos ni reseteamos la UI
      const { data: newConv } = await supabase
        .from("ai_conversations")
        .insert({ user_id: uId, title: text.trim().slice(0, 50) })
        .select()
        .single();

      if (newConv) {
        convId = newConv.id;
        setCurrentConversationId(convId);
        loadConversations(uId); // Recargamos lista lateral en background
      } else {
        setLoading(false);
        setMessages(prev => prev.slice(0, -1)); // Quitamos el placeholder
        return;
      }
    }

    // Save user message (in background)
    if (convId) saveMessage(convId, "user", text.trim());

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userId: uId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Read the SSE stream from OpenAI
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                const snapshot = fullContent;

                // Actualizamos el último mensaje (que ya es el del asistente)
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: snapshot };
                  return updated;
                });
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      // If no content was streamed (fallback for non-stream responses)
      if (!fullContent) {
        try {
          const text = await response.text();
          const data = JSON.parse(text);
          fullContent = data.message || "Lo siento, no pude generar una respuesta.";
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fullContent };
            return updated;
          });
        } catch {
          fullContent = "Lo siento, no pude generar una respuesta.";
        }
      }

      // Save assistant message
      if (convId) await saveMessage(convId, "assistant", fullContent);

      // If in call mode, speak the response
      if (isCallModeRef.current) {
        speakResponse(fullContent);
      }

      // Reload conversations list to update titles
      await loadConversations(uId);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: errorMessage,
      }]);
      if (convId) await saveMessage(convId, "assistant", errorMessage);
      if (isCallModeRef.current) speakResponse(errorMessage);
    } finally {
      setLoading(false);
      // Solo resetear el status a idle si NO estamos en modo llamada, 
      // porque en modo llamada speakResponse se encarga de cambiar a speaking -> listening
      if (!isCallModeRef.current) {
        setCallStatus("idle");
      }
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) return;

    // Cancel previous speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";

    // Attempt to find a natural voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith("es") && (v.name.includes("Google") || v.name.includes("Siri") || v.name.includes("Natural")))
      || voices.find(v => v.lang.startsWith("es"))
      || voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.05; // Slightly faster for natural feel
    utterance.pitch = 1.0;

    utterance.onstart = () => setCallStatus("speaking");
    utterance.onend = () => {
      setCallStatus("listening");
      startCallRecognition();
    };

    synthRef.current.speak(utterance);
  };

  const startCallRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported in this browser");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch (e) { }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false; // Simpler and more reliable for sentence-by-sentence
    recognition.interimResults = true;

    transcriptRef.current = "";
    setInterimTranscript("");

    const commitSpeech = (text: string) => {
      const finalText = text.trim();
      if (isCallModeRef.current && finalText && callStatusRef.current === "listening") {
        console.log("FinyBot: Committing speech ->", finalText);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Stop recognition completely before sending
        try { recognition.onend = null; recognition.stop(); } catch (e) { }

        setCallStatus("thinking");
        sendMessage(finalText);
        setInterimTranscript("");
        transcriptRef.current = "";
      }
    };

    recognition.onstart = () => {
      console.log("FinyBot: Voice recognition started");
      setCallStatus("listening");
    };

    recognition.onresult = (event: any) => {
      let currentResult = "";
      for (let i = 0; i < event.results.length; ++i) {
        currentResult += event.results[i][0].transcript;
      }

      transcriptRef.current = currentResult;
      setInterimTranscript(currentResult);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      // If the browser marks the result as final, commit immediately
      if (event.results[event.results.length - 1].isFinal) {
        commitSpeech(currentResult);
      } else {
        // Fallback: commit after 1.5s of silence
        silenceTimerRef.current = setTimeout(() => {
          commitSpeech(transcriptRef.current);
        }, 1500);
      }
    };

    recognition.onend = () => {
      console.log("FinyBot: Voice recognition ended. Current status:", callStatusRef.current);
      // If we are still in listening status and no message was sent, restart
      if (isCallModeRef.current && callStatusRef.current === "listening") {
        if (transcriptRef.current.trim()) {
          commitSpeech(transcriptRef.current);
        } else {
          try { recognition.start(); } catch (e) { }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("FinyBot: Voice recognition error ->", event.error);
      if (isCallModeRef.current && callStatusRef.current === "listening") {
        if (event.error === "no-speech") {
          // Restart on silence
          try { recognition.start(); } catch (e) { }
        }
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {
      console.error("FinyBot: Failed to start recognition", e);
    }
  };

  const toggleCallMode = () => {
    if (isCallMode) {
      setIsCallMode(false);
      setCallStatus("idle");
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    } else {
      setIsCallMode(true);
      setCallStatus("listening");
      // Initial greeting if no messages
      if (messages.length === 0) {
        const initialMsg = `¡Ey ${getFirstName() || "amigo"}! Soy Finy. ¿Hablamos de tus finanzas? Cuéntame lo que quieras.`;
        setMessages([{ role: "assistant", content: initialMsg }]);
        speakResponse(initialMsg);
      } else {
        startCallRecognition();
      }
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
    <div className="flex h-[calc(100vh-64px)] lg:h-screen">
      {/* Overlay móvil para historial */}
      {showHistory && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowHistory(false)}
        />
      )}

      {/* Panel lateral de historial */}
      <div
        className={`fixed lg:relative lg:translate-x-0 top-0 left-0 h-full z-50 lg:z-auto ${showHistory ? "translate-x-0 w-72" : "-translate-x-full lg:w-0"
          } transition-all duration-300 border-r border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden shrink-0`}
      >
        <div className="w-72 h-full flex flex-col">
          {/* Header del historial */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Conversaciones</h2>
              <button
                onClick={startNewChat}
                className="p-2 rounded-xl bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] hover:bg-[var(--brand-purple)] hover:text-white transition-all shadow-sm"
                title="Nueva conversación"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar charla..."
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs focus:outline-none focus:border-[var(--brand-purple)]"
              />
            </div>
          </div>

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-purple)]" />
                <p className="text-xs text-[var(--brand-gray)]">Cargando chats...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-[var(--background)] flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-[var(--brand-gray)]" />
                </div>
                <p className="text-sm text-[var(--brand-gray)] font-medium">Sin historial aún</p>
                <p className="text-xs text-[var(--brand-gray)]/60 mt-1">¡Saluda a FinyBot!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Agrupar conversaciones por fecha (MOCK logic for grouping simplified) */}
                <div className="space-y-1">
                  <h3 className="text-[10px] font-bold text-[var(--brand-gray)] uppercase tracking-wider px-2 mb-2">Recientes</h3>
                  {conversations.map((conv) => (
                    <div key={conv.id} className="group relative">
                      <button
                        onClick={() => loadConversationMessages(conv.id)}
                        className={`w-full p-3 rounded-xl text-left transition-all border ${currentConversationId === conv.id
                          ? "bg-white dark:bg-[var(--background)] border-[var(--brand-purple)] shadow-sm"
                          : "hover:bg-white dark:hover:bg-[var(--background)] border-transparent hover:border-[var(--border)]"
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${currentConversationId === conv.id ? "bg-[var(--brand-purple)] text-white" : "bg-[var(--background)] text-[var(--brand-gray)]"}`}>
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${currentConversationId === conv.id ? "text-[var(--foreground)]" : "text-[var(--brand-gray)] group-hover:text-[var(--foreground)]"}`}>
                              {conv.title}
                            </p>
                            <p className="text-[10px] text-[var(--brand-gray)]/70 mt-0.5">
                              {new Date(conv.updated_at).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-all z-10"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Summary in Sidebar */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--background-secondary)] transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-purple)] flex items-center justify-center text-white overflow-hidden relative">
                {userAvatar ? <Image src={userAvatar} alt="Profile" fill className="object-cover" /> : <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{profile?.full_name || "Usuario"}</p>
                <p className="text-[10px] text-[var(--success)] font-bold uppercase tracking-tighter">Pro member</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal del chat */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header integrado */}
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-20">
          <div className="px-4 sm:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botón toggle historial */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2.5 rounded-xl transition-all ${showHistory
                  ? "bg-[var(--brand-purple)] text-white shadow-lg shadow-[var(--brand-purple)]/20"
                  : "bg-[var(--background-secondary)] text-[var(--brand-gray)] hover:text-[var(--foreground)]"
                  }`}
              >
                <div className="relative">
                  <MessageSquare className="w-5 h-5" />
                  {!showHistory && conversations.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--danger)] rounded-full border-2 border-[var(--background)]" />
                  )}
                </div>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 relative shrink-0">
                  <div className="relative w-full h-full bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)] flex items-center justify-center p-2">
                    <Image
                      src="/assets/finy-mascota-minimalista.png"
                      alt="FinyBot"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-black tracking-tight">FinyBot</h1>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[var(--success)]/10 text-[var(--success)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleCallMode}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] hover:bg-[var(--brand-purple)] hover:text-white transition-all font-bold text-xs group"
              >
                <Phone className="w-4 h-4 group-hover:animate-bounce" />
                <span className="hidden sm:inline">Llámame!</span>
              </button>

              <div className="h-8 w-[1px] bg-[var(--border)] mx-1 hidden sm:block" />

              <button
                onClick={startNewChat}
                className="p-2.5 rounded-xl hover:bg-[var(--background-secondary)] text-[var(--brand-gray)] transition-all"
                title="Nueva conversación"
              >
                <Plus className="w-5 h-5" />
              </button>
              <NotificationsDropdown />
            </div>
          </div>
        </div>

        {/* Messages area - ocupa todo el espacio disponible */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !loading ? (
            // Welcome screen - premium layout
            <div className="h-full flex flex-col items-center justify-center px-4 pb-32 max-w-4xl mx-auto overflow-y-auto">
              <div className="w-24 h-24 sm:w-32 sm:h-32 relative mb-8 animate-float">
                <div className="absolute inset-0 bg-[var(--brand-purple)]/20 rounded-full blur-2xl animate-pulse" />
                <Image
                  src="/assets/finy-mascota-minimalista.png"
                  alt="FinyBot"
                  fill
                  className="object-contain relative z-10"
                />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black mb-3 text-center tracking-tight">
                Hola {getFirstName() || profile?.full_name}, <br />
                <span className="text-[var(--brand-purple)]">¿Hablamos de tus finanzas?</span>
              </h2>
              <p className="text-[var(--brand-gray)] text-sm sm:text-base mb-10 max-w-md text-center">
                Analizo tus movimientos en tiempo real para darte consejos inteligentes y personalizados.
              </p>

              {/* Quick prompts grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4">
                {QUICK_PROMPTS.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-purple)] hover:bg-white dark:hover:bg-[var(--background)] transition-all group shadow-sm"
                    >
                      <div className={`p-3 rounded-xl ${prompt.bg} ${prompt.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-[var(--brand-gray)] uppercase tracking-widest mb-0.5 group-hover:text-[var(--brand-purple)] transition-colors">{prompt.label}</p>
                        <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--brand-purple)] transition-colors">{prompt.text}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>
          ) : (
            // Chat messages - full width con padding adaptativo
            <div className="px-4 pb-32 max-w-5xl mx-auto w-full pt-6">
              <div className="space-y-6">
                {messages.map((message, index) => {
                  if (message.role === "assistant" && !message.content) return null;
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 sm:gap-4 items-center ${message.role === "user" ? "flex-row-reverse" : ""} ${
                        // Solo animamos la entrada de un mensaje nuevo, no durante el streaming
                        index === messages.length - 1 && !loading ? "animate-in fade-in slide-in-from-bottom-2 duration-500" : ""
                        }`}
                    >
                      {/* Avatar - Mascot Only Mode */}
                      <div className="shrink-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 relative flex items-center justify-center`}>
                          {message.role === "user" ? (
                            <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-[var(--brand-purple)] bg-[var(--background-secondary)] p-1">
                              {userAvatar ? <Image src={userAvatar} alt="Profile" fill className="object-cover" /> : <User className="w-full h-full text-[var(--brand-purple)]" />}
                            </div>
                          ) : (
                            <div className="w-full h-full relative animate-float-slow">
                              <Image src="/assets/finy-mascota-minimalista.png" alt="Finy" fill className="object-contain drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message content refined */}
                      <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[80%]`}>
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${message.role === "user"
                            ? "bg-[var(--brand-purple)] text-white rounded-tr-none"
                            : "bg-[var(--background-secondary)] dark:bg-slate-800 border border-[var(--border)] rounded-tl-none backdrop-blur-sm"
                            }`}
                        >
                          {message.role === "user" ? (
                            <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                          ) : (
                            <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-[var(--brand-cyan)] [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_li]:my-1">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--brand-gray)]/60 mt-1 font-bold uppercase tracking-widest px-1 opacity-70">
                          {message.role === "user" ? "Tú" : "FinyBot • Analista"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Loading indicator - Mascot Only animate-bounce */}
              {loading && !(messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content) && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-8">
                  <div className="shrink-0 pt-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 relative animate-bounce">
                      <Image src="/assets/finy-mascota-minimalista.png" alt="Finy" fill className="object-contain drop-shadow-md" />
                    </div>
                  </div>
                  <div className="px-5 py-3 rounded-2xl rounded-tl-none bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm max-w-[200px]">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-purple)] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-purple)] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-purple)] animate-bounce" style={{ animationDelay: "300ms" }} />
                        <span className="text-[10px] font-black text-[var(--brand-purple)] uppercase tracking-widest ml-1">Analizando...</span>
                      </div>
                      <div className="h-1 w-full bg-[var(--background)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[var(--brand-purple)] to-[var(--brand-cyan)] animate-progress-fast" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )
          }
        </div>

        <div className="fixed bottom-0 left-0 right-0 lg:left-auto lg:w-[calc(100%-288px)] p-4 sm:p-6 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent z-10">
          <div className="max-w-4xl mx-auto relative group">
            {/* Context Floating Chip (Cool Detail using OpenAI context logic) */}
            {messages.length > 0 && !loading && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[var(--background-secondary)] border border-[var(--border)] shadow-xl animate-fade-in-up">
                <div className="w-2 h-2 rounded-full bg-[var(--brand-cyan)] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray)]">Finy está listo para ejecutar tus órdenes</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-[var(--background-secondary)] border-2 border-[var(--border)] rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/5 focus-within:border-[var(--brand-purple)] transition-all outline-none">
                {/* Action Button (Mic) */}
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={loading || isTranscribing}
                  className={`group relative p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all outline-none focus:outline-none ${isRecording
                    ? "bg-[var(--danger)] text-white animate-pulse"
                    : "bg-[var(--background)] text-[var(--brand-gray)] hover:bg-[var(--brand-purple)]/10 hover:text-[var(--brand-purple)]"
                    }`}
                >
                  {isTranscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isRecording ? (
                    <Square className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? "Te escucho..." : isTranscribing ? "Procesando voz..." : "¿Qué quieres lograr hoy?"}
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 resize-none min-h-[24px] max-h-[120px] py-1"
                  disabled={loading || isRecording}
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading || isRecording}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all outline-none focus:outline-none ${!input.trim() || loading || isRecording
                    ? "bg-[var(--border)] text-[var(--brand-gray)]"
                    : "bg-[var(--brand-purple)] text-white shadow-lg shadow-[var(--brand-purple)]/20 hover:scale-105 active:scale-95"
                    }`}
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
      </div>{/* Fin contenido principal del chat */}

      {/* Overlay de Modo Llamada - Futuristic Premium Design */}
      {isCallMode && (
        <div className="fixed inset-0 z-[100] bg-[var(--background)] animate-fade-in flex flex-col items-center justify-between py-16 px-6 overflow-hidden">
          {/* Background Ambient Orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[var(--brand-purple)]/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[var(--brand-cyan)]/10 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
          </div>

          {/* Top Info */}
          <div className="relative z-10 w-full max-w-md flex flex-col items-center">
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Encriptación de voz activa</span>
            </div>
            <h2 className="text-sm font-medium text-[var(--brand-gray)]">Sesión segura con FinyBot</h2>
          </div>

          {/* Central AI Entity Visualizer */}
          <div className="relative flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
            <div className={`relative transition-all duration-1000 ease-out ${callStatus === 'speaking' ? 'scale-110' : 'scale-100'}`}>

              {/* Dynamic Aura */}
              <div className={`absolute inset-[-40px] rounded-full transition-opacity duration-700 ${callStatus === 'listening' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 rounded-full border border-[var(--brand-cyan)]/20 animate-ping-slow" />
                <div className="absolute inset-0 rounded-full border border-[var(--brand-cyan)]/10 animate-pulse" />
              </div>

              <div className={`absolute inset-[-60px] rounded-full transition-opacity duration-700 ${callStatus === 'speaking' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 rounded-full border border-[var(--brand-purple)]/30 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-[var(--brand-purple)]/10 animate-pulse" />
              </div>

              {/* Main Mascot Container */}
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-[48px] bg-gradient-to-tr from-white/10 to-white/5 border border-white/20 shadow-2xl backdrop-blur-2xl flex items-center justify-center p-8 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--brand-purple)]/20 to-[var(--brand-cyan)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[48px]" />
                <Image
                  src="/assets/finy-mascota-minimalista.png"
                  alt="Finy"
                  width={220}
                  height={220}
                  className={`object-contain relative z-10 transition-all duration-500 ${callStatus === 'speaking' ? 'scale-110 drop-shadow-[0_0_30px_rgba(139,77,255,0.4)]' : 'grayscale-[20%] opacity-80'}`}
                />
              </div>

              {/* Waveform Visualizer */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1.5 h-12">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${callStatus === 'speaking' ? 'bg-[var(--brand-purple)] animate-music-bar' : 'bg-[var(--border)] h-2'}`}
                    style={{
                      animationDelay: `${i * 120}ms`,
                      height: callStatus === 'speaking' ? `${20 + Math.random() * 80}%` : '8px'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Transcription / Status Text */}
            <div className="mt-20 text-center px-6 max-w-lg min-h-[100px] flex flex-col items-center justify-center">
              <div className={`text-3xl font-black mb-4 transition-colors ${callStatus === 'listening' ? 'text-[var(--brand-cyan)]' : 'text-white'}`}>
                {callStatus === 'listening' ? 'Te escucho...' :
                  callStatus === 'thinking' ? 'Procesando...' :
                    callStatus === 'speaking' ? 'Finy responde' : 'Conectando'}
              </div>
              <p className="text-base text-[var(--brand-gray)] font-medium leading-relaxed italic opacity-80">
                {interimTranscript || (callStatus === 'listening' ? 'Prueba a decir: "¿Cómo va mi ahorro para el coche?"' : 'Analizando tu situación financiera actual...')}
              </p>
            </div>
          </div>

          {/* Call Control Bar */}
          <div className="relative z-10 flex items-center gap-8 sm:gap-14 px-8 py-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl mb-4 shadow-2xl">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`group relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-[var(--danger)] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform text-[10px] font-black uppercase text-white/50">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={toggleCallMode}
              className="w-24 h-24 rounded-[32px] bg-[var(--danger)] text-white flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.4)] hover:scale-110 active:scale-95 transition-all"
            >
              <PhoneOff className="w-10 h-10" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/5">
              <Bot className="w-6 h-6 opacity-40" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProGate featureName="FinyBot">
      <ChatPageContent />
    </ProGate>
  );
}
