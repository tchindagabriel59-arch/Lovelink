"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  X,
  MapPin,
  Sparkles,
  Flag,
  Crown,
  MessageCircle,
  Star,
  RotateCcw,
  Ban,
  Gem,
  Lock,
  BadgeCheck,
  ChevronUp,
  AlertTriangle,
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
  lastSeen?: string | null;
  isPremium: boolean;
  isVerified: boolean;
  distance: number | null;
  hasLikedMe: boolean;
  hasSuperLikedMe: boolean;
  prompt1Question: string | null;
  prompt1Answer: string | null;
  prompt2Question: string | null;
  prompt2Answer: string | null;
  prompt3Question: string | null;
  prompt3Answer: string | null;
}

interface SuperLikeStatus {
  isPremium: boolean;
  used: number;
  limit: number;
  remaining: number;
  canSuperLike: boolean;
}

interface CurrentUser {
  isPremium?: boolean;
}

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getActivityStatus(profile: Profile): { text: string; color: string } {
  if (profile.isOnline) {
    return { text: "En ligne", color: "bg-green-500" };
  }
  if (profile.lastSeen) {
    const now = new Date();
    const lastSeen = new Date(profile.lastSeen);
    const diffMin = Math.floor(
      (now.getTime() - lastSeen.getTime()) / (1000 * 60)
    );
    if (diffMin < 60) return { text: "Actif récemment", color: "bg-green-400" };
    if (diffMin < 1440)
      return { text: "Actif aujourd'hui", color: "bg-yellow-400" };
  }
  return { text: "Par activité récente", color: "bg-green-500" };
}

const gradients = [
  "from-rose-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
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
  return [
    profile.photoUrl,
    profile.photo1Url,
    profile.photo2Url,
    profile.photo3Url,
    profile.photo4Url,
  ].filter((p): p is string => !!p && p.trim() !== "");
}

