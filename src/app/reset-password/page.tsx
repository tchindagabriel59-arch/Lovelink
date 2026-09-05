"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setError("Jeton de réinitialisation manquant. Veuillez recommencer la procédure.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
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
          <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-500 mt-2">
            Choisissez un mot de passe sécurisé pour votre compte LoveLink.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-50 rounded-xl border border-green-200 text-center">
            <p className="font-semibold">✓ Mot de passe réinitialisé !</p>
            <p className="text-xs mt-1">Redirection vers la page de connexion dans quelques instants...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-pink-200 transition duration-200 disabled:opacity-50"
            >
              {loading ? "Mise à jour..." : "Enregistrer le mot de passe"}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm font-medium text-pink-600 hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
