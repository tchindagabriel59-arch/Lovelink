"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  ArrowLeft,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  Crown,
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3 h-3" />
            Approuvé
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
            <XCircle className="w-3 h-3" />
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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
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
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Refuser la demande</h3>
                <p className="text-sm text-slate-500">
                  {rejectingUser.firstName} {rejectingUser.lastName}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-3">
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
                      ? "bg-red-100 text-red-700 font-semibold"
                      : "hover:bg-slate-100 text-slate-700"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-sm resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectingUser(null);
                  setRejectReason("");
                }}
                disabled={processing === rejectingUser.id}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition"
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

      <Link
        href="/gabriel-boss"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-500 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour panneau admin
      </Link>

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Vérifications
            </h1>
            <p className="text-slate-600">
              {pendingCount > 0 ? (
                <span className="text-amber-600 font-bold">
                  {pendingCount} demande{pendingCount > 1 ? "s" : ""} en attente
                </span>
              ) : (
                "Aucune demande en attente"
              )}
            </p>
          </div>
        </div>
      </div>

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
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">Aucune demande</p>
          <p className="text-sm text-slate-400 mt-1">
            Les nouvelles demandes apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden"
            >
              {/* Header user */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {v.photoUrl ? (
                    <Image
                      src={v.photoUrl}
                      alt={v.firstName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                      {v.firstName?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">
                        {v.firstName} {v.lastName}
                      </p>
                      {v.isPremium && (
                        <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      {v.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{v.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(v.verificationStatus)}
                  {v.verificationSubmittedAt && (
                    <span className="text-xs text-slate-400">
                      {new Date(v.verificationSubmittedAt).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>

              {/* Contenu */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Photo de vérification */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Selfie de vérification
                    </p>
                    {v.verificationPhotoUrl ? (
                      <div
                        onClick={() =>
                          setZoomPhoto(v.verificationPhotoUrl!)
                        }
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
                      <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-400">Aucune photo</span>
                      </div>
                    )}
                  </div>

                  {/* Photos de profil */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
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

                {/* Raison du refus */}
                {v.verificationStatus === "rejected" && v.verificationRejectedReason && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs font-bold text-red-700 mb-1">Raison du refus :</p>
                    <p className="text-sm text-red-800">{v.verificationRejectedReason}</p>
                  </div>
                )}

                {/* Actions (seulement pour pending) */}
                {v.verificationStatus === "pending" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRejectingUser(v)}
                      disabled={processing === v.id}
                      className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
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
            </div>
          ))}
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
          : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
