"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Heart,
  MessageCircle,
  Flag,
  Crown,
  Ban,
  TrendingUp,
  UserPlus,
  DollarSign,
  Activity,
  Shield,
  BarChart3,
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh toutes les 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 403) {
        setError(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-500 animate-pulse mx-auto" />
          <p className="mt-4 text-slate-400">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

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
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gabriel BOSS 👑</h1>
              <p className="text-sm text-slate-400">Contrôle total de LoveLink</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">EN DIRECT</span>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition"
            >
              Retour au site
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPIs principaux */}
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

        {/* Croissance */}
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

        {/* Activité */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-bold">💕 Activité amoureuse</h2>
            </div>
            <div className="space-y-3">
              <ActivityRow
                icon="❤️"
                label="Likes totaux"
                value={stats.activity.totalLikes.toLocaleString()}
              />
              <ActivityRow
                icon="💑"
                label="Matchs totaux"
                value={stats.activity.totalMatches.toLocaleString()}
              />
              <ActivityRow
                icon="💬"
                label="Messages envoyés"
                value={stats.activity.totalMessages.toLocaleString()}
              />
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

        {/* Revenus */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">💰 Revenus (estimation)</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Revenus mensuels</p>
              <p className="text-3xl font-bold text-amber-400">
                {stats.revenue.monthlyRevenue} €
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.users.premium} abonnés × 5€
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Revenus annuels estimés</p>
              <p className="text-3xl font-bold text-orange-400">
                {stats.revenue.yearlyRevenue} €
              </p>
              <p className="text-xs text-slate-500 mt-1">Projection sur 12 mois</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            💡 Note : Les revenus seront calculés automatiquement une fois Stripe intégré.
          </p>
        </div>

        {/* Alertes modération */}
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

        {/* Actions rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction href="/gabriel-boss/utilisateurs" icon={<Users />} label="Gérer les utilisateurs" />
          <QuickAction href="/gabriel-boss/signalements" icon={<Flag />} label="Signalements" />
          <QuickAction href="/gabriel-boss/abonnes" icon={<Crown />} label="Abonnés Premium" />
          <QuickAction href="/gabriel-boss/parametres" icon={<Shield />} label="Paramètres du site" />
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          🔄 Actualisation automatique toutes les 30 secondes
        </p>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  trend,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  trend?: string;
  alert?: boolean;
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

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 transition group"
    >
      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition">
        {icon}
      </div>
      <p className="font-semibold text-sm">{label}</p>
    </a>
  );
}
