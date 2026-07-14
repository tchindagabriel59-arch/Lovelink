"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Crown,
  Sparkles,
  ArrowRight,
  Heart,
  Zap,
  Eye,
  Star,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useUser } from "../../layout";

type VerifyStatus = "loading" | "success" | "pending" | "failed" | "error";

export default function PremiumSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useUser();

  const tx = searchParams.get("tx");

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [billingPeriod, setBillingPeriod] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!tx) {
      setStatus("error");
      setMessage("Transaction ID manquant");
      return;
    }

    verifyPayment();
  }, [tx]);

  const verifyPayment = async () => {
    try {
      const res = await fetch(`/api/payment/verify?tx=${tx}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Erreur lors de la vérification");
        return;
      }

      setPlan(data.plan || "");
      setBillingPeriod(data.billingPeriod || "");
      setAmount(data.amount || 0);
      setMessage(data.message || "");

      if (data.status === "success") {
        setStatus("success");
        // Rafraîchir les infos user (isPremium sera à jour)
        refreshUser();
      } else if (data.status === "failed") {
        setStatus("failed");
      } else if (data.status === "pending") {
        setStatus("pending");
        // Retenter dans 3 secondes (max 10 fois = 30s)
        if (retryCount < 10) {
          setTimeout(() => {
            setRetryCount((c) => c + 1);
            verifyPayment();
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Erreur verify:", error);
      setStatus("error");
      setMessage("Erreur réseau. Veuillez rafraîchir la page.");
    }
  };

  const planLabel = plan === "premium" ? "Premium" : "Gold";
  const periodLabel = billingPeriod === "monthly" ? "1 mois" : "1 an";

  // ============================================
  // ÉTAT : LOADING / PENDING
  // ============================================
  if (status === "loading" || status === "pending") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 border border-slate-100 text-center shadow-xl">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Vérification en cours...
          </h1>
          <p className="text-slate-600 mb-2">
            Nous vérifions votre paiement auprès de CinetPay.
          </p>
          <p className="text-sm text-slate-400">
            Cela peut prendre quelques secondes.
          </p>
          {retryCount > 0 && (
            <p className="text-xs text-slate-400 mt-4">
              Tentative {retryCount}/10...
            </p>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // ÉTAT : FAILED
  // ============================================
  if (status === "failed") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 border border-slate-100 text-center shadow-xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Paiement échoué
          </h1>
          <p className="text-slate-600 mb-6">
            {message || "Votre paiement n'a pas pu être finalisé."}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/premium"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Réessayer
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ÉTAT : ERROR
  // ============================================
  if (status === "error") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 border border-slate-100 text-center shadow-xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Erreur de vérification
          </h1>
          <p className="text-slate-600 mb-6">{message}</p>
          <Link
            href="/premium"
            className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Retour à la page Premium
          </Link>
        </div>
      </div>
    );
  }

  // ============================================
  // ÉTAT : SUCCESS 🎉
  // ============================================
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 lg:p-6">
      <div className="max-w-2xl w-full">
        {/* Card principale */}
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-3xl p-1 shadow-2xl">
          <div className="bg-white rounded-3xl p-8 lg:p-12 text-center">
            {/* Icône animée */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <Crown className="w-12 h-12 text-amber-500" fill="currentColor" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
              <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-orange-400 animate-pulse" />
            </div>

            {/* Titre */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-amber-900">
                Paiement confirmé
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Bienvenue dans <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{planLabel}</span> ! 🎉
            </h1>

            <p className="text-lg text-slate-600 mb-2">
              Votre abonnement <strong>{planLabel}</strong> est actif pour{" "}
              <strong>{periodLabel}</strong>.
            </p>
            <p className="text-sm text-slate-500 mb-8">
              Montant : <strong>{amount.toLocaleString("fr-FR")} FCFA</strong>
            </p>

            {/* Avantages débloqués */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Vos avantages sont maintenant actifs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Voir qui vous like
                    </p>
                    <p className="text-xs text-slate-500">Photos débloquées</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-blue-600" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Super Likes x5
                    </p>
                    <p className="text-xs text-slate-500">Au lieu de 1/jour</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-50 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Boost x3/jour
                    </p>
                    <p className="text-xs text-slate-500">Au lieu de 1/24h</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center">
                    <EyeOff className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Mode Incognito
                    </p>
                    <p className="text-xs text-slate-500">Profil invisible</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/discover"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                <Heart className="w-5 h-5" />
                Découvrir des profils
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/likes-recus"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-all"
              >
                <Eye className="w-5 h-5" />
                Voir qui vous like
              </Link>
            </div>

            <p className="text-xs text-slate-400 mt-6">
              Un email de confirmation a été envoyé à votre adresse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
