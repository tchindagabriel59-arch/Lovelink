"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Users,
  Search,
  Ban,
  Check,
  Crown,
  Shield,
  Trash2,
  X,
  Heart,
  MessageCircle,
  MapPin,
  Calendar,
  Mail,
  User,
  Eye,
  Clock,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

interface UserItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  city: string;
  country: string;
  photoUrl: string;
  bio: string;
  occupation: string;
  isOnline: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  isPremium: boolean;
  lastSeen: string;
  createdAt: string;
  stats: {
    likesGiven: number;
    likesReceived: number;
    matches: number;
    messages: number;
  };
}

interface City {
  name: string;
  count: number;
}

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function UsersSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-white animate-pulse">
      <header className="p-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-800 rounded-xl" />
          <div>
            <div className="h-6 w-40 bg-slate-800 rounded mb-2" />
            <div className="h-4 w-32 bg-slate-800 rounded" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="h-12 bg-slate-900 border border-slate-800 rounded-xl" />
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

function Avatar({
  photoUrl,
  firstName,
  lastName,
  size = 56,
  className = "",
}: {
  photoUrl: string;
  firstName: string;
  lastName: string;
  size?: number;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={firstName}
        width={size}
        height={size}
        className={`rounded-xl object-cover ${className}`}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className={`rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold ${className}`}
    >
      {firstName.charAt(0)}
      {lastName.charAt(0)}
    </div>
  );
}

