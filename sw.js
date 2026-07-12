// 🔔 Service Worker LoveLink - Notifications Push

// Installation
self.addEventListener("install", (event) => {
  console.log("[SW] Installation");
  self.skipWaiting();
});

// Activation
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation");
  event.waitUntil(self.clients.claim());
});

// Réception d'une notification push
self.addEventListener("push", (event) => {
  console.log("[SW] Push reçu");

  let data = {
    title: "LoveLink 💕",
    body: "Tu as une nouvelle notification !",
    icon: "/icon",
    badge: "/icon",
    url: "/dashboard",
    tag: "lovelink-notif",
  };

  // Parser les données envoyées par le serveur
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.error("[SW] Erreur parsing push data:", e);
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    image: data.image,
    tag: data.tag,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: data.url,
      timestamp: Date.now(),
    },
    actions: [
      {
        action: "open",
        title: "Voir",
      },
      {
        action: "close",
        title: "Fermer",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Clic sur la notification
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Clic notification");
  event.notification.close();

  // Si "Fermer" a été cliqué
  if (event.action === "close") {
    return;
  }

  // Sinon, ouvrir l'URL
  const urlToOpen = event.notification.data?.url || "/dashboard";
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Chercher si LoveLink est déjà ouvert
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(fullUrl);
            return client.focus();
          }
        }
        // Sinon ouvrir un nouvel onglet
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      })
  );
});

// Fermeture de la notification (sans clic)
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification fermée");
});
