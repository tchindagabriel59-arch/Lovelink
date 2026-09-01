// src/components/ProfileCompletionCard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
  Flame,
  Rocket,
  Zap,
} from "lucide-react";

interface MissingItem {
  key: string;
  label: string;
  description: string;
  points: number;
  cta: string;
  href: string;
  priority: number;
  emoji: string;
}

interface CompletionData {
  percent: number;
  earnedPoints: number;
  totalPoints: number;
  missing: MissingItem[];
  nextAction: MissingItem | null;
  level: "low" | "medium" | "high" | "complete";
  message: string;
}

interface ProfileCompletionCardProps {
  /** Variante compacte pour Discover / Header */
  variant?: "full" | "compact" | "banner";
  /** Fermer la bannière (sauvegardé en localStorage) */
  dismissible?: boolean;
  /** Cacher automatiquement si 100% */
  hideIfComplete?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}

const DISMISS_KEY = "lovelink_completion_dismissed_at";

export default function ProfileCompletionCard({
  variant = "full",
  dismissible = false,
  hideIfComplete = true,
  className = "",
}: ProfileCompletionCardProps) {
  const router = useRouter();
  const [data, setData] = useState<CompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a fermé la carte récemment (24h)
    if (dismissible) {
      try {
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
          const hoursAgo = (Date.now() - Number(dismissedAt)) / 1000 / 60 / 60;
          if (hoursAgo < 24) {
            setDismissed(true);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    // Charger le score depuis l'API
    fetch("/api/profile/completion")
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json && json.success) {
          setData(json);
        }
      })
      .catch(() => {
        // silent
      })
      .finally(() => setLoading(false));
  }, [dismissible]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const handleAction = () => {
    if (data?.nextAction) {
      router.push(data.nextAction.href);
    }
  };

  // Ne pas afficher si en cours de chargement ou dismissé
  if (loading || dismissed) return null;

  // Ne pas afficher si pas de données
  if (!data) return null;

  // Ne pas afficher si complet et hideIfComplete = true
  if (hideIfComplete && data.percent >= 100) return null;

  // Couleurs selon niveau
  const getGradient = () => {
    if (data.percent >= 100) return "from-emerald-500 to-teal-500";
    if (data.percent >= 70) return "from-purple-500 to-pink-500";
    if (data.percent >= 40) return "from-pink-500 to-rose-500";
    return "from-rose-500 to-orange-500";
  };

  const getTextColor = () => {
    if (data.percent >= 100) return "text-emerald-400";
    if (data.percent >= 70) return "text-purple-400";
    if (data.percent >= 40) return "text-pink-400";
    return "text-rose-400";
  };

  const getIcon = () => {
    if (data.percent >= 100) return <CheckCircle2 className="w-5 h-5" />;
    if (data.percent >= 70) return <Sparkles className="w-5 h-5" />;
    if (data.percent >= 40) return <Rocket className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  // =====================================
  // VARIANTE BANNER (Discover, en haut)
  // =====================================
  if (variant === "banner") {
    return (
      <div
        className={`relative bg-slate-900/95 backdrop-blur-lg border border-slate-800 rounded-2xl p-3.5 shadow-lg ${className}`}
      >
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3">
          {/* Cercle % */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="rgba(148,163,184,0.2)"
                strokeWidth="3.5"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="url(#grad-banner)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${(data.percent / 100) * 100.53} 100.53`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="grad-banner" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-xs font-black ${getTextColor()}`}>
              {data.percent}%
            </div>
          </div>

          {/* Texte + CTA */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold leading-tight truncate">
              {data.nextAction ? data.nextAction.label : "Profil complet !"}
            </p>
            {data.nextAction && (
              <p className="text-slate-400 text-[11px] mt-0.5 leading-snug truncate">
                +{data.nextAction.points} pts • {data.nextAction.description.substring(0, 45)}...
              </p>
            )}
          </div>

          {data.nextAction && (
            <button
              onClick={handleAction}
              className={`px-3 py-2 bg-gradient-to-r ${getGradient()} text-white text-xs font-black rounded-xl flex-shrink-0 shadow-md active:scale-95 transition flex items-center gap-1`}
            >
              GO
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // =====================================
  // VARIANTE COMPACT (Header profil, sidebar)
  // =====================================
  if (variant === "compact") {
    return (
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={getTextColor()}>{getIcon()}</div>
            <span className="text-white font-bold text-sm">
              Profil {data.percent}%
            </span>
          </div>
          {data.percent >= 70 && (
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              TOP
            </span>
          )}
        </div>

        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-1000`}
            style={{ width: `${data.percent}%` }}
          />
        </div>

        {data.nextAction && (
          <button
            onClick={handleAction}
            className="mt-3 w-full text-left flex items-center justify-between gap-2 text-xs text-slate-300 hover:text-white transition group"
          >
            <span className="flex items-center gap-1.5">
              <span>{data.nextAction.emoji}</span>
              <span className="font-semibold">{data.nextAction.label}</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition" />
          </button>
        )}
      </div>
    );
  }

  // =====================================
  // VARIANTE FULL (Page profil, dashboard)
  // =====================================
  return (
    <div
      className={`relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl ${className}`}
    >
      {/* Halo décoratif */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${getGradient()} opacity-20 blur-3xl rounded-full`} />

      <div className="relative p-5 sm:p-6">
        {/* Header : titre + % */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={getTextColor()}>{getIcon()}</div>
              <h3 className="text-white font-bold text-lg">
                Complétion du profil
              </h3>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {data.message}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <div className={`text-3xl sm:text-4xl font-black ${getTextColor()}`}>
              {data.percent}%
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {data.earnedPoints}/{data.totalPoints} pts
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-5 relative">
          <div
            className={`h-full bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-1000 relative`}
            style={{ width: `${data.percent}%` }}
          >
            {data.percent > 15 && (
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            )}
          </div>
        </div>

        {/* Prochaine action */}
        {data.nextAction ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className={`text-2xl flex-shrink-0`}>
                {data.nextAction.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">
                    Prochaine étape
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    +{data.nextAction.points} pts
                  </span>
                </div>
                <p className="text-white font-bold text-sm leading-tight mb-1">
                  {data.nextAction.label}
                </p>
                <p className="text-slate-400 text-xs leading-snug">
                  {data.nextAction.description}
                </p>
              </div>
            </div>

            <button
              onClick={handleAction}
              className={`w-full bg-gradient-to-r ${getGradient()} hover:brightness-110 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform active:scale-[0.98]`}
            >
              <Flame className="w-4 h-4" />
              <span>{data.nextAction.cta}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-300 font-bold text-sm">
              🎉 Profil 100% complet !
            </p>
            <p className="text-emerald-400/70 text-xs mt-1">
              Tu es prêt(e) à cartonner sur LoveLink
            </p>
          </div>
        )}

        {/* Stats motivantes */}
        {data.percent < 100 && (
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
            <span>
              Les profils complets reçoivent{" "}
              <span className="text-pink-400 font-bold">3× plus de matchs</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
