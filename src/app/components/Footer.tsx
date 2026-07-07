import Link from "next/link";
import { Heart, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-rose-900 text-white mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo + Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-8 h-8 text-rose-400 fill-rose-400" />
              <span className="text-2xl font-bold">LoveLink</span>
            </div>
            <p className="text-slate-300 mb-4 max-w-md">
              La plateforme de rencontre en ligne pour trouver l'amour, l'amitié
              ou faire de belles connaissances partout dans le monde.
            </p>
            <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              <span>Dakar, Sénégal</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Mail className="w-4 h-4" />
              <a href="mailto:lovelink237@gmail.com" className="hover:text-rose-400">
                lovelink237@gmail.com
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-rose-400">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-slate-300 hover:text-white transition">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-300 hover:text-white transition">
                  S'inscrire
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-300 hover:text-white transition">
                  Se connecter
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-rose-400">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cgu" className="text-slate-300 hover:text-white transition">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-slate-300 hover:text-white transition">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="text-slate-300 hover:text-white transition">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm text-center md:text-left">
            © {new Date().getFullYear()} LoveLink — Marketing de Boutique Numérique.
            Tous droits réservés.
          </p>
          <p className="text-slate-400 text-sm flex items-center gap-1">
            Fait avec <Heart className="w-4 h-4 text-rose-400 fill-rose-400" /> au Sénégal
          </p>
        </div>
      </div>
    </footer>
  );
}