// ✅ SKELETON LOADER - Affiche pendant le chargement
function DiscoverSkeleton() {
  return (
    <div className="fixed inset-0 bg-black lg:relative lg:min-h-screen lg:bg-gradient-to-br lg:from-slate-100 lg:to-rose-50 lg:flex lg:items-center lg:justify-center lg:p-4">
      <div className="relative w-full h-full lg:w-[420px] lg:h-[750px] lg:rounded-3xl overflow-hidden bg-slate-800 shadow-2xl animate-pulse">
        {/* Fond simulé */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />

        {/* Segments photos simulés */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
          <div className="flex-1 h-1 rounded-full bg-white/30" />
          <div className="flex-1 h-1 rounded-full bg-white/10" />
          <div className="flex-1 h-1 rounded-full bg-white/10" />
        </div>

        {/* Gradient bas */}
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black via-black/70 to-transparent z-10" />

        {/* Infos simulées */}
        <div className="absolute bottom-48 lg:bottom-28 left-4 right-4 z-20 space-y-3">
          <div className="h-3 w-24 bg-white/20 rounded-full" />
          <div className="h-10 w-48 bg-white/30 rounded-xl" />
          <div className="h-4 w-32 bg-white/20 rounded-full" />
        </div>

        {/* Boutons simulés */}
        <div className="absolute bottom-24 lg:bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-30 px-4">
          <div className="w-11 h-11 bg-white/20 rounded-full" />
          <div className="w-14 h-14 bg-white/20 rounded-full" />
          <div className="w-12 h-12 bg-white/20 rounded-full" />
          <div className="w-14 h-14 bg-white/20 rounded-full" />
          <div className="w-11 h-11 bg-white/20 rounded-full" />
        </div>

        {/* Texte chargement */}
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="text-center">
            <Heart className="w-12 h-12 text-rose-400 animate-pulse mx-auto fill-rose-400" />
            <p className="mt-3 text-white/60 text-sm font-medium">
              Chargement des profils...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canRewind, setCanRewind] = useState(false);
  const [matchPopup, setMatchPopup] = useState<{
    firstName: string;
    photoUrl: string | null;
  } | null>(null);
  const [animating, setAnimating] = useState<"left" | "right" | "up" | null>(
    null
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [superLikeStatus, setSuperLikeStatus] =
    useState<SuperLikeStatus | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<string>("");

  // Swipe state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // ✅ OPTIMISATION 1 : Un seul fetch groupé au lieu de 3
  useEffect(() => {
    async function loadAll() {
      try {
        // Lancer les 3 fetches EN PARALLÈLE (Promise.all)
        // C'était déjà en parallèle mais maintenant on gère mieux
        const [profilesRes, superLikeRes, meRes] = await Promise.all([
          fetch("/api/discover"),
          fetch("/api/like"),
          fetch("/api/auth/me"),
        ]);

        if (profilesRes.ok) {
          const data = await profilesRes.json();
          setProfiles(data.profiles || []);
        }
        if (superLikeRes.ok) {
          const data = await superLikeRes.json();
          setSuperLikeStatus(data);
        }
        if (meRes.ok) {
          const data = await meRes.json();
          setCurrentUser(data.user);
        }
      } catch {
        // Silencieux
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  // Reset photo index quand on change de profil
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [currentIndex]);

  // ✅ OPTIMISATION 2 : Prefetch du profil suivant
  useEffect(() => {
    if (profiles[currentIndex + 1]) {
      router.prefetch(`/discover/${profiles[currentIndex + 1].id}`);
    }
  }, [currentIndex, profiles, router]);

  // ✅ OPTIMISATION 3 : Preload image du profil suivant
  useEffect(() => {
    const nextProfile = profiles[currentIndex + 1];
    if (nextProfile?.photoUrl) {
      const img = new window.Image();
      img.src = nextProfile.photoUrl;
    }
  }, [currentIndex, profiles]);

  const handleAction = useCallback(
    async (isLike: boolean) => {
      if (currentIndex >= profiles.length || animating) return;
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
      } catch {}

      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setAnimating(null);
        setDragOffset({ x: 0, y: 0 });
      }, 300);
    },
    [currentIndex, profiles, animating]
  );

  const handleSuperLike = useCallback(async () => {
    if (currentIndex >= profiles.length || animating) return;
    if (superLikeStatus && !superLikeStatus.canSuperLike) {
      setShowLimitModal(true);
      return;
    }

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

      if (res.status === 403) {
        setAnimating(null);
        setShowLimitModal(true);
        // Refresh super like status
        fetch("/api/like")
          .then((r) => r.json())
          .then(setSuperLikeStatus)
          .catch(() => {});
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.isMatch) {
          setMatchPopup({
            firstName: profile.firstName,
            photoUrl: profile.photoUrl,
          });
        }
        // Refresh super like status
        fetch("/api/like")
          .then((r) => r.json())
          .then(setSuperLikeStatus)
          .catch(() => {});
      }
    } catch {}

    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setAnimating(null);
    }, 300);
  }, [currentIndex, profiles, superLikeStatus, animating]);

  const handleRewind = useCallback(async () => {
    if (currentIndex === 0) return;

    if (!currentUser?.isPremium) {
      setPremiumFeature("rewind");
      setShowPremiumModal(true);
      return;
    }

    try {
      const res = await fetch("/api/like/rewind", { method: "POST" });
      if (res.ok) {
        setCurrentIndex((i) => Math.max(0, i - 1));
        setCanRewind(false);
      }
    } catch {}
  }, [currentIndex, currentUser]);

  const handleDirectMessage = () => {
    if (!currentUser?.isPremium) {
      setPremiumFeature("message");
      setShowPremiumModal(true);
      return;
    }
    alert("💬 Message direct (à implémenter)");
  };

  async function handleReport() {
    if (!selectedReason || !currentProfile) return;
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
        alert("✅ Signalement envoyé");
        setShowReportModal(false);
        setSelectedReason("");
        setReportDetails("");
        setCurrentIndex((i) => i + 1);
      }
    } catch {
    } finally {
      setSendingReport(false);
    }
  }

  async function handleBlock() {
    if (!currentProfile) return;
    if (!confirm(`Bloquer ${currentProfile.firstName} ?`)) return;

    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUserId: currentProfile.id }),
      });

      if (res.ok) {
        setCurrentIndex((i) => i + 1);
      }
    } catch {}
  }

  const currentProfile = profiles[currentIndex];
  const photos = currentProfile ? getAllPhotos(currentProfile) : [];
  const hasPhotos = photos.length > 0;
  const status = currentProfile
    ? getActivityStatus(currentProfile)
    : { text: "", color: "" };

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
    if (dragOffset.x !== 0 || dragOffset.y !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) prevPhoto();
    else nextPhoto();
  };

  // SWIPE GESTURES
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart) return;
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    if (!dragStart) return;
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        handleAction(true);
      } else {
        handleAction(false);
      }
    } else if (dragOffset.y < -threshold) {
      handleSuperLike();
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    setDragStart(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return;
    setDragOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    if (!dragStart) return;
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) handleAction(true);
      else handleAction(false);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    setDragStart(null);
  };

  const goToProfile = () => {
    if (currentProfile) {
      router.push(`/discover/${currentProfile.id}`);
    }
  };

  // ✅ SKELETON au lieu d'un spinner simple
  if (loading) {
    return <DiscoverSkeleton />;
  }

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Plus de profils pour le moment
          </h2>
          <p className="text-white/70 mb-6">
            Revenez plus tard pour découvrir de nouveaux profils !
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setLoading(true);
              // Reload profils
              fetch("/api/discover")
                .then((r) => r.json())
                .then((data) => setProfiles(data.profiles || []))
                .catch(() => {})
                .finally(() => setLoading(false));
            }}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition"
          >
            Rafraîchir
          </button>
        </div>
      </div>
    );
  }

  const gradient = gradients[currentProfile.id % gradients.length];
  const rotation = dragOffset.x / 20;

  return (
    <div className="fixed inset-0 bg-black lg:relative lg:min-h-screen lg:bg-gradient-to-br lg:from-slate-100 lg:to-rose-50 lg:flex lg:items-center lg:justify-center lg:p-4">
      {/* MODAL PREMIUM REQUIS */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                {premiumFeature === "rewind" ? (
                  <RotateCcw className="w-10 h-10 text-white" />
                ) : (
                  <MessageCircle className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Fonctionnalité Premium 👑
              </h2>
              <p className="text-slate-600">
                {premiumFeature === "rewind"
                  ? "Revenir au profil précédent est réservé aux membres Premium."
                  : "Envoyer un message direct sans matcher est une fonctionnalité Premium."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Fermer
              </button>
              <Link
                href="/premium"
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Gem className="w-4 h-4" />
                Premium
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIMITE SUPER LIKE */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Plus de Super Likes ! ⭐
              </h2>
              <p className="text-slate-600">
                {superLikeStatus?.isPremium ? (
                  <>
                    Tu as utilisé tes{" "}
                    <strong>{superLikeStatus.limit} Super Likes</strong>{" "}
                    aujourd'hui.
                  </>
                ) : (
                  <>Passe Premium pour avoir 5 Super Likes/jour !</>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
              {!superLikeStatus?.isPremium && (
                <Link
                  href="/premium"
                  onClick={() => setShowLimitModal(false)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Gem className="w-4 h-4" />
                  Premium
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIGNALEMENT */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Signaler</h2>
                <p className="text-sm text-slate-500">
                  {currentProfile.firstName}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
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
                  <span className="text-sm font-medium text-slate-700">
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>

            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Détails (optionnel)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                disabled={sendingReport || !selectedReason}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {sendingReport ? "Envoi..." : "Signaler"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATCH POPUP */}
      {matchPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl mx-4">
            <div className="relative w-32 h-32 mx-auto mb-4">
              {matchPopup.photoUrl ? (
                // ✅ Next.js Image dans le match popup
                <Image
                  src={matchPopup.photoUrl}
                  alt={matchPopup.firstName}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full object-cover border-4 border-rose-500"
                />
              ) : (
                <div
                  className={`w-32 h-32 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-4xl font-bold border-4 border-rose-500`}
                >
                  {matchPopup.firstName.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-2">
              C'est un match ! 🎉
            </h2>
            <p className="text-slate-600 mb-6">
              Vous et <strong>{matchPopup.firstName}</strong> vous êtes
              mutuellement likés !
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMatchPopup(null)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700"
              >
                Continuer
              </button>
              <button
                onClick={() => {
                  setMatchPopup(null);
                  window.location.href = "/messages";
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold"
              >
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* CARTE PROFIL PRINCIPALE */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
          transition: dragStart ? "none" : "all 0.3s ease",
        }}
        className={`relative w-full h-full lg:w-[420px] lg:h-[750px] lg:rounded-3xl overflow-hidden bg-black shadow-2xl ${
          animating === "left"
            ? "-translate-x-full -rotate-12 opacity-0"
            : animating === "right"
            ? "translate-x-full rotate-12 opacity-0"
            : animating === "up"
            ? "-translate-y-full opacity-0"
            : ""
        }`}
      >
        {/* PHOTO PLEIN ÉCRAN */}
        <div
          onClick={handlePhotoTap}
          className="absolute inset-0 select-none cursor-pointer"
        >
          {hasPhotos ? (
            // ✅ OPTIMISATION CLÉE : Next.js Image au lieu de <img>
            <Image
              src={photos[currentPhotoIndex]}
              alt={currentProfile.firstName}
              fill
              className="object-cover"
              draggable={false}
              priority={currentPhotoIndex === 0}
              sizes="(max-width: 768px) 100vw, 420px"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <span className="text-9xl font-bold text-white/80">
                {currentProfile.firstName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* SEGMENTS PHOTOS EN HAUT */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-20 pointer-events-none">
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

        {/* BOUTONS FLAG + BAN */}
        <div className="absolute top-7 left-3 flex flex-col gap-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReportModal(true);
            }}
            className="w-9 h-9 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-red-400 transition"
          >
            <Flag className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBlock();
            }}
            className="w-9 h-9 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-red-400 transition"
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>

        {/* BADGE PREMIUM */}
        {currentProfile.isPremium && (
          <div className="absolute top-7 right-3 z-20">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-3 py-1.5 shadow-lg">
              <Crown className="w-3.5 h-3.5 text-white fill-white" />
              <span className="text-[10px] font-black text-white tracking-widest">
                PREMIUM
              </span>
            </div>
          </div>
        )}

        {/* BADGES LIKÉ / SUPER LIKÉ */}
        {currentProfile.hasSuperLikedMe && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 animate-pulse">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white">
              <Star className="w-4 h-4 fill-white" />
              <span className="text-sm font-bold">T'A SUPER LIKÉ !</span>
            </div>
          </div>
        )}
        {currentProfile.hasLikedMe && !currentProfile.hasSuperLikedMe && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border-2 border-white">
              <Heart className="w-4 h-4 fill-white" />
              <span className="text-sm font-bold">T'A LIKÉ !</span>
            </div>
          </div>
        )}

        {/* INDICATEURS SWIPE */}
        {dragOffset.x > 50 && (
          <div className="absolute top-1/3 left-8 z-30 rotate-[-20deg] pointer-events-none">
            <div className="border-4 border-green-500 text-green-500 px-6 py-2 rounded-2xl text-4xl font-black">
              LIKE
            </div>
          </div>
        )}
        {dragOffset.x < -50 && (
          <div className="absolute top-1/3 right-8 z-30 rotate-[20deg] pointer-events-none">
            <div className="border-4 border-red-500 text-red-500 px-6 py-2 rounded-2xl text-4xl font-black">
              NOPE
            </div>
          </div>
        )}
        {dragOffset.y < -50 && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="border-4 border-blue-500 text-blue-500 px-6 py-2 rounded-2xl text-4xl font-black">
              SUPER
            </div>
          </div>
        )}

        {/* GRADIENT DU BAS */}
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-10" />

        {/* INFOS UTILISATEUR */}
        <div className="absolute bottom-48 lg:bottom-28 left-4 right-4 text-white z-20">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${status.color} animate-pulse`}
            />
            <span className="text-sm font-medium text-white/90">
              {status.text}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToProfile();
            }}
            className="text-left hover:opacity-90 transition"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-4xl font-black drop-shadow-2xl flex items-center gap-2">
                {currentProfile.firstName}
                {currentProfile.isVerified && (
                  <BadgeCheck className="w-7 h-7 text-blue-400 fill-blue-500 drop-shadow-lg" />
                )}
              </h2>
              <span className="text-3xl font-light drop-shadow-2xl">
                {getAge(currentProfile.birthDate)}
              </span>
            </div>

            {currentProfile.distance !== null &&
              currentProfile.distance !== undefined && (
                <p className="flex items-center gap-1 text-white/90 text-sm mt-1 drop-shadow">
                  <MapPin className="w-4 h-4" />à{" "}
                  {currentProfile.distance === 0
                    ? "moins de 1"
                    : currentProfile.distance}{" "}
                  kilomètre{currentProfile.distance > 1 ? "s" : ""}
                </p>
              )}

            <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
              <ChevronUp className="w-3 h-3" />
              <span>Appuie sur le nom pour voir le profil</span>
            </div>
          </button>
        </div>

        {/* 5 BOUTONS D'ACTION EN BAS */}
        <div className="absolute bottom-24 lg:bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-30 px-4">
          {/* REWIND */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRewind();
            }}
            disabled={!canRewind}
            className="relative w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-amber-500 hover:scale-110 active:scale-95 transition disabled:opacity-40"
          >
            <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
            {!currentUser?.isPremium && (
              <Lock className="w-3 h-3 absolute -top-0.5 -right-0.5 text-white bg-orange-500 rounded-full p-0.5" />
            )}
          </button>

          {/* PASS */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(false);
            }}
            className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition"
          >
            <X className="w-8 h-8" strokeWidth={3} />
          </button>

          {/* SUPER LIKE */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSuperLike();
            }}
            className="relative w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-500 hover:scale-110 active:scale-95 transition"
          >
            <Star className="w-6 h-6 fill-blue-500" strokeWidth={2} />
          </button>

          {/* LIKE */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(true);
            }}
            className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-green-500 hover:scale-110 active:scale-95 transition"
          >
            <Heart className="w-8 h-8 fill-green-500" strokeWidth={2} />
          </button>

          {/* MESSAGE DIRECT */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDirectMessage();
            }}
            className="relative w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-purple-500 hover:scale-110 active:scale-95 transition"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
            {!currentUser?.isPremium && (
              <Lock className="w-3 h-3 absolute -top-0.5 -right-0.5 text-white bg-orange-500 rounded-full p-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