// ✅ Type des filtres avancés
type AgeRange = "all" | "18-25" | "26-35" | "36-45" | "45+";
type DateRange = "all" | "today" | "week" | "month" | "3months";
type SortBy = "recent" | "active" | "likes" | "matches";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // ✅ NOUVEAUX FILTRES AVANCÉS
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>("");
  const [ageFilter, setAgeFilter] = useState<AgeRange>("all");
  const [dateFilter, setDateFilter] = useState<DateRange>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  
  // Modal Premium (garde ce qui existait)
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState<"premium" | "gold">("premium");
  const [premiumDuration, setPremiumDuration] = useState<string>("1month");
  const [savingPremium, setSavingPremium] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const [usersRes, citiesRes] = await Promise.all([
        fetch("/api/admin/users/list"),
        fetch("/api/admin/cities"),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (citiesRes.ok) {
        const data = await citiesRes.json();
        setCities(data.cities || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function toggleRole(userId: number, role: string, value: boolean) {
    if (role === "isPremium" && value === true) {
      setShowPremiumModal(true);
      return;
    }

    const labels: Record<string, string> = {
      isAdmin: value ? "rendre admin" : "retirer les droits admin de",
      isPremium: value ? "rendre Premium" : "retirer Premium de",
      isBanned: value ? "bannir" : "débannir",
    };

    if (!confirm(`Voulez-vous vraiment ${labels[role]} cet utilisateur ?`)) return;

    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role, value }),
      });

      if (res.ok) {
        fetchUsers();
        if (selectedUser) {
          setSelectedUser({ ...selectedUser, [role]: value });
        }
      } else {
        const data = await res.json();
        alert("❌ " + (data.error || "Erreur"));
      }
    } catch {
      alert("Erreur de connexion");
    }
  }

  async function confirmPremium() {
    if (!selectedUser) return;
    setSavingPremium(true);

    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: "isPremium",
          value: true,
          premiumPlan,
          premiumDuration,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ ${data.message || "Premium activé !"}`);
        setShowPremiumModal(false);
        setPremiumPlan("premium");
        setPremiumDuration("1month");
        fetchUsers();
        if (selectedUser) {
          setSelectedUser({ ...selectedUser, isPremium: true });
        }
      } else {
        alert("❌ " + (data.error || "Erreur"));
      }
    } catch {
      alert("Erreur de connexion");
    } finally {
      setSavingPremium(false);
    }
  }

  async function deleteUser(userId: number) {
    if (
      !confirm(
        "⚠️ SUPPRESSION DÉFINITIVE\n\nCette action supprimera définitivement :\n- Le compte utilisateur\n- Tous ses likes\n- Tous ses matchs\n- Tous ses messages\n\nContinuer ?"
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/users/delete?id=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ Utilisateur supprimé");
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert("❌ " + (data.error || "Erreur"));
      }
    } catch {
      alert("Erreur");
    }
  }

  function getExpiryDate(): string {
    const now = new Date();
    let expiry = new Date(now);
    switch (premiumDuration) {
      case "1month":
        expiry.setMonth(expiry.getMonth() + 1);
        break;
      case "3months":
        expiry.setMonth(expiry.getMonth() + 3);
        break;
      case "6months":
        expiry.setMonth(expiry.getMonth() + 6);
        break;
      case "1year":
        expiry.setFullYear(expiry.getFullYear() + 1);
        break;
      case "lifetime":
        return "À vie ⭐";
    }
    return expiry.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // ✅ Reset tous les filtres
  const resetFilters = () => {
    setSearch("");
    setFilter("all");
    setCityFilter("");
    setAgeFilter("all");
    setDateFilter("all");
    setSortBy("recent");
  };

  // ✅ Compte les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filter !== "all") count++;
    if (cityFilter) count++;
    if (ageFilter !== "all") count++;
    if (dateFilter !== "all") count++;
    if (sortBy !== "recent") count++;
    return count;
  }, [filter, cityFilter, ageFilter, dateFilter, sortBy]);

  // ✅ Filtrage AVANCÉ avec useMemo
  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => {
      // Recherche texte
      const searchMatch =
        search === "" ||
        u.firstName.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      if (!searchMatch) return false;

      // Filtre catégorie
      switch (filter) {
        case "banned":
          if (!u.isBanned) return false;
          break;
        case "admin":
          if (!u.isAdmin) return false;
          break;
        case "premium":
          if (!u.isPremium) return false;
          break;
        case "online":
          if (!u.isOnline) return false;
          break;
        case "male":
          if (u.gender !== "male") return false;
          break;
        case "female":
          if (u.gender !== "female") return false;
          break;
        case "active":
          if (u.isBanned) return false;
          break;
      }

      // Filtre ville
      if (cityFilter) {
        const userCity = (u.city || "").toLowerCase().trim();
        if (userCity !== cityFilter.toLowerCase()) return false;
      }

      // Filtre âge
      if (ageFilter !== "all") {
        const age = getAge(u.birthDate);
        switch (ageFilter) {
          case "18-25":
            if (age < 18 || age > 25) return false;
            break;
          case "26-35":
            if (age < 26 || age > 35) return false;
            break;
          case "36-45":
            if (age < 36 || age > 45) return false;
            break;
          case "45+":
            if (age < 45) return false;
            break;
        }
      }

      // Filtre date d'inscription
      if (dateFilter !== "all") {
        const now = Date.now();
        const created = new Date(u.createdAt).getTime();
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        switch (dateFilter) {
          case "today":
            if (diffDays > 1) return false;
            break;
          case "week":
            if (diffDays > 7) return false;
            break;
          case "month":
            if (diffDays > 30) return false;
            break;
          case "3months":
            if (diffDays > 90) return false;
            break;
        }
      }

      return true;
    });

    // Tri
    switch (sortBy) {
      case "recent":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "active":
        result.sort((a, b) => {
          const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
          const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case "likes":
        result.sort((a, b) => b.stats.likesReceived - a.stats.likesReceived);
        break;
      case "matches":
        result.sort((a, b) => b.stats.matches - a.stats.matches);
        break;
    }

    return result;
  }, [users, search, filter, cityFilter, ageFilter, dateFilter, sortBy]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => !u.isBanned).length,
    banned: users.filter((u) => u.isBanned).length,
    admins: users.filter((u) => u.isAdmin).length,
    premium: users.filter((u) => u.isPremium).length,
    online: users.filter((u) => u.isOnline).length,
  }), [users]);

  if (loading) return <UsersSkeleton />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="p-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">👥 Utilisateurs</h1>
            <p className="text-sm text-slate-400">
              {filteredUsers.length} / {users.length} membres
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold">
                  {activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""} actif{activeFiltersCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniStat label="Total" value={stats.total} color="bg-blue-500/10 text-blue-400" />
          <MiniStat label="✅ Actifs" value={stats.active} color="bg-green-500/10 text-green-400" />
          <MiniStat label="🟢 En ligne" value={stats.online} color="bg-emerald-500/10 text-emerald-400" />
          <MiniStat label="👑 Admins" value={stats.admins} color="bg-purple-500/10 text-purple-400" />
          <MiniStat label="💎 Premium" value={stats.premium} color="bg-amber-500/10 text-amber-400" />
          <MiniStat label="🚫 Bannis" value={stats.banned} color="bg-red-500/10 text-red-400" />
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom ou email..."
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
          />
        </div>

        {/* Filtres rapides + bouton avancé */}
        <div className="flex flex-wrap gap-2 items-center">
          <FilterBtn current={filter} value="all" onClick={setFilter}>Tous</FilterBtn>
          <FilterBtn current={filter} value="active" onClick={setFilter}>✅ Actifs</FilterBtn>
          <FilterBtn current={filter} value="online" onClick={setFilter}>🟢 En ligne</FilterBtn>
          <FilterBtn current={filter} value="admin" onClick={setFilter}>👑 Admins</FilterBtn>
          <FilterBtn current={filter} value="premium" onClick={setFilter}>💎 Premium</FilterBtn>
          <FilterBtn current={filter} value="banned" onClick={setFilter}>🚫 Bannis</FilterBtn>
          <FilterBtn current={filter} value="male" onClick={setFilter}>👨 Hommes</FilterBtn>
          <FilterBtn current={filter} value="female" onClick={setFilter}>👩 Femmes</FilterBtn>

          {/* Bouton FILTRES AVANCÉS */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              showAdvanced || activeFiltersCount > 1
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres avancés
            {activeFiltersCount > 1 && (
              <span className="px-1.5 py-0.5 bg-white text-purple-600 rounded-full text-xs font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* PANNEAU FILTRES AVANCÉS */}
        {/* ═══════════════════════════════════════ */}
        {showAdvanced && (
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold">Filtres avancés</h3>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Réinitialiser tout
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* VILLE */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Ville
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                >
                  <option value="">Toutes les villes</option>
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* ÂGE */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                  🎂 Tranche d&apos;âge
                </label>
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value as AgeRange)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                >
                  <option value="all">Tous les âges</option>
                  <option value="18-25">18 - 25 ans</option>
                  <option value="26-35">26 - 35 ans</option>
                  <option value="36-45">36 - 45 ans</option>
                  <option value="45+">45 ans et plus</option>
                </select>
              </div>

              {/* DATE INSCRIPTION */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Inscription
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateRange)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                >
                  <option value="all">Depuis toujours</option>
                  <option value="today">Aujourd&apos;hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="3months">3 derniers mois</option>
                </select>
              </div>

              {/* TRI */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                  🔥 Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                >
                  <option value="recent">📅 Plus récent</option>
                  <option value="active">🟢 Plus actif</option>
                  <option value="likes">❤️ Plus de likes reçus</option>
                  <option value="matches">💑 Plus de matchs</option>
                </select>
              </div>
            </div>

            {/* Récap filtres actifs */}
            {activeFiltersCount > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Filtres appliqués :</p>
                <div className="flex flex-wrap gap-2">
                  {filter !== "all" && (
                    <FilterChip label={`Catégorie: ${filter}`} onRemove={() => setFilter("all")} />
                  )}
                  {cityFilter && (
                    <FilterChip label={`Ville: ${cityFilter}`} onRemove={() => setCityFilter("")} />
                  )}
                  {ageFilter !== "all" && (
                    <FilterChip label={`Âge: ${ageFilter}`} onRemove={() => setAgeFilter("all")} />
                  )}
                  {dateFilter !== "all" && (
                    <FilterChip label={`Date: ${dateFilter}`} onRemove={() => setDateFilter("all")} />
                  )}
                  {sortBy !== "recent" && (
                    <FilterChip label={`Tri: ${sortBy}`} onRemove={() => setSortBy("recent")} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Liste utilisateurs */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
            <User className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">Aucun utilisateur trouvé</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onView={() => setSelectedUser(user)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal détails utilisateur */}
      {selectedUser && !showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Profil utilisateur</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <Avatar
                  photoUrl={selectedUser.photoUrl}
                  firstName={selectedUser.firstName}
                  lastName={selectedUser.lastName}
                  size={96}
                  className="rounded-2xl"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-bold">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    {selectedUser.isOnline && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                        🟢 En ligne
                      </span>
                    )}
                    {selectedUser.isAdmin && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                        👑 ADMIN
                      </span>
                    )}
                    {selectedUser.isPremium && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                        💎 PREMIUM
                      </span>
                    )}
                    {selectedUser.isBanned && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                        🚫 BANNI
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 mt-1">
                    {selectedUser.gender === "male" ? "👨" : selectedUser.gender === "female" ? "👩" : "🌈"}
                    {" "}
                    {getAge(selectedUser.birthDate)} ans
                  </p>
                  <div className="flex items-center gap-3 text-sm text-slate-400 mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {selectedUser.email}
                    </span>
                    {selectedUser.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedUser.city}
                        {selectedUser.country && `, ${selectedUser.country}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser.bio && (
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Bio</p>
                  <p className="text-sm">{selectedUser.bio}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-400 mb-3">📊 Activité</p>
                <div className="grid grid-cols-4 gap-3">
                  <StatBox icon="❤️" label="Likes donnés" value={selectedUser.stats.likesGiven} />
                  <StatBox icon="💖" label="Likes reçus" value={selectedUser.stats.likesReceived} />
                  <StatBox icon="💑" label="Matchs" value={selectedUser.stats.matches} />
                  <StatBox icon="💬" label="Messages" value={selectedUser.stats.messages} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Inscrit le
                  </p>
                  <p className="mt-1 font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Dernière activité
                  </p>
                  <p className="mt-1 font-medium">
                    {selectedUser.lastSeen
                      ? new Date(selectedUser.lastSeen).toLocaleDateString("fr-FR")
                      : "Jamais"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <p className="text-sm font-semibold mb-3">⚡ Actions administrateur</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedUser.isBanned ? (
                    <button
                      onClick={() => toggleRole(selectedUser.id, "isBanned", false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition"
                    >
                      <Check className="w-4 h-4" />
                      Débannir
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleRole(selectedUser.id, "isBanned", true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition"
                    >
                      <Ban className="w-4 h-4" />
                      Bannir
                    </button>
                  )}

                  {selectedUser.isAdmin ? (
                    <button
                      onClick={() => toggleRole(selectedUser.id, "isAdmin", false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition"
                    >
                      <Shield className="w-4 h-4" />
                      Retirer admin
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleRole(selectedUser.id, "isAdmin", true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-semibold transition"
                    >
                      <Crown className="w-4 h-4" />
                      Rendre admin
                    </button>
                  )}

                  {selectedUser.isPremium ? (
                    <button
                      onClick={() => toggleRole(selectedUser.id, "isPremium", false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition"
                    >
                      <X className="w-4 h-4" />
                      Retirer Premium
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleRole(selectedUser.id, "isPremium", true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg rounded-xl font-semibold transition"
                    >
                      <Crown className="w-4 h-4" />
                      Rendre Premium
                    </button>
                  )}

                  <button
                    onClick={() => deleteUser(selectedUser.id)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-red-900 border border-red-500/30 rounded-xl font-semibold transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREMIUM */}
      {showPremiumModal && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-2xl w-full my-8 shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Attribuer Premium</h2>
                  <p className="text-sm text-slate-400">
                    à {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPremiumModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-3">
                  1. Choisir la formule
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPremiumPlan("premium")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      premiumPlan === "premium"
                        ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-3xl mb-2">💎</div>
                    <p className="font-bold text-lg">Premium</p>
                    <p className="text-xs text-slate-400 mt-1">2 500 FCFA/mois</p>
                  </button>

                  <button
                    onClick={() => setPremiumPlan("gold")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      premiumPlan === "gold"
                        ? "border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="font-bold text-lg">Gold</p>
                    <p className="text-xs text-slate-400 mt-1">5 000 FCFA/mois</p>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300 mb-3">
                  2. Choisir la durée
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { value: "1month", label: "1 mois" },
                    { value: "3months", label: "3 mois" },
                    { value: "6months", label: "6 mois" },
                    { value: "1year", label: "1 an" },
                    { value: "lifetime", label: "À vie ⭐" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPremiumDuration(option.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        premiumDuration === option.value
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <p className="font-bold text-sm">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Récapitulatif</p>
                    <p className="font-bold text-amber-400 mt-1">
                      {premiumPlan === "gold" ? "🏆 Gold" : "💎 Premium"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      Expire le
                    </p>
                    <p className="font-bold text-amber-400 mt-1">
                      {getExpiryDate()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPremiumModal(false)}
                  disabled={savingPremium}
                  className="flex-1 px-4 py-3 border border-slate-700 rounded-xl font-semibold hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmPremium}
                  disabled={savingPremium}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingPremium ? "Activation..." : "Activer Premium"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-3 rounded-xl ${color} border border-current/20`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function FilterBtn({
  current,
  value,
  onClick,
  children,
}: {
  current: string;
  value: string;
  onClick: (v: string) => void;
  children: React.ReactNode;
}) {
  const isActive = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        isActive
          ? "bg-purple-600 text-white"
          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// ✅ Chip pour afficher les filtres actifs
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs font-medium text-purple-300">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-purple-500/30 rounded-full p-0.5 transition"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function UserRow({ user, onView }: { user: UserItem; onView: () => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-purple-500/50 transition">
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <Avatar
            photoUrl={user.photoUrl}
            firstName={user.firstName}
            lastName={user.lastName}
            size={56}
          />
          {user.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold truncate">
              {user.firstName} {user.lastName}
            </p>
            {user.isAdmin && <span className="text-purple-400" title="Admin">👑</span>}
            {user.isPremium && <span className="text-amber-400" title="Premium">💎</span>}
            {user.isBanned && <span className="text-red-400" title="Banni">🚫</span>}
          </div>
          <p className="text-sm text-slate-400 truncate">{user.email}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>{getAge(user.birthDate)} ans</span>
            {user.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.city}
              </span>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1" title="Likes">
            <Heart className="w-4 h-4" />
            {user.stats.likesGiven}
          </span>
          <span className="flex items-center gap-1" title="Matchs">
            💑 {user.stats.matches}
          </span>
          <span className="flex items-center gap-1" title="Messages">
            <MessageCircle className="w-4 h-4" />
            {user.stats.messages}
          </span>
        </div>

        <button
          onClick={onView}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
        >
          <Eye className="w-4 h-4" />
          Voir
        </button>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-slate-800/50 rounded-xl">
      <div className="text-2xl">{icon}</div>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
