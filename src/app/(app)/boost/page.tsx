"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Rocket,
  ArrowLeft,
  Eye,
  Heart,
  Clock,
  Zap,
  Crown,
  Sparkles,
  TrendingUp,
  Lock,
  Gem,
} from "lucide-react";

interface BoostData {
  isActive: boolean;
  secondsRemaining: number;
  canBoost: boolean;
  cooldownSeconds: number;
  isPremium: boolean;
  boostsUsedToday: number;
  boostsRemaining: number;
  limit: number;
  stats: {
    views: number;
    likes: number;
  };
}

export default function BoostPage() {
  const [data, setData] = useState<BoostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [timeDisplay, setTimeDisplay] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const fetchBoostStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/boost");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoostStatus();
    const interval = setInterval(fetchBoostStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchBoostStatus]);

  useEffect(() => {
    if (!data?.isActive) return;

    let remaining = data.secondsRemaining;
    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        fetchBoostStatus();
        return;
      }
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeDisplay(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    }, 1000);

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    setTimeDisplay(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);

    return () => clearInterval(timer);
  }, [data, fetchBoostStatus]);

  async function activateBoost() {
    if (!data?.canBoost) {
      // Si non-Premium en cooldown → montrer modal Premium
      if (!data?.isPremium && data?.cooldownSeconds && data.cooldownSeconds > 0) {
        setShowPremiumModal(true);
      }
      return;
    }
    
    const message = data.isPremium
      ? `🚀 Activer un boost Premium ?\n\nTon profil sera mis en avant pendant 30 minutes.\n\n⭐ Tu as ${data.boostsRemaining}/${data.limit} boosts restants aujourd'hui.`
      : `🚀 Activer le Boost ?\n\nTon profil sera mis en avant pendant 30 minutes.\n\n⚠️ Un seul boost par 24h (3/jour avec Premium)`;
    
    if (!confirm(message)) return;

    setActivating(true);
    try {
      const res = await fetch("/api/boost", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        alert(result.message);
        fetchBoostStatus();
      } else {
        const err = await res.json();
        if (err.error === "COOLDOWN" && !data.isPremium) {
          setShowPremiumModal(true);
        } else {
          alert("❌ " + (err.error || err.message || "Erreur"));
        }
      }
    } catch {
      alert("Erreur");
    } finally {
      setActivating(false);
    }
  }

  function formatCooldown(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}min`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Rocket className="w-12 h-12 text-purple-400 animate-pulse mx-auto" />
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      
      {/* 🔒 MODAL PREMIUM SI LIMITE ATTEINTE */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Boost quotidien utilisé 🚀
              </h2>
              <p className="text-slate-600">
                Prochain boost gratuit dans <strong>{formatCooldown(data?.cooldownSeconds || 0)}</strong>
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border-2 border-yellow-200 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <p className="font-black text-slate-900">Avec Premium :</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-purple-500" />
                  <strong>3 Boosts</strong> par jour au lieu de 1
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Priorité #1 dans la découverte
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  10x plus de matchs
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Attendre
              </button>
              <Link
                href="/premium"
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Gem className="w-4 h-4" />
                Premium
              </Link>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au dashboard
      </Link>

      {/* HEADER */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-rose-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/30">
          <Rocket className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Booster mon profil
        </h1>
        <p className="text-slate-600">
          Sois le premier profil vu pendant 30 minutes 🚀
        </p>

        {/* Badge Premium ou Gratuit */}
        {data && (
          <div className="mt-4 inline-flex items-center gap-2">
            {data.isPremium ? (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-full px-4 py-1.5">
                <Crown className="w-4 h-4 text-yellow-600 fill-yellow-500" />
                <span className="text-sm font-black text-yellow-700">
                  Premium • {data.boostsRemaining}/{data.limit} restants
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5">
                <span className="text-sm font-bold text-slate-600">
                  Gratuit • 1 boost / 24h
                </span>
                <Link href="/premium" className="text-xs text-orange-500 hover:underline font-bold flex items-center gap-0.5">
                  <Crown className="w-3 h-3" />
                  Upgrader
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOOST ACTIF */}
      {data?.isActive ? (
        <div className="bg-gradient-to-br from-purple-500 via-rose-500 to-orange-500 rounded-3xl p-8 text-white mb-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full mb-4">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-bold">BOOST ACTIF</span>
            </div>
            <p className="text-white/90 mb-2">Temps restant</p>
            <p className="text-7xl font-bold font-mono tracking-tight mb-4">
              {timeDisplay}
            </p>
            <p className="text-white/90 max-w-md mx-auto">
              🔥 Ton profil est <strong>en tête</strong> de la découverte !
            </p>

            {/* Stats du boost */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">Vues</span>
                </div>
                <p className="text-3xl font-bold">{data.stats.views}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Heart className="w-5 h-5 fill-white" />
                  <span className="text-sm">Likes reçus</span>
                </div>
                <p className="text-3xl font-bold">{data.stats.likes}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* BOUTON ACTIVATION */
        <div className="bg-white rounded-3xl p-8 border border-slate-100 mb-6 shadow-xl">
          {data?.canBoost ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-sm font-bold mb-4">
                  <Zap className="w-4 h-4" />
                  Disponible
                </div>
                <p className="text-slate-600">
                  Prêt(e) à booster ta visibilité ? 🚀
                </p>
                {data.isPremium && (
                  <p className="text-xs text-yellow-600 font-bold mt-2 flex items-center justify-center gap-1">
                    <Crown className="w-3 h-3 fill-yellow-500" />
                    {data.boostsRemaining} boost{data.boostsRemaining > 1 ? "s" : ""} restant{data.boostsRemaining > 1 ? "s" : ""} aujourd&apos;hui
                  </p>
                )}
              </div>

              <button
                onClick={activateBoost}
                disabled={activating}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 hover:scale-[1.02] ${
                  data.isPremium
                    ? "bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 hover:shadow-2xl hover:shadow-orange-500/40 text-white"
                    : "bg-gradient-to-r from-purple-500 via-rose-500 to-orange-500 hover:shadow-2xl hover:shadow-purple-500/40 text-white"
                }`}
              >
                <Rocket className="w-6 h-6" />
                {activating ? "Activation..." : data.isPremium ? "BOOSTER (PREMIUM)" : "ACTIVER LE BOOST"}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                data?.isPremium ? "bg-yellow-50" : "bg-amber-50"
              }`}>
                {data?.isPremium ? (
                  <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                ) : (
                  <Lock className="w-8 h-8 text-amber-500" />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {data?.isPremium
                  ? "Limite quotidienne atteinte"
                  : "Prochain boost dans"}
              </h3>
              <p className="text-3xl font-bold gradient-text mb-4">
                {formatCooldown(data?.cooldownSeconds || 0)}
              </p>
              <p className="text-sm text-slate-500 mb-6">
                {data?.isPremium
                  ? `Tu as utilisé tes ${data.limit} boosts Premium aujourd'hui`
                  : "Tu as déjà utilisé ton boost quotidien"}
              </p>

              {/* CTA Premium pour non-Premium */}
              {!data?.isPremium && (
                <div className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
                  <div className="flex items-center gap-2 justify-center mb-3">
                    <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <p className="font-black text-slate-900 text-lg">Débloque plus de boosts !</p>
                  </div>
                  <p className="text-sm text-slate-700 mb-4">
                    Avec Premium tu as <strong>3 boosts par jour</strong> au lieu d&apos;un seul.
                  </p>
                  <Link
                    href="/premium"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <Gem className="w-4 h-4" />
                    Passer Premium
                  </Link>
                </div>
              )}

              {/* Note Premium si Premium */}
              {data?.isPremium && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                  <p className="text-sm text-slate-700">
                    💫 Passe à <strong>Gold</strong> pour des boosts illimités !
                  </p>
                  <Link
                    href="/premium"
                    className="inline-block mt-2 text-xs font-bold text-yellow-600 hover:underline"
                  >
                    Voir les offres →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AVANTAGES DU BOOST */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Pourquoi booster ?
        </h3>
        <div className="space-y-3">
          <Benefit
            icon="🚀"
            title="Visibilité maximale"
            desc="Ton profil apparaît en PREMIER dans la découverte pendant 30 min"
          />
          <Benefit
            icon="⚡"
            title="10x plus de vues"
            desc="Multiplie tes chances d'être vu(e) par les bonnes personnes"
          />
          <Benefit
            icon="💕"
            title="Plus de matchs"
            desc="Plus de vues = plus de likes = plus de matchs !"
          />
          <Benefit
            icon="🎯"
            title="Timing parfait"
            desc="Booste aux heures de pointe (18h-22h) pour un impact maximum"
          />
        </div>
      </div>

      {/* Bannière Premium en bas (si non-Premium) */}
      {!data?.isPremium && (
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-500 rounded-3xl p-6 text-white shadow-2xl mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
              <Crown className="w-8 h-8 text-white fill-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-lg">3x plus de boosts avec Premium</p>
              <p className="text-sm text-white/90">Booste 3 fois par jour au lieu d&apos;une seule</p>
            </div>
            <Link
              href="/premium"
              className="flex-shrink-0 bg-white text-orange-600 font-black px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform text-sm"
            >
              Découvrir
            </Link>
          </div>
        </div>
      )}

      {/* CONSEIL */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-blue-900 mb-1">💡 Conseil pro</p>
            <p className="text-sm text-blue-800">
              Le meilleur moment pour booster : <strong>entre 18h et 22h</strong> quand
              le maximum d&apos;utilisateurs sont connectés !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Benefit({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-bold text-slate-900 text-sm">{title}</p>
        <p className="text-xs text-slate-600">{desc}</p>
      </div>
    </div>
  );
}
