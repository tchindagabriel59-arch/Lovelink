// src/app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Smartphone,
  User,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 3) {
      setError("Indique ton nom complet utilisé lors de l'inscription.");
      return;
    }
    if (phone.trim().length < 8) {
      setError("Indique ton numéro WhatsApp.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi.");
      setDone(true);
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
            <p className="text-xs text-slate-400">Réinitialisation assistée par l&apos;équipe</p>
          </div>
        </div>

        {done ? (
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Demande envoyée ✅</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Notre équipe a reçu ta demande. Tu recevras ton{" "}
              <span className="text-pink-300 font-semibold">nouveau mot de passe sur WhatsApp</span>{" "}
              très bientôt.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-pink-500/25 transition"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              Indique le <strong>nom complet</strong> de ton profil LoveLink et ton{" "}
              <strong>WhatsApp</strong>. On te renverra un mot de passe temporaire rapidement.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nom complet (inscription)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Mohamed Diallo"
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Ton WhatsApp
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Envoi de la demande...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    <span>Envoyer ma demande</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
