"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "../layout";
import {
  Heart,
  Star,
  MapPin,
  Briefcase,
  X,
  Crown,
  MessageCircle,
  Lock,
  Gem,
  Eye,
  Sparkles,
} from "lucide-react";

interface LikeReceived {
  likeId: number;
  isSuperLike: boolean;
  createdAt: string;
  user: {
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
    interests: string | null;
    occupation: string | null;
    isOnline: boolean;
    isPremium: boolean;
  };
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

export default function LikesRecusPage() {
  const { user } = useUser();
  const isPremium = user?.isPremium || false;

  const [likes, setLikes] = useState<LikeReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchPopup, setMatchPopup] = useState<{ firstName: string; photoUrl: string | null } | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchLikes();
  }, []);

  async function fetchLikes() {
    try {
      const res = await fetch("/api/likes-received");
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleLikeBack(userId: number, firstName: string, photoUrl: string | null) {
    if (!isPremium) return; // Bloqué pour non-Premium
    setProcessing(userId);
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: userId, isLike: true }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isMatch) {
          setMatchPopup({ firstName, photoUrl });
        }
        setLikes((prev) => prev.filter((l) => l.user.id !== userId));
      }
    } catch {
      alert("Erreur");
    } finally {
      setProcessing(null);
    }
  }

  async function handlePass(userId: number) {
    if (!isPremium) return; // Bloqué pour non-Premium
    setProcessing(userId);
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: userId, isLike: false }),
      });

      if (res.ok) {
        setLikes((prev) => prev.filter((l) => l.user.id !== userId));
      }
    } catch {
      alert("Erreur");
    } finally {
      setProcessing(null);
    }
  }

  const superLikes = likes.filter((l) => l.isSuperLike);
  const regularLikes = likes.filter((l) => !l.isSuperLike);
  const premiumCount = likes.filter((l) => l.user.isPremium).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse mx-auto" />
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      
      {/* Match Popup */}
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
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-rose-500">
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
              <Link
                href="/messages"
                onClick={() => setMatchPopup(null)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Ils t&apos;ont <span className="gradient-text">liké</span>
            </h1>
            <p className="mt-1 text-slate-600">
              {likes.length} {likes.length > 1 ? "personnes" : "personne"} attendent ta réponse
              {premiumCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                  <Crown className="w-3 h-3 fill-yellow-500" />
                  {premiumCount} Premium
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 🔒 BANNIÈRE PREMIUM si non-Premium et il y a des likes */}
      {!isPremium && likes.length > 0 && (
        <div className="mb-6 relative overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-500 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <div className="flex-1 text-white text-center md:text-left">
              <h3 className="text-2xl font-black mb-2 flex items-center gap-2 justify-center md:justify-start">
                <Gem className="w-6 h-6" />
                {likes.length} {likes.length > 1 ? "personnes" : "personne"} ont craqué sur toi !
              </h3>
              <p className="text-white/90 text-sm md:text-base">
                Débloque leurs profils et matche instantanément avec Premium 👑
              </p>
            </div>
            
            <Link
              href="/premium"
              className="flex-shrink-0 bg-white text-orange-600 font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Passer Premium
            </Link>
          </div>
        </div>
      )}

      {likes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Aucun like pour le moment
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Complète ton profil avec de belles photos et une bio attrayante pour maximiser tes chances !
          </p>
          <Link
            href="/profile"
            className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Améliorer mon profil →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section SUPER LIKES */}
          {superLikes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-6 h-6 text-blue-500 fill-blue-500" />
                <h2 className="text-xl font-bold text-slate-900">
                  Super Likes ({superLikes.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {superLikes.map((like) => (
                  <ProfileCard
                    key={like.likeId}
                    like={like}
                    onLikeBack={handleLikeBack}
                    onPass={handlePass}
                    processing={processing === like.user.id}
                    isSuperLike
                    isLocked={!isPremium}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section LIKES normaux */}
          {regularLikes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                <h2 className="text-xl font-bold text-slate-900">
                  Likes reçus ({regularLikes.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {regularLikes.map((like) => (
                  <ProfileCard
                    key={like.likeId}
                    like={like}
                    onLikeBack={handleLikeBack}
                    onPass={handlePass}
                    processing={processing === like.user.id}
                    isLocked={!isPremium}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CTA final si non-Premium */}
          {!isPremium && (
            <div className="text-center py-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl border-2 border-yellow-200">
              <Crown className="w-16 h-16 text-yellow-500 fill-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Ne rate aucune opportunité ! 💕
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Avec Premium, tu vois exactement qui t&apos;a liké et tu peux matcher instantanément.
              </p>
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Gem className="w-5 h-5" />
                Découvrir Premium
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileCard({
  like,
  onLikeBack,
  onPass,
  processing,
  isSuperLike,
  isLocked,
}: {
  like: LikeReceived;
  onLikeBack: (id: number, name: string, photo: string | null) => void;
  onPass: (id: number) => void;
  processing: boolean;
  isSuperLike?: boolean;
  isLocked?: boolean;
}) {
  const gradient = gradients[like.user.id % gradients.length];
  const isPremium = like.user.isPremium;

  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
      isPremium 
        ? "ring-2 ring-yellow-400 shadow-yellow-500/20" 
        : isSuperLike 
        ? "border-2 border-blue-400 shadow-blue-200" 
        : "border-2 border-slate-100"
    }`}>
      
      {/* Ruban Premium en haut */}
      {isPremium && !isLocked && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-white text-center py-1 text-[10px] font-black tracking-widest flex items-center justify-center gap-1 shadow-md">
          <Crown className="w-3 h-3 fill-white" />
          PREMIUM
          <Crown className="w-3 h-3 fill-white" />
        </div>
      )}

      {/* Badge Super Like */}
      {isSuperLike && (
        <div className={`absolute right-3 z-30 ${isPremium && !isLocked ? "top-8" : "top-3"}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <Star className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Photo */}
      <div className={`aspect-square bg-gradient-to-br ${gradient} relative overflow-hidden ${isPremium && !isLocked ? "mt-5" : ""}`}>
        {like.user.photoUrl ? (
          <img
            src={like.user.photoUrl}
            alt={like.user.firstName}
            className={`w-full h-full object-cover transition-all ${
              isLocked ? "blur-2xl scale-110" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className={`text-6xl font-bold text-white/80 ${isLocked ? "blur-xl" : ""}`}>
              {like.user.firstName.charAt(0)}
            </span>
          </div>
        )}

        {/* 🔒 OVERLAY DE VERROUILLAGE */}
        {isLocked && (
          <Link
            href="/premium"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-500/40 via-orange-500/40 to-yellow-500/40 backdrop-blur-sm cursor-pointer hover:from-yellow-500/60 hover:to-orange-500/60 transition-all"
          >
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl mb-2">
              <Lock className="w-7 h-7 text-orange-500" />
            </div>
            <div className="bg-white/95 backdrop-blur rounded-full px-3 py-1 shadow-lg">
              <p className="text-xs font-black text-orange-600 flex items-center gap-1">
                <Crown className="w-3 h-3 fill-orange-500" />
                Voir avec Premium
              </p>
            </div>
          </Link>
        )}

        {/* En ligne */}
        {like.user.isOnline && !isLocked && (
          <div className="absolute bottom-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}

        {/* Overlay avec nom (masqué si verrouillé) */}
        {!isLocked && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
            <div className="flex items-center gap-1.5">
              <p className="text-white font-bold text-lg drop-shadow">
                {like.user.firstName}, {getAge(like.user.birthDate)}
              </p>
              {isPremium && (
                <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow flex-shrink-0" />
              )}
            </div>
            {like.user.city && (
              <p className="text-white/90 text-xs flex items-center gap-1 drop-shadow">
                <MapPin className="w-3 h-3" />
                {like.user.city}
              </p>
            )}
          </div>
        )}

        {/* Nom masqué si verrouillé */}
        {isLocked && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
            <p className="text-white font-bold text-lg drop-shadow">
              ??? , {getAge(like.user.birthDate)}
            </p>
            <p className="text-white/80 text-xs drop-shadow">
              📍 Localisation cachée
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {!isLocked && like.user.occupation && (
          <p className="text-xs text-slate-600 flex items-center gap-1 mb-2 truncate">
            <Briefcase className="w-3 h-3" />
            {like.user.occupation}
          </p>
        )}
        {!isLocked && like.user.bio && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
            {like.user.bio}
          </p>
        )}
        {isLocked && (
          <div className="mb-3 space-y-1">
            <div className="h-3 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-2">
          {isLocked ? (
            <Link
              href="/premium"
              className="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg text-white rounded-lg transition flex items-center justify-center gap-1 text-xs font-bold"
            >
              <Eye className="w-3.5 h-3.5" />
              Découvrir
            </Link>
          ) : (
            <>
              <button
                onClick={() => onPass(like.user.id)}
                disabled={processing}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-800 transition disabled:opacity-50 flex items-center justify-center"
                title="Passer"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => onLikeBack(like.user.id, like.user.firstName, like.user.photoUrl)}
                disabled={processing}
                className={`flex-1 py-2 rounded-lg text-white transition disabled:opacity-50 flex items-center justify-center hover:shadow-lg ${
                  isPremium
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-orange-500/30"
                    : "bg-gradient-to-r from-rose-500 to-pink-500"
                }`}
                title="Liker en retour"
              >
                <Heart className="w-4 h-4 fill-white" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
