"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Crown, Search, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface Subscriber {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  city: string | null;
  photoUrl: string | null;
  isPremium: boolean;
  premiumPlan: string | null;
  premiumExpiresAt: string | null;
  createdAt: string;
}

type Tab = "all" | "premium" | "gold" | "expiring_soon" | "expired";

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/premium/list");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const now = new Date();

  // Filtrage par onglet + recherche
  const filtered = subscribers.filter((sub) => {
    const matchesSearch =
      searchQuery === "" ||
      `${sub.firstName} ${sub.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.email && sub.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.city && sub.city.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const expiresAt = sub.premiumExpiresAt ? new Date(sub.premiumExpiresAt) : null;
    const isCurrentlyActive = sub.isPremium && expiresAt && expiresAt > now;
    const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    if (activeTab === "premium") {
      return isCurrentlyActive && (sub.premiumPlan === "premium" || !sub.premiumPlan);
    }
    if (activeTab === "gold") {
      return isCurrentlyActive && sub.premiumPlan === "gold";
    }
    if (activeTab === "expiring_soon") {
      return isCurrentlyActive && daysLeft <= 3 && daysLeft >= 0;
    }
    if (activeTab === "expired") {
      return !sub.isPremium || (expiresAt && expiresAt <= now);
    }

    return true; // Onglet "all" (Tous)
  });

  const activeCount = subscribers.filter(
    (s) => s.isPremium && s.premiumExpiresAt && new Date(s.premiumExpiresAt) > now
  ).length;

  const expiredCount = subscribers.filter(
    (s) => !s.isPremium || (s.premiumExpiresAt && new Date(s.premiumExpiresAt) <= now)
  ).length;

  return (
    <div className="p-6 text-white max-w-6xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Abonnés Premium</h1>
            <p className="text-sm text-slate-400">
              {activeCount} actif(s) · {expiredCount} expiré(s)
            </p>
          </div>
        </div>

        <button
          onClick={fetchSubscribers}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Recherche */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Rechercher un abonné par nom, e-mail, ville..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500 transition"
        />
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === "all"
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
          }`}
        >
          Tous ({subscribers.length})
        </button>

        <button
          onClick={() => setActiveTab("premium")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
            activeTab === "premium"
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
          }`}
        >
          💎 Premium
        </button>

        <button
          onClick={() => setActiveTab("gold")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
            activeTab === "gold"
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
          }`}
        >
          🏆 Gold
        </button>

        <button
          onClick={() => setActiveTab("expiring_soon")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
            activeTab === "expiring_soon"
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
          }`}
        >
          ⏰ Expirent bientôt
        </button>

        <button
          onClick={() => setActiveTab("expired")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
            activeTab === "expired"
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
          }`}
        >
          ❌ Expirés ({expiredCount})
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 animate-pulse">Chargement des abonnés...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <Crown className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">Aucun abonné trouvé dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((sub) => {
            const expiresAt = sub.premiumExpiresAt ? new Date(sub.premiumExpiresAt) : null;
            const isCurrentlyActive = sub.isPremium && expiresAt && expiresAt > now;
            const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

            return (
              <div
                key={sub.id}
                className={`bg-slate-900 border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition ${
                  isCurrentlyActive ? "border-slate-800" : "border-rose-500/30 bg-rose-950/10"
                }`}
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden shrink-0 relative">
                    {sub.photoUrl ? (
                      <Image src={sub.photoUrl} alt="" width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                        {sub.firstName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">
                        {sub.firstName} {sub.lastName}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          sub.premiumPlan === "gold"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        }`}
                      >
                        {sub.premiumPlan || "PREMIUM"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{sub.email}</p>
                    {sub.city && <p className="text-xs text-slate-500">📍 {sub.city}</p>}
                  </div>
                </div>

                <div className="text-right w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                  <div className="text-xs font-bold">
                    {isCurrentlyActive ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> ACTIF ({daysLeft}j restants)
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> EXPIRÉ
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">
                    {expiresAt ? `Fin : ${expiresAt.toLocaleDateString("fr-FR")}` : "Pas de date"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
