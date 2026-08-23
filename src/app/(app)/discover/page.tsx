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

export default function DiscoverPage() {
  const router = useRouter();
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

  const [showLikeLimitModal, setShowLikeLimitModal] = useState(false);
  const [showLikesRevealModal, setShowLikesRevealModal] = useState(false);
  const [showSuperLikersModal, setShowSuperLikersModal] = useState(false);

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const preloadedImagesRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    for (let i = 1; i <= 3; i++) {
      const next = profiles[currentIndex + i];
      if (next) {
        router.prefetch(`/discover/${next.id}`);
      }
    }
  }, [currentIndex, profiles, router]);

  useEffect(() => {
    const imagesToPreload: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const next = profiles[currentIndex + i];
      if (next?.photoUrl && !preloadedImagesRef.current.has(next.photoUrl)) {
        imagesToPreload.push(next.photoUrl);
      }
    }
    for (let i = 1; i <= 2; i++) {
      const next = profiles[currentIndex + i];
      if (next) {
        [next.photo1Url, next.photo2Url, next.photo3Url, next.photo4Url].forEach((url) => {
          if (url && !preloadedImagesRef.current.has(url)) {
            imagesToPreload.push(url);
          }
        });
      }
    }
    const timeouts: NodeJS.Timeout[] = [];
    imagesToPreload.forEach((url, index) => {
      const timeout = setTimeout(() => {
        const img = new window.Image();
        img.src = url;
        preloadedImagesRef.current.add(url);
      }, index * 80);
      timeouts.push(timeout);
    });
    return () => timeouts.forEach(clearTimeout);
  }, [currentIndex, profiles]);

  const handleAction = useCallback(
    async (isLike: boolean) => {
      if (currentIndex >= profiles.length || animating) return;

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
    [currentIndex, profiles, animating, stats]
  );

  const handleSuperLike = useCallback(async () => {
    if (currentIndex >= profiles.length || animating) return;
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
          fetch("/api/like")
            .then((r) => r.json())
            .then(setSuperLikeStatus)
            .catch(() => {});
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
        fetch("/api/like")
          .then((r) => r.json())
          .then(setSuperLikeStatus)
          .catch(() => {});
        fetch("/api/discover-stats")
          .then((r) => r.json())
          .then((newStats) => setStats(newStats))
          .catch(() => {});
      })
      .catch(() => {});

    setTimeout(() => {
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex((i) => i + 1);
      setTimeout(() => {
        setAnimating(null);
      }, 20);
    }, 350);
  }, [currentIndex, profiles, superLikeStatus, animating, stats]);

  const handleRewind = useCallback(async () => {
    if (animating) return;

    if (!currentUser?.isPremium) {
      setPremiumFeature("rewind");
      setShowPremiumModal(true);
      return;
    }

    if (currentIndex === 0 && !canRewind) {
      alert("Tu n'as aucune action à annuler dans cette session !");
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
  }, [currentIndex, currentUser, canRewind, animating]);

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
    if (dragOffset.x !== 0 || dragOffset.y !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) prevPhoto();
    else nextPhoto();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (animating) return;
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart || animating) return;
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
    if (animating) return;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || animating) return;
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

  if (loading) return <DiscoverSkeleton />;

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pb-24">
        <div className="max-w-md mx-auto pt-4">
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setActiveFilter(f.value);
                    setCurrentIndex(0);
                    setLoading(true);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                    activeFilter === f.value
                      ? "bg-white text-slate-900 shadow-lg"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {activeFilter === "all"
                ? "Tu as tout vu pour aujourd'hui !"
                : `Aucun profil ${filters.find((f) => f.value === activeFilter)?.label.toLowerCase()}`}
            </h2>
            <p className="text-white/70 text-sm">
              {activeFilter === "all"
                ? "Ne t'inquiète pas, voici comment trouver plus de profils :"
                : "Essaie ces options pour découvrir plus de monde :"}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/preferences"
              className="block bg-white/10 backdrop-blur hover:bg-white/20 rounded-2xl p-4 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-bold text-sm mb-0.5">
                    🌍 Élargir mes préférences
                  </h3>
                  <p className="text-white/60 text-xs">
                    Âge, distance, orientation...
                  </p>
                </div>
                <ChevronUp className="w-5 h-5 text-white/40 rotate-90" />
              </div>
            </Link>

            <Link
              href="/parrainage"
              className="block bg-gradient-to-r from-rose-500/20 to-pink-500/20 backdrop-blur hover:from-rose-500/30 hover:to-pink-500/30 border border-rose-400/30 rounded-2xl p-4 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-bold text-sm mb-0.5">
                    🎁 Invite tes amis (+7j Premium)
                  </h3>
                  <p className="text-white/60 text-xs">
                    Fais grandir la communauté !
                  </p>
                </div>
                <ChevronUp className="w-5 h-5 text-white/40 rotate-90" />
              </div>
            </Link>

            <button
              onClick={() => {
                setCurrentIndex(0);
                setLoading(true);
              }}
              className="w-full bg-white/10 backdrop-blur hover:bg-white/20 rounded-2xl p-4 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-bold text-sm mb-0.5">
                    🔄 Rafraîchir
                  </h3>
                  <p className="text-white/60 text-xs">
                    De nouveaux profils peuvent être arrivés
                  </p>
                </div>
                <ChevronUp className="w-5 h-5 text-white/40 rotate-90" />
              </div>
            </button>

            <Link
              href="/guide"
              className="block bg-white/10 backdrop-blur hover:bg-white/20 rounded-2xl p-4 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-bold text-sm mb-0.5">
                    📖 Guide LoveLink
                  </h3>
                  <p className="text-white/60 text-xs">
                    Astuces pour augmenter tes matchs
                  </p>
                </div>
                <ChevronUp className="w-5 h-5 text-white/40 rotate-90" />
              </div>
            </Link>

            {!currentUser?.isPremium && (
              <Link
                href="/premium"
                className="block bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-400/30 rounded-2xl p-4 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-bold text-sm mb-0.5">
                      👑 Passe Premium
                    </h3>
                    <p className="text-white/60 text-xs">
                      Boost + likes illimités + qui t'a liké
                    </p>
                  </div>
                  <ChevronUp className="w-5 h-5 text-white/40 rotate-90" />
                </div>
              </Link>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-xs">
              💡 De nouveaux profils s'inscrivent chaque jour !
              <br />
              Reviens dans quelques heures ⏰
            </p>
          </div>
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
  } else if (dragStart) {
    cardTransform = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`;
  } else {
    cardTransform = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`;
  }

  return (
    <div className="fixed inset-0 bg-black lg:relative lg:min-h-screen lg:bg-gradient-to-br lg:from-slate-100 lg:to-rose-50 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-4">

      {expandedSearch && (
        <div className="fixed top-4 left-4 lg:top-2 lg:left-1/2 lg:-translate-x-1/2 z-40 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full px-3 py-1.5 shadow-2xl">
          <p className="text-white text-xs font-bold flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            Recherche élargie
          </p>
        </div>
      )}

      {likesRemaining !== null && likesRemaining <= 5 && likesRemaining > 0 && (
        <div className="fixed top-4 right-4 lg:top-2 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 z-40 bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-3 py-1.5 shadow-2xl animate-pulse">
          <p className="text-white text-xs font-bold flex items-center gap-1.5">
            <Heart className="w-3 h-3 fill-white" />
            {likesRemaining} like{likesRemaining > 1 ? "s" : ""} restant{likesRemaining > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {stats && stats.pendingLikes > 0 && !currentUser?.isPremium && (
        <button
          onClick={() => setShowLikesRevealModal(true)}
          className="fixed top-16 lg:top-4 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full px-4 py-2 shadow-2xl animate-pulse hover:scale-105 transition"
        >
          <p className="text-white text-xs font-bold flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 fill-white" />
            {stats.pendingLikes} nouveau{stats.pendingLikes > 1 ? "x" : ""} like{stats.pendingLikes > 1 ? "s" : ""} caché{stats.pendingLikes > 1 ? "s" : ""}
            <Lock className="w-3 h-3" />
          </p>
        </button>
      )}

      {stats && stats.recentSuperLikers && stats.recentSuperLikers.length > 0 && !currentUser?.isPremium && (
        <button
          onClick={() => setShowSuperLikersModal(true)}
          className="fixed bottom-40 lg:bottom-20 left-4 z-40 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-3 shadow-2xl hover:scale-105 transition flex items-center gap-2"
        >
          <div className="flex -space-x-2">
            {stats.recentSuperLikers.slice(0, 3).map((sl) => (
              <div key={sl.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                {sl.photoUrl ? (
                  <img
                    src={sl.photoUrl}
                    alt=""
                    className="w-full h-full object-cover blur-sm"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
                )}
              </div>
            ))}
          </div>
          <div className="text-white text-left">
            <p className="text-[10px] font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              SUPER LIKÉ
            </p>
            <p className="text-xs font-black">Voir qui →</p>
          </div>
        </button>
      )}

      <div className="hidden lg:flex gap-2 mb-4 max-w-[420px] w-full overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
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

      {showLikeLimitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
                <Heart className="w-12 h-12 text-white fill-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                Tu as beaucoup de goût ! 💕
              </h2>
              <p className="text-slate-600 mb-4">
                Tu as utilisé tes <strong>{stats?.maxFreeLikes || 20} likes gratuits</strong> pour aujourd&apos;hui !
              </p>
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 border-2 border-rose-200 mb-4">
                <p className="text-sm font-bold text-slate-800 mb-3">
                  💎 Passe Premium pour continuer :
                </p>
                <ul className="space-y-2 text-sm text-slate-700 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Likes ILLIMITÉS 💕</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Voir qui t&apos;a liké 👀</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>5 Super Likes par jour ⭐</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Boosts 3x par jour 🚀</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs text-slate-500">
                💡 Tu peux toujours passer des profils gratuitement !
                <br />
                Reset dans 24h ⏰
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLikeLimitModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Plus tard
              </button>
              <Link
                href="/premium"
                onClick={() => setShowLikeLimitModal(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-black hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Gem className="w-4 h-4" />
                Débloquer
              </Link>
            </div>
          </div>
        </div>
      )}

      {showLikesRevealModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Heart className="w-12 h-12 text-white fill-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                {stats?.pendingLikes} {stats && stats.pendingLikes > 1 ? "personnes ont" : "personne a"} craqué sur toi ! 💕
              </h2>
              <p className="text-slate-600 mb-4">
                Découvre qui te trouve irrésistible !
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-gradient-to-br from-rose-200 to-pink-300 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-2xl flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white/80" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 border-2 border-rose-200">
                <p className="text-sm font-bold text-slate-800 mb-2">
                  ✨ Avec Premium tu vas :
                </p>
                <ul className="space-y-2 text-sm text-slate-700 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Voir toutes les personnes qui t&apos;aiment 👀</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Matcher directement (1 clic) ⚡</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Gagner du temps 🕐</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLikesRevealModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Plus tard
              </button>
              <Link
                href="/premium"
                onClick={() => setShowLikesRevealModal(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-black hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Voir qui !
              </Link>
            </div>
          </div>
        </div>
      )}

      {showSuperLikersModal && stats && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
                <Star className="w-12 h-12 text-white fill-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                {stats.recentSuperLikers.length} personne{stats.recentSuperLikers.length > 1 ? "s" : ""} t&apos;{stats.recentSuperLikers.length > 1 ? "ont" : "a"} Super Liké ! ⭐
              </h2>
              <p className="text-slate-600 mb-4">
                Un Super Like = coup de foudre ! Ne rate pas cette chance !
              </p>

              <div className="flex justify-center gap-3 mb-4">
                {stats.recentSuperLikers.slice(0, 3).map((sl) => (
                  <div key={sl.id} className="relative">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-blue-500 shadow-xl">
                      {sl.photoUrl ? (
                        <img
                          src={sl.photoUrl}
                          alt=""
                          className="w-full h-full object-cover blur-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-300 to-cyan-400" />
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white drop-shadow-2xl" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-2">
                      {sl.firstName.charAt(0)}***
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
                <p className="text-sm font-black text-blue-900 mb-2">
                  ⭐ Un Super Like = 3x plus de chances de match !
                </p>
                <p className="text-xs text-slate-700">
                  Passe Premium pour voir qui te trouve exceptionnel(le) !
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuperLikersModal(false)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Plus tard
              </button>
              <Link
                href="/premium"
                onClick={() => setShowSuperLikersModal(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-black hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Débloquer
              </Link>
            </div>
          </div>
        </div>
      )}

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
                  <>Tu as utilisé tes <strong>{superLikeStatus.limit} Super Likes</strong> aujourd&apos;hui.</>
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

      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Signaler</h2>
                <p className="text-sm text-slate-500">{currentProfile.firstName}</p>
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
                  <span className="text-sm font-medium text-slate-700">{reason.label}</span>
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

      {matchPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
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
            <h2 className="text-3xl font-bold gradient-text mb-2">C&apos;est un match ! 🎉</h2>
            <p className="text-slate-600 mb-6">
              Vous et <strong>{matchPopup.firstName}</strong> vous êtes mutuellement likés !
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
            <>
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} animate-pulse`} />
              <img
                src={photos[currentPhotoIndex]}
                alt={currentProfile.firstName}
                className="absolute inset-0 w-full h-full object-cover z-[1]"
                draggable={false}
                loading="eager"
                decoding="async"
              />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-9xl font-bold text-white/80">
                {currentProfile.firstName.charAt(0)}
              </span>
            </div>
          )}
        </div>

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

        <div className="absolute top-7 right-3 z-20 flex flex-col gap-2 items-end">
          {currentProfile.isPremium && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-3 py-1.5 shadow-lg">
              <Crown className="w-3.5 h-3.5 text-white fill-white" />
              <span className="text-[10px] font-black text-white tracking-widest">PREMIUM</span>
            </div>
          )}
          {currentProfile.isRecycled && (
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full px-2 py-1 shadow-lg">
              <RefreshCw className="w-3 h-3 text-white/80" />
              <span className="text-[9px] font-bold text-white/90 tracking-wider">REDÉCOUVRE</span>
            </div>
          )}
        </div>

        {currentProfile.hasSuperLikedMe && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 animate-pulse">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white">
              <Star className="w-4 h-4 fill-white" />
              <span className="text-sm font-bold">T&apos;A SUPER LIKÉ !</span>
            </div>
          </div>
        )}
        {currentProfile.hasLikedMe && !currentProfile.hasSuperLikedMe && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border-2 border-white">
              <Heart className="w-4 h-4 fill-white" />
              <span className="text-sm font-bold">T&apos;A LIKÉ !</span>
            </div>
          </div>
        )}

        {dragOffset.x > 50 && !animating && (
          <div className="absolute top-1/3 left-8 z-30 rotate-[-20deg] pointer-events-none">
            <div className="border-4 border-green-500 text-green-500 px-6 py-2 rounded-2xl text-4xl font-black">
              LIKE
            </div>
          </div>
        )}
        {dragOffset.x < -50 && !animating && (
          <div className="absolute top-1/3 right-8 z-30 rotate-[20deg] pointer-events-none">
            <div className="border-4 border-red-500 text-red-500 px-6 py-2 rounded-2xl text-4xl font-black">
              NOPE
            </div>
          </div>
        )}
        {dragOffset.y < -50 && !animating && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="border-4 border-blue-500 text-blue-500 px-6 py-2 rounded-2xl text-4xl font-black">
              SUPER
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none z-10" />

        <div className="absolute bottom-48 lg:bottom-28 left-4 right-4 text-white z-20">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2.5 h-2.5 rounded-full ${status.color} animate-pulse`} />
            <span className="text-sm font-medium text-white/90">{status.text}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToProfile();
            }}
            className="text-left hover:opacity-90 transition w-full"
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

            {currentProfile.distance !== null && currentProfile.distance !== undefined && (
              <p className="flex items-center gap-1 text-white/90 text-sm mt-1 drop-shadow">
                <MapPin className="w-4 h-4" />
                à {currentProfile.distance === 0 ? "moins de 1" : currentProfile.distance} kilomètre
                {currentProfile.distance > 1 ? "s" : ""}
              </p>
            )}

            {currentProfile.compatibility > 60 && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full px-3 py-1 text-xs font-black text-white shadow-lg">
                <Heart className="w-3 h-3 fill-white" />
                {currentProfile.compatibility}% compatibilité
              </div>
            )}

            {currentProfile.interests && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {currentProfile.interests
                  .split(",")
                  .slice(0, 4)
                  .map((interest, i) => {
                    const trimmed = interest.trim();
                    const isCommon = currentProfile.commonInterests?.some(
                      (ci) => ci.toLowerCase() === trimmed.toLowerCase()
                    );
                    return (
                      <span
                        key={i}
                        className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                          isCommon
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white ring-2 ring-white/50 shadow-lg"
                            : "bg-white/20 text-white backdrop-blur"
                        }`}
                      >
                        {trimmed} {isCommon && "✨"}
                      </span>
                    );
                  })}
              </div>
            )}

            <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
              <ChevronUp className="w-3 h-3" />
              <span>Appuie sur le nom pour voir le profil</span>
            </div>
          </button>
        </div>

        {/* BARRE D'ACTIONS : 6 BOUTONS COMPACTS */}
        <div className="absolute bottom-24 lg:bottom-4 left-0 right-0 flex items-center justify-center gap-1.5 sm:gap-2 z-30 px-2">
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRewind();
            }}
            disabled={!!animating}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-amber-500 hover:scale-110 active:scale-95 transition disabled:opacity-40 flex-shrink-0 ${
              currentUser?.isPremium && (canRewind || currentIndex > 0)
                ? "opacity-100"
                : currentUser?.isPremium
                ? "opacity-50"
                : "opacity-100"
            }`}
            title="Profil précédent"
          >
            <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
            {!currentUser?.isPremium && (
              <Lock className="w-3 h-3 absolute -top-0.5 -right-0.5 text-white bg-orange-500 rounded-full p-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(false);
            }}
            disabled={!!animating}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition disabled:opacity-50 flex-shrink-0"
          >
            <X className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={3} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSuperLike();
            }}
            disabled={!!animating}
            className="relative w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-500 hover:scale-110 active:scale-95 transition disabled:opacity-50 flex-shrink-0"
          >
            <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-blue-500" strokeWidth={2} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(true);
            }}
            disabled={!!animating}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-green-500 hover:scale-110 active:scale-95 transition disabled:opacity-50 flex-shrink-0"
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-green-500" strokeWidth={2} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDirectMessage();
            }}
            disabled={!!animating}
            className="relative w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-purple-500 hover:scale-110 active:scale-95 transition disabled:opacity-50 flex-shrink-0"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
            {!currentUser?.isPremium && (
              <Lock className="w-3 h-3 absolute -top-0.5 -right-0.5 text-white bg-orange-500 rounded-full p-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/boost");
            }}
            disabled={!!animating}
            className="relative w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition disabled:opacity-50 flex-shrink-0"
            title="Booster mon profil 🚀"
          >
            <Rocket className="w-5 h-5 fill-white text-white animate-pulse" strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </div>
  );
}
