"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  Crown,
  ChevronDown,
  ChevronUp,
  Calendar,
  CalendarClock,
  Mail,
} from "lucide-react";

interface Verification {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string | null;
  photo1Url: string | null;
  photo2Url: string | null;
  photo3Url: string | null;
  photo4Url: string | null;
  verificationStatus: "pending" | "approved" | "rejected";
  verificationPhotoUrl: string | null;
  verificationSubmittedAt: string | null;
  verificationReviewedAt: string | null;
  verificationRejectedReason: string | null;
  isVerified: boolean;
  isPremium: boolean;
  createdAt?: string | null;
}

type FilterType = "pending" | "approved" | "rejected" | "all";

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("pending");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const [rejectingUser, setRejectingUser] = useState<Verification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  async function fetchVerifications() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications || []);
        setPendingCount(data.pendingCount || 0);
      } else if (res.status === 403) {
        alert("Accès refusé");
        window.location.href = "/dashboard";
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(
    userId: number,
    action: "approve" | "reject",
    reason?: string
  ) {
    setProcessing(userId);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: userId,
          action,
          reason,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setRejectingUser(null);
        setRejectReason("");
        setExpandedId(null);
        fetchVerifications();
      } else {
        const err = await res.json();
        alert("❌ " + (err.error || "Erreur"));
      }
    } catch {
      alert("❌ Erreur de connexion");
    } finally {
      setProcessing(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold border border-amber-500/30">
            <Clock className="w-2.5 h-2.5" />
            En attente
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold border border-blue-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Approuvé
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold border border-red-500/30">
            <XCircle className="w-2.5 h-2.5" />
            Refusé
          </span>
        );
      default:
        return null;
    }
  }

  function getProfilePhotos(v: Verification): string[] {
    return [v.photoUrl, v.photo1Url, v.photo2Url, v.photo3Url, v.photo4Url].filter(
      (p): p is string => !!p
    );
  }

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function toggleExpand(id: number) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header simplifié (la sidebar gère le reste) */}
      <header className="p-6 border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Vérifications</h1>
            <p className="text-sm text-slate-400">
              {pendingCount > 0 ? (
                <span className="text-amber-400 font-bold">
                  {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente
                </span>
              ) : (
                "Aucune demande en attente"
              )}
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-8 max-w-5xl mx-auto">
        {/* Modal zoom photo */}
        {zoomPhoto && (
          <div
            onClick={() => setZoomPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          >
            <Image
              src={zoomPhoto}
              alt="Zoom"
              width={1200}
              height={1200}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
              unoptimized
            />
          </div>
        )}

        {/* Modal refus */}
        {rejectingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Refuser la demande</h3>
                  <p className="text-sm text-slate-400">
                    {rejectingUser.firstName} {rejectingUser.lastName}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-3">
                Indique la raison du refus (visible par l&apos;utilisateur) :
              </p>

              <div className="space-y-2 mb-4">
                {[
                  "Photo floue ou de mauvaise qualité",
                  "Visage non visible",
                  "Signe de la main absent",
                  "Photo différente du profil",
                  "Photo trouvée sur internet",
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setRejectReason(preset)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition ${
                      rejectReason === preset
                        ? "bg-red-500/20 text-red-300 font-semibold"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ou écris une raison personnalisée..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition text-sm resize-none mb-4 text-white"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRejectingUser(null);
                    setRejectReason("");
                  }}
                  disabled={processing === rejectingUser.id}
                  className="flex-1 px-4 py-3 border border-slate-700 rounded-xl font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() =>
                    handleAction(rejectingUser.id, "reject", rejectReason)
                  }
                  disabled={processing === rejectingUser.id || !rejectReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50"
                >
                  {processing === rejectingUser.id ? "..." : "Refuser"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FILTRES */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterBtn current={filter} value="pending" onClick={setFilter}>
            <Clock className="w-4 h-4" />
            En attente ({pendingCount})
          </FilterBtn>
          <FilterBtn current={filter} value="approved" onClick={setFilter}>
            <CheckCircle2 className="w-4 h-4" />
            Approuvées
          </FilterBtn>
          <FilterBtn current={filter} value="rejected" onClick={setFilter}>
            <XCircle className="w-4 h-4" />
            Refusées
          </FilterBtn>
          <FilterBtn current={filter} value="all" onClick={setFilter}>
            <Users className="w-4 h-4" />
            Toutes
          </FilterBtn>
        </div>

        {/* LISTE */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
          </div>
        ) : verifications.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <ShieldCheck className="w-16 h-16 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">Aucune demande</p>
            <p className="text-sm text-slate-500 mt-1">
              Les nouvelles demandes apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {verifications.map((v) => {
              const isExpanded = expandedId === v.id;
              return (
                <div
                  key={v.id}
                  className={`bg-slate-900 rounded-2xl border overflow-hidden transition-all ${
                    isExpanded ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-slate-800"
                  }`}
                >
                  <button
                    onClick={() => toggleExpand(v.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-800/50 transition text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-white text-base">
                          {v.firstName} {v.lastName}
                        </p>
                        {v.isPremium && (
                          <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        {v.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                        )}
                        {getStatusBadge(v.verificationStatus)}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3 text-blue-400" />
                          <span className="font-medium">Demande :</span>
                          <span className="text-slate-300 font-semibold">
                            {formatDate(v.verificationSubmittedAt)}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-400" />
                          <span className="font-medium">Inscrit :</span>
                          <span className="text-slate-300 font-semibold">
                            {formatDate(v.createdAt)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-800 p-4 animate-fade-in">
                      <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>{v.email}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Selfie de vérification
                          </p>
                          {v.verificationPhotoUrl ? (
                            <div
                              onClick={() => setZoomPhoto(v.verificationPhotoUrl!)}
                              className="relative rounded-xl overflow-hidden cursor-zoom-in group"
                            >
                              <Image
                                src={v.verificationPhotoUrl}
                                alt="Selfie vérification"
                                width={400}
                                height={400}
                                className="w-full aspect-square object-cover group-hover:scale-105 transition"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full">
                                  🔍 Zoomer
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full aspect-square rounded-xl bg-slate-800 flex items-center justify-center">
                              <span className="text-slate-500">Aucune photo</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Photos de profil ({getProfilePhotos(v).length})
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {getProfilePhotos(v).slice(0, 4).map((photo, i) => (
                              <div
                                key={i}
                                onClick={() => setZoomPhoto(photo)}
                                className="relative rounded-lg overflow-hidden cursor-zoom-in group aspect-square"
                              >
                                <Image
                                  src={photo}
                                  alt={`Photo ${i + 1}`}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                  unoptimized
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {v.verificationStatus === "rejected" && v.verificationRejectedReason && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                          <p className="text-xs font-bold text-red-400 mb-1">Raison du refus :</p>
                          <p className="text-sm text-red-300">{v.verificationRejectedReason}</p>
                        </div>
                      )}

                      {v.verificationStatus === "pending" && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setRejectingUser(v)}
                            disabled={processing === v.id}
                            className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <X className="w-5 h-5" />
                            Refuser
                          </button>
                          <button
                            onClick={() => handleAction(v.id, "approve")}
                            disabled={processing === v.id}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {processing === v.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-5 h-5" />
                                Approuver
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterBtn({
  current,
  value,
  onClick,
  children,
}: {
  current: FilterType;
  value: FilterType;
  onClick: (v: FilterType) => void;
  children: React.ReactNode;
}) {
  const isActive = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 ${
        isActive
          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
