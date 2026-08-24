"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Send, Bot } from "lucide-react";

export default function GabiAiButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "gabi"; text: string }[]>([
    {
      sender: "gabi",
      text: "Salut ! Je suis Gabi AI, ton coach séduction personnel. Pose-moi une question ou demande-moi un conseil pour tes matchs ! 😉✨",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");

  // 🙈 MASQUER LE BOUTON SUR LA PAGE DISCOVER
  if (pathname === "/discover") {
    return null;
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userText = inputPrompt.trim();
    setInputPrompt("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", userPrompt: userText }),
      });

      const data = await res.json();
      if (res.ok && data.advice) {
        setMessages((prev) => [...prev, { sender: "gabi", text: data.advice }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "gabi", text: "Oups, petit bug réseau ! Réessaie ta question ✨" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "gabi", text: "Impossible de joindre Gabi AI pour le moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🤖 BOUTON FLOTTANT (Caché sur /discover, visible au scroll sur le reste) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-[60] bg-gradient-to-r from-purple-600 via-rose-500 to-indigo-600 text-amber-300 p-3.5 rounded-full shadow-2xl hover:scale-110 hover:shadow-purple-500/40 transition-all duration-300 flex items-center gap-2 border-2 border-amber-300/50 group"
        title="Discuter avec Gabi AI"
      >
        <Sparkles className="w-6 h-6 text-amber-300 group-hover:rotate-12 transition" />
        <span className="text-xs font-black text-white pr-1 hidden sm:inline">Gabi AI</span>
      </button>

      {/* 💬 CHAT MODAL GABI AI */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-md h-[500px] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border-b border-purple-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg border border-amber-300">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-1.5">
                    Gabi AI
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-md font-bold uppercase border border-amber-400/30">
                      En Ligne
                    </span>
                  </h3>
                  <p className="text-[11px] text-purple-300 font-medium">
                    Ton Assistant Séduction LoveLink ✨
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zone de discussion */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-purple-600 to-rose-600 text-white font-medium rounded-br-none"
                        : "bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none shadow-md"
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
                    <span>Gabi AI tape sa réponse...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Formulaire de saisie */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Pose une question à Gabi AI..."
                className="flex-1 bg-slate-800 text-white text-xs px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-purple-500 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className="bg-gradient-to-r from-purple-600 to-rose-600 text-white p-3 rounded-xl hover:scale-105 transition disabled:opacity-40 flex items-center justify-center"
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
