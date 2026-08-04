"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  Search,
  Calendar,
  Mail,
  MapPin,
  X,
  Gem,
  Star,
  AlertTriangle,
  Clock,
  CheckCircle,
  CreditCard,
} from "lucide-react";

interface PremiumUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  gender: string;
  city: string | null;
  country: string | null;
  isPremium: boolean;
  premiumPlan: string | null;
  premiumExpiresAt: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string;
  lastPayment: {
    amount: number;
    currency: string;
    plan: string;
    billingPeriod: string;
    paymentMethod: string | null;
    completedAt: string;
    status: string;
  } | null;
}

interface Stats {
  total: number;
  monthly: number;
  gold: number;
  monthlyRevenue: number;
  totalRevenue: number;
  expiringSoon: number;
}

function getDaysRemaining(expiryDate: string | null): number {
  if (!expiryDate) return 0;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AdminPremiumPage() {
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<PremiumUser | null>(null);

  useEffect(() => {
    fetchPremiumUsers();
  }, []);

  async function fetchPremiumUsers() {
    try {
      const res = await fetch("/api/admin/premium/list");
      if (res.ok) {
        const data = await res.json();
        setPremiumUsers(data.premiumUsers || []);
        setStats(data.stats || null);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function removePremium(userId: number) {
    if (!confirm("Retirer le statut Premium de cet utilisateur ?")) return;

    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "isPremium", value: false }),
      });

      if (res.ok) {
        alert("✅ Premium retiré");
        setSelectedUser(null);
        fetchPremiumUsers();
      } else {
        alert("❌ Erreur");
      }
    } catch {
      alert("Erreur de connexion");
    }
  }

  // Filtres
  const filteredUsers = premiumUsers.filter((u) => {
    // Recherche
    const searchMatch =
      search === "" ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    // Filtre catégorie
    let categoryMatch = true;
    switch (filter) {
      case "premium":
        categoryMatch = u.premiumPlan === "premium";
        break;
      case "gold":
        categoryMatch = u.premiumPlan === "gold";
        break;
      case "expiring":
        const days = getDaysRemaining(u.premiumExpiresAt);
        categoryMatch = days > 0 && days <= 7;
        break;
      case "expired":
        categoryMatch = getDaysRemaining(u.premiumExpiresAt) < 0;
        break;
    }

    return searchMatch && categoryMatch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/gabriel-boss"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">👑 Abonnés Premium</h1>
                <p className="text-sm text-slate-400">
                  {filteredUsers.length} / {premiumUsers.length} membres
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <Crown className="w-12 h-12 text-amber-500 animate-pulse mx-auto" />
            <p className="mt-4 text-slate-400">Chargement des abonnés...</p>
          </div>
        ) : (
          <>
            {/* KPIs Revenus */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-3">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-slate-400">Total Premium</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.monthly} Premium • {stats.gold} Gold
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-slate-400">Revenus 30 derniers jours</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.monthlyRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">FCFA</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-slate-400">Revenus totaux</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">FCFA (tous temps)</p>
                </div>

                <div className={`rounded-2xl p-5 border ${
                  stats.expiringSoon > 0
                    ? "bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30"
                    : "bg-slate-900 border-slate-800"
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    stats.expiringSoon > 0
                      ? "bg-gradient-to-br from-red-500 to-pink-500"
                      : "bg-slate-800"
                  }`}>
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-slate-400">Expirent bientôt</p>
                  <p className="text-3xl font-bold mt-1">{stats.expiringSoon}</p>
                  <p className="text-xs text-slate-500 mt-1">Dans les 7 jours</p>
                </div>
              </div>
            )}

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un abonné..."
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2">
              <FilterBtn current={filter} value="all" onClick={setFilter}>
                Tous
              </FilterBtn>
              <FilterBtn current={filter} value="premium" onClick={setFilter}>
                💎 Premium
              </FilterBtn>
              <FilterBtn current={filter} value="gold" onClick={setFilter}>
                🏆 Gold
              </FilterBtn>
              <FilterBtn current={filter} value="expiring" onClick={setFilter}>
                ⏰ Expirent bientôt
              </FilterBtn>
              <FilterBtn current={filter} value="expired" onClick={setFilter}>
                ❌ Expirés
              </FilterBtn>
            </div>

            {/* Liste */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
                <Crown className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">Aucun abonné Premium trouvé</p>
                <p className="text-sm text-slate-600 mt-2">
                  Les abonnés apparaîtront ici quand ils souscriront au Premium
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredUsers.map((user) => (
                  <PremiumUserRow
                    key={user.id}
                    user={user}
                    onView={() => setSelectedUser(user)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal détails abonné */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full my-8">
            {/* Header modal */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Détails de l&apos;abonné
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info principales */}
              <div className="flex items-start gap-4">
                {selectedUser.photoUrl ? (
                  <img
                    src={selectedUser.photoUrl}
                    alt={selectedUser.firstName}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-500/50"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-3xl">
                    {selectedUser.firstName.charAt(0)}
                    {selectedUser.lastName.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-bold">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    {selectedUser.premiumPlan === "gold" ? (
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full text-xs font-black">
                        🏆 GOLD
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-black">
                        💎 PREMIUM
                      </span>
                    )}
                  </div>
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

              {/* Statut abonnement */}
              {selectedUser.premiumExpiresAt && (
                <div className={`p-4 rounded-xl border ${
                  getDaysRemaining(selectedUser.premiumExpiresAt) < 0
                    ? "bg-red-500/10 border-red-500/30"
                    : getDaysRemaining(selectedUser.premiumExpiresAt) <= 7
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-green-500/10 border-green-500/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Statut de l&apos;abonnement</p>
                      <p className="font-bold flex items-center gap-2">
                        {getDaysRemaining(selectedUser.premiumExpiresAt) < 0 ? (
                          <>
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-red-400">Expiré depuis {Math.abs(getDaysRemaining(selectedUser.premiumExpiresAt))} jours</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400">
                              Actif • {getDaysRemaining(selectedUser.premiumExpiresAt)} jours restants
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Expire le</p>
                      <p className="font-bold">
                        {new Date(selectedUser.premiumExpiresAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dernier paiement */}
              {selectedUser.lastPayment && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Dernier paiement
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Montant</p>
                      <p className="font-bold text-lg text-green-400">
                        {selectedUser.lastPayment.amount.toLocaleString()} {selectedUser.lastPayment.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Formule</p>
                      <p className="font-bold">
                        {selectedUser.lastPayment.plan === "gold" ? "🏆 Gold" : "💎 Premium"}
                        {" • "}
                        {selectedUser.lastPayment.billingPeriod === "yearly" ? "Annuel" : "Mensuel"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Méthode</p>
                      <p className="font-bold">
                        {selectedUser.lastPayment.paymentMethod || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="font-bold">
                        {new Date(selectedUser.lastPayment.completedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date inscription */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Membre depuis
                  </p>
                  <p className="mt-1 font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500">Statut</p>
                  <p className="mt-1 font-medium flex items-center gap-2">
                    {selectedUser.isOnline ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        En ligne
                      </>
                    ) : selectedUser.lastSeen ? (
                      `Vu le ${new Date(selectedUser.lastSeen).toLocaleDateString("fr-FR")}`
                    ) : (
                      "Jamais connecté"
                    )}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="border-t border-slate-800 pt-6">
                <button
                  onClick={() => removePremium(selectedUser.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold transition"
                >
                  <X className="w-4 h-4" />
                  Retirer le statut Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
          ? "bg-amber-500 text-white"
          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function PremiumUserRow({
  user,
  onView,
}: {
  user: PremiumUser;
  onView: () => void;
}) {
  const daysRemaining = getDaysRemaining(user.premiumExpiresAt);
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  return (
    <div
      className={`bg-slate-900 border rounded-xl p-4 hover:border-amber-500/50 transition cursor-pointer ${
        isExpired
          ? "border-red-500/30"
          : isExpiringSoon
          ? "border-amber-500/30"
          : "border-slate-800"
      }`}
      onClick={onView}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.firstName}
              className="w-14 h-14 rounded-xl object-cover border-2 border-amber-500/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </div>
          )}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-3 h-3 text-white fill-white" />
          </div>
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold truncate">
              {user.firstName} {user.lastName}
            </p>
            {user.premiumPlan === "gold" ? (
              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full font-bold">
                🏆 GOLD
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-bold">
                💎 PREMIUM
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 truncate">{user.email}</p>
          {user.city && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {user.city}
            </p>
          )}
        </div>

        {/* Statut expiration */}
        <div className="text-right">
          {isExpired ? (
            <div className="text-red-400">
              <p className="text-xs font-bold">EXPIRÉ</p>
              <p className="text-xs">Il y a {Math.abs(daysRemaining)}j</p>
            </div>
          ) : isExpiringSoon ? (
            <div className="text-amber-400">
              <p className="text-xs font-bold">EXPIRE BIENTÔT</p>
              <p className="text-xs">Dans {daysRemaining}j</p>
            </div>
          ) : (
            <div className="text-green-400">
              <p className="text-xs font-bold">ACTIF</p>
              <p className="text-xs">{daysRemaining}j restants</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
