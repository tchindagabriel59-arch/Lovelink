"use client";

import { useEffect, useState } from "react";
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
  interests: string | null;
  occupation: string | null;
  isOnline: boolean;
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

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchPopup, setMatchPopup] = useState<{ firstName: string; photoUrl: string | null } | null>(null);
  const [animating, setAnimating] = useState<"left" | "right" | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [sendingReport, setSendingReport] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

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

  async function handleAction(isLike: boolean) {
    if (currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];
    setAnimating(isLike ? "right" : "left");

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
  }

  async function handleReport() {
    if (!selectedReason) {
      alert("Veuillez sélectionner un motif");
      return;
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
        // Passer au profil suivant automatiquement
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse-heart mx-auto" />
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
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      {/* 🚨 MODAL DE SIGNALEMENT */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in p-4">
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
              Aidez-nous à maintenir une communauté sûre. Pourquoi souhaitez-vous signaler ce profil ?
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

      {/* Match Popup */}
      {matchPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-slide-up mx-4">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-3xl font-bold`}>
                {matchPopup.firstName.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold gradient-text mb-2">
              C&apos;est un match ! 🎉
            </h2>
            <p className="text-slate-600 mb-6">
              Vous et {matchPopup.firstName} vous êtes mutuellement likés !
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
                Envoyer un message
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Profile Card */}
        <div
          className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-300 ${
            animating === "left"
              ? "opacity-0 -translate-x-20 rotate-[-5deg]"
              : animating === "right"
              ? "opacity-0 translate-x-20 rotate-[5deg]"
              : "opacity-100"
          }`}
        >
          {/* 🚨 BOUTON SIGNALER (en haut à droite) */}
          <button
            onClick={() => setShowReportModal(true)}
            className="absolute top-4 left-4 z-10 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-white shadow-md transition"
            title="Signaler ce profil"
          >
            <Flag className="w-4 h-4" />
          </button>

          {/* Photo / Avatar */}
          <div className={`h-80 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
            {currentProfile.photoUrl ? (
              <img
                src={currentProfile.photoUrl}
                alt={currentProfile.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-8xl font-bold text-white/80">
                {currentProfile.firstName.charAt(0)}
              </span>
            )}
            {currentProfile.isOnline && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 rounded-full px-3 py-1.5">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <span className="text-xs font-medium text-slate-700">En ligne</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-24" />
            <div className="absolute bottom-4 left-4 text-white">
              <h2 className="text-2xl font-bold">
                {currentProfile.firstName}, {getAge(currentProfile.birthDate)} ans
              </h2>
              {currentProfile.city && (
                <p className="flex items-center gap-1 text-white/90 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {currentProfile.city}
                  {currentProfile.country ? `, ${currentProfile.country}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-6">
            {currentProfile.occupation && (
              <p className="flex items-center gap-2 text-slate-600 mb-3">
                <Briefcase className="w-4 h-4 text-slate-400" />
                {currentProfile.occupation}
              </p>
            )}

            {currentProfile.bio && (
              <p className="text-slate-700 leading-relaxed mb-4">
                {currentProfile.bio}
              </p>
            )}

            {currentProfile.interests && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentProfile.interests.split(",").map((interest, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-sm font-medium"
                  >
                    {interest.trim()}
                  </span>
                ))}
              </div>
            )}

            <p className="text-center text-sm text-slate-400 mt-2">
              {currentIndex + 1} / {profiles.length}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={() => handleAction(false)}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:shadow-xl hover:scale-110 transition-all duration-200 border border-slate-100"
            title="Passer"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={() => handleAction(true)}
            className="w-20 h-20 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-lg shadow-rose-500/30 flex items-center justify-center text-white hover:shadow-xl hover:scale-110 transition-all duration-200"
            title="Liker"
          >
            <Heart className="w-10 h-10 fill-white" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-8 mt-6 text-slate-400 text-sm">
          <span className="flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Passer
          </span>
          <span className="flex items-center gap-1">
            Liker <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
