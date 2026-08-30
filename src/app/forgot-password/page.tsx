// src/app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Smartphone, ArrowRight, ArrowLeft, Loader2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!phone || phone.trim().length < 8) {
      setError("Renseigne un numéro WhatsApp valide.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setSuccessMsg(data.message || "Code envoyé sur WhatsApp !");

      // Redirection automatique vers /reset-password après 1.5s
      setTimeout(() => {
        const encodedPhone = encodeURIComponent(data.phone || phone);
        router.push(`/reset-password?phone=${encodedPhone}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-slate-400 hover:text-pink-400 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la connexion
        </Link>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 via-rose-300 to-white bg-clip-text text-transparent">
              Mot de passe oublié ?
            </h1>
            <p className="text-xs text-slate-400">Récupération par WhatsApp</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Entre le numéro WhatsApp lié à ton compte. Nous t’enverrons un code à 6 chiffres.
        </p>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Numéro WhatsApp
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 6XXXXXXXX ou 7XXXXXXXX"
                required
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition disabled:opacity-50"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Cameroun (6xx...), Sénégal (7xx...), ou format international (+221...)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Envoi du code...</span>
              </>
            ) : (
              <>
                <span>Recevoir le code sur WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <Link
            href="/reset-password"
            className="text-xs text-slate-400 hover:text-pink-400 transition"
          >
            Tu as déjà un code ? <span className="underline font-semibold">Saisir le code ici</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
