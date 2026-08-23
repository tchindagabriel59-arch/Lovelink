"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Gift,
  Sparkles,
  Camera,
  Check,
  Lock,
  Briefcase,
  MapPin,
  Users,
  Search,
  Calendar,
  Mail,
  User,
} from "lucide-react";

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

const TOTAL_STEPS = 8;

const lookingForOptions = [
  { value: "relationship", label: "Relation sérieuse", emoji: "💕" },
  { value: "marriage", label: "Le mariage", emoji: "💍" },
  { value: "friendship", label: "Amitié", emoji: "🤝" },
  { value: "casual", label: "Sans prise de tête", emoji: "😊" },
];

const maritalOptions = [
  { value: "single", label: "Célibataire", emoji: "✨" },
  { value: "divorced", label: "Divorcé(e)", emoji: "🔄" },
  { value: "widowed", label: "Veuf / Veuve", emoji: "🕊️" },
  { value: "separated", label: "Séparé(e)", emoji: "📉" },
];

const discoveryOptions = [
  { value: "facebook", label: "Facebook / Instagram", emoji: "📱" },
  { value: "friend", label: "Un(e) ami(e)", emoji: "👥" },
  { value: "whatsapp", label: "WhatsApp", emoji: "💬" },
  { value: "google", label: "Google", emoji: "🔍" },
  { value: "tiktok", label: "TikTok", emoji: "🎵" },
  { value: "other", label: "Autre", emoji: "🌟" },
];

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [genderLocked, setGenderLocked] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    gender: "",
    lookingFor: "",
    city: "",
    country: "",
    occupation: "",
    maritalStatus: "",
    discoverySource: "",
  });

  const [acceptCGU, setAcceptCGU] = useState(false);
  const [acceptAge, setAcceptAge] = useState(false);

  useEffect(() => {
    if (refCode) localStorage.setItem("referralCode", refCode);
  }, [refCode]);

  const activeReferralCode =
    refCode ||
    (typeof window !== "undefined"
      ? localStorage.getItem("referralCode")
      : null);

  const setField = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!form.firstName.trim()) {
          setError("Indique ton prénom");
          return false;
        }
        return true;
      case 2:
        if (!form.email.trim() || !form.password) {
          setError("Email et mot de passe requis");
          return false;
        }
        if (form.password.length < 6) {
          setError("Mot de passe : minimum 6 caractères");
          return false;
        }
        if (form.password !== form.confirmPassword) {
          setError("Les mots de passe ne correspondent pas");
          return false;
        }
        return true;
      case 3:
        if (!form.birthDate) {
          setError("Indique ta date de naissance");
          return false;
        }
        if (calculateAge(form.birthDate) < 18) {
          setError("Tu dois avoir au moins 18 ans");
          return false;
        }
        return true;
      case 4:
        if (!form.gender) {
          setError("Choisis ton genre (choix définitif)");
          return false;
        }
        return true;
      case 5:
        if (!form.lookingFor) {
          setError("Dis-nous ce que tu recherches");
          return false;
        }
        return true;
      case 6:
        if (!form.city.trim()) {
          setError("Indique ta ville");
          return false;
        }
        return true;
      case 7:
        if (!form.maritalStatus) {
          setError("Indique ta situation");
          return false;
        }
        if (!form.discoverySource) {
          setError("Dis-nous comment tu nous as connus");
          return false;
        }
        return true;
      case 8:
        if (!acceptAge) {
          setError("Tu dois certifier avoir 18 ans ou plus");
          return false;
        }
        if (!acceptCGU) {
          setError("Tu dois accepter les CGU");
          return false;
        }
        if (!photoFile) {
          setError("Ajoute une photo pour continuer (obligatoire)");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (step === 4) setGenderLocked(true);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    if (step === 5 && genderLocked) {
      setStep(3);
    } else {
      setStep((s) => Math.max(s - 1, 1));
    }
    setError("");
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Fichier image uniquement");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Photo trop lourde (max 10 Mo)");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError("");

    try {
      // 1. Upload binaire de la photo sur Cloudinary
      let uploadedPhotoUrl = "";
      if (photoFile) {
        try {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": photoFile.type || "image/jpeg",
            },
            body: photoFile, // Envoi binaire directement
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedPhotoUrl = uploadData.url || uploadData.display_url || "";
          } else {
            const errData = await uploadRes.json().catch(() => null);
            setError(
              errData?.error || "Erreur d'envoi de la photo. Réessaie."
            );
            setLoading(false);
            return;
          }
        } catch {
          setError("Impossible d'envoyer la photo. Vérifie ta connexion.");
          setLoading(false);
          return;
        }
      }

      // 2. Création du compte avec la photoUrl enregistrée direct en DB
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName || form.firstName,
          birthDate: form.birthDate,
          gender: form.gender,
          lookingFor: form.lookingFor,
          city: form.city,
          country: form.country || "",
          occupation: form.occupation,
          maritalStatus: form.maritalStatus,
          discoverySource: form.discoverySource,
          photoUrl: uploadedPhotoUrl,
          referralCode: activeReferralCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq(
          "track",
          "CompleteRegistration",
          {
            content_name: "LoveLink Registration",
            status: true,
            currency: "USD",
            value: 0,
          },
          { eventID: data.metaEventId }
        );
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("referralCode");
      }

      if (data.referralApplied) {
        router.push("/welcome?referral=success&onboarded=1");
      } else {
        router.push("/welcome?onboarded=1");
      }
    } catch {
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-rose-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span className="font-bold gradient-text">LoveLink</span>
          </Link>
          <span className="text-xs font-bold text-slate-500">
            {step}/{TOTAL_STEPS}
          </span>
        </div>
        <div className="max-w-lg mx-auto mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg">
          {activeReferralCode && step === 1 && (
            <div className="mb-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-0.5 shadow-lg">
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
                <Gift className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-sm font-black text-slate-900">
                    Code {activeReferralCode}
                  </p>
                  <p className="text-xs text-slate-600">
                    7 jours Premium offerts à l&apos;inscription 🎁
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            {/* STEP 1 : Prénom */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-2">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Comment tu t&apos;appelles ?
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Ton prénom sera visible sur ton profil
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Prénom *
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none text-lg"
                    placeholder="Ex: Aïssatou"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Nom (optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none"
                    placeholder="Ex: Diallo"
                  />
                </div>
              </div>
            )}

            {/* STEP 2 : Email / MDP */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-2">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Crée tes identifiants
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Pour te connecter en toute sécurité
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    autoFocus
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-rose-400 outline-none"
                    placeholder="ton@email.com"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Mot de passe *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-rose-400 outline-none pr-12"
                    placeholder="Min. 6 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-10 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Confirmer *
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setField("confirmPassword", e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-rose-400 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* STEP 3 : Date de naissance */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-2">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Quelle est ta date de naissance ?
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    🔞 Réservé aux 18 ans et plus
                  </p>
                </div>
                <input
                  autoFocus
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setField("birthDate", e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                    .toISOString()
                    .split("T")[0]}
                  className="w-full px-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-rose-400 outline-none text-lg"
                />
                {form.birthDate && calculateAge(form.birthDate) >= 18 && (
                  <p className="text-center text-emerald-600 font-bold text-sm">
                    ✓ Tu as {calculateAge(form.birthDate)} ans
                  </p>
                )}
              </div>
            )}

            {/* STEP 4 : Genre IRRÉVERSIBLE */}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-2">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Tu es…
                  </h1>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-800">
                    <Lock className="w-3.5 h-3.5" />
                    Choix définitif — non modifiable ensuite
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "male", label: "Homme", emoji: "👨" },
                    { value: "female", label: "Femme", emoji: "👩" },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setField("gender", g.value)}
                      className={`p-6 rounded-2xl border-2 text-center transition ${
                        form.gender === g.value
                          ? "border-rose-500 bg-rose-50 shadow-lg scale-[1.02]"
                          : "border-slate-200 hover:border-rose-300 bg-white"
                      }`}
                    >
                      <div className="text-4xl mb-2">{g.emoji}</div>
                      <div className="font-black text-slate-900">{g.label}</div>
                      {form.gender === g.value && (
                        <div className="mt-2 text-rose-500 flex justify-center">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "non_binary", label: "Non-binaire", emoji: "🌈" },
                    { value: "other", label: "Autre", emoji: "💫" },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setField("gender", g.value)}
                      className={`p-4 rounded-2xl border-2 text-center transition ${
                        form.gender === g.value
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{g.emoji}</div>
                      <div className="font-bold text-sm text-slate-800">{g.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5 : Recherche */}
            {step === 5 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-2">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-white fill-white" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Que recherches-tu ?
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Sois honnête, ça aide les bons matchs
                  </p>
                </div>
                <div className="space-y-3">
                  {lookingForOptions.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setField("lookingFor", o.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition text-left ${
                        form.lookingFor === o.value
                          ? "border-rose-500 bg-rose-50 shadow-md"
                          : "border-slate-200 hover:border-rose-300"
                      }`}
                    >
                      <span className="text-3xl">{o.emoji}</span>
                      <span className="font-bold text-slate-900 flex-1">{o.label}</span>
                      {form.lookingFor === o.value && (
                        <Check className="w-5 h-5 text-rose-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6 : Ville + Job */}
            {step === 6 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-2">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Où vis-tu ?
                  </h1>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Ville *
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-rose-400 outline-none"
                    placeholder="Ex: Dakar, Yaoundé, Abidjan..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Pays (optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-rose-400 outline-none"
                    placeholder="Ex: Sénégal, Cameroun..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Profession
                  </label>
                  <input
                    type="text"
                    value={form.occupation}
                    onChange={(e) => setField("occupation", e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-rose-400 outline-none"
                    placeholder="Ex: Étudiant, Commerçant, Infirmière..."
                  />
                </div>
              </div>
            )}

            {/* STEP 7 : Situation + Source */}
            {step === 7 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h1 className="text-2xl font-black text-slate-900">
                    Encore 2 infos…
                  </h1>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3">
                    Situation matrimoniale *
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {maritalOptions.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setField("maritalStatus", o.value)}
                        className={`p-3 rounded-xl border-2 text-sm font-bold transition ${
                          form.maritalStatus === o.value
                            ? "border-rose-500 bg-rose-50 text-rose-700"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        {o.emoji} {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Comment as-tu connu LoveLink ? *
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {discoveryOptions.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setField("discoverySource", o.value)}
                        className={`p-3 rounded-xl border-2 text-sm font-bold transition ${
                          form.discoverySource === o.value
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        {o.emoji} {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8 : Photo + CGU (CORRIGÉ SANS CAPTURE="USER") */}
            {step === 8 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-2">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Ajoute ta photo
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Sans photo, personne ne te voit. Obligatoire 📸
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[3/4] max-h-72 rounded-3xl border-2 border-dashed border-rose-300 bg-rose-50/50 flex flex-col items-center justify-center overflow-hidden relative"
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-rose-400 mb-2" />
                      <span className="font-bold text-rose-600">
                        Appuie pour choisir une photo
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        Galerie ou Appareil photo (max 10 Mo)
                      </span>
                    </>
                  )}
                </button>
                {/* ✅ SANS capture="user" = laisse le choix Galerie / Caméra */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhoto}
                />
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-sm font-bold text-rose-600"
                  >
                    Changer de photo
                  </button>
                )}

                <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <input
                    type="checkbox"
                    id="acceptAge"
                    checked={acceptAge}
                    onChange={(e) => setAcceptAge(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-rose-500 cursor-pointer"
                  />
                  <label htmlFor="acceptAge" className="text-sm text-slate-700 cursor-pointer">
                    Je certifie avoir <strong>au moins 18 ans</strong>
                  </label>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <input
                    type="checkbox"
                    id="acceptCGU"
                    checked={acceptCGU}
                    onChange={(e) => setAcceptCGU(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-purple-500 cursor-pointer"
                  />
                  <label htmlFor="acceptCGU" className="text-sm text-slate-700 cursor-pointer">
                    J&apos;accepte les{" "}
                    <Link href="/cgu" target="_blank" className="text-rose-500 underline font-bold">
                      CGU
                    </Link>{" "}
                    et la{" "}
                    <Link
                      href="/confidentialite"
                      target="_blank"
                      className="text-rose-500 underline font-bold"
                    >
                      Confidentialité
                    </Link>
                  </label>
                </div>
              </div>
            )}

            {/* NAV BUTTONS */}
            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/25"
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-2xl font-black shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    "Création du compte..."
                  ) : (
                    <>
                      Terminer
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-rose-500 font-bold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-rose-50">
          <Heart className="w-12 h-12 text-rose-500 fill-rose-500 animate-pulse" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
