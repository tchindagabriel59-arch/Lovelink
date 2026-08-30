"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setHint("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }

      setMessage(data.message);
      if (data.hint === "email") {
        setHint("📬 Regarde ta boîte email (et les spams).");
      } else if (data.hint === "push") {
        setHint("📱 Regarde tes notifications LoveLink sur le téléphone.");
      } else if (data.hint === "phone_no_channel") {
        setHint(
          "⚠️ Active les notifications LoveLink sur ton téléphone, ou utilise l'email du compte si tu en as un. Sinon contacte le support."
        );
      }

      // Redirige vers saisie du code après 1.5s
      setTimeout(() => {
        router.push(
          `/reset-password?id=${encodeURIComponent(identifier.trim())}`
        );
      }, 1500);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-rose-500 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
          <KeyRound className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Mot de passe oublié ?
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Entre ton email ou ton numéro WhatsApp. On t&apos;envoie un code à 6
          chiffres.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email ou numéro WhatsApp
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ex: 651387914 ou email@gmail.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl">
              {message}
              {hint && <p className="mt-2 font-medium">{hint}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Envoi...
              </>
            ) : (
              "Recevoir mon code"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
