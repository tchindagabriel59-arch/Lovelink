"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushAutoSubscriber() {
  useEffect(() => {
    async function autoRegisterPush() {
      try {
        if (
          typeof window === "undefined" ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ) {
          return;
        }

        // Si l'utilisateur n'a pas encore accepté, on ne force pas (pour respecter son choix)
        if (Notification.permission !== "granted") {
          return;
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) return;

        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        // Si la souscription du navigateur a expiré ou n'existe pas, on la crée
        if (!subscription) {
          const applicationServerKey = urlBase64ToUint8Array(publicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
          });
        }

        // Envoi silencieux à Neon
        if (subscription) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription,
              userAgent: navigator.userAgent,
            }),
          });
          console.log("[PushAutoSubscriber] Abonnement Push rafraîchi et actif !");
        }
      } catch (error) {
        console.error("[PushAutoSubscriber] Sync Push silencieuse:", error);
      }
    }

    autoRegisterPush();
  }, []);

  return null; // 100% invisible
}
