"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Users,
  Heart,
  MessageCircle,
  Flag,
  Crown,
  Ban,
  TrendingUp,
  DollarSign,
  Activity,
  Shield,
  BarChart3,
  ShieldCheck,
  Camera,
  Mail,
  Loader2,
} from "lucide-react";

interface Stats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    active24h: number;
    premium: number;
    banned: number;
  };
  gender: Array<{ gender: string; count: number }>;
  activity: {
    totalLikes: number;
    totalMatches: number;
    totalMessages: number;
  };
  reports: {
    pending: number;
    total: number;
  };
  revenue: {
    monthlyRevenue: number;
    yearlyRevenue: number;
  };
}

// ✅ SKELETON LOADER
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white animate-pulse">
      <header className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl" />
          <div>
            <div className="h-6 w-40 bg-slate-800 rounded mb-2" />
            <div className="h-4 w-56 bg-slate-800 rounded" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-24 bg-slate-900 border border-slate-800 rounded-2xl" />
        <div className="h-40 bg-slate-900 border border-slate-800 rounded-2xl" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-900 border border-slate-800 rounded-2xl" />
          <div className="h-48 bg-slate-900 border border-slate-800 rounded-2xl" />
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [sendingRelance, setSendingRelance] = useState(false);
  const [relanceResult, setRelanceResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // ✅ Hash pour éviter les re-renders inutiles
  const lastStatsHashRef = useRef<string>("");

  // ✅ Fetch groupé et optimisé
  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, verifRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/verifications?filter=pending"),
      ]);

      if (statsRes.status === 403) {
        setError(true);
        setLoading(false);
        return;
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        // ✅ Ne mettre à jour QUE si les stats ont changé
        const hash = JSON.stringify(data);
        if (hash !== lastStatsHashRef.current) {
          lastStatsHashRef.current = hash;
          setStats(data);
        }
      }

      if (verifRes.ok) {
        const data = await verifRes.json();
        setPendingVerifications(data.pendingCount || 0);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // ✅ Polling à 60s au lieu de 30s (dashboard admin change pas si vite)
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  async function handleRelancePhotos() {
    if (!confirm("Envoyer un email de relance à tous les utilisateurs sans photo ?")) {
      return;
    }

    setSendingRelance(true);
    setRelanceResult(null);

    try {
      const res = await fetch("/api/admin/relance-photos", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setRelanceResult({
          success: true,
          message: `✅ ${data.sentCount} email(s) envoyé(s) sur ${data.totalWithoutPhotos} utilisateur(s) sans photo`,
        });
      } else {
        setRelanceResult({
          success: false,
          message: `❌ Erreur : ${data.error || "Impossible d'envoyer les emails"}`,
        });
      }
    } catch {
      setRelanceResult({
        success: false,
        message: "❌ Erreur de connexion",
      });
    } finally {
      setSendingRelance(false);
      setTimeout(() => setRelanceResult(null), 8000);
    }
  }

  // ✅ SKELETON au lieu de spinner
  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">🚫 Accès refusé</h1>
          <p className="text-slate-400 mb-6">
            Cette zone est réservée aux administrateurs de LoveLink.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="p-6 border-b border-slate-800">
  <div className="max-w-7xl mx-auto flex items-center gap-3">
    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
      <Crown className="w-6 h-6 text-white" />
    </div>
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-slate-400">Contrôle total de LoveLink</p>
    </div>
  </div>
</header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Utilisateurs totaux"
            value={stats.users.total}
            color="from-blue-500 to-cyan-500"
            trend={`+${stats.users.newToday} aujourd'hui`}
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            label="Actifs (24h)"
            value={stats.users.active24h}
            color="from-green-500 to-emerald-500"
            trend="En temps réel"
          />
          <StatCard
            icon={<Crown className="w-6 h-6" />}
            label="Abonnés Premium"
            value={stats.users.premium}
            color="from-amber-500 to-orange-500"
            trend={`${stats.revenue.monthlyRevenue}€ / mois`}
          />
          <StatCard
            icon={<Flag className="w-6 h-6" />}
            label="Signalements"
            value={stats.reports.pending}
            color="from-red-500 to-pink-500"
            trend={`${stats.reports.total} au total`}
            alert={stats.reports.pending > 0}
          />
        </div>

        {/* CARTE RELANCE PHOTOS */}
        <div className="bg-gradient-to-r from-rose-500/20 to-pink-500/20 border-2 border-rose-500/50 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  📸 Relancer les utilisateurs sans photo
                </h3>
                <p className="text-sm text-slate-400">
                  Envoie un email à tous les membres qui n&apos;ont pas encore ajouté de photo
                </p>
              </div>
            </div>
            <button
              onClick={handleRelancePhotos}
              disabled={sendingRelance}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg text-white rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingRelance ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Envoyer les relances
                </>
              )}
            </button>
          </div>

          {relanceResult && (
            <div
              className={`mt-4 p-4 rounded-xl relative ${
                relanceResult.success
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              <p className="text-sm font-semibold">{relanceResult.message}</p>
            </div>
          )}
        </div>

        {pendingVerifications > 0 && (
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <ShieldCheck className="w-8 h-8 text-white fill-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {pendingVerifications} demande{pendingVerifications > 1 ? "s" : ""} de vérification 
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">NEW</span>
                  </h3>
                  <p className="text-sm text-slate-400">
                    Des utilisateurs attendent la validation de leur badge bleu 💙
                  </p>
                </div>
              </div>
              <a
                href="/gabriel-boss/verifications"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg text-white rounded-xl font-bold transition flex items-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                Examiner
              </a>
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold">📈 Croissance</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <GrowthCard label="Aujourd'hui" value={stats.users.newToday} color="text-green-400" />
            <GrowthCard label="Cette semaine" value={stats.users.newThisWeek} color="text-blue-400" />
            <GrowthCard label="Ce mois" value={stats.users.newThisMonth} color="text-purple-400" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-bold">💕 Activité amoureuse</h2>
            </div>
            <div className="space-y-3">
              <ActivityRow icon="❤️" label="Likes totaux" value={stats.activity.totalLikes.toLocaleString()} />
              <ActivityRow icon="💑" label="Matchs totaux" value={stats.activity.totalMatches.toLocaleString()} />
              <ActivityRow icon="💬" label="Messages envoyés" value={stats.activity.totalMessages.toLocaleString()} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold">👥 Répartition par genre</h2>
            </div>
            <div className="space-y-3">
              {stats.gender.map((g) => {
                const total = stats.gender.reduce((sum, x) => sum + x.count, 0);
                const percentage = total > 0 ? (g.count / total) * 100 : 0;
                const labels: Record<string, string> = {
                  male: "👨 Hommes",
                  female: "👩 Femmes",
                  non_binary: "🌈 Non-binaires",
                  other: "✨ Autres",
                };
                return (
                  <div key={g.gender}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{labels[g.gender] || g.gender}</span>
                      <span className="font-bold">{g.count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-purple-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">💰 Revenus (estimation)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Revenus mensuels</p>
              <p className="text-3xl font-bold text-amber-400">{stats.revenue.monthlyRevenue} €</p>
              <p className="text-xs text-slate-500 mt-1">{stats.users.premium} abonnés × 5€</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Revenus annuels estimés</p>
              <p className="text-3xl font-bold text-orange-400">{stats.revenue.yearlyRevenue} €</p>
              <p className="text-xs text-slate-500 mt-1">Projection sur 12 mois</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            💡 Note : Les revenus seront calculés automatiquement une fois Stripe intégré.
          </p>
        </div>

        {(stats.reports.pending > 0 || stats.users.banned > 0) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-bold">🛡️ Modération</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Signalements à traiter</p>
                <p className="text-3xl font-bold text-red-400">{stats.reports.pending}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Utilisateurs bannis</p>
                <p className="text-3xl font-bold text-red-400">{stats.users.banned}</p>
              </div>
            </div>
            <a
              href="/gabriel-boss/signalements"
              className="mt-4 inline-block px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-semibold transition"
            >
              Voir les signalements →
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction href="/gabriel-boss/utilisateurs" icon={<Users />} label="Utilisateurs" />
          <QuickAction 
            href="/gabriel-boss/signalements" 
            icon={<Flag />} 
            label="Signalements"
            badge={stats.reports.pending > 0 ? stats.reports.pending : undefined}
            alert
          />
          <QuickAction 
            href="/gabriel-boss/verifications" 
            icon={<ShieldCheck />} 
            label="Vérifications"
            badge={pendingVerifications > 0 ? pendingVerifications : undefined}
            highlight
          />
          <QuickAction href="/gabriel-boss/abonnes" icon={<Crown />} label="Abonnés Premium" />
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          🔄 Actualisation automatique toutes les 60 secondes
        </p>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color, trend, alert }: {
  icon: React.ReactNode; label: string; value: number; color: string; trend?: string; alert?: boolean;
}) {
  return (
    <div className={`bg-slate-900 border ${alert ? "border-red-500/50" : "border-slate-800"} rounded-2xl p-5`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
      {trend && <p className={`text-xs mt-1 ${alert ? "text-red-400" : "text-slate-500"}`}>{trend}</p>}
    </div>
  );
}

function GrowthCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-4 bg-slate-800/50 rounded-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>+{value}</p>
      <p className="text-xs text-slate-500 mt-1">nouveaux</p>
    </div>
  );
}

function ActivityRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
      <span className="flex items-center gap-2 text-sm text-slate-300">
        <span className="text-xl">{icon}</span>
        {label}
      </span>
      <span className="font-bold text-lg">{value}</span>
    </div>
  );
}

function QuickAction({ href, icon, label, badge, alert, highlight }: {
  href: string; icon: React.ReactNode; label: string; badge?: number; alert?: boolean; highlight?: boolean;
}) {
  return (
    <a
      href={href}
      className={`relative bg-slate-900 border rounded-2xl p-5 transition group ${
        highlight ? "border-blue-500/50 hover:border-blue-500" : alert ? "border-red-500/50 hover:border-red-500" : "border-slate-800 hover:border-purple-500/50"
      }`}
    >
      {badge !== undefined && badge > 0 && (
        <div className={`absolute -top-2 -right-2 min-w-[24px] h-6 ${alert ? "bg-red-500" : highlight ? "bg-blue-500" : "bg-purple-500"} text-white text-xs font-bold rounded-full flex items-center justify-center px-2 shadow-lg animate-pulse`}>
          {badge > 9 ? "9+" : badge}
        </div>
      )}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition ${
        highlight ? "bg-blue-500/10 text-blue-400" : alert ? "bg-red-500/10 text-red-400" : "bg-purple-500/10 text-purple-400"
      }`}>
        {icon}
      </div>
      <p className="font-semibold text-sm">{label}</p>
    </a>
  );
}
