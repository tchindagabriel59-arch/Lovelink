"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Rocket, ArrowLeft, Zap, Star, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function BoostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txStatus = searchParams.get("status");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeDisplay] = useState<string | null>(null);

  // Vérifier si un boost est déjà actif
  useEffect(() => {
    fetch("/api/boost")
      .then((res) => res.json())
      .then((data) => {
        if (data.isActive && data.secondsRemaining > 0) {
          const timer = setInterval(() => {
            data.secondsRemaining -= 1;
            if (data.secondsRemaining <= 0) {
              clearInterval(timer);
              setTimeDisplay(null);
            } else {
              const h = Math.floor(data.secondsRemaining / 3600);
              const m = Math.floor((data.secondsRemaining % 3600) / 60);
              const s = data.secondsRemaining % 60;
              setTimeDisplay(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
            }
          }, 1000);
        }
      });
  }, []);

  const handleBuyBoost = async (period: "24h" | "3d" | "7d") => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "boost",
          period: period,
          returnPath: "/boost",
        }),
      });

      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl; // Redirection vers PayDunya
      } else {
        alert("Erreur: " + data.error);
        setLoading(false);
      }
    } catch (err) {
      alert("Erreur de connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto min-h-screen">
      <Link href="/discover" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-500 transition mb-6 font-bold">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      {/* Message de succès après paiement */}
      {txStatus === "success" && (
        <div className="mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <h3 className="font-black text-xl">Paiement validé ! 🚀</h3>
              <p className="text-white/90">Ton boost est maintenant actif. Profite de ta nouvelle visibilité !</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
          <Rocket className="w-12 h-12 text-white animate-pulse" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
          Passe en <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">priorité absolue</span>
        </h1>
        <p className="text-lg text-slate-600">
          Sois le premier profil affiché dans ta ville et multiplie tes matchs par 10.
        </p>

        {timeLeft && (
          <div className="mt-6 inline-flex flex-col items-center justify-center bg-purple-50 border-2 border-purple-200 text-purple-700 px-6 py-3 rounded-2xl">
            <span className="text-sm font-bold uppercase tracking-wider mb-1">Boost déjà actif 🚀</span>
            <span className="text-2xl font-black font-mono">{timeLeft}</span>
            <span className="text-xs mt-1 text-purple-600">En acheter un autre s'ajoutera à ton temps actuel.</span>
          </div>
        )}
      </div>

      {/* LES 3 OFFRES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Offre 24H */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-xl flex flex-col hover:border-purple-300 transition">
          <div className="text-center mb-6">
            <div className="text-purple-600 font-black text-xl mb-2">Boost 24H</div>
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl font-black text-slate-900">1 500</span>
              <span className="text-slate-500 font-bold mb-1">FCFA</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Profil prioritaire pendant 24h</li>
            <li className="flex gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Idéal pour tester</li>
          </ul>
          <button onClick={() => handleBuyBoost("24h")} disabled={loading} className="w-full py-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition">
            {loading ? "Chargement..." : "Choisir 24H"}
          </button>
        </div>

        {/* Offre 3 JOURS (Populaire) */}
        <div className="bg-gradient-to-b from-purple-600 to-indigo-600 rounded-3xl p-6 shadow-2xl flex flex-col relative transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            Le plus populaire ⭐
          </div>
          <div className="text-center mb-6 mt-4">
            <div className="text-purple-100 font-black text-xl mb-2">Boost 3 Jours</div>
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl font-black text-white">3 000</span>
              <span className="text-purple-200 font-bold mb-1">FCFA</span>
            </div>
            <div className="text-xs text-purple-200 mt-2 line-through">4 500 FCFA</div>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-white">
            <li className="flex gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-amber-400" /> Priorité MAX pendant 72h</li>
            <li className="flex gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-amber-400" /> Couvre tout le week-end</li>
            <li className="flex gap-3 text-sm"><CheckCircle2 className="w-5 h-5 text-amber-400" /> ~ Économie de 33%</li>
          </ul>
          <button onClick={() => handleBuyBoost("3d")} disabled={loading} className="w-full py-4 rounded-xl font-black bg-white text-purple-600 hover:bg-slate-50 transition shadow-xl">
            {loading ? "Chargement..." : "Choisir 3 Jours"}
          </button>
        </div>

        {/* Offre 7 JOURS */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-xl flex flex-col hover:border-purple-300 transition">
          <div className="text-center mb-6">
            <div className="text-purple-600 font-black text-xl mb-2">Boost 1 Semaine</div>
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl font-black text-slate-900">5 000</span>
              <span className="text-slate-500 font-bold mb-1">FCFA</span>
            </div>
            <div className="text-xs text-slate-400 mt-2 line-through">10 500 FCFA</div>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Être vu par TOUT LE MONDE</li>
            <li className="flex gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> ~ Économie de 50%</li>
          </ul>
          <button onClick={() => handleBuyBoost("7d")} disabled={loading} className="w-full py-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition">
            {loading ? "Chargement..." : "Choisir 7 Jours"}
          </button>
        </div>
      </div>

      <div className="text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        Paiement 100% sécurisé via PayDunya (Orange Money, MTN, Wave, Carte)
      </div>
    </div>
  );
}
