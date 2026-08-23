"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Rocket, MessageCircle, Copy, CheckCircle2, ShieldCheck } from "lucide-react";

function ManualCMPaymentContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "boost";
  const amount = searchParams.get("amount") || "1 500";
  const userId = searchParams.get("userId") || "0";

  // 🔴 METS TES PROPRES NUMÉROS ICI :
  const mtnNumber = "651387914"; // 
  const mtnName = "Tchinda Dassi Gabriel Anicett"; // 
  const whatsappNumber = "237651387914"; //

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Numéro copié dans le presse-papier !");
  };

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Bonjour, je viens d'envoyer ${amount} FCFA pour le ${plan} LoveLink. Mon ID Utilisateur est : ${userId}`;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl shadow-2xl p-6 border border-slate-700">
        
        {/* Header */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-tr from-yellow-500 to-amber-300 p-4 rounded-full shadow-lg text-slate-900">
            <Rocket size={36} />
          </div>
        </div>

        <h1 className="text-2xl font-black text-center text-white mb-1">
          Paiement MTN / Orange
        </h1>
        <p className="text-slate-400 text-sm text-center mb-6">
          Effectue le transfert direct pour activer ton <span className="text-amber-400 font-bold">{plan}</span> immédiatement.
        </p>

        {/* Encadré Montant */}
        <div className="bg-slate-900/80 p-4 rounded-2xl text-center border border-slate-700/80 mb-6">
          <span className="text-xs text-slate-400 uppercase font-semibold">Montant à transférer</span>
          <p className="text-3xl font-extrabold text-amber-400">{amount} FCFA</p>
        </div>

        {/* Instructions */}
        <div className="space-y-5">
          {/* Étape 1 */}
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex gap-3 items-start">
            <div className="bg-amber-400 text-slate-900 font-black w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
              1
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-slate-200">Envoie le montant au numéro MTN :</p>
              <p className="text-xs text-slate-400 mb-2">Compte : <span className="text-white font-medium">{mtnName}</span></p>
              
              <div className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
                <span className="font-mono font-bold text-amber-400 text-base">{mtnNumber}</span>
                <button
                  onClick={() => copyToClipboard(mtnNumber)}
                  className="bg-slate-700 hover:bg-slate-600 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-slate-200 transition-colors"
                >
                  <Copy size={14} /> Copier
                </button>
              </div>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex gap-3 items-start">
            <div className="bg-green-500 text-white font-black w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
              2
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-slate-200">Envoie la capture sur WhatsApp</p>
              <p className="text-xs text-slate-400 mb-3">
                Clique sur le bouton ci-dessous pour confirmer ton paiement. Ton compte sera validé en 2 minutes.
              </p>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-green-900/30"
              >
                <MessageCircle size={18} />
                Confirmer sur WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Note de sécurité */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck size={14} className="text-amber-400" />
          <span>Activation garantie sous 5 à 10 minutes max.</span>
        </div>

      </div>
    </div>
  );
}

export default function ManualCMPayment() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement...</div>}>
      <ManualCMPaymentContent />
    </Suspense>
  );
}
