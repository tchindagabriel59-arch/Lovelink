import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";

export const metadata: Metadata = {
  title: "LoveLink — Trouvez votre âme sœur",
  description:
    "LoveLink est la plateforme de rencontre en ligne premium. Trouvez l'amour, créez des connexions authentiques.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
