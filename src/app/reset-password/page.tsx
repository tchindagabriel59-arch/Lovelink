// src/app/reset-password/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Smartphone, Lock, CheckCircle2, ArrowLeft, Loader2, KeyRound } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const p = searchParams.get("phone");
    if (p) setPhone(p);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || phone.trim().length < 8) {
      setError("Veuillez saisir un numéro WhatsApp valide.");
      return;
    }

    if (!code || code.trim().length < 4) {
      setError("Saisis le code reçu sur WhatsApp.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: code.trim(), newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de la réinitialisation.");
      }

      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de réseau.");
    } finally {
      setLoading(false);
    }
  };

  if (isDone) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Mot de passe réinitialisé !</h2>
        <p className="text-sm text-slate-300 mb-6">
          Ton mot de passe a été mis à jour avec succès. Tu peux maintenant te connecter à LoveLink.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-pink-500/25 transition"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-950/60 border border-pink-500/20 rounded-2xl p-3.5 text-xs text-slate-300 mb-2">
        📱 <strong className="text-pink-400">Demande transmise !</strong> Un administrateur va t'envoyer ton code secret sur WhatsApp (ex: <code className="text-slate-200">Lk-XXXXXXXX</code>).
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
  Numéro WhatsApp ou Email
</label>
        <div className="relative">
          <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ex: 2376XXXXXXXX"
            required
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Code reçu par WhatsApp
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex: Lk-a1b2c3d4"
            required
            disabled={loading}
            className="w-full bg-slate-950 border border-pink-500/40 rounded-2xl py-3 pl-11 pr-4 text-sm font-mono text-pink-300 placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Nouveau mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 6 caractères"
            required
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
          Confirmer le nouveau mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme le mot de passe"
            required
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition transform active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Modification en cours...</span>
          </>
        ) : (
          <span>Valider et Réinitialiser</span>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <Link
          href="/forgot-password"
          className="inline-flex items-center text-sm text-slate-400 hover:text-pink-400 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 via-rose-300 to-white bg-clip-text text-transparent">
            Définir mon mot de passe
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Entre le code reçu par l'admin et ton nouveau mot de passe.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-8 text-slate-400">Chargement...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
