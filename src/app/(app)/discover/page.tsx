"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  X,
  MapPin,
  Sparkles,
  Crown,
  MessageCircle,
  Star,
  RotateCcw,
  BadgeCheck,
  Rocket,
  ArrowRight,
  Gem,
} from "lucide-react";

// ==========================================
// 🚀 ONBOARDING TOUR
// ==========================================
function OnboardingTour({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      id: "welcome",
      title: "Bienvenue sur LoveLink ! 🎉",
      text: "Faisons un tour rapide de 10 secondes pour t'aider à obtenir tes premiers matchs !",
      target: null as null | {
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
      text: "Appuie sur la croix rouge (ou swipe à gauche) si le profil ne t'intéresse pas.",
      target: {
        bottom: "5rem",
        left: "calc(50% - 4.5rem)",
        width: "3.5rem",
        height: "3.5rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "like",
      title: "Liker un profil 💚",
      text: "Appuie sur le cœur vert (ou swipe à droite) pour liker. Si la personne te like aussi → Match !",
      target: {
        bottom: "5rem",
        left: "calc(50% + 1.2rem)",
        width: "3.5rem",
        height: "3.5rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "superlike",
      title: "Le Super Like ⭐",
      text: "L'étoile bleue te démarque instantanément avec une notification prioritaire.",
      target: {
        bottom: "5.2rem",
        left: "calc(50% - 1.5rem)",
        width: "3rem",
        height: "3rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "message",
      title: "Message Direct 💬",
      text: "La bulle violette te permet d'envoyer un message avant même d'avoir matché !",
      target: {
        bottom: "5.3rem",
        left: "calc(50% + 4.8rem)",
        width: "2.75rem",
        height: "2.75rem",
      },
      tooltipSide: "top" as const,
    },
    {
      id: "boost",
      title: "Booster mon profil 🚀",
      text: "La fusée propulse ton profil en tête de pile dans ta ville pour multiplier tes vues !",
      target: {
        bottom: "5.3rem",
        left: "calc(50% + 7.8rem)",
        width: "2.75rem",
        height: "2.75rem",
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
      <div className="absolute inset-0 bg-black/75" onClick={onFinish} />

      {current.target && (
        <div
          className="absolute z-[210] rounded-full pointer-events-none transition-all duration-300"
          style={{
            bottom: current.target.bottom,
            left: current.target.left,
            width: current.target.width,
            height: current.target.height,
            boxShadow:
              "0 0 0 4px rgba(255,255,255,0.95), 0 0 0 8px rgba(244,63,94,0.45), 0 0 0 9999px rgba(0,0,0,0.75)",
          }}
        />
      )}

      <div
        className={`absolute z-[220] px-4 w-full flex pointer-events-none ${
          current.tooltipSide === "center"
            ? "inset-0 items-center justify-center"
            : "justify-center"
        }`}
        style={
          current.tooltipSide === "top" && current.target
            ? {
                bottom: `calc(${current.target.bottom} + ${current.target.height} + 1rem)`,
              }
            : undefined
        }
      >
        <div className="pointer-events-auto relative max-w-[320px] w-full bg-white rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in duration-200">
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
              <div className="flex gap-1.5">
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
                  className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md active:scale-95 transition flex items-center gap-1"
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
  photo1Url: string | null;
  photo2Url: string | null;
  photo3Url: string | null;
  photo4Url: string | null;
  interests: string | null;
  occupation: string | null;
  isOnline: boolean;
  isPremium: boolean;
  isVerified: boolean;
  isBoosted?: boolean;
}

interface CurrentUser {
  isPremium?: boolean;
  isBoosted?: boolean;
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
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
      <div className="relative w-full h-full lg:w-[420px] lg:h-[750px] lg:rounded-3xl overflow-hidden bg-slate-800 animate-pulse flex items-center justify-center">
        <Heart className="w-12 h-12 text-rose-400 animate-pulse fill-rose-400" />
      </div>
    </div>
  );
}

// ==========================================
// PAGE DISCOVER
// ==========================================
export default function DiscoverPage() {
  const router = useRouter();
  const [showTour, setShowTour] = useState(false);
  const [showBoostPromo, setShowBoostPromo] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<string>("");

  // 💬 Modale Message Direct
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [directMessageText, setDirectMessageText] = useState("");
  const [sendingDirectMessage, setSendingDirectMessage] = useState(false);

  const [animating, setAnimating] = useState<"left" | "right" | "up" | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
        const [profilesRes, meRes] = await Promise.all([
          fetch("/api/discover"),
          fetch("/api/auth/me"),
        ]);

        if (profilesRes.ok) {
          const data = await profilesRes.json();
          setProfiles(data.profiles || []);
        }
        if (meRes.ok) {
          const data = await meRes.json();
          setCurrentUser(data.user);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // 🚀 PROMO BOOST : max 2 fois, après le tour, pas si Premium/Boost
  useEffect(() => {
    if (loading || showTour) return;
    if (currentUser?.isPremium || currentUser?.isBoosted) return;

    try {
      const KEY = "lovelink_boost_promo_count";
      const count = parseInt(localStorage.getItem(KEY) || "0", 10);
      if (count >= 2) return;

      const timer = setTimeout(() => {
        setShowBoostPromo(true);
        localStorage.setItem(KEY, String(count + 1));
      }, 2800);

      return () => clearTimeout(timer);
    } catch {
      // ignore
    }
  }, [loading, showTour, currentUser?.isPremium, currentUser?.isBoosted]);

  const handleAction = useCallback(
    async (isLike: boolean) => {
      if (currentIndex >= profiles.length || animating || showTour) return;

      const profile = profiles[currentIndex];
      setAnimating(isLike ? "right" : "left");

      fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: profile.id, isLike }),
      }).catch(() => {});

      setTimeout(() => {
        setDragOffset({ x: 0, y: 0 });
        setCurrentIndex((i) => i + 1);
        setCurrentPhotoIndex(0);
        setTimeout(() => setAnimating(null), 20);
      }, 350);
    },
    [currentIndex, profiles, animating, showTour]
  );

  const handleSuperLike = useCallback(async () => {
    if (currentIndex >= profiles.length || animating || showTour) return;
    const profile = profiles[currentIndex];

    setAnimating("up");

    fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: profile.id, isLike: true, isSuperLike: true }),
    }).catch(() => {});

    setTimeout(() => {
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex((i) => i + 1);
      setCurrentPhotoIndex(0);
      setTimeout(() => setAnimating(null), 20);
    }, 350);
  }, [currentIndex, profiles, animating, showTour]);

  const handleRewind = useCallback(async () => {
    if (animating || showTour) return;
    if (!currentUser?.isPremium) {
      setPremiumFeature("rewind");
      setShowPremiumModal(true);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex((i) => Math.max(0, i - 1));
      setCurrentPhotoIndex(0);
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

  await fetch("/api/messages/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    receiverId: profiles[currentIndex].id,
    content: directMessageText,
  }),
});

      setShowDirectMessageModal(false);
      setDirectMessageText("");
      handleAction(true);
    } catch {
      alert("Erreur lors de l'envoi");
    } finally {
      setSendingDirectMessage(false);
    }
  };

  const currentProfile = profiles[currentIndex];
  const photos = currentProfile ? getAllPhotos(currentProfile) : [];
  const hasPhotos = photos.length > 0;

  if (loading) return <DiscoverSkeleton />;

  // ==========================================
  // ÉCRAN VIDE (Tu as tout vu !) - CORRIGÉ
  // ==========================================
  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 flex flex-col items-center justify-center text-center text-white">
        <Sparkles className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-black mb-2">Tu as tout vu !</h2>
        <p className="text-slate-400 text-sm mb-6">
          Reviens plus tard pour de nouveaux profils.
        </p>
        <button
          onClick={async () => {
            setLoading(true);
            setCurrentIndex(0);
            try {
              const res = await fetch("/api/discover");
              if (res.ok) {
                const data = await res.json();
                setProfiles(data.profiles || []);
              }
            } catch {
              // silent
            } finally {
              setLoading(false);
            }
          }}
          className="px-6 py-3 bg-rose-500 font-bold rounded-full transition active:scale-95"
        >
          Rafraîchir
        </button>
        <Link
          href="/preferences"
          className="mt-6 text-sm text-slate-400 underline hover:text-slate-300 transition"
        >
          Élargir mes préférences →
        </Link>
      </div>
    );
  }

  const rotation = dragOffset.x / 20;

  let cardTransform = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`;
  if (animating === "left") cardTransform = "translateX(-150%) rotate(-30deg)";
  if (animating === "right") cardTransform = "translateX(150%) rotate(30deg)";
  if (animating === "up") cardTransform = "translateY(-150%)";

  return (
    <div className="fixed inset-0 bg-black lg:relative lg:min-h-screen lg:bg-slate-100 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-4">
      {/* 🚀 TOUR EN DIRECT */}
      {showTour && <OnboardingTour onFinish={completeTour} />}

      {/* 🚀 BANNIÈRE PROMO BOOST (max 2 fois) */}
      {showBoostPromo && !showTour && (
        <div className="fixed bottom-28 left-3 right-3 z-[90] max-w-md mx-auto animate-in slide-in-from-bottom duration-300">
          <div className="bg-gradient-to-r from-purple-600 via-rose-500 to-amber-400 p-[1.5px] rounded-2xl shadow-2xl">
            <div className="bg-slate-950/95 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-black leading-tight">
                  Multiplie tes matchs 🚀
                </p>
                <p className="text-white/70 text-[11px] mt-0.5 leading-snug">
                  Boost ton profil et apparais en premier dans Discover
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBoostPromo(false);
                  router.push("/boost");
                }}
                className="px-3.5 py-2 bg-white text-rose-600 text-xs font-black rounded-xl flex-shrink-0 shadow-md active:scale-95 transition"
              >
                GO
              </button>
              <button
                type="button"
                onClick={() => setShowBoostPromo(false)}
                className="text-white/50 hover:text-white text-xl leading-none px-1 flex-shrink-0"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💬 MODALE MESSAGE DIRECT */}
      {showDirectMessageModal && currentProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-2">
              Message direct à {currentProfile.firstName}
            </h3>
            <textarea
              value={directMessageText}
              onChange={(e) => setDirectMessageText(e.target.value)}
              placeholder={`Dis quelque chose à ${currentProfile.firstName}...`}
              rows={4}
              className="w-full p-4 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDirectMessageModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={submitDirectMessage}
                disabled={sendingDirectMessage}
                className="flex-1 py-3 rounded-xl bg-purple-600 font-bold text-sm"
              >
                {sendingDirectMessage ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE PREMIUM */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-center">
            <Crown className="w-16 h-16 text-amber-500 mx-auto mb-3" />
            <h3 className="font-black text-xl mb-2">Fonctionnalité Premium 👑</h3>
            <p className="text-slate-600 text-sm mb-6">
              {premiumFeature === "rewind"
                ? "Revenir au profil précédent est réservé aux membres Premium."
                : "Envoyer un message direct sans matcher est réservé aux membres Premium."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold"
              >
                Fermer
              </button>
              <Link
                href="/premium"
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1"
              >
                <Gem size={16} /> Premium
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CARTE PROFIL */}
      <div
        key={currentIndex}
        style={{
          transform: cardTransform,
          transition: dragStart ? "none" : "transform 350ms ease",
        }}
        className="relative w-full h-full lg:w-[420px] lg:h-[750px] lg:rounded-3xl overflow-hidden bg-black shadow-2xl"
      >
        <div className="absolute inset-0 select-none">
          {hasPhotos ? (
            <img
              src={photos[currentPhotoIndex]}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-7xl font-bold text-white">
              {currentProfile.firstName.charAt(0)}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none z-10" />

        <div className="absolute bottom-36 left-4 right-4 text-white z-20 pointer-events-none">
          <h2 className="text-3xl font-black flex items-center gap-2">
            {currentProfile.firstName}, {getAge(currentProfile.birthDate)}
            {currentProfile.isVerified && (
              <BadgeCheck className="w-6 h-6 text-blue-400 fill-blue-500" />
            )}
          </h2>
          <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
            <MapPin size={14} /> {currentProfile.city || "Cameroun"}
          </p>
        </div>

        <div className="absolute bottom-20 lg:bottom-6 left-0 right-0 flex items-center justify-center gap-2 z-30 px-2">
          <button
            onClick={handleRewind}
            className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-amber-500 hover:scale-110 active:scale-95 transition"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={() => handleAction(false)}
            className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition"
          >
            <X size={28} />
          </button>
          <button
            onClick={handleSuperLike}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-500 hover:scale-110 active:scale-95 transition"
          >
            <Star size={24} className="fill-blue-500" />
          </button>
          <button
            onClick={() => handleAction(true)}
            className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-green-500 hover:scale-110 active:scale-95 transition"
          >
            <Heart size={28} className="fill-green-500" />
          </button>
          <button
            onClick={handleDirectMessage}
            className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-purple-500 hover:scale-110 active:scale-95 transition"
          >
            <MessageCircle size={20} />
          </button>
          <button
            onClick={() => router.push("/boost")}
            className="w-11 h-11 bg-gradient-to-tr from-purple-600 to-amber-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition"
          >
            <Rocket size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
