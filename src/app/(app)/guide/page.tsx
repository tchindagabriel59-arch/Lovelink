"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  X,
  Star,
  RotateCcw,
  MessageCircle,
  Crown,
  ShieldCheck,
  Flag,
  Ban,
  Gift,
  Sparkles,
  MapPin,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  Camera,
  Users,
  Lock,
  ArrowLeft,
  Compass,
  Info,
  Gem,
  MousePointerClick,
  Hand,
  ChevronRight,
  Trophy,
} from "lucide-react";

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  content: React.ReactNode;
}

export default function GuidePage() {
  const [openSection, setOpenSection] = useState<string>("boutons");

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? "" : id);
  };

  const sections: Section[] = [
    // ═══════════════════════════════════════════════
    // SECTION 1 : LES 5 BOUTONS
    // ═══════════════════════════════════════════════
    {
      id: "boutons",
      icon: <MousePointerClick className="w-6 h-6" />,
      title: "Les 5 boutons de Discover",
      color: "from-rose-500 to-pink-500",
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm mb-4">
            Sur la page <strong>Découvrir</strong>, tu as 5 boutons ronds en bas de chaque profil.
            Voici ce que fait chacun :
          </p>

          {/* Rewind */}
          <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-amber-500 flex-shrink-0">
              <RotateCcw className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-bold text-slate-900">Rewind (Retour)</h4>
                <span className="text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full">
                  PREMIUM
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tu as swipé trop vite ? Ce bouton te permet de <strong>revenir au profil précédent</strong> 
                et changer d'avis. Réservé aux membres Premium 👑
              </p>
            </div>
          </div>

          {/* Pass */}
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl border border-red-200">
            <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 flex-shrink-0">
              <X className="w-7 h-7" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 mb-1">Pass (Passer)</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ce profil ne t'intéresse pas ? Clique sur ❌ pour passer au suivant.
                Tu peux aussi <strong>swiper vers la gauche</strong> 👈
              </p>
            </div>
          </div>

          {/* Super Like */}
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-blue-500 flex-shrink-0">
              <Star className="w-6 h-6 fill-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 mb-1">Super Like ⭐</h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">
                Ce profil t'a <strong>vraiment tapé dans l'œil</strong> ? Envoie un Super Like !
                La personne sera <strong>notifiée immédiatement</strong> et verra ton profil en priorité.
              </p>
              <div className="bg-white/60 rounded-lg p-2 text-xs">
                <p><strong>Gratuit</strong> : 1 par jour</p>
                <p><strong>Premium 👑</strong> : 5 par jour</p>
              </div>
            </div>
          </div>

          {/* Like */}
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl border border-green-200">
            <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-green-500 flex-shrink-0">
              <Heart className="w-7 h-7 fill-green-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 mb-1">Like ❤️</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ce profil te plaît ? Clique sur ❤️ pour le liker.
                Tu peux aussi <strong>swiper vers la droite</strong> 👉
                <br/><br/>
                Si la personne te like en retour = <strong>C'est un MATCH !</strong> 💕
                Vous pouvez alors discuter ensemble.
              </p>
            </div>
          </div>

          {/* Message direct */}
          <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-200">
            <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-purple-500 flex-shrink-0">
              <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-bold text-slate-900">Message direct</h4>
                <span className="text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full">
                  PREMIUM
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Envoie un message <strong>sans avoir besoin d'un match</strong>.
                Idéal pour te démarquer et créer une vraie connexion 💜
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // ═══════════════════════════════════════════════
    // SECTION 2 : LES GESTES
    // ═══════════════════════════════════════════════
    {
      id: "gestes",
      icon: <Hand className="w-6 h-6" />,
      title: "Les gestes tactiles",
      color: "from-purple-500 to-indigo-500",
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm mb-4">
            LoveLink est optimisé pour le tactile. Voici tous les gestes à connaître :
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* Swipe left */}
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-center gap-4">
              <div className="text-3xl">👈</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">Swipe à gauche</h4>
                <p className="text-xs text-slate-600">Pass (passer le profil)</p>
              </div>
            </div>

            {/* Swipe right */}
            <div className="p-4 bg-green-50 rounded-2xl border border-green-200 flex items-center gap-4">
              <div className="text-3xl">👉</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">Swipe à droite</h4>
                <p className="text-xs text-slate-600">Like (liker le profil)</p>
              </div>
            </div>

            {/* Swipe up */}
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-center gap-4">
              <div className="text-3xl">👆</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">Swipe vers le haut</h4>
                <p className="text-xs text-slate-600">Super Like ⭐</p>
              </div>
            </div>

            {/* Tap photo */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="text-3xl">👆</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">Tap gauche/droite sur la photo</h4>
                <p className="text-xs text-slate-600">Voir les photos suivantes/précédentes</p>
              </div>
            </div>

            {/* Tap nom */}
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-center gap-4">
              <div className="text-3xl">👤</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">Tap sur le nom</h4>
                <p className="text-xs text-slate-600">Voir le profil complet (bio, intérêts...)</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-rose-500 to-purple-600 rounded-2xl text-white text-sm">
            💡 <strong>Astuce :</strong> Le geste swipe permet de découvrir plus rapidement.
            Les boutons sont là pour ceux qui préfèrent cliquer !
          </div>
        </div>
      ),
    },

    // ═══════════════════════════════════════════════
    // SECTION 3 : LES STATUTS ET BADGES
    // ═══════════════════════════════════════════════
    {
      id: "statuts",
      icon: <Sparkles className="w-6 h-6" />,
      title: "Les statuts et badges",
      color: "from-cyan-500 to-blue-500",
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm mb-4">
            Chaque profil affiche des <strong>badges</strong> et <strong>statuts</strong> pour t'aider à choisir :
          </p>

          {/* En ligne */}
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">🟢 En ligne</h4>
              <p className="text-xs text-slate-600">La personne est connectée maintenant</p>
            </div>
          </div>

          {/* Vérifié */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">Badge Vérifié 💙</h4>
              <p className="text-xs text-slate-600">Profil authentifié par un selfie - 100% réel !</p>
            </div>
          </div>

          {/* Premium */}
          <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
            <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">Badge Premium 👑</h4>
              <p className="text-xs text-slate-600">Membre Premium - utilisateur sérieux et engagé</p>
            </div>
          </div>

          {/* T'a liké */}
          <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-200">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">"T'a liké !" ❤️</h4>
              <p className="text-xs text-slate-600">
                Cette personne t'a déjà liké. Like-la en retour = <strong>MATCH immédiat</strong> !
              </p>
            </div>
          </div>

          {/* T'a super liké */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-300">
            <Star className="w-6 h-6 text-blue-500 fill-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">"T'a Super Liké !" ⭐</h4>
              <p className="text-xs text-slate-600">
                Wow ! Cette personne <strong>t'a vraiment remarqué(e)</strong>. Elle t'a envoyé un Super Like.
              </p>
            </div>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <MapPin className="w-6 h-6 text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-sm">📍 Distance</h4>
              <p className="text-xs text-slate-600">
                Distance approximative entre toi et la personne (basée sur la géolocalisation)
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // ═══════════════════════════════════════════════
    // SECTION 4 : PREMIUM
    // ═══════════════════════════════════════════════
    {
      id: "premium",
      icon: <Crown className="w-6 h-6" />,
      title: "Les avantages Premium",
      color: "from-yellow-500 to-orange-500",
      content: (
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-300">
            <div className="flex items-center gap-3 mb-3">
              <Crown className="w-8 h-8 text-yellow-600 fill-yellow-500" />
              <div>
                <h3 className="font-black text-slate-900">Premium 👑</h3>
                <p className="text-xs text-slate-600">Trouve l'amour 10x plus vite</p>
              </div>
            </div>
            <p className="text-2xl font-black text-orange-600">2 500 FCFA/mois</p>
            <p className="text-xs text-slate-600">ou 21 000 FCFA/an (-30%)</p>
          </div>

          <h4 className="font-bold text-slate-900 mt-6">✨ Ce que tu débloques :</h4>

          <div className="space-y-3">
            {[
              { icon: <Star className="w-5 h-5" />, title: "5 Super Likes/jour", desc: "vs 1 en gratuit", color: "text-blue-500 bg-blue-50" },
              { icon: <Heart className="w-5 h-5" />, title: "Voir qui t'a liké", desc: "Découvre tous tes admirateurs", color: "text-rose-500 bg-rose-50" },
              { icon: <RotateCcw className="w-5 h-5" />, title: "Rewind illimité", desc: "Reviens sur tes swipes", color: "text-amber-500 bg-amber-50" },
              { icon: <Zap className="w-5 h-5" />, title: "Boost profil", desc: "3x plus de visibilité (3/jour)", color: "text-purple-500 bg-purple-50" },
              { icon: <MessageCircle className="w-5 h-5" />, title: "Messages directs", desc: "Sans avoir besoin de matcher", color: "text-indigo-500 bg-indigo-50" },
              { icon: <Eye className="w-5 h-5" />, title: "Mode Incognito", desc: "Navigue en secret", color: "text-slate-500 bg-slate-100" },
              { icon: <Crown className="w-5 h-5" />, title: "Badge Premium", desc: "Sois vu comme sérieux", color: "text-yellow-500 bg-yellow-50" },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${item.color}`}>
                <div className="flex-shrink-0">{item.icon}</div>
                <div className="flex-1">
                  <h5 className="font-bold text-sm text-slate-900">{item.title}</h5>
                  <p className="text-xs text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/premium"
            className="block w-full mt-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-black text-center shadow-lg hover:shadow-xl transition"
          >
            <Gem className="w-5 h-5 inline mr-2" />
            Passer Premium
          </Link>
        </div>
      ),
    },

    // ═══════════════════════════════════════════════
    // SECTION 5 : PARRAINAGE
    // ═══════════════════════════════════════════════
    {
      id: "parrainage",
      icon: <Gift className="w-6 h-6" />,
      title: "Gagner du Premium GRATUIT",
      color: "from-emerald-500 to-green-600",
      content: (
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl border-2 border-emerald-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Système de Parrainage 🎁</h3>
                <p className="text-xs text-slate-600">100% gratuit, sans limite</p>
              </div>
            </div>
            <p className="text-slate-800 text-sm mt-3">
              Invite tes amis sur LoveLink et gagne <strong>7 jours de Premium GRATUIT</strong> pour chaque inscription !
            </p>
          </div>

          <h4 className="font-bold text-slate-900 mt-6">Comment ça marche ?</h4>

          <div className="space-y-3">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-lg">
                1
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-sm">Récupère ton code unique</h5>
                <p className="text-xs text-slate-600">
                  Va sur <Link href="/parrainage" className="text-rose-500 font-semibold underline">Parrainage</Link> et copie ton code personnel
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-lg">
                2
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-sm">Partage ton code</h5>
                <p className="text-xs text-slate-600">
                  Envoie-le sur WhatsApp, Instagram, SMS... à tes amis célibataires 💕
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-lg">
                3
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-sm">Ils s'inscrivent = Vous gagnez tous les 2 !</h5>
                <p className="text-xs text-slate-600">
                  <strong className="text-emerald-600">+7 jours Premium GRATUIT pour toi</strong>
                  <br/>
                  <strong className="text-emerald-600">+7 jours Premium GRATUIT pour ton ami</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl mt-4">
            <p className="text-sm text-slate-800">
              💡 <strong>Astuce :</strong> Invite <strong>4 amis</strong> = 1 MOIS de Premium GRATUIT !
              Invite <strong>52 amis</strong> = 1 AN de Premium GRATUIT ! 🚀
            </p>
          </div>

          <Link
            href="/parrainage"
            className="block w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-black text-center shadow-lg hover:shadow-xl transition"
          >
            <Gift className="w-5 h-5 inline mr-2" />
            Voir mon code de parrainage
          </Link>
        </div>
      ),
    },

    // ═══════════════════════════════════════════════
    // SECTION 6 : SÉCURITÉ
    // ═══════════════════════════════════════════════
    {
      id: "securite",
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Ta sécurité avant tout",
      color: "from-cyan-500 to-blue-500",
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm mb-4">
            LoveLink prend ta sécurité très au sérieux. Voici les outils à ta disposition :
          </p>

          {/* Vérification */}
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-white fill-white" />
              </div>
              <h4 className="font-bold text-slate-900">💙 Badge de Vérification</h4>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Prouve que tu es une vraie personne en envoyant un selfie avec un geste spécifique.
              Une fois validé par nos modérateurs, tu obtiens le <strong>badge bleu</strong> ✓
            </p>
            <Link
              href="/verification"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
            >
              Vérifier mon profil <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Signaler */}
          <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-slate-900">🚩 Signaler un profil</h4>
            </div>
            <p className="text-sm text-slate-600">
              Comportement suspect ? Faux profil ? <strong>Signale-le en 1 clic</strong>.
              Notre équipe examine chaque signalement dans les 24h.
            </p>
          </div>

          {/* Bloquer */}
          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <Ban className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-slate-900">🚫 Bloquer un utilisateur</h4>
            </div>
            <p className="text-sm text-slate-600">
              Tu ne veux plus qu'une personne te contacte ? <strong>Bloque-la</strong>.
              Elle ne verra plus ton profil et ne pourra plus t'écrire.
            </p>
          </div>

          {/* Conseils */}
          <div className="p-5 bg-gradient-to-br from-purple-100 to-rose-100 rounded-2xl border-2 border-purple-300 mt-4">
            <h4 className="font-bold text-slate-900 mb-3">💡 Conseils de sécurité</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><span>✅</span> Ne partage jamais tes informations bancaires</li>
              <li className="flex gap-2"><span>✅</span> Rencontre les gens dans des lieux publics</li>
              <li className="flex gap-2"><span>✅</span> Fais confiance à ton instinct</li>
              <li className="flex gap-2"><span>✅</span> Signale tout comportement inapproprié</li>
              <li className="flex gap-2"><span>✅</span> Vérifie les profils avec le badge bleu 💙</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-slate-900">Guide LoveLink</h1>
            <p className="text-xs text-slate-500">Comment ça marche ?</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Hero */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-500 to-purple-600 rounded-3xl mb-4 shadow-2xl">
            <Info className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Guide LoveLink 📚
          </h1>
          <p className="text-slate-600">
            Découvre <strong>tous les outils</strong> pour maximiser tes chances de trouver l'amour 💜
          </p>
        </div>

        {/* Quick access */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/discover"
            className="p-4 bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-2xl shadow-lg hover:scale-105 transition flex flex-col items-center gap-2"
          >
            <Compass className="w-8 h-8" />
            <span className="font-bold text-sm">Découvrir</span>
          </Link>
          <Link
            href="/parrainage"
            className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl shadow-lg hover:scale-105 transition flex flex-col items-center gap-2"
          >
            <Gift className="w-8 h-8" />
            <span className="font-bold text-sm">Parrainer</span>
          </Link>
        </div>

        {/* Sections (accordéon) */}
        <div className="space-y-3">
          {sections.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <div
                key={section.id}
                className={`bg-white rounded-3xl shadow-sm border transition-all overflow-hidden ${
                  isOpen ? "border-rose-300 shadow-xl" : "border-slate-100"
                }`}
              >
                {/* En-tête cliquable */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition text-left"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${section.color} rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}
                  >
                    {section.icon}
                  </div>
                  <h2 className="font-bold text-slate-900 flex-1">{section.title}</h2>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {/* Contenu déplié */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 animate-fade-in">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA final */}
        <div className="mt-8 p-6 bg-gradient-to-br from-rose-500 to-purple-600 rounded-3xl text-white text-center shadow-2xl">
          <Trophy className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-xl font-black mb-2">Prêt(e) à trouver l'amour ?</h3>
          <p className="text-sm text-white/90 mb-4">
            Tu connais maintenant tous les outils LoveLink !
          </p>
          <Link
            href="/discover"
            className="inline-block px-6 py-3 bg-white text-rose-600 rounded-2xl font-black shadow-lg hover:scale-105 transition"
          >
            Découvrir des profils 🚀
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          💜 LoveLink - Connecter les cœurs africains
        </p>
      </div>
    </div>
  );
}
