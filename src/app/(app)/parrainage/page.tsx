"use client";

import { useState, useEffect } from "react";
import { 
  Gift, 
  Copy, 
  Check, 
  Users, 
  Trophy, 
  Sparkles,
  Share2,
  ArrowRight,
  Crown,
  HeartHandshake,
  CheckCircle2
} from "lucide-react";
import { getCurrentUserId } from "@/lib/auth"; // Ajuste selon ton import

interface ReferralData {
  referralCode?: string;
  referralCount: number;
  premiumDaysEarned: number;
  premiumExpiresAt: string | null;
  filleuls: Array<{
    id: number;
    firstName: string;
    photoUrl?: string;
    createdAt: string;
  }>;
}

export default function ParrainagePage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Récupérer les données de parrainage au chargement
  useEffect(() => {
    fetchReferralData();
  }, []);

  async function fetchReferralData() {
    try {
      const res = await fetch("/api/referral");
      if (res.ok) {
        const result = await res.json();
        setData({
          referralCode: result.referralCode,
          referralCount: result.referralCount || 0,
          premiumDaysEarned: result.premiumDaysEarned || 0,
          premiumExpiresAt: result.premiumExpiresAt,
          filleuls: result.filleuls || [],
        });
      }
    } catch (err) {
      console.error("Erreur chargement parrainage:", err);
    } finally {
      setLoading(false);
    }
  }

  // Copier le code dans le presse-papier
  async function copyCode() {
    if (!data?.referralCode) return;
    
    const url = `https://lovelink237.com/register?ref=${data.referralCode}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    } catch (err) {
      // Fallback si clipboard API échoue
      console.error("Erreur copie:", err);
    }
  }

  // Partager sur WhatsApp
  function shareWhatsApp() {
    if (!data?.referralCode) return;
    const url = `https://lovelink237.com/register?ref=${data.referralCode}`;
    const message = `💜 Rejoins-moi sur LoveLink et gagne 7 jours Premium gratuit ! Mon code : ${data.referralCode}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }

  // Calculer la date d'expiration Premium gagnée
  const premiumText = data?.premiumDaysEarned 
    ? `${data.premiumDaysEarned} jour${data.premiumDaysEarned > 1 ? "s" : ""} de Premium`
    : "Aucun Premium gagné";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 text-purple-500 animate-bounce mx-auto" />
          <p className="mt-4 text-slate-400">Chargement de ton programme de parrainage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/20 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <a href="/dashboard" className="p-2 hover:bg-slate-800 rounded-xl transition">
            <ArrowRight className="w-5 h-5 rotate-180 text-slate-400" />
          </a>
          <div>
            <h1 className="text-xl font-bold">Programme de Parrainage</h1>
            <p className="text-xs text-slate-400">Gagne du Premium gratuitement</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        
        {/* 🏆 Carte principale - Ton code */}
        <section className="relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-rose-500/30 to-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-amber-500/20 to-rose-500/20 rounded-full blur-3xl" />
          
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800/90 to-purple-950/40 border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-purple-500/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">Parraine tes amis</h2>
                <p className="text-sm text-slate-400">Et gagne du Premium gratuitement</p>
              </div>
            </div>

            {/* Le code du user */}
            <div className="bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 border-2 border-rose-500/20 rounded-2xl p-6 mb-6">
              <p className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2">Ton code personnel</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-4xl font-black tracking-widest font-mono bg-gradient-to-r from-rose-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
                    {data?.referralCode || "CHARGEMENT..."}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Chaque ami qui s&apos;inscrit avec ce code te donne 7 jours Premium</p>
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg shadow-rose-500/30"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
            </div>

            {/* Boutons de partage */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-2xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
              >
                <Share2 className="w-5 h-5" />
                WhatsApp
              </button>
              <button
                onClick={copyCode}
                className="flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-2xl font-bold transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20"
              >
                <Copy className="w-5 h-5" />
                Copier le lien
              </button>
            </div>
          </div>
        </section>

        {/* 📊 Stats du parrain */}
        <section className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-700/30 rounded-2xl p-5 text-center">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">{data?.referralCount || 0}</p>
            <p className="text-xs text-slate-400">Filleuls</p>
          </div>
          
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-5 text-center">
            <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-amber-400">{data?.premiumDaysEarned || 0}</p>
            <p className="text-xs text-slate-400">Jours Premium</p>
          </div>
          
          <div className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-5 text-center">
            <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-purple-400">7</p>
            <p className="text-xs text-slate-400">Par filleul</p>
          </div>
        </section>

        {/* 💎 Explication du système */}
        <section className="bg-gradient-to-r from-purple-900/20 to-rose-900/20 border border-purple-500/20 rounded-3xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-400" />
            Comment ça marche ?
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-rose-500/25">1</div>
              <div>
                <h4 className="font-bold">Partage ton code</h4>
                <p className="text-sm text-slate-300">Envoie ton code à tes amis sur WhatsApp, Instagram ou SMS</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-purple-500/25">2</div>
              <div>
                <h4 className="font-bold">Ils s&apos;inscrivent avec ton code</h4>
                <p className="text-sm text-slate-300">Le code est automatiquement détecté lors de l&apos;inscription</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-amber-500/25">3</div>
              <div>
                <h4 className="font-bold">Tu gagnes du Premium !</h4>
                <p className="text-sm text-slate-300">7 jours de Premium gratuit pour toi ET pour ton ami ! 🎉</p>
              </div>
            </div>
          </div>
        </section>

        {/* 👥 Tes filleuls */}
        {data?.filleuls && data.filleuls.length > 0 && (
          <section>
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Tes filleuls ({data.filleuls.length})
            </h3>
            
            <div className="space-y-3">
              {data.filleuls.map((filleul) => (
                <div key={filleul.id} className="bg-slate-900/40 border border-slate-700/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={filleul.photoUrl || "/default-avatar.png"} 
                      alt={filleul.firstName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/default-avatar.png";
                      }}
                    />
                    <div>
                      <h4 className="font-bold">{filleul.firstName}</h4>
                      <p className="text-xs text-slate-400">
                        Inscrit le {new Date(filleul.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                    <Gift className="w-4 h-4" />
                    +7j Premium
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ℹ️ Note si aucun filleul */}
        {(!data?.filleuls || data.filleuls.length === 0) && (
          <section className="bg-gradient-to-r from-slate-900/60 to-purple-950/20 border border-slate-700/20 rounded-3xl p-8 text-center">
            <Gift className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-2">Tu n&apos;as pas encore de filleuls</h3>
            <p className="text-slate-400 mb-6">
              Partage ton code avec tes amis et gagne du Premium gratuitement ! 💜
            </p>
            <button 
              onClick={shareWhatsApp}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-bold hover:scale-105 transition"
            >
              <Share2 className="w-5 h-5" />
              Partager sur WhatsApp
            </button>
          </section>
        )}
      </main>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-rose-500 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-purple-500/30 flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <p className="font-bold">Lien copié !</p>
            <p className="text-xs opacity-90">Partage-le avec tes amis</p>
          </div>
        </div>
      )}
    </div>
  );
}
