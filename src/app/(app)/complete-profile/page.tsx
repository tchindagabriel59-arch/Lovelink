// src/app/(app)/complete-profile/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  Sparkles,
  Briefcase,
  PenLine,
  BadgeCheck,
  PartyPopper,
  X,
} from "lucide-react";

type MissingKey =
  | "photoMain"
  | "photosExtra"
  | "bio"
  | "city"
  | "occupation"
  | "interests"
  | "birthDate"
  | "verified";

interface MissingItem {
  key: MissingKey;
  label: string;
  description: string;
  points: number;
  cta: string;
  href: string;
  priority: number;
  emoji: string;
}

interface CompletionData {
  percent: number;
  earnedPoints: number;
  totalPoints: number;
  missing: MissingItem[];
  nextAction: MissingItem | null;
  level: string;
  message: string;
}

interface ProfileForm {
  bio: string;
  city: string;
  country: string;
  occupation: string;
  interests: string;
  photoUrl: string;
  photo1Url: string;
  photo2Url: string;
  photo3Url: string;
  photo4Url: string;
}

const INTEREST_OPTIONS = [
  "Voyages",
  "Musique",
  "Cinema",
  "Sport",
  "Cuisine",
  "Lecture",
  "Art",
  "Photographie",
  "Danse",
  "Jeux vidéo",
  "Nature",
  "Yoga",
  "Animaux",
  "Tech",
  "Mode",
  "Gastronomie",
  "Business",
  "Football",
  "Gospel",
  "Sorties",
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);

  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const [form, setForm] = useState<ProfileForm>({
    bio: "",
    city: "",
    country: "",
    occupation: "",
    interests: "",
    photoUrl: "",
    photo1Url: "",
    photo2Url: "",
    photo3Url: "",
    photo4Url: "",
  });

  const selectedInterests = useMemo(
    () =>
      form.interests
        ? form.interests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    [form.interests]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, meRes] = await Promise.all([
        fetch("/api/profile/completion", { credentials: "include" }),
        fetch("/api/auth/me", { credentials: "include" }),
      ]);

      if (compRes.status === 401 || meRes.status === 401) {
        router.push("/login");
        return;
      }

      if (compRes.ok) {
        const data = await compRes.json();
        setCompletion(data);
        // Revenir à la première étape manquante
        setStepIndex(0);
      }

      if (meRes.ok) {
        const data = await meRes.json();
        const u = data.user || data;
        setForm({
          bio: u.bio || "",
          city: u.city || "",
          country: u.country || "",
          occupation: u.occupation || "",
          interests: u.interests || "",
          photoUrl: u.photoUrl || "",
          photo1Url: u.photo1Url || "",
          photo2Url: u.photo2Url || "",
          photo3Url: u.photo3Url || "",
          photo4Url: u.photo4Url || "",
        });
      }
    } catch {
      setError("Impossible de charger ton profil. Réessaie.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const missing = completion?.missing || [];
  const current = missing[stepIndex] || null;
  const isComplete = !loading && (!!completion && (completion.percent >= 100 || missing.length === 0));

  const saveProfile = async (patch: Partial<ProfileForm>) => {
    const next = { ...form, ...patch };
    setForm(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur de sauvegarde");
      }
      setSuccessFlash("Enregistré ✅");
      setTimeout(() => setSuccessFlash(null), 1500);
      // Recharger le score
      await loadAll();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de sauvegarde");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo trop lourde (max 5 Mo).");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Choisis une image.");
      return;
    }

    // Déterminer quel champ photo remplir
    let field: keyof ProfileForm = "photoUrl";
    if (current?.key === "photosExtra") {
      if (!form.photo1Url) field = "photo1Url";
      else if (!form.photo2Url) field = "photo2Url";
      else if (!form.photo3Url) field = "photo3Url";
      else field = "photo4Url";
    } else {
      field = "photoUrl";
    }

    setUploading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        { method: "POST", body: file }
      );
      if (!response.ok) throw new Error("Échec upload");
      const blob = await response.json();
      const ok = await saveProfile({ [field]: blob.url } as Partial<ProfileForm>);
      if (ok) {
        // rester sur photosExtra s'il en manque encore — loadAll reset stepIndex à 0
      }
    } catch {
      setError("Erreur lors de l'envoi de la photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleInterest = (interest: string) => {
    const currentList = selectedInterests;
    const updated = currentList.includes(interest)
      ? currentList.filter((i) => i !== interest)
      : [...currentList, interest];
    setForm((f) => ({ ...f, interests: updated.join(", ") }));
  };

  const skipStep = () => {
    if (stepIndex < missing.length - 1) setStepIndex((i) => i + 1);
    else router.push("/discover");
  };

  const gradientBar =
    (completion?.percent || 0) >= 70
      ? "from-purple-500 to-pink-500"
      : (completion?.percent || 0) >= 40
      ? "from-pink-500 to-rose-500"
      : "from-rose-500 to-orange-500";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
      </div>
    );
  }

  // ========== ÉCRAN 100% ==========
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shadow-lg">
            <PartyPopper className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Profil 100% complet ! 🔥
          </h1>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Tu es prêt(e) à cartonner sur LoveLink. Les profils complets
            reçoivent en moyenne <strong>3× plus de matchs</strong>.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/discover")}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold shadow-lg active:scale-[0.98] transition"
            >
              Découvrir des profils
            </button>
            <Link
              href="/profile"
              className="block w-full py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
            >
              Voir mon profil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Compléter mon profil
            </p>
            <p className="text-sm font-black text-slate-900">
              {completion?.percent ?? 0}% complété
            </p>
          </div>
          <button
            onClick={() => router.push("/discover")}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
          >
            Plus tard
          </button>
        </div>

        {/* Progress */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradientBar} rounded-full transition-all duration-700`}
              style={{ width: `${completion?.percent ?? 0}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Étape {Math.min(stepIndex + 1, missing.length)} / {missing.length}
            </span>
            <span className="font-semibold text-pink-500">
              {current ? `+${current.points} pts` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium">
            {error}
          </div>
        )}
        {successFlash && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            {successFlash}
          </div>
        )}

        {current && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Step header */}
            <div className="p-6 pb-4 bg-gradient-to-br from-rose-50 to-purple-50 border-b border-slate-100">
              <div className="text-4xl mb-3">{current.emoji}</div>
              <h1 className="text-xl font-black text-slate-900 mb-1">
                {current.label}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {current.description}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* ===== PHOTO MAIN / EXTRA ===== */}
              {(current.key === "photoMain" || current.key === "photosExtra") && (
                <div className="space-y-4">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    disabled={uploading || saving}
                    onClick={() => fileRef.current?.click()}
                    className="w-full aspect-[4/5] max-h-80 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/50 flex flex-col items-center justify-center gap-3 hover:border-rose-400 hover:bg-rose-50 transition"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
                        <span className="text-sm font-semibold text-rose-600">
                          Envoi en cours...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">
                          {current.key === "photoMain"
                            ? "Choisir ma photo principale"
                            : "Ajouter une photo"}
                        </span>
                        <span className="text-xs text-slate-400">JPG/PNG · max 5 Mo</span>
                      </>
                    )}
                  </button>

                  {/* Aperçu mini galerie */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[form.photoUrl, form.photo1Url, form.photo2Url, form.photo3Url, form.photo4Url]
                      .filter(Boolean)
                      .map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* ===== BIO ===== */}
              {current.key === "bio" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <PenLine className="w-4 h-4" />
                    Minimum 20 caractères
                  </div>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={5}
                    maxLength={500}
                    placeholder="Ex: Passionné(e) de voyages et de bonne bouffe. Je cherche quelqu'un de vrai pour partager la vie à Douala / Dakar..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none resize-none text-sm text-slate-800"
                  />
                  <p className="text-xs text-slate-400 text-right">
                    {form.bio.trim().length}/500
                  </p>
                  <button
                    disabled={saving || form.bio.trim().length < 20}
                    onClick={() => saveProfile({ bio: form.bio.trim() })}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Enregistrer ma bio
                  </button>
                </div>
              )}

              {/* ===== VILLE ===== */}
              {current.key === "city" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <MapPin className="w-4 h-4" />
                    Ville & pays
                  </div>
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Ex: Douala, Yaoundé, Dakar, Abidjan..."
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                  />
                  <input
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    placeholder="Pays (Cameroun, Sénégal, Côte d'Ivoire...)"
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                  />
                  <button
                    disabled={saving || form.city.trim().length < 2}
                    onClick={() =>
                      saveProfile({
                        city: form.city.trim(),
                        country: form.country.trim(),
                      })
                    }
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Enregistrer ma ville
                  </button>
                </div>
              )}

              {/* ===== OCCUPATION ===== */}
              {current.key === "occupation" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <Briefcase className="w-4 h-4" />
                    Métier ou études
                  </div>
                  <input
                    value={form.occupation}
                    onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
                    placeholder="Ex: Entrepreneur, Étudiante, Infirmier, Commerçant..."
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                  />
                  <button
                    disabled={saving || form.occupation.trim().length < 2}
                    onClick={() => saveProfile({ occupation: form.occupation.trim() })}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Enregistrer
                  </button>
                </div>
              )}

              {/* ===== INTERESTS ===== */}
              {current.key === "interests" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-semibold">
                    Choisis au moins 3 centres d&apos;intérêt ({selectedInterests.length}/3)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => {
                      const active = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-3.5 py-2 rounded-full text-sm font-semibold transition ${
                            active
                              ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md"
                              : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    disabled={saving || selectedInterests.length < 3}
                    onClick={() => saveProfile({ interests: selectedInterests.join(", ") })}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Valider mes intérêts
                  </button>
                </div>
              )}

              {/* ===== VERIFIED ===== */}
              {current.key === "verified" && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <BadgeCheck className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    La vérification te donne un <strong>badge bleu</strong> et augmente
                    fortement la confiance des autres membres.
                  </p>
                  <Link
                    href="/verification"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <BadgeCheck className="w-5 h-5" />
                    Lancer la vérification
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* ===== BIRTHDATE fallback ===== */}
              {current.key === "birthDate" && (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-slate-600">
                    Complète ta date de naissance dans ton profil.
                  </p>
                  <Link
                    href="/profile"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold inline-flex items-center justify-center gap-2"
                  >
                    Ouvrir mon profil
                  </Link>
                </div>
              )}

              {/* Skip */}
              <button
                type="button"
                onClick={skipStep}
                className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1"
              >
                Passer cette étape
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Liste des étapes restantes */}
        {missing.length > 1 && (
          <div className="mt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Prochaines étapes
            </p>
            <div className="space-y-2">
              {missing.map((m, i) => (
                <button
                  key={m.key + i}
                  type="button"
                  onClick={() => setStepIndex(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    i === stepIndex
                      ? "border-rose-300 bg-rose-50"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{m.label}</p>
                    <p className="text-[11px] text-slate-400">+{m.points} points</p>
                  </div>
                  {i === stepIndex ? (
                    <span className="text-[10px] font-black text-rose-500 uppercase">En cours</span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-slate-400">
          Les profils complets matchent jusqu&apos;à{" "}
          <span className="text-pink-500 font-bold">3× plus</span> sur LoveLink 💜
        </p>
      </div>
    </div>
  );
}
