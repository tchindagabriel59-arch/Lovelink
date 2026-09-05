"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, birthDate }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");

      router.push(data.redirectUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-b from-pink-50 to-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-pink-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié ?</h1>
          <p className="text-sm text-gray-500 mt-2">
            Confirmez votre identité pour choisir un nouveau mot de passe immédiatement.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail du compte
            </label>
            <input
              type="email"
              required
              placeholder="ex: marie@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de naissance
            </label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Continuer"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm font-medium text-pink-600 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
