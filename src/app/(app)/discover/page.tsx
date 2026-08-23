"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
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
  CheckCircle2,
  Zap,
  Eye,
  Users,
  Settings,
  BookOpen,
  RefreshCw,
  Globe,
  Rocket,
  ArrowRight,
} from "lucide-react";

// ==========================================
// 🚀 ONBOARDING TOUR — flèches collées aux vrais éléments
// ==========================================
function OnboardingTour({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);

  // Positions calibrées pour le mobile LoveLink (barre d'actions + header)
  const steps = [
    {
      id: "welcome",
      title: "Bienvenue sur LoveLink ! 🎉",
      text: "Petit tour rapide pour t’aider à obtenir tes premiers matchs. Ça ne prend que 10 secondes.",
      // Pas de cible : bulle centrée
      target: null as null | {
        top?: string;
        bottom?: string;
        left?: string;
        width: string;
        height: string;
      },
      tooltipSide: "center" as const,
    },
    {
      id: "pass",
      title: "Passer un profil ❌",
      text: "Appuie sur la croix rouge (ou swipe à gauche) si le profil ne t’intéresse pas.",
      // Bouton X — 2e bouton de la barre
      target: {
        bottom: "5.5rem",
        left: "calc(50% - 5.2rem)",
        width: "3.5rem",
        height: "3.5rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "like",
      title: "Liker un profil 💚",
      text: "Appuie sur le cœur vert (ou swipe à droite) pour liker. Si la personne like aussi → Match !",
      // Bouton Like — 4e bouton
      target: {
        bottom: "5.5rem",
        left: "calc(50% + 1.7rem)",
        width: "3.5rem",
        height: "3.5rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "superlike",
      title: "Le Super Like ⭐",
      text: "L’étoile bleue te démarque : la personne reçoit une notif immédiate. Utilise-la avec soin !",
      // Bouton Super Like — centre
      target: {
        bottom: "5.7rem",
        left: "calc(50% - 1.5rem)",
        width: "3rem",
        height: "3rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "message",
      title: "Message Direct 💬",
      text: "La bulle violette envoie un message avant même le match. Réservé Premium.",
      // Bouton Message
      target: {
        bottom: "5.7rem",
        left: "calc(50% + 5.1rem)",
        width: "2.75rem",
        height: "2.75rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "boost",
      title: "Boost ton profil 🚀",
      text: "La fusée met ton profil en avant pendant 24h, 3j ou 7j. Idéal pour multiplier les vues !",
      // Bouton Boost (fusée)
      target: {
        bottom: "5.7rem",
        left: "calc(50% + 7.9rem)",
        width: "2.75rem",
        height: "2.75rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "profile",
      title: "Voir le profil complet 👆",
      text: "Appuie sur le prénom ou la photo pour voir le bio, les centres d’intérêt et toutes les photos.",
      // Zone prénom / infos en bas de carte
      target: {
        bottom: "9.5rem",
        left: "1rem",
        width: "70%",
        height: "4.5rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "nav",
      title: "Ta barre de navigation 📱",
      text: "Accueil, Découvrir, Likes, Matchs, Messages et Premium : tout est accessible en un tap en bas de l’écran.",
      // Bottom nav globale
      target: {
        bottom: "0",
        left: "0",
        width: "100%",
        height: "4.2rem",
      },
      tooltipSide: "top" as const,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const nextStep = () => {
    if (!isLast) setStep((s) => s + 1);
    else onFinish();
  };

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Fond sombre */}
      <div className="absolute inset-0 bg-black/75" onClick={onFinish} />

      {/* 🔦 SPOTLIGHT collé à l'élément */}
      {current.target && (
        <div
          className="absolute z-[210] rounded-full pointer-events-none transition-all duration-300"
          style={{
            top: current.target.top,
            bottom: current.target.bottom,
            left: current.target.left,
            width: current.target.width,
            height: current.target.height,
            // Halo blanc + trou dans l'overlay
            boxShadow:
              "0 0 0 4px rgba(255,255,255,0.95), 0 0 0 8px rgba(244,63,94,0.45), 0 0 0 9999px rgba(0,0,0,0.75)",
            borderRadius:
              current.id === "nav" || current.id === "profile"
                ? "1rem"
                : "9999px",
          }}
        />
      )}

      {/* 💬 BULLE d'explication */}
      <div
        className={`absolute z-[220] px-4 w-full flex pointer-events-none ${
          current.tooltipSide === "center"
            ? "inset-0 items-center justify-center"
            : current.tooltipSide === "top"
            ? "justify-center"
            : "justify-center"
        }`}
        style={
          current.tooltipSide === "top" && current.target
            ? {
                // Place la bulle juste AU-DESSUS du spotlight
                bottom: `calc(${current.target.bottom || "0px"} + ${
                  current.target.height
                } + 1.25rem)`,
              }
            : undefined
        }
      >
        <div className="pointer-events-auto relative max-w-[320px] w-full bg-white rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
          {/* Flèche vers le bas (pointe vers l'élément en dessous) */}
          {current.tooltipSide === "top" && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-sm" />
          )}

          <div className="relative z-10">
            <h3 className="text-lg font-black text-slate-900 mb-1.5 leading-tight">
              {current.title}
            </h3>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              {current.text}
            </p>

            <div className="flex items-center justify-between gap-3">
              {/* Progress dots */}
              <div className="flex gap-1.5 flex-wrap">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step
                        ? "w-4 bg-gradient-to-r from-rose-500 to-purple-600"
                        : i < step
                        ? "w-1.5 bg-rose-300"
                        : "w-1.5 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={onFinish}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Passer
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-md active:scale-95 transition flex items-center gap-1"
                >
                  {isLast ? "C'est parti !" : "Suivant"}
                  {!isLast && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  const current = steps[step];

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onFinish();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm transition-all duration-300">
      <div className={current.position}>
        <div className={`bg-white rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-300 ${current.bubbleClass}`}>
          
          {/* Flèche directionnelle */}
          {current.arrow === "bottom" && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 rounded-sm" />
          )}
          {current.arrow === "top" && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 rounded-sm" />
          )}

          <div className="relative z-10">
            <h3 className="text-xl font-black text-slate-900 mb-2">{current.title}</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{current.text}</p>
            
            <div className="flex items-center justify-between">
              {/* Points de progression */}
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i === step ? "w-4 bg-rose-500" : "w-2 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onFinish}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Passer
                </button>
                <button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:scale-105 transition flex items-center gap-1"
                >
                  {step === steps.length - 1 ? "C'est parti !" : "Suivant"}
                  {step < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// INTERFACES & HELPERS
// ==========================================

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
  compatibility: number;
  commonInterests: string[];
  isRecycled?: boolean;
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

interface DiscoverStats {
  likesToday: number;
  superLikesToday: number;
  pendingLikes: number;
  likesGivenToday: number;
  maxFreeLikes: number;
  isPremium: boolean;
  recentSuperLikers: {
    id: number;
    firstName: string;
    photoUrl: string | null;
  }[];
}

type FilterType = "all" | "verified" | "online" | "premium" | "new";

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

const filters: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Tous", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { value: "verified", label: "Vérifiés", icon: <BadgeCheck className="w-3.5 h-3.5" /> },
  { value: "online", label: "En ligne", icon: <div className="w-2 h-2 bg-green-500 rounded-full" /> },
  { value: "premium", label: "Premium", icon: <Crown className="w-3.5 h-3.5" /> },
  { value: "new", label: "Nouveaux", icon: <Zap className="w-3.5 h-3.5" /> },
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

function DiscoverSkeleton() {
  return (
    <div className="fixed inset-0 bg-black lg:relative lg:min-h-screen lg:bg-gradient-to-br lg:from-slate-100 lg:to-rose-50 lg:flex lg:items-center lg:justify-center lg:p-4">
      <div className="relative w-full h-full lg:w-[420px] lg:h-[750px] lg:rounded-3xl overflow-hidden bg-slate-800 shadow-2xl animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse fill-rose-400" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PAGE DISCOVER PRINCIPALE
// ==========================================

export default function DiscoverPage() {
  const router = useRouter();
  
  // 🧭 ÉTATS ONBOARDING TOUR
  const [showTour, setShowTour] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canRewind, setCanRewind] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [stats, setStats] = useState<DiscoverStats | null>(null);
  const [expandedSearch, setExpandedSearch] = useState(false);
  const [matchPopup, setMatchPopup] = useState<{
    firstName: string;
    photoUrl: string | null;
  } | null>(null);
  const [animating, setAnimating] = useState<"left" | "right" | "up" | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [superLikeStatus, setSuperLikeStatus] = useState<SuperLikeStatus | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<string>("");

  // 💬 Modale Message Direct
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [directMessageText, setDirectMessageText] = useState("");
  const [sendingDirectMessage, setSendingDirectMessage] = useState(false);

  const [showLikeLimitModal, setShowLikeLimitModal] = useState(false);
  const [showLikesRevealModal, setShowLikesRevealModal] = useState(false);
  const [showSuperLikersModal, setShowSuperLikersModal] = useState(false);

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  // ✅ VÉRIFIER SI L'UTILISATEUR A DÉJÀ VU LE TOUR
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("lovelink_tour_completed");
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem("lovelink_tour_completed", "true");
    setShowTour(false);
  };

  useEffect(() => {
    async function loadAll() {
      try {
        const [profilesRes, superLikeRes, meRes, statsRes] = await Promise.all([
          fetch(`/api/discover?filter=${activeFilter}`),
          fetch("/api/like"),
          fetch("/api/auth/me"),
          fetch("/api/discover-stats"),
        ]);

        if (profilesRes.ok) {
          const data = await profilesRes.json();
          setProfiles(data.profiles || []);
          setExpandedSearch(data.expandedSearch || false);
        }
        if (superLikeRes.ok) {
          const data = await superLikeRes.json();
          setSuperLikeStatus(data);
        }
        if (meRes.ok) {
          const data = await meRes.json();
          setCurrentUser(data.user);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [activeFilter]);

  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [currentIndex]);

  const handleAction = useCallback(
    async (isLike: boolean) => {
      if (currentIndex >= profiles.length || animating || showTour) return;

      if (
        isLike &&
        stats &&
        !stats.isPremium &&
        stats.likesGivenToday >= stats.maxFreeLikes
      ) {
        setShowLikeLimitModal(true);
        return;
      }

      const profile = profiles[currentIndex];

      setAnimating(isLike ? "right" : "left");
      setCanRewind(true);

      fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: profile.id, isLike }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.isMatch) {
            setMatchPopup({
              firstName: profile.firstName,
              photoUrl: profile.photoUrl,
            });
          }
          if (isLike) {
            fetch("/api/discover-stats")
              .then((r) => r.json())
              .then((newStats) => setStats(newStats))
              .catch(() => {});
          }
        })
        .catch(() => {});

      setTimeout(() => {
        setDragOffset({ x: 0, y: 0 });
        setCurrentIndex((i) => i + 1);
        setTimeout(() => {
          setAnimating(null);
        }, 20);
      }, 350);
    },
    [currentIndex, profiles, animating, stats, showTour]
  );

  const handleSuperLike = useCallback(async () => {
    if (currentIndex >= profiles.length || animating || showTour) return;
    if (superLikeStatus && !superLikeStatus.canSuperLike) {
      setShowLimitModal(true);
      return;
    }

    if (
      stats &&
      !stats.isPremium &&
      stats.likesGivenToday >= stats.maxFreeLikes
    ) {
      setShowLikeLimitModal(true);
      return;
    }

    const profile = profiles[currentIndex];

    setAnimating("up");
    setCanRewind(true);

    fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUserId: profile.id,
        isLike: true,
        isSuperLike: true,
      }),
    })
      .then(async (res) => {
        if (res.status === 403) {
          setShowLimitModal(true);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data?.isMatch) {
          setMatchPopup({
            firstName: profile.firstName,
            photoUrl: profile.photoUrl,
          });
        }
      })
      .catch(() => {});

    setTimeout(() => {
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex((i) => i + 1);
      setTimeout(() => {
        setAnimating(null);
      }, 20);
    }, 350);
  }, [currentIndex, profiles, superLikeStatus, animating, stats, showTour]);

  const handleRewind = useCallback(async () => {
    if (animating || showTour) return;

    if (!currentUser?.isPremium) {
      setPremiumFeature("rewind");
      setShowPremiumModal(true);
      return;
    }

    try {
      const res = await fetch("/api/like/rewind", { method: "POST" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Aucune action à annuler");
        return;
      }

      if (currentIndex > 0) {
        setCurrentIndex((i) => Math.max(0, i - 1));
      }

      setCanRewind(false);
      setDragOffset({ x: 0, y: 0 });
      setAnimating(null);
    } catch {
      alert("Erreur lors du retour en arrière");
    }
  }, [currentIndex, currentUser, animating, showTour]);

  const handleDirectMessage = () => {
    if (showTour) return;
    if (!currentUser?.isPremium) {
      setPremiumFeature("message");
      setShowPremiumModal(true);
      return;
    }
    setShowDirectMessageModal(true);
  };

  const submitDirectMessage = async () => {
    if (!directMessageText.trim() || !currentProfile) return;
    setSendingDirectMessage(true);

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: currentProfile.id,
          isLike: true,
          message: directMessageText,
        }),
      });

      const data = await res.json();
      if (data?.isMatch) {
        setMatchPopup({
          firstName: currentProfile.firstName,
          photoUrl: currentProfile.photoUrl,
        });
      }

      setShowDirectMessageModal(false);
      setDirectMessageText("");
      handleAction(true);
    } catch {
      alert("Erreur lors de l'envoi du message direct");
    } finally {
      setSendingDirectMessage(false);
    }
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
      if (res.ok) setCurrentIndex((i) => i + 1);
    } catch {}
  }

  const currentProfile = profiles[currentIndex];
  const photos = currentProfile ? getAllPhotos(currentProfile) : [];
  const hasPhotos = photos.length > 0;
  const status = currentProfile ? getActivityStatus(currentProfile) : { text: "", color: "" };

  const likesRemaining = stats && !stats.isPremium
    ? Math.max(0, stats.maxFreeLikes - stats.likesGivenToday)
    : null;

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
    if (dragOffset.x !== 0 || dragOffset.y !== 0 || showTour) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) prevPhoto();
    else nextPhoto();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (animating || showTour) return;
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart || animating || showTour) return;
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    if (!dragStart || showTour) return;
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) handleAction(true);
      else handleAction(false);
    } else if (dragOffset.y < -threshold) {
      handleSuperLike();
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
    setDragStart(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (animating || showTour) return;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || animating || showTour) return;
    setDragOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    if (!dragStart || showTour) return;
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
    if (currentProfile && !showTour) {
      router.push(`/discover/${currentProfile.id}`);
    }
  };

  if (loading) return <DiscoverSkeleton />;

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pb-24">
        <div className="max-w-md mx-auto pt-4 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            Tu as tout vu pour aujourd'hui !
          </h2>
          <p className="text-white/70 text-sm mb-6">
            Reviens un peu plus tard pour découvrir de nouveaux profils !
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setLoading(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-full shadow-lg"
          >
            Rafraîchir
          </button>
        </div>
      </div>
    );
  }

  const gradient = gradients[currentProfile.id % gradients.length];
  const rotation = dragOffset.x / 20;

  let cardTransform = "";
  let cardOpacity = 1;

  if (animating === "left") {
    cardTransform = "translateX(-150%) rotate(-30deg)";
    cardOpacity = 0;
  } else if (animating === "right") {
    cardTransform = "translateX(150%) rotate(30deg)";
    cardOpacity = 0;
  } else if (animating === "up") {
    cardTransform = "translateY(-150%)";
    cardOpacity = 0;
  } else {
    cardTransform = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`;
  }

  return (
    <div className="fixed inset-0 bg-black lg:relative lg:min-h-screen lg:bg-gradient-to-br lg:from-slate-100 lg:to-rose-50 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-4">

      {/* 🚀 ONBOARDING TOUR RENDER */}
      {showTour && <OnboardingTour onFinish={completeTour} />}

      {/* 💬 MODALE MESSAGE DIRECT */}
      {showDirectMessageModal && currentProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-purple-500 flex-shrink-0">
                {currentProfile.photoUrl ? (
                  <img src={currentProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-purple-600 flex items-center justify-center font-bold text-xl">
                    {currentProfile.firstName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Message direct à {currentProfile.firstName}</h3>
                <p className="text-xs text-purple-400 font-medium">⚡ Fonctionnalité Premium Exclusivité</p>
              </div>
            </div>

            <textarea
              value={directMessageText}
              onChange={(e) => setDirectMessageText(e.target.value)}
              placeholder={`Écris ton message d'accroche pour ${currentProfile.firstName}...`}
              rows={4}
              className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-4"
              maxLength={250}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDirectMessageModal(false);
                  setDirectMessageText("");
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={submitDirectMessage}
                disabled={!directMessageText.trim() || sendingDirectMessage}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {sendingDirectMessage ? "Envoi..." : "Envoyer 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTRES MODALES PREMIUM / LIMITES */}
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
              <p className="text-slate-600 text-sm">
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
              >
                <Gem className="w-4 h-4" />
                Premium
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FILTRES EN HAUT DE L'ECRAN (Z-INDEX ADAPTÉ POUR LE TOUR) */}
      <div className={`hidden lg:flex gap-2 mb-4 max-w-[420px] w-full overflow-x-auto pb-2 scrollbar-hide relative ${showTour ? "z-[250]" : "z-10"}`}>
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              if (showTour) return;
              setActiveFilter(f.value);
              setCurrentIndex(0);
              setLoading(true);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
              activeFilter === f.value
                ? "bg-white text-slate-900 shadow-lg"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* CARTE PROFIL */}
      <div
        key={currentIndex}
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: cardTransform,
          opacity: cardOpacity,
          transition: dragStart
            ? "none"
            : "transform 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms ease",
        }}
        className="relative w-full h-full lg:w-[420px] lg:h-[750px] lg:rounded-3xl overflow-hidden bg-black shadow-2xl"
      >
        <div onClick={handlePhotoTap} className="absolute inset-0 select-none cursor-pointer">
          {hasPhotos ? (
            <img
              src={photos[currentPhotoIndex]}
              alt={currentProfile.firstName}
              className="absolute inset-0 w-full h-full object-cover z-[1]"
              draggable={false}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-9xl font-bold text-white/80">
                {currentProfile.firstName.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-10" />

        <div className="absolute bottom-28 left-4 right-4 text-white z-20 pointer-events-none">
          <div className="text-left w-full">
            <h2 className="text-4xl font-black flex items-center gap-2">
              {currentProfile.firstName}, {getAge(currentProfile.birthDate)}
            </h2>
            <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {currentProfile.city || "Cameroun"}
            </p>
          </div>
        </div>

        {/* BARRE D'ACTIONS (Z-INDEX ADAPTÉ POUR LE TOUR) */}
        <div className={`absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 px-2 transition-all ${showTour ? "z-[250] pointer-events-none" : "z-30"}`}>
          <button
            onClick={(e) => { e.stopPropagation(); handleRewind(); }}
            className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-amber-500 hover:scale-110 active:scale-95 transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleAction(false); }}
            className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleSuperLike(); }}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-500 hover:scale-110 active:scale-95 transition"
          >
            <Star className="w-6 h-6 fill-blue-500" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleAction(true); }}
            className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-green-500 hover:scale-110 active:scale-95 transition"
          >
            <Heart className="w-8 h-8 fill-green-500" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleDirectMessage(); }}
            className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-purple-500 hover:scale-110 active:scale-95 transition relative"
          >
            <MessageCircle className="w-5 h-5" />
            {!currentUser?.isPremium && (
              <Lock className="w-3 h-3 absolute -top-0.5 -right-0.5 text-white bg-orange-500 rounded-full p-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if(!showTour) router.push("/boost");
            }}
            className="w-11 h-11 bg-gradient-to-tr from-purple-600 to-amber-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition"
          >
            <Rocket className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
