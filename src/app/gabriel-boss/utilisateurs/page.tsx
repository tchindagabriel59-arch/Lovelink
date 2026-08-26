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
  KeyRound,
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
  if (!birthDate) return 0;
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
      {firstName?.charAt(0) || "U"}
      {lastName?.charAt(0) || ""}
    </div>
  );
}

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

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>("");
  const [ageFilter, setAgeFilter] = useState<AgeRange>("all");
  const [dateFilter, setDateFilter] = useState<DateRange>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

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
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 🔑 REINITIALISER LE MOT DE PASSE DE L'UTILISATEUR
  const handleAdminResetPassword = async (userId: number) => {
    const newPass = prompt("Saisis le nouveau mot de passe temporaire pour cet utilisateur :");
    if (!newPass || newPass.trim().length < 4) return;

    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, newPassword: newPass.trim() }),
      });

      if (res.ok) {
        alert(`✅ Mot de passe changé avec succès ! Communique "${newPass.trim()}" au client sur WhatsApp.`);
      } else {
        alert("❌ Erreur lors du changement de mot de passe.");
      }
    } catch {
      alert("❌ Erreur réseau.");
    }
  };

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
    if (!confirm("⚠️ SUPPRESSION DÉFINITIVE\n\nContinuer ?")) return;

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

  const resetFilters = () => {
    setSearch("");
    setFilter("all");
    setCityFilter("");
    setAgeFilter("all");
    setDateFilter("all");
    setSortBy("recent");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filter !== "all") count++;
    if (cityFilter) count++;
    if (ageFilter !== "all") count++;
    if (dateFilter !== "all") count++;
    if (sortBy !== "recent") count++;
    return count;
  }, [filter, cityFilter, ageFilter, dateFilter, sortBy]);

  // 🔍 RECHERCHE UNIVERSELLE + FILTRAGE
  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => {
      const q = search.toLowerCase().trim();
      const searchMatch =
        q === "" ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        String(u.id) === q;

      if (!searchMatch) return false;

      switch (filter) {
        case "banned": if (!u.isBanned) return false; break;
        case "admin": if (!u.isAdmin) return false; break;
        case "premium": if (!u.isPremium) return false; break;
        case "online": if (!u.isOnline) return false; break;
        case "male": if (u.gender !== "male") return false; break;
        case "female": if (u.gender !== "female") return false; break;
        case "active": if (u.isBanned) return false; break;
      }

      if (cityFilter) {
        if ((u.city || "").toLowerCase().trim() !== cityFilter.toLowerCase()) return false;
      }

      if (ageFilter !== "all") {
        const age = getAge(u.birthDate);
        if (ageFilter === "18-25" && (age < 18 || age > 25)) return false;
        if (ageFilter === "26-35" && (age < 26 || age > 35)) return false;
        if (ageFilter === "36-45" && (age < 36 || age > 45)) return false;
        if (ageFilter === "45+" && age < 45) return false;
      }

      return true;
    });

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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">👥 Utilisateurs</h1>
              <p className="text-sm text-slate-400">
                {filteredUsers.length} / {users.length} membres
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* STATISTIQUES EN HAUT */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniStat label="Total" value={stats.total} color="bg-blue-500/10 text-blue-400" />
          <MiniStat label="✅ Actifs" value={stats.active} color="bg-green-500/10 text-green-400" />
          <MiniStat label="🟢 En ligne" value={stats.online} color="bg-emerald-500/10 text-emerald-400" />
          <MiniStat label="👑 Admins" value={stats.admins} color="bg-purple-500/10 text-purple-400" />
          <MiniStat label="💎 Premium" value={stats.premium} color="bg-amber-500/10 text-amber-400" />
          <MiniStat label="🚫 Bannis" value={stats.banned} color="bg-red-500/10 text-red-400" />
        </div>

        {/* 🔍 BARRE DE RECHERCHE UNIVERSELLE */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par prénom, nom, téléphone ou email (Ex: 651387914)..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:border-rose-500 outline-none transition"
          />
        </div>

        {/* FILTRES RAPIDES (HOMMES & FEMMES INCLUS) */}
        <div className="flex flex-wrap gap-2 items-center">
          <FilterBtn current={filter} value="all" onClick={setFilter}>Tous</FilterBtn>
          <FilterBtn current={filter} value="active" onClick={setFilter}>✅ Actifs</FilterBtn>
          <FilterBtn current={filter} value="online" onClick={setFilter}>🟢 En ligne</FilterBtn>
          <FilterBtn current={filter} value="admin" onClick={setFilter}>👑 Admins</FilterBtn>
          <FilterBtn current={filter} value="premium" onClick={setFilter}>💎 Premium</FilterBtn>
          <FilterBtn current={filter} value="banned" onClick={setFilter}>🚫 Bannis</FilterBtn>
          <FilterBtn current={filter} value="male" onClick={setFilter}>👨 Hommes</FilterBtn>
          <FilterBtn current={filter} value="female" onClick={setFilter}>👩 Femmes</FilterBtn>
        </div>

        {/* LISTE DES UTILISATEURS AVEC STATS VISIBLES */}
        <div className="grid gap-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
              <User className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <UserRow key={user.id} user={user} onView={() => setSelectedUser(user)} />
            ))
          )}
        </div>
      </main>

      {/* MODAL DÉTAILS UTILISATEUR */}
      {selectedUser && !showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Profil utilisateur</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
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
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-bold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    {selectedUser.isAdmin && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold">👑 ADMIN</span>}
                    {selectedUser.isPremium && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">💎 PREMIUM</span>}
                    {selectedUser.isBanned && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">🚫 BANNI</span>}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{selectedUser.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedUser.gender === "male" ? "👨 Homme" : "👩 Femme"} • {getAge(selectedUser.birthDate)} ans • {selectedUser.city || "Cameroun"}
                  </p>
                </div>
              </div>

              {/* STATS BOBOXES */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <StatBox icon="❤️" label="Likes donnés" value={selectedUser.stats?.likesGiven || 0} />
                <StatBox icon="💖" label="Likes reçus" value={selectedUser.stats?.likesReceived || 0} />
                <StatBox icon="💑" label="Matchs" value={selectedUser.stats?.matches || 0} />
                <StatBox icon="💬" label="Messages" value={selectedUser.stats?.messages || 0} />
              </div>

              {/* ACTIONS ADMIN */}
              <div className="border-t border-slate-800 pt-6">
                <p className="text-sm font-semibold mb-3">⚡ Actions administrateur</p>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* 🔑 RESET PASSWORD WHATSAPP */}
                  <button
                    onClick={() => handleAdminResetPassword(selectedUser.id)}
                    className="col-span-2 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    <KeyRound className="w-5 h-5" />
                    Réinitialiser le mot de passe (WhatsApp Support)
                  </button>

                  <button
                    onClick={() => toggleRole(selectedUser.id, "isBanned", !selectedUser.isBanned)}
                    className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-semibold"
                  >
                    {selectedUser.isBanned ? "Débannir" : "Bannir"}
                  </button>

                  <button
                    onClick={() => toggleRole(selectedUser.id, "isPremium", !selectedUser.isPremium)}
                    className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl font-semibold"
                  >
                    {selectedUser.isPremium ? "Retirer Premium" : "Rendre Premium"}
                  </button>

                  <button
                    onClick={() => deleteUser(selectedUser.id)}
                    className="col-span-2 px-4 py-3 bg-slate-800 hover:bg-red-900 border border-red-500/30 text-red-400 rounded-xl font-semibold"
                  >
                    Supprimer le compte
                  </button>
                </div>
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

function FilterBtn({ current, value, onClick, children }: { current: string; value: string; onClick: (v: string) => void; children: React.ReactNode }) {
  const isActive = current === value;
  return (
    <button onClick={() => onClick(value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isActive ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
      {children}
    </button>
  );
}

// 👑 LIGNE UTILISATEUR COMPLETE AVEC TOUTES LES STATS VISIBLES
function UserRow({ user, onView }: { user: UserItem; onView: () => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-purple-500/50 transition shadow-md">
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
            <p className="font-bold text-base text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            {user.isAdmin && <span className="text-purple-400 text-xs font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">👑 Admin</span>}
            {user.isPremium && <span className="text-amber-400 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">💎 Premium</span>}
            {user.isBanned && <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">🚫 Banni</span>}
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            {user.birthDate && <span>{getAge(user.birthDate)} ans</span>}
            {user.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                {user.city}
              </span>
            )}
          </div>
        </div>

        {/* 📊 STATS EN DIRECT (RESTAURÉES SUR CHAQUE LIGNE) */}
        <div className="hidden lg:flex items-center gap-5 text-xs text-slate-400 px-4 border-l border-r border-slate-800">
          <div className="text-center" title="Likes donnés">
            <p className="text-slate-500 flex items-center justify-center gap-1"><Heart size={12} className="text-rose-500" /> Likes</p>
            <p className="font-bold text-slate-200 text-sm mt-0.5">{user.stats?.likesGiven || 0}</p>
          </div>
          <div className="text-center" title="Matchs">
            <p className="text-slate-500">💑 Matchs</p>
            <p className="font-bold text-slate-200 text-sm mt-0.5">{user.stats?.matches || 0}</p>
          </div>
          <div className="text-center" title="Messages envoyés">
            <p className="text-slate-500 flex items-center justify-center gap-1"><MessageCircle size={12} className="text-purple-400" /> Msgs</p>
            <p className="font-bold text-slate-200 text-sm mt-0.5">{user.stats?.messages || 0}</p>
          </div>
        </div>

        <button
          onClick={onView}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md flex-shrink-0"
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
    <div className="text-center p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div className="text-2xl">{icon}</div>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
