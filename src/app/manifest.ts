import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LoveLink - Trouvez votre âme sœur",
    short_name: "LoveLink",
    description: "Site de rencontre en ligne pour trouver l'amour, l'amitié ou de belles connexions au Sénégal, au Cameroun et partout en Afrique.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#f43f5e",
    lang: "fr",
    dir: "ltr",
    scope: "/",
    id: "lovelink237",
    categories: ["social", "lifestyle", "dating"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "540x720",
        type: "image/png",
        form_factor: "narrow",
        label: "Découvrez des profils qui vous correspondent",
      },
    ],
    shortcuts: [
      {
        name: "Découvrir",
        short_name: "Découvrir",
        description: "Voir de nouveaux profils",
        url: "/discover",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Messages",
        short_name: "Messages",
        description: "Voir mes messages",
        url: "/messages",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Matchs",
        short_name: "Matchs",
        description: "Voir mes matchs",
        url: "/matches",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
