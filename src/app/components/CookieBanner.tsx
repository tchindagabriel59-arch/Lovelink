"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("lovelink_cookie_consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("lovelink_cookie_consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm flex-1">
          🍪 LoveLink utilise des cookies essentiels au fonctionnement du site
          (connexion, sécurité). En continuant, vous acceptez notre{" "}
          <Link href="/confidentialite" className="underline text-pink-400">
            politique de confidentialité
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-2 rounded-full whitespace-nowrap"
        >
          J'accepte
        </button>
      </div>
    </div>
  );
}
