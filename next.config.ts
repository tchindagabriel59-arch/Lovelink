import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ✅ Vercel Blob Storage (upload photos profil)
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      // ✅ ImgBB (logo LoveLink)
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      // ✅ Cloudinary (si utilisé)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // ✅ Uploadthing (si utilisé)
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      // ✅ Fallback générique HTTPS (sécurisé)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // ✅ Formats modernes (WebP + AVIF = 2x à 5x plus léger)
    formats: ["image/avif", "image/webp"],
    // ✅ Tailles d'écrans couverts
    deviceSizes: [390, 430, 768, 1024, 1280, 1920],
    // ✅ Tailles pour les images fixes (avatars, thumbnails)
    imageSizes: [36, 44, 56, 64, 80, 96, 128, 192],
    // ✅ Cache images 7 jours (les photos de profil ne changent pas souvent)
    minimumCacheTTL: 604800,
  },

  // ✅ Compression activée
  compress: true,

  // ✅ Prefetch automatique des liens visibles
  experimental: {
    optimisticClientCache: true,
  },
};

export default nextConfig;
