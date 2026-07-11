"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Search,
  Crown,
  Sparkles,
  Users,
  Trash2,
  MoreVertical,
  Compass,
} from "lucide-react";

interface MatchItem {
  matchId: number;
  matchedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    isOnline: boolean;
    city: string | null;
    isPremium: boolean;
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

type FilterType = "all" | "new" | "online" | "conversations" | "premium";

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function deleteMatch(matchId: number, firstName: string) {
    if (!confirm(`Retirer ${firstName} de tes matchs ?\n\nCette action supprimera aussi toute votre conversation.`)) return;

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
        setOpenMenu(null);
      }
    } catch {
      alert("Erreur");
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
    if (days < 7) return `${days}j`;
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  // Filtres
  const filteredMatches = matches.filter((m) => {
    const searchMatch =
      search === "" ||
      m.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      m.user.lastName.toLowerCase().includes(search.toLowerCase());

    if (!searchMatch) return false;

    switch (filter) {
      case "new":
        return !m.lastMessage;
      case "online":
        return m.user.isOnline;
      case "conversations":
        return m.lastMessage !== null;
      case "premium":
        return m.user.isPremium;
      default:
        return true;
    }
  });

  const stats = {
    total: matches.length,
    new: matches.filter((m) => !m.lastMessage).length,
    online: matches.filter((m) => m.user.isOnline).length,
    conversations: matches.filter((m) => m.lastMessage !== null).length,
    premium: matches.filter((m) => m.user.isPremium).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse mx-auto" />
          <p className="mt-4 text-slate-600">Chargement de tes matchs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Mes <span className="gradient-text">Matchs</span>
            </h1>
            <p className="text-slate-600">
              {stats.total} {stats.total > 1 ? "personnes" : "personne"}{" "}qui t&apos;ont matché 💕
            </p>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.total} icon="💕" color="from-rose-500 to-pink-500" />
          <StatCard label="Nouveaux" value={stats.new} icon="✨" color="from-amber-500 to-orange-500" />
          <StatCard label="En ligne" value={stats.online} icon="🟢" color="from-emerald-500 to-teal-500" />
          <StatCard label="Conversations" value={stats.conversations} icon="💬" color="from-purple-500 to-violet-500" />
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Aucun match pour le moment
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Va découvrir de nouveaux profils et likez ceux qui te plaisent pour créer des matchs !
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
          {/* Barre de recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un match..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2 mb-6">
            <FilterBtn current={filter} value="all" onClick={setFilter} count={stats.total}>
              Tous
            </FilterBtn>
            <FilterBtn current={filter} value="new" onClick={setFilter} count={stats.new}>
              ✨ Nouveaux
            </FilterBtn>
            <FilterBtn current={filter} value="online" onClick={setFilter} count={stats.online}>
              🟢 En ligne
            </FilterBtn>
            <FilterBtn current={filter} value="conversations" onClick={setFilter} count={stats.conversations}>
              💬 Conversations
            </FilterBtn>
            {stats.premium > 0 && (
              <FilterBtn current={filter} value="premium" onClick={setFilter} count={stats.premium}>
                👑 Premium
              </FilterBtn>
            )}
          </div>

          {/* Grille de matchs */}
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun match dans cette catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.matchId}
                  match={match}
                  gradient={gradients[match.user.id % gradients.length]}
                  isMenuOpen={openMenu === match.matchId}
                  onMenuToggle={() =>
                    setOpenMenu(openMenu === match.matchId ? null : match.matchId)
                  }
                  onDelete={() => deleteMatch(match.matchId, match.user.firstName)}
                  timeAgo={timeAgo}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white shadow-md`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium opacity-90">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function FilterBtn({
  current,
  value,
  onClick,
  count,
  children,
}: {
  current: FilterType;
  value: FilterType;
  onClick: (v: FilterType) => void;
  count: number;
  children: React.ReactNode;
}) {
  const isActive = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${
        isActive
          ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg"
          : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
      }`}
    >
      {children}
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        isActive ? "bg-white/20" : "bg-slate-100"
      }`}>
        {count}
      </span>
    </button>
  );
}

function MatchCard({
  match,
  gradient,
  isMenuOpen,
  onMenuToggle,
  onDelete,
  timeAgo,
}: {
  match: MatchItem;
  gradient: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onDelete: () => void;
  timeAgo: (d: string) => string;
}) {
  const isNew = !match.lastMessage;
  const isPremium = match.user.isPremium;

  return (
    <div className={`group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
      isPremium ? "ring-2 ring-yellow-400 shadow-yellow-500/20" : ""
    }`}>
      
      {/* Ruban Premium en haut */}
      {isPremium && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-white text-center py-1 text-[10px] font-black tracking-widest flex items-center justify-center gap-1 shadow-md">
          <Crown className="w-3 h-3 fill-white" />
          PREMIUM
          <Crown className="w-3 h-3 fill-white" />
        </div>
      )}

      {/* Photo grande */}
      <div className={`aspect-[3/4] bg-gradient-to-br ${gradient} relative overflow-hidden ${isPremium ? "mt-5" : ""}`}>
        {match.user.photoUrl ? (
          <img
            src={match.user.photoUrl}
            alt={match.user.firstName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl font-bold text-white/80">
              {match.user.firstName.charAt(0)}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Badge NOUVEAU */}
        {isNew && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
            <Sparkles className="w-3 h-3" />
            NOUVEAU
          </div>
        )}

        {/* Menu 3 points */}
        <button
          onClick={onMenuToggle}
          className="absolute top-3 right-3 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition"
        >
          <MoreVertical className="w-4 h-4 text-slate-700" />
        </button>

        {/* Menu déroulant */}
        {isMenuOpen && (
          <div className="absolute top-11 right-3 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-10 min-w-[140px]">
            <button
              onClick={onDelete}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Retirer le match
            </button>
          </div>
        )}

        {/* Statut en ligne */}
        {match.user.isOnline && (
          <div className="absolute top-14 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-full px-2 py-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-700">EN LIGNE</span>
          </div>
        )}

        {/* Badge messages non lus */}
        {match.unreadCount > 0 && (
          <div className="absolute bottom-24 right-3 w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white animate-bounce">
            {match.unreadCount > 9 ? "9+" : match.unreadCount}
          </div>
        )}

        {/* Info nom + ville */}
        <div className="absolute bottom-3 left-3 right-3 text-white z-[1]">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-lg drop-shadow-lg truncate">
              {match.user.firstName}
            </p>
            {isPremium && (
              <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-md flex-shrink-0" />
            )}
          </div>
          {match.user.city && (
            <p className="text-xs text-white/90 drop-shadow truncate">
              📍 {match.user.city}
            </p>
          )}
        </div>
      </div>

      {/* Actions en bas */}
      <div className="p-3">
        {match.lastMessage ? (
          <p className="text-xs text-slate-500 truncate mb-2">
            {match.lastMessage.content.startsWith("[IMAGE]") ? (
              <span>📸 Photo</span>
            ) : (
              match.lastMessage.content
            )}
            <span className="text-slate-400 ml-1">
              • {timeAgo(match.lastMessage.createdAt)}
            </span>
          </p>
        ) : (
          <p className="text-xs text-rose-500 font-medium mb-2 italic">
            Envoie le premier message ! 💌
          </p>
        )}

        <Link
          href={`/messages?match=${match.matchId}`}
          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition text-white ${
            isPremium 
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-orange-500/30" 
              : "bg-gradient-to-r from-rose-500 to-purple-600 hover:shadow-lg"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {match.lastMessage ? "Continuer" : "Message"}
        </Link>
      </div>
    </div>
  );
}
