"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, MapPin, Sparkles, Compass } from "lucide-react";

interface MatchData {
  matchId: number;
  matchedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    isOnline: boolean;
    lastSeen: string | null;
    city: string | null;
  };
  lastMessage: {
    content: string;
    senderId: number;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

const gradients = [
  "from-rose-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-400 to-pink-500",
];

export default function MatchesPage() {
  const [matchesList, setMatchesList] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch("/api/matches");
        if (res.ok) {
          const data = await res.json();
          setMatchesList(data.matches || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Mes <span className="gradient-text">Matchs</span>
        </h1>
        <p className="mt-2 text-slate-600">
          Retrouvez toutes vos connexions ici
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse-heart mx-auto" />
          <p className="mt-4 text-slate-600">Chargement des matchs...</p>
        </div>
      ) : matchesList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-rose-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Pas encore de matchs
          </h2>
          <p className="text-slate-600 max-w-md mx-auto mb-6">
            Commencez à découvrir des profils et likez ceux qui vous plaisent. 
            Quand c&apos;est réciproque, c&apos;est un match !
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            <Compass className="w-5 h-5" />
            Découvrir des profils
          </Link>
        </div>
      ) : (
        <>
          {/* New Matches */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Nouveaux matchs
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {matchesList.slice(0, 6).map((match) => {
                const gradient = gradients[match.user.id % gradients.length];
                return (
                  <Link
                    key={match.matchId}
                    href={`/messages?match=${match.matchId}`}
                    className="flex-shrink-0 text-center group"
                  >
                    <div className="relative">
                      <div
                        className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-bold border-3 border-white shadow-lg group-hover:scale-105 transition`}
                      >
                        {match.user.firstName?.charAt(0)}
                      </div>
                      {match.user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                      {match.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {match.unreadCount}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-700 truncate max-w-[80px]">
                      {match.user.firstName}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Match List */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              Conversations
            </h2>
            {matchesList.map((match) => {
              const gradient = gradients[match.user.id % gradients.length];
              return (
                <Link
                  key={match.matchId}
                  href={`/messages?match=${match.matchId}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:border-rose-100 transition group"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-bold`}
                    >
                      {match.user.firstName?.charAt(0)}
                    </div>
                    {match.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900">
                        {match.user.firstName} {match.user.lastName}
                      </h3>
                      {match.lastMessage && (
                        <span className="text-xs text-slate-400">
                          {timeAgo(match.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {match.user.city && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" />
                        {match.user.city}
                      </p>
                    )}
                    {match.lastMessage ? (
                      <p className="text-sm text-slate-500 truncate">
                        {match.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-rose-400 italic">
                        Envoyez le premier message ! 💬
                      </p>
                    )}
                  </div>

                  {match.unreadCount > 0 && (
                    <span className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {match.unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
