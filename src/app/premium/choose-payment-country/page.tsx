"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

type PaymentCountry = "CM" | "OTHER";

function CountryChoiceContent() {
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan");
  const period = searchParams.get("period");
  const returnPath =
    searchParams.get("returnPath") ||
    (plan === "boost" ? "/discover" : "/premium");

  const [loadingCountry, setLoadingCountry] =
    useState<PaymentCountry | null>(null);

  const [error, setError] = useState("");

  const selectCountry = async (
    country: PaymentCountry
  ) => {
    if (!plan || !period || loadingCountry) return;

    setLoadingCountry(country);
    setError("");

    try {
      const response = await fetch(
        "/api/payment/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan,
            period,
            country,
            returnPath,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible de préparer le paiement"
        );
      }

      if (!data.paymentUrl) {
        throw new Error(
          "Aucun lien de paiement reçu"
        );
      }

      window.location.assign(data.paymentUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue"
      );

      setLoadingCountry(null);
    }
  };

  if (!plan || !period) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
        <div className="max-w-sm w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center">
          <h1 className="text-xl font-bold">
            Paiement invalide
          </h1>

          <p className="text-slate-400 mt-2">
            Le plan ou la durée n’a pas été transmis.
          </p>

          <a
            href="/premium"
            className="inline-block mt-5 rounded-xl bg-rose-500 px-5 py-3 font-bold"
          >
            Retour
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-3xl">
            🌍
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Choisis ton pays
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Nous afficherons le moyen de paiement
            disponible dans ton pays.
          </p>
        </div>

        <div className="mt-7 space-y-4">
          <button
            type="button"
            disabled={loadingCountry !== null}
            onClick={() => selectCountry("CM")}
            className="w-full rounded-2xl border border-amber-400/30 bg-slate-800 p-4 text-left transition hover:border-amber-400 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🇨🇲</span>

              <div>
                <p className="font-bold text-white">
                  Cameroun
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Paiement direct MTN Mobile Money
                </p>

                {loadingCountry === "CM" && (
                  <p className="mt-2 text-xs font-semibold text-amber-400">
                    Préparation du paiement…
                  </p>
                )}
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={loadingCountry !== null}
            onClick={() => selectCountry("OTHER")}
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-left transition hover:border-rose-400 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🌍</span>

              <div>
                <p className="font-bold text-white">
                  Autres pays
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Sénégal, Côte d’Ivoire, Bénin,
                  Togo, Mali, Burkina Faso…
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  PayDunya : Wave, Orange Money,
                  MTN, Moov et carte
                </p>

                {loadingCountry === "OTHER" && (
                  <p className="mt-2 text-xs font-semibold text-rose-400">
                    Ouverture de PayDunya…
                  </p>
                )}
              </div>
            </div>
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <a
          href={returnPath}
          className="mt-6 block text-center text-sm text-slate-400 hover:text-white"
        >
          Annuler et revenir
        </a>
      </section>
    </main>
  );
}

export default function CountryChoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          Chargement…
        </div>
      }
    >
      <CountryChoiceContent />
    </Suspense>
  );
}
