// src/app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Loader2,
  KeyRound,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

// Numéro test Meta (en prod, remplace par ton numéro WhatsApp Business)
const WHATSAPP_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "15556775813";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"input" | "whatsapp_open">("input");
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || phone.trim().length < 8) {
      setError("Renseigne un numéro WhatsApp valide.");
      return;
    }

    setStep("whatsapp_open");
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent("Bonjour LoveLink, je souhaite réinitialiser mon mot de passe.");
    const url = `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${text}`;
    window.open(url, "_blank");
    setHasOpenedWhatsApp(true);
  };

  const handleSendCode = async () => {
    setError(null);
    setSuccessMsg(null);
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

      // Redirection auto vers /reset-password après 1.5s
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
            <p className="text-xs text-slate-400">Récupération 100% gratuite par WhatsApp</p>
          </div>
        </div>

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

        {step === "input" ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Saisis ton numéro WhatsApp pour démarrer la réinitialisation.
            </p>

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
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition transform active:scale-[0.98]"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Pour recevoir ton code gratuitement, effectue ces 2 petites étapes :
              </p>

              {/* Étape 1 : Ouvrir WhatsApp */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-pink-400 uppercase tracking-wider">
                  Étape 1
                </span>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>1. Ouvrir WhatsApp & envoyer "Bonjour"</span>
                </button>
              </div>

              {/* Étape 2 : Recevoir le code */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-pink-400 uppercase tracking-wider">
                  Étape 2
                </span>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-pink-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Envoi du code...</span>
                    </>
                  ) : (
                    <>
                      {hasOpenedWhatsApp && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                      <span>2. M'envoyer le code maintenant</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep("input")}
              className="text-xs text-slate-500 hover:text-slate-300 transition underline w-full text-center"
            >
              Modifier le numéro ({phone})
            </button>
          </div>
        )}

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
