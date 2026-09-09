"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Copy, 
  CheckCircle2, 
  MessageCircle, 
  AlertCircle, 
  ShieldCheck, 
  Smartphone,
  Info,
  Zap,
  PhoneCall
} from "lucide-react";

function ManualPaymentContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "premium";
  const period = searchParams.get("period") || "monthly";
  const amount = searchParams.get("amount") || "0";
  const tx = searchParams.get("tx") || "Ref_inconnue";

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // ==========================================
  // ⚙️ CONFIGURATION DES INFOS DE PAIEMENT
  // ==========================================
  const RECIPIENT_NAME = "Cedric Merlin Fossi Bekam";
  const RECIPIENT_NUMBER: string = "651387914"; 
  const SUPPORT_WHATSAPP: string = "221787533626";
  // ==========================================

  const handleCopy = (text: string) => {
    const textToCopy = String(text);
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(textToCopy);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const planName = plan === "boost" ? "Boost" : plan === "gold" ? "LoveLink Gold" : "LoveLink Premium";
  
  // Code USSD automatique pour MTN Mobile Money
  const mtnUssdCode = `*126*9*${RECIPIENT_NUMBER}*${amount}#`;

  // Message pré-rempli WhatsApp
  const whatsappMessage = `Bonjour le support LoveLink 👋\n\nJe viens d'effectuer un paiement Mobile Money.\n\n📦 Offre : ${planName}\n💰 Montant : ${amount} FCFA\n🧾 Réf : ${tx}\n\nVoici la capture d'écran du message de confirmation :`;
  const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`;
  const supportUrlOnly = `https://wa.me/${SUPPORT_WHATSAPP}?text=Bonjour,%20j'ai%20besoin%20d'aide%20pour%20mon%20paiement%20LoveLink.`;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/premium" className="flex items-center gap-2 text-slate-600 hover:text-rose-600 font-bold transition">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>
          <div className="font-black text-slate-900 flex items-center gap-2">
            Paiement Cameroun <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        
        {/* RECAPITULATIF */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative z-10">
            <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-sm">Montant à payer</p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-black">{amount}</span>
              <span className="text-xl font-bold text-slate-400 mb-1">FCFA</span>
            </div>
            <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium">Offre sélectionnée</p>
                <p className="font-bold text-lg">{planName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Réf. transaction</p>
                <p className="font-mono text-sm">{tx.split('_')[0] || tx}</p>
              </div>
            </div>
          </div>
        </div>

        {/* NUMEROTATION AUTOMATIQUE USSD MTN */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 mb-6">
          <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
            Paiement Rapide MTN Mobile Money
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Clique ci-dessous pour ouvrir le clavier d'appel avec le montant et le numéro pré-remplis :
          </p>

          <div className="mb-8">
            {/* BOUTON UNIQUE MTN */}
            <a
              href={`tel:${encodeURIComponent(mtnUssdCode)}`}
              className="w-full flex items-center justify-between bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black p-4 rounded-2xl transition shadow-md hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-yellow-400 rounded-xl flex items-center justify-center font-black text-xs">
                  MTN
                </div>
                <div>
                  <p className="text-sm font-black">Lancer le paiement MTN</p>
                  <p className="text-[11px] font-semibold opacity-80">{mtnUssdCode}</p>
                </div>
              </div>
              <PhoneCall className="w-5 h-5 shrink-0" />
            </a>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-rose-500" />
              Ou fais le transfert manuellement :
            </h3>

            <div className="space-y-4">
              {/* NUMERO A COPIER */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Numéro MTN Mobile Money</p>
                  <p className="text-2xl font-black text-slate-800">{RECIPIENT_NUMBER}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleCopy(RECIPIENT_NUMBER)}
                  className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm"
                >
                  {copiedText === RECIPIENT_NUMBER ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-500" />}
                </button>
              </div>

              {/* NOM OBLIGATOIRE */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-800 font-medium">Nom à vérifier sur ton écran :</p>
                  <p className="text-base font-black text-amber-900 mt-0.5">{RECIPIENT_NAME}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CONFIRMATION WHATSAPP */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="font-bold text-slate-900 mb-2">Après avoir validé avec ton code secret :</p>
            <p className="text-sm text-slate-600 mb-4">
              Clique ci-dessous pour envoyer la preuve par WhatsApp. Ton compte sera activé immédiatement ! ⚡
            </p>
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 px-6 rounded-2xl font-black text-lg transition-transform hover:scale-[1.02] shadow-lg shadow-green-500/30"
            >
              <MessageCircle className="w-6 h-6" />
              J'ai payé, j'envoie la preuve
            </a>
          </div>

        </div>

        {/* SUPPORT */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">Un problème lors du paiement ?</h3>
          <p className="text-sm text-slate-500 mb-4">
            Notre équipe est disponible pour t'aider.
          </p>
          <a 
            href={supportUrlOnly}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            Contacter le support (+221 78 753 36 26)
          </a>
        </div>

      </div>
    </div>
  );
}

export default function ManualPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center font-bold text-slate-500 animate-pulse">Chargement de la page de paiement...</div>
        </div>
      }
    >
      <ManualPaymentContent />
    </Suspense>
  );
}
