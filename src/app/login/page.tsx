"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Lock,
  ArrowRight,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Numéro (ou email) et mot de passe requis");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.trim(), // téléphone OU email — l’API gère les deux
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Identifiant ou mot de passe incorrect");
      }

      router.push("/discover");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la connexion";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/20">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Bon retour ! 💕</h1>
          <p className="text-sm text-slate-500 mt-1">
            Connecte-toi à ton compte LoveLink
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Téléphone OU Email */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Numéro WhatsApp ou Email *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                }}
                placeholder="Ex: 651387914 ou ton@email.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:border-rose-500 outline-none transition"
                autoComplete="username"
                required
              />
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1.5">
              💡 Tu peux te connecter avec ton numéro ou ton email.
            </p>
          </div>

          {/* Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mot de passe *
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Ton mot de passe"
                className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:border-rose-500 outline-none transition"
                autoComplete="current-password"
                required
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              "Connexion..."
            ) : (
              <>
                Se connecter
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-bold text-rose-500 hover:underline">
              S&apos;inscrire
            </Link>
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-500 transition"
          >
            <HelpCircle className="w-4 h-4" />
            Besoin d&apos;aide pour te connecter ?
          </Link>
        </div>
      </div>
    </div>
  );
}
