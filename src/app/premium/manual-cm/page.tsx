"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { Rocket, MessageCircle, Copy, CheckCircle2 } from "lucide-react";

export default function ManualCMPayment() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "boost";
  const amount = searchParams.get("amount") || "1 500";
  const userId = searchParams.get("userId") || "0";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Numéro copié !");
  };

  const mtnNumber = "6XXXXXXXX"; // 👈 METS TON NUMÉRO MTN ICI
  const whatsappNumber = "2376XXXXXXXX"; // 👈 METS TON WHATSAPP ICI (avec 237)

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Bonjour, je viens d'envoyer ${amount} FCFA pour le ${plan} LoveLink. Mon ID Utilisateur est : ${userId}`;

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center text-slate-900">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-400 p-4 rounded-full shadow-inner">
            <Rocket className="text-white w-10 h-10" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Paiement Mobile Money</h1>
        <p className="text-slate-500 text-center mb-8">
          Notch Pay est en cours de maintenance au Cameroun. Utilise le paiement direct pour activer ton boost instantanément !
        </p>

        <div className="space-y-6">
          {/* Étape 1 */}
          <div className="flex gap-4 items-start">
            <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-semibold">Envoie le montant par MTN MoMo</p>
              <p className="text-sm text-slate-500 mb-2">Montant : <span className="font-bold text-slate-900">{amount} FCFA</span></p>
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300">
                <span className="font-mono font-bold text-lg text-yellow-600">{mtnNumber}</span>
                <button onClick={() => copyToClipboard(mtnNumber)} className="ml-auto p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="flex gap-4 items-start">
            <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-semibold">Envoie la preuve sur WhatsApp</p>
              <p className="text-sm text-slate-500 mb-4 text-pretty">
                Clique sur le bouton ci-dessous pour nous envoyer une capture d'écran. Ton boost sera activé dans les 5 minutes.
              </p>
              <a 
                href={whatsappLink}
                className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-200"
              >
                <MessageCircle size={20} />
                Envoyer la preuve
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
