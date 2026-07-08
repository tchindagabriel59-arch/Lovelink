"use client";

import { useEffect, useState } from "react";
import {
  Flag,
  ArrowLeft,
  AlertTriangle,
  Ban,
  Check,
  X,
  Eye,
  User,
  Calendar,
  MessageSquare,
  Shield,
  Trash2,
} from "lucide-react";

interface Report {
  id: number;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  reporter: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl: string;
  };
  reported: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl: string;
    isBanned: boolean;
  };
}

const reasonLabels: Record<string, string> = {
  fake_profile: "🎭 Faux profil",
  inappropriate_content: "🔞 Contenu inapproprié",
  harassment: "😡 Harcèlement",
  spam: "📢 Spam",
  minor: "⚠️ Mineur",
  scam: "💰 Arnaque",
  other: "❓ Autre",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "⏳ En attente", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  reviewed: { label: "👁️ Examiné", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  resolved: { label: "✅ Résolu", color: "bg-green-500/10 text-green-400 border-green-500/30" },
  ignored: { label: "🚫 Ignoré", color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(reportId: number, status: string) {
    try {
      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status }),
      });
      fetchReports();
      setSelectedReport(null);
    } catch {
      alert("Erreur");
    }
  }

  async function deleteReport(reportId: number) {
    if (!confirm("Supprimer ce signalement ?")) return;
    try {
      await fetch(`/api/admin/reports?id=${reportId}`, { method: "DELETE" });
      fetchReports();
      setSelectedReport(null);
    } catch {
      alert("Erreur");
    }
  }

  async function banUser(userId: number, action: "ban" | "unban") {
    const message = action === "ban"
      ? "Bannir cet utilisateur ? Il ne pourra plus se connecter."
      : "Débannir cet utilisateur ?";
    if (!confirm(message)) return;

    try {
      await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      fetchReports();
      alert(action === "ban" ? "✅ Utilisateur banni" : "✅ Utilisateur débanni");
    } catch {
      alert("Erreur");
    }
  }

  const filteredReports = filter === "all"
    ? reports
    : reports.filter((r) => r.status === filter);

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    ignored: reports.filter((r) => r.status === "ignored").length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/gabriel-boss"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Flag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">🚨 Signalements</h1>
                <p className="text-sm text-slate-400">Modération de la communauté</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatMini label="Total" value={stats.total} color="text-white" />
          <StatMini label="⏳ En attente" value={stats.pending} color="text-yellow-400" />
          <StatMini label="✅ Résolus" value={stats.resolved} color="text-green-400" />
          <StatMini label="🚫 Ignorés" value={stats.ignored} color="text-slate-400" />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          <FilterButton current={filter} value="all" onClick={setFilter}>
            Tous
          </FilterButton>
          <FilterButton current={filter} value="pending" onClick={setFilter}>
            ⏳ En attente
          </FilterButton>
          <FilterButton current={filter} value="reviewed" onClick={setFilter}>
            👁️ Examinés
          </FilterButton>
          <FilterButton current={filter} value="resolved" onClick={setFilter}>
            ✅ Résolus
          </FilterButton>
          <FilterButton current={filter} value="ignored" onClick={setFilter}>
            🚫 Ignorés
          </FilterButton>
        </div>

        {/* Liste des signalements */}
        {loading ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-600 animate-pulse mx-auto" />
            <p className="mt-4 text-slate-500">Chargement...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold">Aucun signalement</h3>
            <p className="text-slate-500 mt-2">
              Ta communauté est saine ! 🌟
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onView={() => setSelectedReport(report)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal détails */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full my-8">
            {/* Header modal */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-bold">Signalement #{selectedReport.id}</h2>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Motif */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Motif du signalement</p>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="font-bold text-lg">
                    {reasonLabels[selectedReport.reason] || selectedReport.reason}
                  </p>
                  {selectedReport.details && (
                    <p className="mt-2 text-slate-300 text-sm italic">
                      &quot;{selectedReport.details}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Signalé par */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Signalé par</p>
                <UserBlock user={selectedReport.reporter} />
              </div>

              {/* Utilisateur signalé */}
              <div>
                <p className="text-sm text-slate-400 mb-2">
                  Utilisateur signalé
                  {selectedReport.reported.isBanned && (
                    <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                      🚫 BANNI
                    </span>
                  )}
                </p>
                <UserBlock user={selectedReport.reported} highlight />
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                {new Date(selectedReport.createdAt).toLocaleString("fr-FR")}
              </div>

              {/* Actions */}
              <div className="border-t border-slate-800 pt-6">
                <p className="text-sm font-semibold mb-3">Actions</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReport.reported.isBanned ? (
                    <button
                      onClick={() => banUser(selectedReport.reported.id, "unban")}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition"
                    >
                      <Check className="w-4 h-4" />
                      Débannir
                    </button>
                  ) : (
                    <button
                      onClick={() => banUser(selectedReport.reported.id, "ban")}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition"
                    >
                      <Ban className="w-4 h-4" />
                      Bannir l'utilisateur
                    </button>
                  )}

                  <button
                    onClick={() => updateStatus(selectedReport.id, "resolved")}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition"
                  >
                    <Check className="w-4 h-4" />
                    Marquer résolu
                  </button>

                  <button
                    onClick={() => updateStatus(selectedReport.id, "ignored")}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition"
                  >
                    <X className="w-4 h-4" />
                    Ignorer
                  </button>

                  <button
                    onClick={() => deleteReport(selectedReport.id)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-red-900 rounded-xl font-semibold transition"
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
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function FilterButton({
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

function ReportCard({ report, onView }: { report: Report; onView: () => void }) {
  const status = statusLabels[report.status] || statusLabels.pending;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-purple-500/50 transition">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
              {status.label}
            </span>
            <span className="text-sm font-medium text-red-400">
              {reasonLabels[report.reason] || report.reason}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">De :</span>
              <span className="font-medium">
                {report.reporter.firstName} {report.reporter.lastName}
              </span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Contre :</span>
              <span className="font-medium text-red-300">
                {report.reported.firstName} {report.reported.lastName}
              </span>
              {report.reported.isBanned && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  BANNI
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            {new Date(report.createdAt).toLocaleString("fr-FR")}
          </p>
        </div>

        <button
          onClick={onView}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition whitespace-nowrap"
        >
          <Eye className="w-4 h-4" />
          Voir
        </button>
      </div>
    </div>
  );
}

function UserBlock({
  user,
  highlight,
}: {
  user: { firstName: string; lastName: string; email: string; photoUrl: string };
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${
      highlight ? "bg-red-500/5 border-red-500/30" : "bg-slate-800/50 border-slate-700"
    }`}>
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={user.firstName}
          className="w-14 h-14 rounded-xl object-cover"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold">{user.firstName} {user.lastName}</p>
        <p className="text-sm text-slate-400 truncate">{user.email}</p>
      </div>
    </div>
  );
}
