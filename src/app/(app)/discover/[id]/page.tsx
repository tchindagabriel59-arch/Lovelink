"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  Heart,
  X,
  MapPin,
  Briefcase,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crown,
  BadgeCheck,
  Star,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Profile {
  id: number;
  firstName: string;
  birthDate: string;
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
  distance: number | null;
  prompt1Question: string | null;
  prompt1Answer: string | null;
  prompt2Question: string | null;
  prompt2Answer: string | null;
  prompt3Question: string | null;
  prompt3Answer: string | null;
}

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function ProfileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [profileId]);

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/discover/${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      } else {
        router.push("/discover");
      }
    } catch {
      router.push("/discover");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(isLike: boolean) {
    if (!profile || acting) return;
    setActing(true);
    try {
      await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: profile.id, isLike }),
      });
      router.push("/discover");
    } catch {
      setActing(false);
    }
  }

  async function handleSuperLike() {
    if (!profile || acting) return;
    setActing(true);
    try {
      await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: profile.id,
          isLike: true,
          isSuperLike: true,
        }),
      });
      router.push("/discover");
    } catch {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Profil introuvable</p>
      </div>
    );
  }

  const photos = [
    profile.photoUrl,
    profile.photo1Url,
    profile.photo2Url,
    profile.photo3Url,
    profile.photo4Url,
  ].filter((p): p is string => !!p);

  const interests = profile.interests ? profile.interests.split(",").map(i => i.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header sticky avec bouton retour */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="font-bold text-slate-900">Profil</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* CARROUSEL PHOTOS */}
        <div className="relative aspect-square bg-slate-200 overflow-hidden">
          {photos.length > 0 ? (
            <img
              src={photos[currentPhoto]}
              alt={profile.firstName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center">
              <span className="text-9xl font-bold text-white">
                {profile.firstName.charAt(0)}
              </span>
            </div>
          )}

          {/* Segments photos */}
          {photos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full ${
                    i === currentPhoto ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Boutons navigation photos */}
          {photos.length > 1 && currentPhoto > 0 && (
            <button
              onClick={() => setCurrentPhoto(currentPhoto - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
          )}
          {photos.length > 1 && currentPhoto < photos.length - 1 && (
            <button
              onClick={() => setCurrentPhoto(currentPhoto + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              <ChevronRight className="w-6 h-6 text-slate-700" />
            </button>
          )}

          {/* Badges */}
          <div className="absolute top-7 right-3 flex flex-col gap-2 z-10">
            {profile.isPremium && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-3 py-1.5 shadow-lg">
                <Crown className="w-3.5 h-3.5 text-white fill-white" />
                <span className="text-[10px] font-black text-white">PREMIUM</span>
              </div>
            )}
          </div>

          {/* Gradient bas */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Nom + âge */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-4xl font-black drop-shadow-2xl flex items-center gap-2">
                {profile.firstName}
                {profile.isVerified && (
                  <BadgeCheck className="w-7 h-7 text-blue-400 fill-blue-500" />
                )}
              </h2>
              <span className="text-3xl font-light">{getAge(profile.birthDate)}</span>
            </div>
          </div>
        </div>

        {/* INFOS DÉTAILLÉES */}
        <div className="p-6 space-y-6">
          {/* Localisation */}
          {(profile.city || profile.distance !== null) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Localisation</p>
                  <p className="font-semibold text-slate-900">
                    {profile.city && <>{profile.city}</>}
                    {profile.city && profile.country && ", "}
                    {profile.country}
                    {profile.distance !== null && (
                      <span className="ml-2 text-sm text-slate-500">
                        • à {profile.distance} km
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Occupation */}
          {profile.occupation && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Profession</p>
                  <p className="font-semibold text-slate-900">{profile.occupation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                À propos de moi
              </h3>
              <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Intérêts */}
          {interests.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Centres d'intérêt
              </h3>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-gradient-to-r from-rose-50 to-purple-50 text-rose-700 rounded-full text-sm font-medium border border-rose-100"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prompts */}
          {profile.prompt1Question && profile.prompt1Answer && (
            <div className="bg-gradient-to-br from-purple-50 to-rose-50 rounded-2xl p-5 border border-purple-100">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
                {profile.prompt1Question}
              </p>
              <p className="text-slate-800 leading-relaxed">{profile.prompt1Answer}</p>
            </div>
          )}

          {profile.prompt2Question && profile.prompt2Answer && (
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-5 border border-rose-100">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
                {profile.prompt2Question}
              </p>
              <p className="text-slate-800 leading-relaxed">{profile.prompt2Answer}</p>
            </div>
          )}

          {profile.prompt3Question && profile.prompt3Answer && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                {profile.prompt3Question}
              </p>
              <p className="text-slate-800 leading-relaxed">{profile.prompt3Answer}</p>
            </div>
          )}
        </div>
      </div>

      {/* BOUTONS ACTIONS EN BAS (sticky) */}
      <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 z-50 flex items-center justify-center gap-4 px-4">
        <button
          onClick={() => handleAction(false)}
          disabled={acting}
          className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition disabled:opacity-50"
        >
          <X className="w-8 h-8" strokeWidth={3} />
        </button>

        <button
          onClick={handleSuperLike}
          disabled={acting}
          className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-blue-500 hover:scale-110 active:scale-95 transition disabled:opacity-50"
        >
          <Star className="w-7 h-7 fill-blue-500" />
        </button>

        <button
          onClick={() => handleAction(true)}
          disabled={acting}
          className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-green-500 hover:scale-110 active:scale-95 transition disabled:opacity-50"
        >
          <Heart className="w-8 h-8 fill-green-500" />
        </button>
      </div>
    </div>
  );
}
