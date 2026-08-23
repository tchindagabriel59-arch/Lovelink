"use client";

import React from "react";
import { Globe, X } from "lucide-react";

interface CountryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCountry: (country: "CM" | "OTHER") => void;
  isLoading?: boolean;
}

export default function CountryPaymentModal({
  isOpen,
  onClose,
  onSelectCountry,
  isLoading = false,
}: CountryPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Globe size={28} />
          </div>
          <h3 className="text-xl font-bold text-white">Choisis ton pays</h3>
          <p className="text-xs text-slate-400 mt-1">
            Sélectionne ton pays pour afficher les modes de paiement adaptés.
          </p>
        </div>

        <div className="space-y-3">
          {/* Option 1 : Cameroun */}
          <button
            onClick={() => onSelectCountry("CM")}
            disabled={isLoading}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇨🇲</span>
              <div>
                <p className="font-bold text-white group-hover:text-amber-400 transition-colors text-sm">
                  Cameroun
                </p>
                <p className="text-xs text-slate-400">MTN MoMo & Orange Money</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg">
              Populaire
            </span>
          </button>

          {/* Option 2 : Autres Pays */}
          <button
            onClick={() => onSelectCountry("OTHER")}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/50 transition-all text-left group"
          >
            <span className="text-2xl">🌍</span>
            <div>
              <p className="font-bold text-white group-hover:text-rose-400 transition-colors text-sm">
                Autres pays
              </p>
              <p className="text-xs text-slate-400">
                Sénégal, CI, Bénin (Wave, OM, Carte)
              </p>
            </div>
          </button>
        </div>

        {isLoading && (
          <p className="text-center text-xs text-amber-400 mt-4 animate-pulse">
            Génération du lien de paiement...
          </p>
        )}
      </div>
    </div>
  );
}
