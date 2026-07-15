"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone, Share, Plus, Check, Sparkles } from "lucide-react";

// Type pour l'événement beforeinstallprompt (Chrome/Edge)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type DeviceType = "ios" | "android" | "desktop" | "unknown";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [device, setDevice] = useState<DeviceType>("unknown");

  useEffect(() => {
    // Détecter si l'app est déjà installée
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Détecter le type d'appareil
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDevice("ios");
    } else if (/android/.test(userAgent)) {
      setDevice("android");
    } else {
      setDevice("desktop");
    }

    // Écouter l'événement d'installation (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Afficher le bandeau après 5 secondes si l'utilisateur n'a pas déjà refusé
      const dismissed = localStorage.getItem("lovelink-install-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 5000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Sur iOS, on affiche le bandeau après 10 secondes (pas d'événement natif)
    if (/iphone|ipad|ipod/.test(userAgent)) {
      const dismissed = localStorage.getItem("lovelink-install-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 10000);
      }
    }

    // Détecter quand l'app est installée
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Edge/Android : installation native
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS ou desktop sans support : afficher les instructions
      setShowModal(true);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("lovelink-install-dismissed", "true");
  };

  // Si déjà installé, ne rien afficher
  if (isInstalled) {
    return (
      <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
        <Check className="w-4 h-4" />
        App installée
      </div>
    );
  }

  return (
    <>
      {/* Bouton principal (dans le dashboard) */}
      <button
        onClick={handleInstall}
        className="group relative w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
      >
        <Download className="w-5 h-5 group-hover:animate-bounce" />
        Installer l&apos;app LoveLink
        <Sparkles className="w-4 h-4 text-yellow-300" />
      </button>

      {/* Bandeau flottant en bas (mobile) */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-purple-200 overflow-hidden">
            {/* Header avec dégradé */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 relative">
              <button
                onClick={dismissBanner}
                className="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-7 h-7 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">Installer LoveLink</h3>
                  <p className="text-purple-100 text-xs">Comme une vraie app 📱</p>
                </div>
              </div>
            </div>

            {/* Corps */}
            <div className="p-4">
              <ul className="space-y-2 text-sm text-slate-700 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Accès rapide depuis l&apos;écran d&apos;accueil</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Notifications instantanées</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Ouverture plein écran</span>
                </li>
              </ul>

              <div className="flex gap-2">
                <button
                  onClick={dismissBanner}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                >
                  Installer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal avec instructions (iOS ou desktop) */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                  <Smartphone className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-white font-bold text-2xl">Installer LoveLink</h2>
                <p className="text-purple-100 text-sm mt-1">
                  {device === "ios" && "Sur iPhone/iPad"}
                  {device === "android" && "Sur Android"}
                  {device === "desktop" && "Sur ordinateur"}
                </p>
              </div>
            </div>

            {/* Instructions selon l'appareil */}
            <div className="p-6">
              {device === "ios" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-2xl">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">
                        Ouvre Safari
                      </p>
                      <p className="text-sm text-slate-600">
                        L&apos;installation ne fonctionne que sur Safari (pas Chrome ni Firefox)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 bg-purple-50 rounded-2xl">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 mb-1">
                        Appuie sur le bouton Partager
                      </p>
                      <p className="text-sm text-slate-600 mb-2">
                        C&apos;est l&apos;icône en bas de l&apos;écran :
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg">
                        <Share className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-mono">Partager</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 bg-pink-50 rounded-2xl">
                    <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 mb-1">
                        Sélectionne &quot;Sur l&apos;écran d&apos;accueil&quot;
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg">
                        <Plus className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-mono">Sur l&apos;écran d&apos;accueil</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 bg-green-50 rounded-2xl">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">
                        Appuie sur &quot;Ajouter&quot;
                      </p>
                      <p className="text-sm text-slate-600">
                        L&apos;icône LoveLink apparaît sur ton écran d&apos;accueil ! 🎉
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {device === "android" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-2xl">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">
                        Ouvre le menu Chrome
                      </p>
                      <p className="text-sm text-slate-600">
                        Appuie sur les 3 points en haut à droite ⋮
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 bg-purple-50 rounded-2xl">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">
                        Sélectionne &quot;Installer l&apos;application&quot;
                      </p>
                      <p className="text-sm text-slate-600">
                        Ou &quot;Ajouter à l&apos;écran d&apos;accueil&quot;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 bg-green-50 rounded-2xl">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">
                        Confirme l&apos;installation
                      </p>
                      <p className="text-sm text-slate-600">
                        LoveLink s&apos;installe comme une vraie app ! 🎉
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {device === "desktop" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-2xl">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">
                        Regarde dans la barre d&apos;adresse
                      </p>
                      <p className="text-sm text-slate-600">
                        Une petite icône d&apos;installation apparaît à droite de l&apos;URL
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 bg-purple-50 rounded-2xl">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">
                        Clique sur &quot;Installer LoveLink&quot;
                      </p>
                      <p className="text-sm text-slate-600">
                        Confirme dans la popup qui apparaît
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 bg-green-50 rounded-2xl">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">
                        C&apos;est prêt ! 🎉
                      </p>
                      <p className="text-sm text-slate-600">
                        LoveLink s&apos;ouvre comme un logiciel classique
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Avantages */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Pourquoi installer ?
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2">
                    <div className="text-2xl mb-1">⚡</div>
                    <p className="text-xs text-slate-600 font-medium">Plus rapide</p>
                  </div>
                  <div className="p-2">
                    <div className="text-2xl mb-1">🔔</div>
                    <p className="text-xs text-slate-600 font-medium">Notifs</p>
                  </div>
                  <div className="p-2">
                    <div className="text-2xl mb-1">📱</div>
                    <p className="text-xs text-slate-600 font-medium">Plein écran</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
