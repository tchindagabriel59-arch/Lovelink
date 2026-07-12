"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

// Convertir base64 en Uint8Array (requis par push manager)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotifButton() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    checkSupport();
  }, []);

  async function checkSupport() {
    try {
      // Vérifier le support du navigateur
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setSupported(false);
        setLoading(false);
        return;
      }

      setSupported(true);
      setPermission(Notification.permission);

      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("[Push] Service Worker enregistré");

      // Vérifier si déjà abonné
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);

      // Vérifier côté serveur aussi
      if (subscription) {
        const res = await fetch("/api/push/subscribe");
        if (res.ok) {
          const data = await res.json();
          setSubscribed(data.subscribed);
        }
      }
    } catch (err) {
      console.error("[Push] Erreur setup:", err);
    } finally {
      setLoading(false);
    }
  }

  async function subscribe() {
    setProcessing(true);
    setMessage(null);

    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== "granted") {
        setMessage({
          type: "error",
          text: "Tu dois autoriser les notifications dans ton navigateur",
        });
        setProcessing(false);
        return;
      }

      // Récupérer la clé publique VAPID
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMessage({ type: "error", text: "Configuration manquante" });
        setProcessing(false);
        return;
      }

      // S'abonner via le Service Worker
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Envoyer l'abonnement au serveur
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
        }),
      });

      if (res.ok) {
        setSubscribed(true);
        setMessage({
          type: "success",
          text: "🎉 Notifications activées !",
        });

        // Notification de bienvenue
        setTimeout(() => {
          registration.showNotification("LoveLink 💕", {
            body: "Les notifications sont activées ! Tu ne rateras plus rien 🔥",
            icon: "/icon",
            badge: "/icon",
            tag: "welcome",
          });
        }, 500);

        setTimeout(() => setMessage(null), 5000);
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Erreur" });
        // Rollback : désabonner le navigateur
        await subscription.unsubscribe();
      }
    } catch (err) {
      console.error("[Push] Erreur subscribe:", err);
      setMessage({ type: "error", text: "Impossible d'activer les notifications" });
    } finally {
      setProcessing(false);
    }
  }

  async function unsubscribe() {
    if (!confirm("Désactiver les notifications push ?")) return;

    setProcessing(true);
    setMessage(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Supprimer côté serveur
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Désabonner côté navigateur
        await subscription.unsubscribe();
      } else {
        // Pas d'abonnement local, on nettoie tout côté serveur
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      }

      setSubscribed(false);
      setMessage({ type: "success", text: "🔕 Notifications désactivées" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("[Push] Erreur unsubscribe:", err);
      setMessage({ type: "error", text: "Erreur" });
    } finally {
      setProcessing(false);
    }
  }

  // Loader
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  // Navigateur non supporté
  if (!supported) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900 mb-1">Navigateur non compatible</h3>
            <p className="text-sm text-amber-800">
              Ton navigateur ne supporte pas les notifications push. Essaye avec Chrome, Firefox ou Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Permission refusée définitivement
  if (permission === "denied") {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <BellOff className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 mb-1">Notifications bloquées</h3>
            <p className="text-sm text-red-800 mb-3">
              Tu as refusé les notifications. Pour les activer, va dans les paramètres de ton navigateur :
            </p>
            <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
              <li>Clique sur l&apos;icône 🔒 à gauche de l&apos;URL</li>
              <li>Trouve &quot;Notifications&quot;</li>
              <li>Change &quot;Bloquer&quot; en &quot;Autoriser&quot;</li>
              <li>Recharge la page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ==== ABONNÉ ====
  if (subscribed) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-8 translate-x-8" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 fill-white text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg mb-1">Notifications activées ! 🔔</h3>
                <p className="text-sm text-white/90 mb-3">
                  Tu recevras une notif à chaque match, message ou like, même si l&apos;onglet est fermé !
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-white/20 backdrop-blur px-2 py-1 rounded-full">💕 Matchs</span>
                  <span className="bg-white/20 backdrop-blur px-2 py-1 rounded-full">💬 Messages</span>
                  <span className="bg-white/20 backdrop-blur px-2 py-1 rounded-full">❤️ Likes</span>
                  <span className="bg-white/20 backdrop-blur px-2 py-1 rounded-full">⭐ Super Likes</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={unsubscribe}
            disabled={processing}
            className="mt-4 w-full px-4 py-2.5 bg-white/20 backdrop-blur hover:bg-white/30 rounded-xl font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Désactivation...
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                Désactiver les notifications
              </>
            )}
          </button>

          {message && (
            <div className={`mt-3 p-2 rounded-lg text-sm text-center ${
              message.type === "success" ? "bg-white/20" : "bg-red-500/50"
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==== NON ABONNÉ ====
  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/40 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Bell className="w-6 h-6 text-white fill-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-slate-900 text-lg mb-1 flex items-center gap-2">
              Active les notifications
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                Recommandé
              </span>
            </h3>
            <p className="text-sm text-slate-600">
              Reçois une notif dès qu&apos;un match, un like ou un message arrive - même si l&apos;onglet est fermé !
            </p>
          </div>
        </div>

        {/* Avantages */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2 bg-rose-50 rounded-lg text-center">
            <div className="text-lg">💕</div>
            <p className="text-[10px] font-bold text-rose-700 mt-0.5">Nouveaux matchs</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-center">
            <div className="text-lg">💬</div>
            <p className="text-[10px] font-bold text-blue-700 mt-0.5">Messages</p>
          </div>
          <div className="p-2 bg-pink-50 rounded-lg text-center">
            <div className="text-lg">❤️</div>
            <p className="text-[10px] font-bold text-pink-700 mt-0.5">Likes reçus</p>
          </div>
          <div className="p-2 bg-cyan-50 rounded-lg text-center">
            <div className="text-lg">⭐</div>
            <p className="text-[10px] font-bold text-cyan-700 mt-0.5">Super Likes</p>
          </div>
        </div>

        <button
          onClick={subscribe}
          disabled={processing}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Activation...
            </>
          ) : (
            <>
              <Bell className="w-5 h-5" />
              Activer les notifications
            </>
          )}
        </button>

        {message && (
          <div className={`mt-3 p-2 rounded-lg text-sm text-center ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <p className="text-xs text-slate-500 mt-3 text-center">
          🔒 Tu peux désactiver à tout moment
        </p>
      </div>
    </div>
  );
}
