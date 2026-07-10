"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Heart,
  X,
  MapPin,
  Briefcase,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  Crown,
  MessageCircle,
  Star,
  RotateCcw,
  Ban,
} from "lucide-react";

interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  photoUrl: string | null;
  coverPhotoUrl: string | null;
  photo1Url: string | null;
  photo2Url: string | null;
  photo3Url: string | null;
  photo4Url: string | null;
  interests: string | null;
  occupation: string | null;
  isOnline: boolean;
  isPremium: boolean;
  distance: number | null;
  hasLikedMe: boolean;
  hasSuperLikedMe: boolean;
}

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const gradients = [
  "from-rose-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-400 to-pink-500",
];

const reportReasons = [
  { value: "fake_profile", label: "Faux profil" },
  { value: "inappropriate_content", label: "Contenu inapproprié" },
  { value: "harassment", label: "Harcèlement ou insultes" },
  { value: "spam", label: "Spam ou publicité" },
  { value: "minor", label: "Utilisateur mineur (moins de 18 ans)" },
  { value: "scam", label: "Arnaque ou escroquerie" },
  { value: "other", label: "Autre" },
];

function getAllPhotos(profile: Profile): string[] {
  const photos = [
    profile.photoUrl,
    profile.photo1Url,
    profile.photo2Url,
    profile.photo3Url,
    profile.photo4Url,
  ].filter((p): p is string => !!p && p.trim() !== "");
  return photos;
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canRewind, setCanRewind] = useState(false);
  const [matchPopup, setMatchPopup] = useState<{ firstName: string; photoUrl: string | null } | null>(null);
  const [animating, setAnimating] = useState<"left" | "right" | "up" | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    setCurrentPhotoIndex(0);
    setShowFullBio(false);
  }, [currentIndex]);

  async function fetchProfiles() {
    try {
      const res = await fetch("/api/discover");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  const handleAction = useCallback(async (isLike: boolean) => {
    if (currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];
    setAnimating(isLike ? "right" : "left");
    setCanRewind(true);

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: profile.id, isLike }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isMatch) {
          setMatchPopup({
            firstName: profile.firstName,
            photoUrl: profile.photoUrl,
          });
        }
      }
    } catch {
      // silently fail
    }

    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setAnimating(null);
    }, 300);
  }, [currentIndex, profiles]);

  const handleSuperLike = useCallback(async () => {
    if (currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];
    setAnimating("up");
    setCanRewind(true);

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: profile.id,
          isLike: true,
          isSuperLike: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isMatch) {
          setMatchPopup({
            firstName: profile.firstName,
            photoUrl: profile.photoUrl,
          });
        }
      }
    } catch {
      // silently fail
    }

    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setAnimating(null);
    }, 300);
  }, [currentIndex, profiles]);
    const handleRewind = useCallback(async () => {
    if (currentIndex === 0) return;

    try {
      const res = await fetch("/api/like/rewind", {
        method: "POST",
      });

      if (res.ok) {
        // Revenir au profil précédent
        setCurrentIndex((i) => Math.max(0, i - 1));
        setCanRewind(false);
      } else {
        alert("Impossible d'annuler cette action");
      }
    } catch {
      alert("Erreur de connexion");
    }
  }, [currentIndex]);

  async function handleReport() {
    if (!selectedReason) {
      alert("Veuillez sélectionner un motif");
      return;
    }
      async function handleBlock() {
    if (!currentProfile) return;
    if (!confirm(`Bloquer ${currentProfile.firstName} ?\n\nCette personne ne verra plus ton profil et vous ne pourrez plus vous contacter.`)) return;

    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUserId: currentProfile.id }),
      });

      if (res.ok) {
        alert("✅ Utilisateur bloqué");
        setCurrentIndex((i) => i + 1);
      } else {
        const data = await res.json();
        alert("❌ " + (data.error || "Erreur"));
      }
    } catch {
      alert("Erreur de connexion");
    }
  }
    if (!currentProfile) return;

    setSendingReport(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId: currentProfile.id,
          reason: selectedReason,
          details: reportDetails,
        }),
      });

      if (res.ok) {
        alert("✅ Signalement envoyé. Merci de nous aider à protéger la communauté !");
        setShowReportModal(false);
        setSelectedReason("");
        setReportDetails("");
        setCurrentIndex((i) => i + 1);
      } else {
        const data = await res.json();
        alert("❌ " + (data.error || "Erreur lors du signalement"));
      }
    } catch {
      alert("❌ Erreur de connexion");
    } finally {
      setSendingReport(false);
    }
  }

  const currentProfile = profiles[currentIndex];
  const photos = currentProfile ? getAllPhotos(currentProfile) : [];
  const hasPhotos = photos.length > 0;

  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex((i) => i + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex((i) => i - 1);
    }
  };

  const handlePhotoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (x < width / 2) {
      prevPhoto();
    } else {
      nextPhoto();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse mx-auto" />
          <p className="mt-4 text-slate-600">Recherche de profils...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Plus de profils pour le moment
          </h2>
          <p className="text-slate-600 mb-6">
            Revenez plus tard pour découvrir de nouveaux profils !
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setLoading(true);
              fetchProfiles();
            }}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Rafraîchir
          </button>
        </div>
      </div>
    );
  }

  const gradient = gradients[currentProfile.id % gradients.length];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Signaler ce profil</h2>
                <p className="text-sm text-slate-500">{currentProfile.firstName}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Aidez-nous à maintenir une communauté sûre.
            </p>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {reportReasons.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedReason === reason.value
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="accent-red-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{reason.label}</span>
                </label>
              ))}
            </div>

            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Détails supplémentaires (optionnel)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-sm resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedReason("");
                  setReportDetails("");
                }}
                disabled={sendingReport}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                disabled={sendingReport || !selectedReason}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50"
              >
                {sendingReport ? "Envoi..." : "Signaler"}
              </button>
            </div>
          </div>
        </div>
      )}

      {matchPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl mx-4">
            <div className="relative w-32 h-32 mx-auto mb-4">
              {matchPopup.photoUrl ? (
                <img
                  src={matchPopup.photoUrl}
                  alt={matchPopup.firstName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-rose-500"
                />
              ) : (
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-4xl font-bold border-4 border-rose-500`}>
                  {matchPopup.firstName.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-2">
              C&apos;est un match ! 🎉
            </h2>
            <p className="text-slate-600 mb-6">
              Vous et <strong>{matchPopup.firstName}</strong> vous êtes mutuellement likés !
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMatchPopup(null)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Continuer
              </button>
              <button
                onClick={() => {
                  setMatchPopup(null);
                  window.location.href = "/messages";
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Message
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
  <div
  className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
    currentProfile.hasSuperLikedMe
      ? "ring-4 ring-blue-400 ring-offset-2 shadow-blue-500/30"
      : currentProfile.hasLikedMe
      ? "ring-2 ring-rose-400 ring-offset-2"
      : ""
  } ${
    animating === "left"
      ? "opacity-0 -translate-x-20 -rotate-12"
      : animating === "right"
      ? "opacity-0 translate-x-20 rotate-12"
      : animating === "up"
      ? "opacity-0 -translate-y-20"
      : "opacity-100"
  }`}
  style={{ minHeight: "600px" }}
>
          <div
            onClick={handlePhotoTap}
            className={`relative h-[500px] bg-gradient-to-br ${gradient} cursor-pointer select-none`}
          >
              {/* 🆕 BADGE SUPER LIKE REÇU */}
  {currentProfile.hasSuperLikedMe && (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 animate-pulse">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white">
        <Star className="w-4 h-4 fill-white" />
        <span className="text-sm font-bold">T&apos;A SUPER LIKÉ !</span>
        <Star className="w-4 h-4 fill-white" />
      </div>
    </div>
  )}

  {/* 🆕 BADGE LIKE REÇU (normal) */}
  {currentProfile.hasLikedMe && !currentProfile.hasSuperLikedMe && (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border-2 border-white">
        <Heart className="w-4 h-4 fill-white" />
        <span className="text-sm font-bold">T&apos;A LIKÉ !</span>
      </div>
    </div>
  )}
            {hasPhotos ? (
              <img
                src={photos[currentPhotoIndex]}
                alt={currentProfile.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-9xl font-bold text-white/80">
                  {currentProfile.firstName.charAt(0)}
                </span>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

            {photos.length > 1 && (
              <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-all ${
                      i === currentPhotoIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}

          {/* Boutons Signaler + Bloquer */}
<div className="absolute top-7 left-4 flex gap-2 z-10">
  <button
    onClick={(e) => {
      e.stopPropagation();
      setShowReportModal(true);
    }}
    className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-white shadow-md transition"
    title="Signaler ce profil"
  >
    <Flag className="w-4 h-4" />
  </button>
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleBlock();
    }}
    className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-white shadow-md transition"
    title="Bloquer ce profil"
  >
    <Ban className="w-4 h-4" />
  </button>
</div>

            {currentProfile.isPremium && (
              <div className="absolute top-7 right-4 z-10">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full px-3 py-1.5 shadow-lg">
                  <Crown className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="text-xs font-bold text-white">PREMIUM</span>
                </div>
              </div>
            )}

            {currentProfile.isOnline && !currentProfile.isPremium && (
              <div className="absolute top-7 right-4 flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 z-10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-slate-700">En ligne</span>
              </div>
            )}

            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  disabled={currentPhotoIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition disabled:opacity-0 z-10"
                >
                  <ChevronLeft className="w-6 h-6 text-slate-700" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  disabled={currentPhotoIndex === photos.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition disabled:opacity-0 z-10"
                >
                  <ChevronRight className="w-6 h-6 text-slate-700" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-4 right-4 text-white z-10 pointer-events-none">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-3xl font-bold drop-shadow-lg">
                  {currentProfile.firstName}
                </h2>
                <span className="text-2xl font-light drop-shadow-lg">
                  {getAge(currentProfile.birthDate)}
                </span>
              </div>
           {currentProfile.city && (
  <p className="flex items-center gap-1 text-white/95 text-sm mt-1 drop-shadow">
    <MapPin className="w-3.5 h-3.5" />
    {currentProfile.city}
    {currentProfile.country ? `, ${currentProfile.country}` : ""}
    {currentProfile.distance !== null && currentProfile.distance !== undefined && (
      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
        {currentProfile.distance === 0 ? "< 1 km" : `${currentProfile.distance} km`}
      </span>
    )}
  </p>
)}
              {currentProfile.occupation && (
                <p className="flex items-center gap-1 text-white/90 text-sm mt-0.5 drop-shadow">
                  <Briefcase className="w-3.5 h-3.5" />
                  {currentProfile.occupation}
                </p>
              )}
            </div>
          </div>

          <div className="p-5">
            {currentProfile.bio && (
              <div className="mb-4">
                <p className={`text-slate-700 leading-relaxed text-sm ${showFullBio ? "" : "line-clamp-3"}`}>
                  {currentProfile.bio}
                </p>
                {currentProfile.bio.length > 150 && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="text-xs text-rose-500 font-medium mt-1"
                  >
                    {showFullBio ? "Voir moins" : "Voir plus"}
                  </button>
                )}
              </div>
            )}

            {currentProfile.interests && (
              <div className="flex flex-wrap gap-1.5">
                {currentProfile.interests.split(",").slice(0, 6).map((interest, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-medium"
                  >
                    {interest.trim()}
                  </span>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-slate-400 mt-4">
              {currentIndex + 1} / {profiles.length}
              {photos.length > 1 && ` • 📸 ${currentPhotoIndex + 1}/${photos.length}`}
            </p>
          </div>
        </div>

       {/* BOUTONS ACTIONS AVEC REWIND + SUPER LIKE */}
<div className="flex items-center justify-center gap-3 mt-6">
  {/* Bouton REWIND (retour arrière) */}
  <button
    onClick={handleRewind}
    disabled={!canRewind}
    className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-amber-500 hover:shadow-xl hover:scale-110 transition-all duration-200 border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
    title={canRewind ? "Retour arrière" : "Rien à annuler"}
  >
    <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
  </button>

  {/* Bouton Passer */}
  <button
    onClick={() => handleAction(false)}
    className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:shadow-xl hover:scale-110 transition-all duration-200 border border-slate-100"
    title="Passer"
  >
    <X className="w-7 h-7" strokeWidth={2.5} />
  </button>

  {/* Bouton SUPER LIKE ⭐ */}
  <button
    onClick={handleSuperLike}
    className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center text-white hover:shadow-xl hover:scale-110 transition-all duration-200"
    title="Super Like"
  >
    <Star className="w-8 h-8 fill-white" strokeWidth={2} />
  </button>

  {/* Bouton Liker */}
  <button
    onClick={() => handleAction(true)}
    className="w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-lg shadow-rose-500/30 flex items-center justify-center text-white hover:shadow-xl hover:scale-110 transition-all duration-200"
    title="Liker"
  >
    <Heart className="w-7 h-7 fill-white" />
  </button>
</div>

        {photos.length > 1 && (
          <p className="text-center text-xs text-slate-400 mt-4">
            💡 Tap à gauche/droite de la photo pour naviguer
          </p>
        )}
      </div>
    </div>
  );
}
