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
  Briefcase,
} from "lucide-react";

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

export default function DashboardPage() {
  const { user } = useUser();
  const [recentMatches, setRecentMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/matches");
        if (res.ok) {
          const data = await res.json();
          setRecentMatches(data.matches?.slice(0, 4) || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const profileCompletion = (() => {
    if (!user) return 0;
    let score = 0;
    if (user.firstName) score += 15;
    if (user.lastName) score += 15;
    if (user.bio) score += 20;
    if (user.city) score += 15;
    if (user.occupation) score += 15;
    if (user.interests) score += 10;
    if (user.photoUrl) score += 10;
    return score;
  })();

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Bonjour, <span className="gradient-text">{user?.firstName}</span> 👋
        </h1>
        <p className="mt-2 text-slate-600">
          Prêt(e) à faire de nouvelles rencontres ?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Profil complet",
            value: `${profileCompletion}%`,
            icon: <User className="w-5 h-5" />,
            color: "from-blue-500 to-cyan-500",
            bg: "bg-blue-50",
          },
          {
            label: "Matchs",
            value: recentMatches.length.toString(),
            icon: <Heart className="w-5 h-5" />,
            color: "from-rose-500 to-pink-500",
            bg: "bg-rose-50",
          },
          {
            label: "Messages",
            value: recentMatches
              .reduce((sum, m) => sum + m.unreadCount, 0)
              .toString(),
            icon: <MessageCircle className="w-5 h-5" />,
            color: "from-purple-500 to-violet-500",
            bg: "bg-purple-50",
          },
          {
            label: "Vues",
            value: "12",
            icon: <Sparkles className="w-5 h-5" />,
            color: "from-amber-500 to-orange-500",
            bg: "bg-amber-50",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition"
          >
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <span className={`text-transparent bg-gradient-to-r ${stat.color} bg-clip-text`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Completion */}
        {profileCompletion < 100 && (
          <div className="lg:col-span-2 bg-gradient-to-r from-rose-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Complétez votre profil</h3>
            <p className="text-rose-100 mb-4">
              Les profils complets reçoivent 5x plus de matchs !
            </p>
            <div className="w-full bg-white/20 rounded-full h-3 mb-4">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-rose-100">
                {profileCompletion}% complété
              </span>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-rose-600 rounded-lg font-semibold text-sm hover:bg-rose-50 transition"
              >
                Compléter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={profileCompletion < 100 ? "" : "lg:col-span-2"}>
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold mb-4">Actions rapides</h3>
            <div className="space-y-3">
              <Link
                href="/discover"
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 transition group"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Découvrir des profils</p>
                  <p className="text-sm text-slate-500">
                    Trouvez des personnes compatibles
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition" />
              </Link>

              <Link
                href="/messages"
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition group"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center text-white">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Mes messages</p>
                  <p className="text-sm text-slate-500">
                    Discutez avec vos matchs
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div className={profileCompletion >= 100 ? "" : "lg:col-span-3"}>
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Matchs récents</h3>
              <Link
                href="/matches"
                className="text-sm text-rose-500 hover:text-rose-600 font-medium"
              >
                Voir tout
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Heart className="w-8 h-8 text-rose-300 animate-pulse mx-auto" />
                <p className="mt-2 text-sm text-slate-500">Chargement...</p>
              </div>
            ) : recentMatches.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Pas encore de matchs</p>
                <p className="text-sm text-slate-400 mt-1">
                  Commencez à découvrir des profils !
                </p>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium text-sm"
                >
                  <Compass className="w-4 h-4" />
                  Découvrir
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <Link
                    key={match.matchId}
                    href={`/messages?match=${match.matchId}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {match.user.firstName?.charAt(0)}
                      </div>
                      {match.user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">
                        {match.user.firstName} {match.user.lastName}
                      </p>
                      {match.user.city && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {match.user.city}
                        </p>
                      )}
                    </div>
                    {match.unreadCount > 0 && (
                      <span className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {match.unreadCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-slate-100">
        <h3 className="text-lg font-bold mb-4">Mon profil</h3>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-bold">
              {user?.firstName} {user?.lastName}
            </h4>
            {user?.occupation && (
              <p className="text-slate-600 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {user.occupation}
              </p>
            )}
            {user?.city && (
              <p className="text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {user.city}
                {user.country ? `, ${user.country}` : ""}
              </p>
            )}
            {user?.bio ? (
              <p className="text-slate-500 text-sm">{user.bio}</p>
            ) : (
              <p className="text-slate-400 text-sm italic">
                Ajoutez une bio pour vous présenter...
              </p>
            )}
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 mt-2 text-rose-500 hover:text-rose-600 font-medium text-sm"
            >
              Modifier mon profil
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
