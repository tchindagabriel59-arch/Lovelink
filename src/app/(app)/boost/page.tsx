"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Rocket, ArrowLeft, Eye, Heart, Clock, Zap, Crown, Sparkles, TrendingUp } from "lucide-react";

interface BoostData {
  isActive: boolean;
  secondsRemaining: number;
  canBoost: boolean;
  cooldownSeconds: number;
  isPremium: boolean;
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

  // Timer local pour un affichage fluide
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

    // Init
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    setTimeDisplay(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);

    return () => clearInterval(timer);
  }, [data, fetchBoostStatus]);

  async function activateBoost() {
    if (!data?.canBoost) return;
    if (!confirm("🚀 Activer le Boost ?\n\nTon profil sera mis en avant pendant 30 minutes.\n\n⚠️ Un seul boost par 24h (illimité pour Premium)")) return;

    setActivating(true);
    try {
      const res = await fetch("/api/boost", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        alert(result.message);
        fetchBoostStatus();
      } else {
        const err = await res.json();
        alert("❌ " + (err.error || "Erreur"));
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
              </div>

              <button
                onClick={activateBoost}
                disabled={activating}
                className="w-full py-5 bg-gradient-to-r from-purple-500 via-rose-500 to-orange-500 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] text-white rounded-2xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Rocket className="w-6 h-6" />
                {activating ? "Activation..." : "ACTIVER LE BOOST"}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Prochain boost disponible dans
              </h3>
              <p className="text-3xl font-bold gradient-text mb-4">
                {formatCooldown(data?.cooldownSeconds || 0)}
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Tu as déjà utilisé ton boost quotidien
              </p>
              {!data?.isPremium && (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <p className="font-bold text-amber-800">Passe Premium</p>
                  </div>
                  <p className="text-sm text-slate-700">
                    Débloque des <strong>boosts illimités</strong> avec Premium !
                  </p>
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
