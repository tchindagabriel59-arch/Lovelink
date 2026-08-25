"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Send, Bot } from "lucide-react";
import { useUser } from "@/app/(app)/layout";

type ChatMsg = { sender: "user" | "gabi"; text: string };

const WELCOME: ChatMsg = {
  sender: "gabi",
  text: "Salut ! Je suis Gabi AI, ton coach séduction personnel. Plus on discute, mieux je te connais et mieux je t'aide. Pose-moi une question ! 😉✨",
};

function storageKey(userId?: number) {
  return userId ? `gabi_ai_memory_${userId}` : "gabi_ai_memory_guest";
}

export default function GabiAiButton() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [inputPrompt, setInputPrompt] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Position déplaçable
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Charger la mémoire de CET utilisateur
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(user?.id));
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMsg[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [user?.id]);

  // Sauvegarder la mémoire à chaque message
  useEffect(() => {
    if (messages.length <= 1) return;
    try {
      // Garde les 40 derniers messages max (contexte + perf)
      const toSave = messages.slice(-40);
      localStorage.setItem(storageKey(user?.id), JSON.stringify(toSave));
    } catch {
      // ignore
    }
  }, [messages, user?.id]);

  // Scroll auto en bas du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  if (pathname === "/discover" || pathname === "/messages") {
    return null;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { x: t.clientX, y: t.clientY };
    posStartRef.current = { ...position };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStartRef.current.x;
    const dy = t.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDraggedRef.current = true;
    setPosition({ x: posStartRef.current.x + dx, y: posStartRef.current.y + dy });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDraggedRef.current = true;
    setPosition({ x: posStartRef.current.x + dx, y: posStartRef.current.y + dy });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleButtonClick = () => {
    if (!hasDraggedRef.current) setIsOpen(true);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userText = inputPrompt.trim();
    setInputPrompt("");

    const nextMessages: ChatMsg[] = [
      ...messages,
      { sender: "user", text: userText },
    ];
    setMessages(nextMessages);
    setLoading(true);

    try {
      // Envoie l'historique (comme ChatGPT) pour que Gabi se souvienne
      const history = nextMessages
        .filter((m) => m !== WELCOME || nextMessages.length === 2)
        .slice(-20) // 20 derniers messages
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          userPrompt: userText,
          history, // 🔑 mémoire de conversation
        }),
      });

      const data = await res.json();
      if (res.ok && data.advice) {
        setMessages((prev) => [...prev, { sender: "gabi", text: data.advice }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "gabi", text: `⚠️ ${data.error || "Erreur Gabi AI"}` },
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      setMessages((prev) => [
        ...prev,
        { sender: "gabi", text: `⚠️ ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearMemory = () => {
    if (!confirm("Effacer toute la mémoire de Gabi AI pour ce compte ?")) return;
    setMessages([WELCOME]);
    try {
      localStorage.removeItem(storageKey(user?.id));
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Bouton flottant déplaçable */}
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          touchAction: "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-[60] cursor-grab active:cursor-grabbing select-none"
      >
        <button
          type="button"
          onClick={handleButtonClick}
          className="bg-gradient-to-r from-purple-600 via-rose-500 to-indigo-600 text-amber-300 p-3.5 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 border-2 border-amber-300/50"
          title="Glisse-moi pour me déplacer"
        >
          <Sparkles className="w-6 h-6 text-amber-300 pointer-events-none" />
          <span className="text-xs font-black text-white pr-1 hidden sm:inline pointer-events-none">
            Gabi AI
          </span>
        </button>
      </div>

      {/* Modale SANS flou d'arrière-plan */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
          <div className="bg-slate-900 border border-purple-500/30 rounded-t-3xl sm:rounded-3xl w-full max-w-md h-[85vh] sm:h-[520px] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border-b border-purple-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center border border-amber-300">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-1.5">
                    Gabi AI
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-md font-bold uppercase border border-amber-400/30">
                      Perso
                    </span>
                  </h3>
                  <p className="text-[11px] text-purple-300 font-medium">
                    {user?.firstName
                      ? `Coach de ${user.firstName} ✨`
                      : "Ton coach personnalisé ✨"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearMemory}
                  className="text-[10px] text-slate-400 hover:text-amber-300 px-2 py-1 rounded-lg"
                  title="Nouvelle conversation"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-purple-600 to-rose-600 text-white rounded-br-none"
                        : "bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-700/80 text-xs text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Gabi AI réfléchit...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Parle à ton Gabi AI..."
                className="flex-1 bg-slate-800 text-white text-xs px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-purple-500 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className="bg-gradient-to-r from-purple-600 to-rose-600 text-white p-3 rounded-xl hover:scale-105 transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
