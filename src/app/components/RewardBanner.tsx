"use client";

import { useState, useEffect } from "react";
import { Gift, Sparkles, CheckCircle2, X, Crown } from "lucide-react";

interface RewardBannerProps {
  onRewardClaimed?: () => void;
}

export default function RewardBanner({ onRewardClaimed }: RewardBannerProps) {
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [missingFields, setMissingFields] = useState<{
    photo?: boolean;
    bio?: boolean;
    city?: boolean;
    interests?: boolean;
  } | null>(null);
  const [message, setMessage] = useState("");

  // ✅ Vérifier éligibilité au chargement
  useEffect(() => {
    async function checkEligibility() {
      try {
        // Appel silencieux pour vérifier si l'user a reçu une relance
        const res = await fetch("/api/reward/incomplete-profile/check", {
          method: "GET",
        });
        if (res.ok) {
          const data = await res.json();
          setEligible(data.eligible || false);
        }
      } catch {
        // silencieux
      } finally {
        setChecking(false);
      }
    }
    checkEligibility();
  }, []);

  const handleClaim = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/reward/incomplete-profile", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setClaimed(true);
        setMessage(data.message || "🎁 7 jours Premium débloqués !");
        if (onRewardClaimed) onRewardClaimed();
        // Refresh la page après 3s pour voir le Premium actif
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setMissingFields(data.missing || null);
        setMessage(data.message || "Profil pas encore complet");
      }
    } catch {
      setMessage("Erreur, réessaie plus tard");
    } finally {
      setLoading(false);
    }
  };

  // Ne rien afficher pendant la vérification ou si pas éligible
  if (checking || !eligible || dismissed) return null;

  // ✅ Bandeau succès après réclamation
  if (claimed) {
    return (
      <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 shadow-2xl text-white animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black mb-1">🎉 Félicitations !</h3>
            <p className="text-white/90 text-sm">
              Tu as reçu <strong>7 jours Premium GRATUITS</strong> !<br />
              Profites-en pour trouver l&apos;amour 💕
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Bandeau récompense
  return (
    <div className="mb-6 relative bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-2xl p-1 shadow-2xl">
      <div className="bg-white rounded-2xl p-5 relative overflow-hidden">
        {/* Bouton fermer */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        {/* Décoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-30 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full opacity-30 blur-2xl" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 animate-pulse">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-0.5 rounded-full tracking-wider">
                  CADEAU EXCLUSIF
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">
                🎁 7 jours Premium OFFERTS !
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Complète ton profil (<strong>photo, bio, ville, intérêts</strong>) et
            débloque <strong className="text-orange-600">7 jours Premium GRATUITS</strong> !
          </p>

          {/* Message d'erreur si champs manquants */}
          {missingFields && (
            <div className="mb-4 bg-orange-50 border-2 border-orange-200 rounded-xl p-3">
              <p className="text-xs font-bold text-orange-800 mb-2">
                ⚠️ Il te manque encore :
              </p>
              <ul className="text-xs text-orange-700 space-y-1">
                {missingFields.photo && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Une photo de profil
                  </li>
                )}
                {missingFields.bio && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Une bio (min. 10 caractères)
                  </li>
                )}
                {missingFields.city && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Ta ville
                  </li>
                )}
                {missingFields.interests && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Au moins 1 centre d&apos;intérêt
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Avantages Premium */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Crown className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-bold text-orange-900">
                Avec Premium tu auras :
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-orange-800">
              <p>💕 Likes illimités</p>
              <p>👀 Voir qui t&apos;a liké</p>
              <p>⭐ 5 Super Likes/j</p>
              <p>🚀 3 Boosts/j</p>
            </div>
          </div>

          {/* Bouton */}
          <button
            onClick={handleClaim}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-600 hover:via-orange-600 hover:to-pink-600 text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-2xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Réclamer mes 7 jours Premium
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>

          {message && !claimed && (
            <p className="text-xs text-center text-slate-600 mt-2">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
