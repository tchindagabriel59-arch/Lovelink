"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../layout";
import {
  Heart,
  Camera,
  Sparkles,
  Check,
  ArrowRight,
  Loader2,
  Star,
  Users,
  MessageCircle,
} from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Si l'utilisateur a déjà une photo, rediriger vers dashboard
  useEffect(() => {
    if (user?.photoUrl) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🔍 Réinitialiser les erreurs
    setErrorMessage("");

    // 🛡️ Vérifications préalables
    if (file.size > 32 * 1024 * 1024) {
      setErrorMessage(`📸 Photo trop grande (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum : 32 MB`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("❌ Ce fichier n'est pas une image. Choisis une photo (JPG, PNG, HEIC...)");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          body: file,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // 🎯 Messages d'erreur spécifiques
        if (data.code === "QUOTA_EXCEEDED") {
          setErrorMessage("⏳ Le service photos est temporairement saturé. Réessaie dans 5 minutes !");
        } else {
          setErrorMessage(`❌ ${data.error || "Erreur lors de l'envoi de la photo"}`);
        }
        return;
      }

      setPhotoUrl(data.url);
    } catch (err) {
      console.error("Erreur upload:", err);
      setErrorMessage("❌ Problème de connexion. Vérifie ton internet et réessaie.");
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = async () => {
  if (!photoUrl) {
    setErrorMessage("📸 Ajoute au moins une photo pour continuer !");
    return;
  }

  setSaving(true);
  setErrorMessage("");

  try {
    // Timeout de 30 secondes pour éviter le blocage infini
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photoUrl,
        bio: bio || undefined,
        city: city || undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Erreur API profile:", response.status, errorData);
      setErrorMessage(
        `❌ Erreur d'enregistrement (${response.status}). ${errorData.error || "Réessaye."}`
      );
      setSaving(false);
      return;
    }

    // Succès : rafraîchir l'user et rediriger
    await refreshUser();
    
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  } catch (err: any) {
    console.error("Erreur handleContinue:", err);
    
    if (err.name === "AbortError") {
      setErrorMessage("⏳ L'enregistrement prend trop de temps. Vérifie ta connexion et réessaye.");
    } else {
      setErrorMessage(`❌ ${err.message || "Erreur d'enregistrement. Réessaye."}`);
    }
    setSaving(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      {/* Décoration */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full mb-4 shadow-sm">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-700">
              Bienvenue sur LoveLink !
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Salut <span className="gradient-text">{user?.firstName}</span> 👋
          </h1>
          <p className="text-lg text-slate-600">
            Une dernière chose avant de commencer...
          </p>
        </div>

        {/* Card principale */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
          {/* Titre */}
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-gradient-to-br from-rose-100 to-purple-100 rounded-2xl mb-4">
              <Camera className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Ajoute ta photo 📸
            </h2>
            <p className="text-slate-600">
              C&apos;est <strong>essentiel</strong> pour recevoir des likes et faire des matchs
            </p>
          </div>

          {/* 🚨 MESSAGE D'ERREUR */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium animate-fade-in flex items-start gap-2">
              <span className="text-lg leading-none">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Statistiques d'incitation */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl text-center">
              <Star className="w-5 h-5 text-rose-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">10x</p>
              <p className="text-xs text-slate-600">Plus de likes</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl text-center">
              <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">5x</p>
              <p className="text-xs text-slate-600">Plus de matchs</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl text-center">
              <MessageCircle className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">15x</p>
              <p className="text-xs text-slate-600">Plus de messages</p>
            </div>
          </div>

          {/* Zone d'upload photo */}
          <div className="mb-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            {photoUrl ? (
              // Photo uploadée - affichage succès
              <div className="relative">
                <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                  <img
                    src={photoUrl}
                    alt="Ta photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-green-600 font-semibold flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Super photo ! ✨
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-2 text-sm text-slate-500 hover:text-rose-500 underline"
                  >
                    Changer la photo
                  </button>
                </div>
              </div>
            ) : (
              // Zone d'upload vide
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-12 md:py-16 border-4 border-dashed border-rose-200 hover:border-rose-400 rounded-3xl bg-gradient-to-br from-rose-50/50 to-purple-50/50 hover:from-rose-50 hover:to-purple-50 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  {uploading ? (
                    <>
                      <Loader2 className="w-16 h-16 text-rose-500 animate-spin" />
                      <p className="text-slate-600 font-medium">Envoi en cours...</p>
                      <p className="text-xs text-slate-400">Cela peut prendre quelques secondes</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Camera className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        Clique pour ajouter ta photo
                      </p>
                      <p className="text-sm text-slate-500">
                        JPG, PNG, HEIC • Max 32 MB
                      </p>
                    </>
                  )}
                </div>
              </button>
            )}
          </div>

          {/* Champs optionnels */}
          {photoUrl && (
            <div className="space-y-4 mb-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ta ville (optionnel)
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Dakar, Yaoundé, Abidjan..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ta bio en 1 phrase (optionnel)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  maxLength={150}
                  placeholder="Ex: Passionné(e) de voyage, cherche l'âme sœur 💕"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition resize-none"
                />
                <p className="text-xs text-slate-400 text-right mt-1">
                  {bio.length}/150
                </p>
              </div>
            </div>
          )}

          {/* Bouton continuer */}
          <button
            onClick={handleContinue}
            disabled={!photoUrl || saving}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
              photoUrl && !saving
                ? "bg-gradient-to-r from-rose-500 to-purple-600 hover:shadow-xl hover:scale-[1.02] shadow-lg shadow-rose-500/30"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement...
              </>
            ) : photoUrl ? (
              <>
                Continuer vers LoveLink
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Ajoute une photo pour continuer
              </>
            )}
          </button>
        </div>

        {/* Footer motivant */}
        <div className="text-center">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            Tu pourras ajouter plus de photos et compléter ton profil après
          </p>
        </div>
      </div>
    </div>
  );
}
