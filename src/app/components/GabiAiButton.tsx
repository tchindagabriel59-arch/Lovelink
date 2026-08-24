"use client";

import { useState } from "react";
import { Sparkles, X, MessageCircle } from "lucide-react";

export default function GabiAiButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);

  const getAdvice = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advice" }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdvice(data.advice);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!advice) getAdvice();
  };

  return (
    <>
      {/* 🤖 BOUTON FLOTTANT GABI AI */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-amber-300 p-4 rounded-full shadow-2xl hover:scale-110 hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center animate-bounce-slow"
        style={{ animationDuration: '3s' }}
        title="Demander conseil à Gabi AI"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* 🤖 MODALE GABI AI */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg border-2 border-amber-300">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-xl text-white">Gabi AI</h3>
                <p className="text-xs text-purple-300 font-bold">Ton coach en séduction</p>
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 min-h-[100px] flex items-center justify-center text-sm text-slate-200">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                  <span className="text-slate-400">Gabi AI réfléchit...</span>
                </div>
              ) : (
                <p className="leading-relaxed">{advice || "Impossible de joindre Gabi AI pour le moment."}</p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={getAdvice}
                disabled={loading}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Autre conseil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
