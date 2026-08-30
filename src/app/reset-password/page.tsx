"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState(searchParams.get("id") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      setError("Minimum 6 caractères");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          code,
          newPassword: password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">✅</p>
        <p className="font-bold text-lg text-slate-900">Mot de passe mis à jour !</p>
        <p className="text-slate-500 text-sm mt-2">Redirection vers la connexion...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Email ou numéro
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-rose-400"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Code à 6 chiffres
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-rose-400 tracking-[0.3em] text-center text-xl font-black"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Nouveau mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-rose-400"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Confirmer
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-rose-400"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Validation...
          </>
        ) : (
          "Changer mon mot de passe"
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8">
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-rose-500 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Nouveau mot de passe
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Entre le code reçu et choisis un nouveau mot de passe.
        </p>
        <Suspense fallback={<p>Chargement...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
