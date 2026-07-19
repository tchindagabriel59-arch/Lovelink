"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowRight, Eye, EyeOff } from "lucide-react";

// Déclaration TypeScript pour Facebook Pixel
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "",
  });
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [acceptAge, setAcceptAge] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Calcul de l'âge depuis la date de naissance
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.firstName || !form.lastName) {
        setError("Veuillez remplir votre nom et prénom");
        return;
      }
    }
    if (step === 2) {
      if (!form.email || !form.password || !form.confirmPassword) {
        setError("Veuillez remplir tous les champs");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }
      if (form.password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.birthDate || !form.gender) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    // Vérification de l'âge (18 ans minimum)
    const age = calculateAge(form.birthDate);
    if (age < 18) {
      setError("Vous devez avoir au moins 18 ans pour vous inscrire sur LoveLink.");
      return;
    }

    // Vérification cases à cocher
    if (!acceptAge) {
      setError("Vous devez certifier avoir au moins 18 ans.");
      return;
    }
    if (!acceptCGU) {
      setError("Vous devez accepter les CGU et la Politique de confidentialité.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        return;
      }

      // 🎯 FACEBOOK PIXEL - Tracker l'inscription réussie
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", "CompleteRegistration", {
          content_name: "LoveLink Registration",
          status: true,
          currency: "USD",
          value: 0,
        });
        console.log("✅ Facebook Pixel: CompleteRegistration tracked");
      }

      router.push("/dashboard");
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-6">
      <div className="absolute top-20 right-20 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            <span className="text-2xl font-bold gradient-text">LoveLink</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Créer un compte</h1>
          <p className="mt-2 text-slate-600">Rejoignez notre communauté</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s <= step
                    ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 mx-1 rounded transition-all ${
                    s < step ? "bg-gradient-to-r from-rose-500 to-purple-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-3xl p-8 shadow-xl"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-semibold mb-2">Qui êtes-vous ?</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Prénom
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white/80"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nom
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white/80"
                  placeholder="Votre nom"
                />
              </div>
              <button
                type="button"
                onClick={nextStep}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-rose-500/25 transition-all"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-semibold mb-2">Vos identifiants</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white/80"
                  placeholder="votre@email.com"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mot de passe
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white/80 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white/80"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-rose-500/25 transition-all"
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-semibold mb-2">Un peu plus sur vous</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Date de naissance
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white/80"
                />
                <p className="text-xs text-slate-500 mt-1">
                  🔞 LoveLink est réservé aux personnes majeures (18 ans ou plus).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Genre
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white/80"
                >
                  <option value="">Sélectionnez...</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="non_binary">Non-binaire</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* CASE 18+ */}
              <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
                <input
                  type="checkbox"
                  id="acceptAge"
                  checked={acceptAge}
                  onChange={(e) => setAcceptAge(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-rose-500 cursor-pointer"
                />
                <label htmlFor="acceptAge" className="text-sm text-slate-700 cursor-pointer">
                  Je certifie sur l'honneur avoir <strong>au moins 18 ans</strong> et
                  disposer de la capacité juridique pour m'inscrire sur LoveLink.
                </label>
              </div>

              {/* CASE CGU */}
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <input
                  type="checkbox"
                  id="acceptCGU"
                  checked={acceptCGU}
                  onChange={(e) => setAcceptCGU(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-purple-500 cursor-pointer"
                />
                <label htmlFor="acceptCGU" className="text-sm text-slate-700 cursor-pointer">
                  J'accepte les{" "}
                  <Link href="/cgu" target="_blank" className="text-rose-500 underline font-semibold">
                    Conditions Générales d'Utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link href="/confidentialite" target="_blank" className="text-rose-500 underline font-semibold">
                    Politique de Confidentialité
                  </Link>
                  .
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? "Inscription..." : "Créer mon compte"}
                  {!loading && <Heart className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-slate-600">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-rose-500 hover:text-rose-600 font-semibold">
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
