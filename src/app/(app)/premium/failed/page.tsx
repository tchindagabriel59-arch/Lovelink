"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  XCircle,
  RefreshCw,
  ArrowLeft,
  HelpCircle,
  Mail,
  ArrowRight,
  Wallet,
  CreditCard,
  Phone,
  Home,
} from "lucide-react";

export default function PremiumFailedPage() {
  const searchParams = useSearchParams();
  const tx = searchParams.get("tx");

  const [reason, setReason] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [plan, setPlan] = useState<string>("");
  const [billingPeriod, setBillingPeriod] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tx) {
      setLoading(false);
      return;
    }

    // Récupérer les détails du paiement échoué
    fetch(`/api/payment/verify?tx=${tx}`)
      .then((res) => res.json())
      .then((data) => {
        setReason(data.message || "");
        setAmount(data.amount || 0);
        setPlan(data.plan || "");
        setBillingPeriod(data.billingPeriod || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tx]);

  const planLabel = plan === "premium" ? "Premium" : plan === "gold" ? "Gold" : "";
  const periodLabel =
    billingPeriod === "monthly" ? "1 mois" : billingPeriod === "yearly" ? "1 an" : "";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 lg:p-6">
      <div className="max-w-2xl w-full">
        {/* Card principale */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 px-8 py-10 text-center border-b border-red-100">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Paiement non finalisé
            </h1>
            <p className="text-lg text-slate-600">
              Aucun montant n&apos;a été débité de votre compte.
            </p>
          </div>

          {/* Corps */}
          <div className="p-8 lg:p-10">
            {/* Détails du paiement */}
            {planLabel && (
              <div className="bg-slate-50 rounded-2xl p-5 mb-6">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">
                  Tentative de paiement
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      LoveLink {planLabel}
                    </p>
                    <p className="text-sm text-slate-500">
                      Abonnement {periodLabel}
                    </p>
                  </div>
                  {amount > 0 && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">
                        {amount.toLocaleString("fr-FR")}
                      </p>
                      <p className="text-xs text-slate-500">FCFA</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raison */}
            {reason && !loading && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Raison :</strong> {reason}
                </p>
              </div>
            )}

            {/* Raisons possibles */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-slate-500" />
                Que s&apos;est-il passé ?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Solde insuffisant
                    </p>
                    <p className="text-xs text-slate-500">
                      Vérifiez le solde de votre compte Mobile Money
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Code de confirmation non validé
                    </p>
                    <p className="text-xs text-slate-500">
                      Vous avez fermé la fenêtre ou dépassé le temps de validation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Problème avec votre moyen de paiement
                    </p>
                    <p className="text-xs text-slate-500">
                      Carte bloquée, plafond dépassé, ou opérateur indisponible
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/premium"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Réessayer le paiement
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
              >
                <Home className="w-5 h-5" />
                Retour à l&apos;accueil
              </Link>
            </div>

            {/* Support */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 mb-3">
                Besoin d&apos;aide ? Notre équipe est là pour vous.
              </p>
              <a
                href="mailto:lovelink237@gmail.com"
                className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
              >
                <Mail className="w-4 h-4" />
                lovelink237@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Note rassurante en bas */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <Link href="/premium" className="text-amber-600 hover:underline font-semibold">
              Choisir un autre plan
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
