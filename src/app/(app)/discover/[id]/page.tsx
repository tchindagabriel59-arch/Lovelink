"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "../../layout";
import {
  ArrowLeft,
  MapPin,
  BadgeCheck,
  Crown,
  Images,
  Info,
  Briefcase,
  Heart,
  MessageCircle,
} from "lucide-react";

interface PublicProfile {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  city: string;
  country: string;
  bio: string;
  interests: string;
  occupation: string;
  maritalStatus: string;
  photoUrl: string;
  photo1Url: string;
  photo2Url: string;
  photo3Url: string;
  photo4Url: string;
  isOnline: boolean;
  lastSeen: string;
  isVerified: boolean;
  isPremium: boolean;
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

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string>("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setActivePhoto(data.user.photoUrl);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col items-center justify-center p-4">
        <p className="text-slate-500 font-bold mb-4">Profil introuvable</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-rose-500 text-white rounded-full font-bold">
          Retour
        </button>
      </div>
    );
  }

  // Rassembler toutes les photos existantes
  const allPhotos = [
    profile.photoUrl,
    profile.photo1Url,
    profile.photo2Url,
    profile.photo3Url,
    profile.photo4Url,
  ].filter(Boolean);

  const isPremium = currentUser?.isPremium;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FC] pb-24">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm relative">
        
        {/* Header Retour */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux profils
          </button>
        </div>

        {/* Photo Principale */}
        <div className="w-full aspect-[4/5] relative bg-slate-100">
          {activePhoto ? (
            <Image
              src={activePhoto}
              alt={profile.firstName}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-400 to-purple-500 text-white text-6xl font-black">
              {profile.firstName.charAt(0)}
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-3xl font-black flex items-center gap-2 drop-shadow-md">
              {profile.firstName}, {getAge(profile.birthDate)}
              {profile.isVerified && <BadgeCheck className="w-6 h-6 text-blue-400 fill-blue-500" />}
            </h1>
            <p className="flex items-center gap-1.5 mt-1 text-sm font-medium drop-shadow-md">
              <MapPin className="w-4 h-4" /> {profile.city || "Cameroun"}
            </p>
          </div>
        </div>

        <div className="p-5">
          {/* GALERIE PHOTOS & UPSELL PREMIUM */}
          <div className="mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Images className="w-5 h-5 text-emerald-500" />
              Photos ({allPhotos.length})
            </h3>
            
            <div className="grid grid-cols-4 gap-2">
              {/* Photo 1 (Toujours visible) */}
              <button
                onClick={() => setActivePhoto(allPhotos[0])}
                className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition ${activePhoto === allPhotos[0] ? "border-emerald-500 shadow-md" : "border-transparent"}`}
              >
                <Image src={allPhotos[0]} alt="Principale" fill className="object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-white text-[9px] font-black text-center py-0.5">
                  Principale
                </div>
              </button>

              {/* Photos 2, 3 et 4 (Bloquées si non-premium) */}
              {[1, 2, 3].map((index) => {
                const photoExists = allPhotos[index];

                if (!isPremium) {
                  // MÊME S'IL N'A PAS DE PHOTO, ON AFFICHE LE CADENAS POUR DONNER ENVIE
                  return (
                    <Link
                      key={index}
                      href="/premium"
                      className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 flex flex-col items-center justify-center gap-1 hover:bg-amber-100 transition"
                    >
                      {photoExists && (
                        <Image src={photoExists} alt="" fill className="object-cover opacity-20 blur-sm rounded-xl" />
                      )}
                      <Crown className="w-6 h-6 text-amber-500 relative z-10" />
                      <span className="text-[10px] font-black text-amber-600 relative z-10">Premium</span>
                    </Link>
                  );
                }

                // Si Premium et que la photo existe
                if (photoExists) {
                  return (
                    <button
                      key={index}
                      onClick={() => setActivePhoto(photoExists)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition ${activePhoto === photoExists ? "border-emerald-500 shadow-md" : "border-transparent"}`}
                    >
                      <Image src={photoExists} alt={`Photo ${index + 1}`} fill className="object-cover" />
                    </button>
                  );
                }

                // Si Premium mais la photo n'existe pas
                return (
                  <div key={index} className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50" />
                );
              })}
            </div>
          </div>

          {/* BIO */}
          {profile.bio && (
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-rose-500" />
                À propos de moi
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {profile.bio}
              </p>
            </div>
          )}

          {/* INFOS COMPLÉMENTAIRES */}
          <div className="space-y-4 mb-8">
            {profile.occupation && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Profession</p>
                  <p className="text-sm font-bold text-slate-800">{profile.occupation}</p>
                </div>
              </div>
            )}
            
            {profile.interests && (
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">Centres d&apos;intérêt</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.split(",").map((interest, i) => (
                    <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-full border border-rose-100">
                      {interest.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOUTONS D'ACTION FIXES EN BAS */}
        <div className="fixed lg:absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-100 flex gap-3 max-w-md mx-auto">
          <Link
            href={`/messages?match=${profile.id}`}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Écrire
          </Link>
          <button
            onClick={() => alert("Profil liké ! (Géré via l'API Like)")}
            className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:scale-105 transition"
          >
            <Heart className="w-5 h-5" />
            Liker
          </button>
        </div>

      </div>
    </div>
  );
}
