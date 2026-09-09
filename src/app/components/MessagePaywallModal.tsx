"use client";

import Link from "next/link";
import { MessageCircle, Gem, Sparkles, X, Heart } from "lucide-react";

interface MessagePaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchName?: string;
}

export default function MessagePaywallModal({
  isOpen,
  onClose,
  matchName = "ton match",
}: MessagePaywallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
        
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Décoration d'arrière-plan */}
        <div className="w-20 h-20 bg-gradient-to-tr from-rose-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-rose-500/30 transform rotate-3">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-2">
          Passe en <span className="gradient-text">Illimité !</span> 💬
        </h2>

        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Tu as utilisé tes <strong className="text-rose-600">3 messages gratuits</strong> avec <strong>{matchName}</strong>. Passe Premium pour continuer la discussion sans restriction !
        </p>

        {/* Avantages rapides */}
        <div className="bg-rose-50/60 rounded-2xl p-4 mb-6 text-left space-y-2.5 border border-rose-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
            Messages & tchats illimités
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Heart className="w-4 h-4 text-rose-500 shrink-0" />
            Débloque tous ceux qui t'ont liké
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Gem className="w-4 h-4 text-purple-600 shrink-0" />
            Badge VIP sur ton profil
          </div>
        </div>

        {/* Bouton d'action */}
        <Link
          href="/premium"
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-black rounded-2xl shadow-lg shadow-rose-500/25 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-base"
        >
          <Gem className="w-5 h-5" />
          Débloquer mes messages
        </Link>

        <button
          onClick={onClose}
          className="mt-3 text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
