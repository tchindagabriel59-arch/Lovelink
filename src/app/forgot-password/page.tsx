"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, MessageCircle, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const whatsappNumber = "237651387914"; // 👈 Ton numéro WhatsApp support

  const handleWhatsAppReset = () => {
    if (!identifier.trim()) {
      alert("Saisis ton numéro de téléphone ou e-mail d'abord !");
      return;
    }

    const message = `Bonjour Support LoveLink, j'ai oublié mon mot de passe. Mon identifiant (Téléphone/Email) est : ${identifier}`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 mb-6">
          <ArrowLeft size={16} /> Retour à la connexion
        </Link>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Mot de passe oublié ?</h1>
          <p className="text-sm text-slate-500 mt-1">
            Entre ton numéro de téléphone ou e-mail pour réinitialiser ton compte.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Ton Numéro ou Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ex: 651387914 ou email@gmail.com"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:border-rose-500 outline-none transition"
            />
          </div>

          <button
            onClick={handleWhatsAppReset}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Réinitialiser via WhatsApp Support
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          🔒 Réinitialisation sécurisée garantie sous 5 minutes par notre équipe.
        </p>
      </div>
    </div>
  );
}
