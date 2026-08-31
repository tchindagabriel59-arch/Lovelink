// src/components/MatchModal.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Heart, Sparkles, Loader2, MessageCircle } from "lucide-react";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUser: {
    id: number;
    name: string;
    photoUrl: string | null;
  } | null;
}

export default function MatchModal({ isOpen, onClose, matchedUser }: MatchModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !matchedUser) return null;

  const handleQuickCoucou = async () => {
    setLoading(true);
    try {
      // 1. Envoi d'un message pré-rempli instantané
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: matchedUser.id,
          content: "Coucou ! 👋 Ravi(e) de matcher avec toi !",
        }),
      });

      if (res.ok) {
        // Redirection directe vers la conversation
        router.push(`/messages/${matchedUser.id}`);
      } else {
        // En cas de souci, on redirige quand même vers le tchat
        router.push(`/messages/${matchedUser.id}`);
      }
    } catch (err) {
      console.error("Erreur envoi coucou:", err);
      router.push(`/messages/${matchedUser.id}`);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center overflow-hidden animate-scale-up">
        {/* Bouton Fermer X */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-9 h-9 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Halo lumineux en arrière-plan */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl -z-10" />

        {/* Photo de profil de la personne avec badge cœur */}
        <div className="relative w-28 h-28 mx-auto mb-5">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-pink-500/40 shadow-xl shadow-pink-500/20">
            <Image
              src={matchedUser.photoUrl || "/placeholder.png"}
              alt={matchedUser.name}
              width={112}
              height={112}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          {/* Badge cœur superposé */}
          <div className="absolute bottom-0 right-0 w-9 h-9 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
        </div>

        {/* Titre & Description */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>C'est un Match !</span>
          </div>

          <h2 className="text-2xl font-bold text-white">Nouveau Match !</h2>

          <p className="text-sm text-slate-300 leading-relaxed px-2">
            <strong className="text-pink-300">{matchedUser.name}</strong> vous a aussi donné un Like 🙌
            <br />
            On peut lui envoyer un petit message tout prêt si vous voulez.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <button
            onClick={handleQuickCoucou}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                <span>Lui faire un petit coucou</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full text-xs font-medium text-slate-400 hover:text-slate-200 py-2.5 transition"
          >
            Peut-être plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
