import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";

const SITE_URL = "https://lovelink-omega.vercel.app";
const SITE_NAME = "LoveLink";
const DESCRIPTION = "LoveLink est la plateforme de rencontre en ligne pour trouver l'amour, l'amitié ou faire de nouvelles connaissances partout dans le monde. Inscription gratuite en 2 minutes.";
const IMAGE_URL = "https://i.ibb.co/Kj0P8Kt/lovelink-og.jpg"; // On changera avec ta vraie image

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LoveLink — Trouvez votre âme sœur 💜",
    template: "%s | LoveLink",
  },
  description: DESCRIPTION,
  keywords: [
    "rencontre",
    "amour",
    "site de rencontre",
    "dating",
    "amitié",
    "célibataires",
    "sénégal",
    "afrique",
    "dakar",
    "rencontre gratuite",
    "match",
    "tinder alternative",
  ],
  authors: [{ name: "Gabriel Tchinda" }],
  creator: "Marketing de Boutique Numérique",
  publisher: "LoveLink",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "LoveLink — Trouvez votre âme sœur 💜",
    description: DESCRIPTION,
    images: [
      {
        url: IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "LoveLink - Site de rencontre en ligne",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LoveLink — Trouvez votre âme sœur 💜",
    description: DESCRIPTION,
    images: [IMAGE_URL],
    creator: "@lovelink",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
  manifest: "/manifest.json",
  category: "dating",
  applicationName: "LoveLink",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#f43f5e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LoveLink" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
