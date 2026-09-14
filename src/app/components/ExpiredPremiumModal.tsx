"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crown, Sparkles, Heart, Zap, X, ArrowRight } from "lucide-react";

interface ExpiredPremiumModalProps {
  user: {
    isPremium: boolean;
    premiumExpiresAt?: string | null;
    firstName: string;
  } | null;
}

export default function ExpiredPremiumModal({ user }: ExpiredPremiumModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Si l'utilisateur N'EST PLUS Premium mais A DÉJÀ ÉTÉ Premium dans le passé
    const now = new Date();
    const hasExpired =
      !user.isPremium &&
      user.premiumExpiresAt &&
      new Date(user.premiumExpiresAt) <= now;

    if (hasExpired) {
      // Vérifier si la modale a déjà été fermée aujourd'hui
      const dismissed = localStorage.getItem("expired_modal_dismissed");
      const todayStr = new Date().toISOString().split("T")[0];

      if (dismissed !== todayStr) {
        setOpen(true);
      }
    }
  }, [user]);

  const handleClose = () => {
    setOpen(false);
    // Masquer pour la journée actuelle
    const todayStr = new Date().toISOString().split("T")[0];
    localStorage.setItem("expired_modal_dismissed", todayStr);
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative border border-purple-500/30 overflow-hidden">
        
        {/* Lumière d'ambiance */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Bouton Fermer */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icône Couronne cassée / Coeur */}
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-xl shadow-rose-500/20 transform -rotate-3">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-slate-900 border-2 border-purple-500 p-1.5 rounded-full">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
        </div>

        <h2 className="text-2xl font-black mb-2">
          Tu nous manques, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">{user.firstName}</span> ! 💔
        </h2>

        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          Ton abonnement Premium est arrivé à terme. Tes likes recus et tes super-pouvoirs sont actuellement mis en pause.
        </p>

        {/* Avantages rappel */}
        <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left space-y-2.5 border border-white/10">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            Débloque tous ceux qui t'ont liké
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
            <Zap className="w-4 h-4 text-rose-400 shrink-0" />
            Boosts de visibilité prioritaires
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
            <Crown className="w-4 h-4 text-purple-400 shrink-0" />
            Badge VIP & Filtres avancés
          </div>
        </div>

        {/* Bouton de Réabonnement */}
        <Link
          href="/premium"
          onClick={handleClose}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black rounded-2xl shadow-xl shadow-rose-500/25 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-base"
        >
          Relancer mon Premium
          <ArrowRight className="w-5 h-5" />
        </Link>

        <button
          onClick={handleClose}
          className="mt-4 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          Continuer en mode gratuit
        </button>
      </div>
    </div>
  );
}
