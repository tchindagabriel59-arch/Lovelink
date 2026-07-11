"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "../layout";
import {
  Heart,
  Compass,
  MessageCircle,
  Sparkles,
  ArrowRight,
  User,
  MapPin,
  Star,
  TrendingUp,
  Bell,
  Zap,
  Users,
  Trophy,
  Target,
  Camera,
} from "lucide-react";

interface DashboardStats {
  stats: {
    likesGiven: number;
    likesGivenToday: number;
    likesReceived: number;
    likesReceivedThisWeek: number;
    superLikesReceived: number;
    matches: number;
    matchesThisWeek: number;
    messagesSent: number;
    unreadMessages: number;
    unreadNotifs: number;
  };
  completion: number;
  suggestions: Array<{ icon: string; text: string; link: string }>;
  recentNotifs: Array<{
    id: number;
    type: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    fromUser: {
      id: number;
      firstName: string;
      photoUrl: string | null;
    } | null;
  }>;
}

interface MatchData {
  matchId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    isOnline: boolean;
    city: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

const gradients = [
  "from-rose-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
];

export default function DashboardPage() {
  const { user } = useUser();
  const [dashData, setDashData] = useState<DashboardStats | null>(null);
  const [recentMatches, setRecentMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAllData() {
    try {
      const [statsRes, matchesRes] = await Promise.all([
        fetch("/api/dashboard-stats"),
        fetch("/api/matches"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setDashData(data);
      }

      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setRecentMatches(data.matches?.slice(0, 4) || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  }

  function getNotifIcon(type: string) {
    switch (type) {
      case "like":
        return "❤️";
      case "super_like":
        return "⭐";
      case "match":
        return "💕";
      case "message":
        return "💬";
      default:
        return "🔔";
    }
  }

  function getNotifLink(type: string) {
    switch (type) {
      case "like":
      case "super_like":
        return "/likes-recus";
      case "match":
        return "/matches";
      case "message":
        return "/messages";
      default:
        return "/dashboard";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse mx-auto" />
          <p className="mt-4 text-slate-600">Chargement de ton dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashData?.stats;
  const completion = dashData?.completion || 0;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.firstName}
              className="w-16 h-16 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Bonjour, <span className="gradient-text">{user?.firstName}</span> 👋
            </h1>
            <p className="mt-1 text-slate-600">
              Prêt(e) à faire de nouvelles rencontres ?
            </p>
          </div>
        </div>
      </div>

      {/* STATS PRINCIPALES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          value={stats?.likesReceived || 0}
          label="Likes reçus"
          sub={stats?.likesReceivedThisWeek ? `+${stats.likesReceivedThisWeek} cette semaine` : "Cette semaine"}
          gradient="from-rose-500 to-pink-500"
          badge={stats?.superLikesReceived ? `${stats.superLikesReceived} ⭐` : undefined}
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          value={stats?.matches || 0}
          label="Matchs"
          sub={stats?.matchesThisWeek ? `+${stats.matchesThisWeek} cette semaine` : "Total"}
          gradient="from-purple-500 to-violet-500"
        />
        <StatCard
          icon={<MessageCircle className="w-5 h-5" />}
          value={stats?.messagesSent || 0}
          label="Messages envoyés"
          sub={stats?.unreadMessages ? `${stats.unreadMessages} non lu(s)` : "Continue !"}
          gradient="from-emerald-500 to-teal-500"
          alert={(stats?.unreadMessages || 0) > 0}
        />
        <StatCard
          icon={<Heart className="w-5 h-5 fill-current" />}
          value={stats?.likesGiven || 0}
          label="Likes envoyés"
          sub={stats?.likesGivenToday ? `+${stats.likesGivenToday} aujourd'hui` : "Aujourd'hui"}
          gradient="from-blue-500 to-cyan-500"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* COMPLÉTUDE DU PROFIL */}
          {completion < 100 && (
            <div className="bg-gradient-to-br from-rose-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-5 h-5" />
                      <h3 className="text-xl font-bold">Ton profil</h3>
                    </div>
                    <p className="text-white/90 text-sm">
                      {completion < 50
                        ? "Complète-le pour avoir 5x plus de matchs !"
                        : completion < 80
                        ? "Presque fini, continue !"
                        : "Excellent ! Encore un petit effort !"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">{completion}%</p>
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden">
                  <div
                    className="bg-white rounded-full h-3 transition-all duration-1000 shadow-lg"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-bold text-sm hover:shadow-lg transition"
                >
                  Améliorer mon profil
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* SUGGESTIONS D'AMÉLIORATION */}
          {dashData?.suggestions && dashData.suggestions.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Conseils pour toi
              </h3>
              <div className="space-y-2">
                {dashData.suggestions.map((sug, i) => (
                  <Link
                    key={i}
                    href={sug.link}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition group"
                  >
                    <span className="text-2xl">{sug.icon}</span>
                    <p className="flex-1 text-sm text-slate-700 font-medium">{sug.text}</p>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
                  </Link>
                ))}
              </div>
            </div>
          )}

      {/* ACTIONS RAPIDES */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
  <ActionCard
    href="/discover"
    icon={<Compass className="w-6 h-6" />}
    label="Découvrir"
    gradient="from-rose-500 to-pink-500"
  />
  <ActionCard
    href="/likes-recus"
    icon={<Star className="w-6 h-6" />}
    label="Qui m'a liké"
    gradient="from-blue-500 to-cyan-500"
    badge={stats?.likesReceived}
  />
  <ActionCard
    href="/matches"
    icon={<Heart className="w-6 h-6" />}
    label="Mes matchs"
    gradient="from-purple-500 to-violet-500"
    badge={stats?.matches}
  />
  <ActionCard
    href="/messages"
    icon={<MessageCircle className="w-6 h-6" />}
    label="Messages"
    gradient="from-emerald-500 to-teal-500"
    badge={stats?.unreadMessages}
    alert
  />
  <ActionCard
    href="/boost"
    icon={<Zap className="w-6 h-6" />}
    label="Booster 🚀"
    gradient="from-amber-500 to-orange-500"
  />
</div>

          {/* MATCHS RÉCENTS */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                Matchs récents
              </h3>
              <Link
                href="/matches"
                className="text-sm text-rose-500 hover:text-rose-600 font-medium"
              >
                Voir tout →
              </Link>
            </div>

            {recentMatches.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 text-rose-300" />
                </div>
                <p className="text-slate-600 font-medium">Pas encore de matchs</p>
                <p className="text-sm text-slate-400 mt-1 mb-4">
                  Commence à découvrir des profils !
                </p>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium text-sm"
                >
                  <Compass className="w-4 h-4" />
                  Découvrir
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {recentMatches.map((match) => {
                  const gradient = gradients[match.user.id % gradients.length];
                  return (
                    <Link
                      key={match.matchId}
                      href={`/messages?match=${match.matchId}`}
                      className="group relative overflow-hidden rounded-xl aspect-square"
                    >
                      {match.user.photoUrl ? (
                        <img
                          src={match.user.photoUrl}
                          alt={match.user.firstName}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-4xl font-bold`}>
                          {match.user.firstName?.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <p className="font-bold text-sm truncate">{match.user.firstName}</p>
                        {match.user.city && (
                          <p className="text-xs text-white/90 truncate">📍 {match.user.city}</p>
                        )}
                      </div>
                      {match.user.isOnline && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                      {match.unreadCount > 0 && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce">
                          {match.unreadCount > 9 ? "9+" : match.unreadCount}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE (1/3) */}
        <div className="space-y-6">
          {/* NOTIFICATIONS RÉCENTES */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-500" />
                Notifications
              </h3>
              {(stats?.unreadNotifs || 0) > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full font-bold">
                  {stats?.unreadNotifs}
                </span>
              )}
            </div>

            {dashData?.recentNotifs && dashData.recentNotifs.length > 0 ? (
              <div className="space-y-2">
                {dashData.recentNotifs.map((notif) => (
                  <Link
                    key={notif.id}
                    href={getNotifLink(notif.type)}
                    className={`flex items-start gap-3 p-3 rounded-xl transition ${
                      !notif.isRead
                        ? "bg-rose-50 hover:bg-rose-100"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {notif.fromUser?.photoUrl ? (
                      <img
                        src={notif.fromUser.photoUrl}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {notif.fromUser?.firstName?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="text-base mr-1">{getNotifIcon(notif.type)}</span>
                        <strong>{notif.fromUser?.firstName || "Quelqu'un"}</strong>{" "}
                        {notif.content}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Bell className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Aucune notification</p>
              </div>
            )}
          </div>

          {/* PROGRESSION SEMAINE */}
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold">Ta semaine</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">💕 Nouveaux matchs</span>
                  <span className="font-bold text-emerald-400 text-lg">
                    +{stats?.matchesThisWeek || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">❤️ Likes reçus</span>
                  <span className="font-bold text-rose-400 text-lg">
                    +{stats?.likesReceivedThisWeek || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">⭐ Super likes</span>
                  <span className="font-bold text-blue-400 text-lg">
                    {stats?.superLikesReceived || 0}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link
                  href="/discover"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 rounded-xl font-bold text-sm hover:shadow-lg transition"
                >
                  <Compass className="w-4 h-4" />
                  Découvrir plus
                </Link>
              </div>
            </div>
          </div>

          {/* MON PROFIL - Aperçu rapide */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Mon profil
            </h3>
            <div className="text-center">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.firstName}
                  className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-md">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </div>
              )}
              <p className="font-bold text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              {user?.city && (
                <p className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {user.city}
                </p>
              )}
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium text-sm transition"
              >
                <Camera className="w-4 h-4" />
                Éditer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
  gradient,
  badge,
  alert,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  sub: string;
  gradient: string;
  badge?: string;
  alert?: boolean;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-md relative overflow-hidden`}>
      {alert && (value > 0) && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {badge && (
          <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      <p className="text-xs text-white/90 mt-1">{label}</p>
      <p className="text-[10px] text-white/70 mt-0.5">{sub}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  label,
  gradient,
  badge,
  alert,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  badge?: number;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all"
    >
      {badge !== undefined && badge > 0 && (
        <div className={`absolute -top-1 -right-1 min-w-[20px] h-5 ${alert ? "bg-rose-500" : "bg-purple-500"} text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg ${alert ? "animate-pulse" : ""}`}>
          {badge > 9 ? "9+" : badge}
        </div>
      )}
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition`}>
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-900">{label}</p>
    </Link>
  );
}
