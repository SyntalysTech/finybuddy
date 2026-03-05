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
  Phone,
  PhoneOff,
  Volume2,
  MicOff,
  Bot
} from "lucide-react";
import ProGate from "@/components/subscription/ProGate";
import { useProfile } from "@/hooks/useProfile";

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

  // Auto-scroll to bottom when messages change or loading starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    const userMessage: Message = { role: "user", content: text.trim() };

    // Immediately show user message and loading state - no delay!
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, userMessage]);

    // Create conversation if needed (in background, user already sees their message)
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation();
      if (!convId) {
        setLoading(false);
        return;
      }
    }

    // Save user message (in background)
    saveMessage(convId, "user", text.trim());

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

      // Add empty assistant message that we'll stream into
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

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
      await saveMessage(convId, "assistant", fullContent);

      // If in call mode, speak the response
      if (isCallMode) {
        speakResponse(fullContent);
      }

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
      if (isCallMode) speakResponse(errorMessage);
    } finally {
      setLoading(false);
      if (isCallMode) setCallStatus("idle");
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
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-semibold text-sm">Historial</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={startNewChat}
                className="p-2 rounded-lg hover:bg-[var(--background)] transition-colors"
                title="Nueva conversación"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg hover:bg-[var(--background)] transition-colors lg:hidden"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
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
                    className={`w-full p-3 rounded-lg text-left transition-colors group flex items-start gap-2 ${currentConversationId === conv.id
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
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header integrado */}
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
            {/* Botón toggle historial */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${showHistory
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

            <div className="w-8 h-8 sm:w-10 sm:h-10 relative shrink-0">
              <Image
                src="/assets/finy-mascota-minimalista.png"
                alt="FinyBot"
                fill
                className="object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold">FinyBot</h1>
              <p className="text-xs text-[var(--brand-gray)] truncate hidden sm:block">Tu asistente financiero personal</p>
            </div>
            <button
              onClick={toggleCallMode}
              className="p-1.5 sm:p-2 rounded-lg bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] hover:bg-[var(--brand-purple)] hover:text-white transition-all shadow-lg shadow-[var(--brand-purple)]/20"
              title="Modo Llamada"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Botón nueva conversación */}
              <button
                onClick={startNewChat}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                title="Nueva conversación"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--success)]/10 text-[var(--success)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                Online
              </span>
              <span className="sm:hidden w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Messages area - ocupa todo el espacio disponible */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Welcome screen - centrado vertical y horizontal
            <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 relative mb-4 sm:mb-5">
                <Image
                  src="/assets/finy-mascota-minimalista.png"
                  alt="FinyBot"
                  fill
                  className="object-contain"
                />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2 text-center">¿En qué te puedo ayudar?</h2>
              <p className="text-[var(--brand-gray)] text-xs sm:text-sm mb-6 sm:mb-8 max-w-md text-center px-4">
                Tengo acceso a todos tus datos financieros para darte consejos personalizados.
              </p>

              {/* Quick prompts - grid responsive */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-4xl px-2 sm:px-0">
                {QUICK_PROMPTS.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt.text)}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--brand-purple)] hover:bg-[var(--brand-purple)]/5 transition-all text-center group"
                    >
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-[var(--background)] group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${prompt.color}`} />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium leading-tight">{prompt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Chat messages - full width con padding adaptativo
            <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-3 sm:space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 sm:gap-3 max-w-4xl ${message.role === "user" ? "ml-auto flex-row-reverse" : ""
                    }`}
                >
                  {/* Avatar */}
                  {message.role === "user" ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 bg-[var(--brand-purple)] overflow-hidden relative">
                      {userAvatar ? (
                        <Image
                          src={userAvatar}
                          alt="Tu avatar"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 relative shrink-0">
                      <Image
                        src="/assets/finy-mascota-minimalista.png"
                        alt="FinyBot"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  {/* Message content */}
                  <div
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl max-w-[85%] sm:max-w-[75%] ${message.role === "user"
                      ? "bg-[var(--brand-purple)] text-white rounded-br-md"
                      : "bg-[var(--background-secondary)] border border-[var(--border)] rounded-bl-md"
                      }`}
                  >
                    {message.role === "user" ? (
                      <p className="text-xs sm:text-sm text-white">{message.content}</p>
                    ) : (
                      <div className="text-xs sm:text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-[var(--brand-cyan)] [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-2 [&_li]:my-0.5">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator - hide once streaming starts */}
              {loading && !(messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content) && (
                <div className="flex gap-2 sm:gap-3 max-w-4xl">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 relative shrink-0">
                    <Image
                      src="/assets/finy-mascota-minimalista.png"
                      alt="FinyBot"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-bl-md bg-[var(--background-secondary)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[var(--brand-gray)]">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--brand-purple)] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--brand-purple)] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--brand-purple)] animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs sm:text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area - fijado abajo */}
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--background)] p-2 sm:p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-end gap-1.5 sm:gap-2">
              {/* Mic button */}
              <button
                type="button"
                onClick={handleMicClick}
                disabled={loading || isTranscribing}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all shrink-0 ${isRecording
                  ? "bg-[var(--danger)] text-white animate-pulse"
                  : "bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--brand-gray)] hover:text-[var(--foreground)] hover:border-[var(--brand-purple)]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isRecording ? "Detener grabación" : "Grabar mensaje de voz"}
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

              <div className="flex-1 relative">
                {isTranscribing && (
                  <div className="absolute -top-8 left-0 flex items-center gap-2 text-xs text-[var(--brand-purple)] animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Transcribiendo audio...
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? "Grabando..." : isTranscribing ? "Transcribiendo audio..." : "Escribe tu mensaje..."}
                  rows={1}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl sm:rounded-2xl resize-none focus:outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 text-xs sm:text-sm"
                  disabled={loading || isRecording}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading || isRecording}
                className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl gradient-brand text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
            {isRecording && (
              <p className="text-[10px] sm:text-xs text-[var(--danger)] mt-1.5 sm:mt-2 text-center animate-pulse">
                Grabando audio... Pulsa el botón rojo para enviar
              </p>
            )}
          </form>
        </div>
      </div>{/* Fin contenido principal del chat */}

      {/* Overlay de Modo Llamada */}
      {isCallMode && (
        <div className="fixed inset-0 z-[100] bg-[var(--background)]/80 backdrop-blur-2xl animate-fade-in flex flex-col items-center justify-between py-12 px-6">
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--brand-purple)]/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--brand-cyan)]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1000ms" }} />
          </div>

          {/* Call Header */}
          <div className="w-full max-w-md flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-[var(--brand-gray)]">Llamada en curso con FinyBot</span>
          </div>

          {/* Mascot Section */}
          <div className="relative flex-1 flex flex-col items-center justify-center gap-8 w-full">
            <div className={`relative w-40 h-40 sm:w-56 sm:h-56 transition-all duration-700 ${callStatus === 'speaking' ? 'scale-110' : 'scale-100'}`}>
              {/* Animated Rings */}
              <div className={`absolute inset-0 rounded-full border-2 border-[var(--brand-purple)]/20 animate-ping shadow-[0_0_40px_rgba(139,77,255,0.2)] ${callStatus === 'speaking' ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`absolute inset-0 rounded-full border border-[var(--brand-cyan)]/30 animate-pulse ${callStatus === 'listening' ? 'opacity-100' : 'opacity-0'}`} />

              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--brand-purple)]/20 to-[var(--brand-cyan)]/10 rounded-full blur-2xl" />

              <div className="relative w-full h-full bg-[var(--background-secondary)] rounded-full border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/assets/finy-mascota-minimalista.png"
                  alt="Finy"
                  width={180}
                  height={180}
                  className={`object-contain transition-transform duration-500 ${callStatus === 'speaking' ? 'animate-bounce' : 'group-hover:scale-110'}`}
                />
              </div>

              {/* Activity bars */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 h-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-1 bg-[var(--brand-cyan)] rounded-full transition-all duration-150 ${callStatus === 'speaking' ? 'animate-music-bar' : 'h-1'}`}
                    style={{
                      animationDelay: `${i * 100}ms`,
                      height: callStatus === 'speaking' ? '100%' : '4px'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">
                {callStatus === 'listening' ? 'Escuchándote...' :
                  callStatus === 'thinking' ? 'Analizando...' :
                    callStatus === 'speaking' ? 'Finy hablando' : 'Conectado'}
              </h3>
              <p className="text-sm text-[var(--brand-gray)] font-medium max-w-xs mx-auto min-h-[1.5em] italic">
                {interimTranscript || (callStatus === 'listening' ? 'Di algo como: "¿Cómo van mis ahorros?"' : '')}
              </p>
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center gap-6 sm:gap-10">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-[var(--danger)] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleCallMode}
              className="w-20 h-20 rounded-full bg-[var(--danger)] text-white flex items-center justify-center shadow-2xl shadow-[var(--danger)]/30 hover:scale-110 active:scale-95 transition-all"
            >
              <PhoneOff className="w-8 h-8" />
            </button>

            <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center">
              <Bot className="w-6 h-6" />
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
