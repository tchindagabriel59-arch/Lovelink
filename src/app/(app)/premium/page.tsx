'use client';

import { useState } from 'react';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    emoji: '🆓',
    price: 0,
    period: 'Toujours gratuit',
    color: 'from-gray-400 to-gray-500',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    button: 'bg-gray-200 text-gray-600 cursor-not-allowed',
    buttonText: 'Plan actuel',
    popular: false,
    features: [
      { text: 'Likes illimités', included: true },
      { text: '1 Super Like par jour', included: true },
      { text: 'Voir ses matchs', included: true },
      { text: 'Chat avec ses matchs', included: true },
      { text: '1 Boost par 24h', included: true },
      { text: 'Prompts de profil (3)', included: true },
      { text: '6 photos de profil', included: true },
      { text: 'Voir qui m\'a liké', included: false },
      { text: 'Super Likes illimités', included: false },
      { text: 'Boosts illimités', included: false },
      { text: 'Mode incognito', included: false },
      { text: 'Badge PREMIUM doré', included: false },
      { text: 'Priorité dans Discover', included: false },
      { text: 'Rewind illimité', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    emoji: '💜',
    price: 4.99,
    period: 'par mois',
    color: 'from-pink-500 to-purple-600',
    border: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-700',
    button: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90',
    buttonText: 'Bientôt disponible',
    popular: true,
    features: [
      { text: 'Likes illimités', included: true },
      { text: '5 Super Likes par jour', included: true },
      { text: 'Voir ses matchs', included: true },
      { text: 'Chat avec ses matchs', included: true },
      { text: '3 Boosts par jour', included: true },
      { text: 'Prompts de profil (3)', included: true },
      { text: '6 photos de profil', included: true },
      { text: 'Voir qui m\'a liké', included: true },
      { text: 'Super Likes illimités', included: false },
      { text: 'Boosts illimités', included: false },
      { text: 'Mode incognito', included: false },
      { text: 'Badge PREMIUM doré', included: true },
      { text: 'Priorité dans Discover', included: true },
      { text: 'Rewind illimité', included: true },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    emoji: '👑',
    price: 9.99,
    period: 'par mois',
    color: 'from-yellow-400 to-orange-500',
    border: 'border-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700',
    button: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:opacity-90',
    buttonText: 'Bientôt disponible',
    popular: false,
    features: [
      { text: 'Likes illimités', included: true },
      { text: 'Super Likes illimités', included: true },
      { text: 'Voir ses matchs', included: true },
      { text: 'Chat avec ses matchs', included: true },
      { text: 'Boosts illimités', included: true },
      { text: 'Prompts de profil (3)', included: true },
      { text: '6 photos de profil', included: true },
      { text: 'Voir qui m\'a liké', included: true },
      { text: 'Super Likes illimités', included: true },
      { text: 'Boosts illimités', included: true },
      { text: 'Mode incognito', included: true },
      { text: 'Badge GOLD doré ✨', included: true },
      { text: 'Priorité #1 dans Discover', included: true },
      { text: 'Rewind illimité', included: true },
    ],
  },
];

const faq = [
  {
    q: 'Quand sera disponible le paiement ?',
    a: 'Le système de paiement sera disponible très prochainement. Inscris-toi maintenant pour être notifié en premier et profiter d\'une offre de lancement exclusive !',
  },
  {
    q: 'Puis-je annuler mon abonnement ?',
    a: 'Oui, tu pourras annuler à tout moment depuis ton profil. Aucun engagement, aucune surprise.',
  },
  {
    q: 'Quels moyens de paiement seront acceptés ?',
    a: 'Carte bancaire (Visa, Mastercard), Mobile Money (Orange Money, Wave) et PayPal seront acceptés.',
  },
  {
    q: 'Le plan Basic restera-t-il gratuit ?',
    a: 'Oui ! Le plan Basic restera toujours gratuit. LoveLink est fait pour tout le monde.',
  },
];

export default function PremiumPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white pb-20">
      
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white py-16 px-4 text-center">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-48 translate-y-48" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6">
            ✨ Bientôt disponible
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Passe à la vitesse supérieure
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Plus de matchs, plus de connexions, plus d'amour. 
            Découvre qui t'a liké et booste ta visibilité.
          </p>
          
          {/* Toggle mensuel/annuel */}
          <div className="inline-flex items-center bg-white/20 backdrop-blur rounded-full p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billing === 'monthly' 
                  ? 'bg-white text-purple-600' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billing === 'yearly' 
                  ? 'bg-white text-purple-600' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Annuel 🎁 -30%
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* CARTES PLANS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const displayPrice = billing === 'yearly' && plan.price > 0
              ? (plan.price * 0.7).toFixed(2)
              : plan.price;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl border-2 ${plan.border} shadow-xl overflow-hidden transition-transform hover:-translate-y-1`}
              >
                {/* Badge Populaire */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-center text-xs font-bold py-2 tracking-wide">
                    ⭐ LE PLUS POPULAIRE
                  </div>
                )}

                <div className={`p-6 ${plan.popular ? 'pt-10' : ''}`}>
                  {/* Header plan */}
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">{plan.emoji}</div>
                    <h2 className="text-2xl font-black text-gray-900">{plan.name}</h2>
                    <div className="mt-3">
                      {plan.price === 0 ? (
                        <div className="text-3xl font-black text-gray-500">Gratuit</div>
                      ) : (
                        <>
                          <div className="text-4xl font-black text-gray-900">
                            {displayPrice}€
                          </div>
                          <div className="text-sm text-gray-500">
                            {billing === 'yearly' ? 'par mois, facturé annuellement' : plan.period}
                          </div>
                          {billing === 'yearly' && (
                            <div className="inline-block mt-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                              Économise {(plan.price * 12 * 0.3).toFixed(0)}€/an
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bouton */}
                  <button
                    disabled={plan.id === 'basic'}
                    className={`w-full py-3 rounded-2xl font-bold text-sm transition-all mb-6 ${plan.button}`}
                  >
                    {plan.id === 'basic' ? '✓ Plan actuel' : '🔒 ' + plan.buttonText}
                  </button>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          feature.included 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {feature.included ? '✓' : '✕'}
                        </div>
                        <span className={`text-sm ${
                          feature.included ? 'text-gray-800' : 'text-gray-400 line-through'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BANDEAU COMING SOON */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white text-center mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              Le paiement arrive très bientôt !
            </h2>
            <p className="text-white/90 max-w-xl mx-auto mb-6">
              On prépare quelque chose de magnifique pour toi. 
              Sois parmi les premiers à en profiter avec une offre de lancement exclusive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-3 text-sm font-semibold">
                💳 Carte bancaire
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-3 text-sm font-semibold">
                📱 Mobile Money (Wave, Orange)
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-3 text-sm font-semibold">
                🌍 PayPal
              </div>
            </div>
          </div>
        </div>

        {/* AVANTAGES VISUELS */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-center text-gray-900 mb-8">
            Pourquoi passer Premium ? 💡
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '👀',
                title: 'Voir qui t\'a liké',
                desc: 'Découvre tous ceux qui ont swipé sur ton profil avant même de matcher.',
                color: 'bg-pink-50 border-pink-200',
              },
              {
                icon: '⭐',
                title: 'Super Likes illimités',
                desc: 'Montre que tu es vraiment intéressé(e) sans limite quotidienne.',
                color: 'bg-purple-50 border-purple-200',
              },
              {
                icon: '🚀',
                title: 'Boosts illimités',
                desc: 'Propulse ton profil en tête des découvertes autant de fois que tu veux.',
                color: 'bg-blue-50 border-blue-200',
              },
              {
                icon: '🕵️',
                title: 'Mode incognito',
                desc: 'Navigue discrètement et choisis qui peut voir ton profil.',
                color: 'bg-green-50 border-green-200',
              },
            ].map((item, i) => (
              <div key={i} className={`border-2 ${item.color} rounded-2xl p-6 text-center`}>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TABLEAU COMPARATIF */}
        <div className="mb-16 overflow-x-auto">
          <h2 className="text-2xl font-black text-center text-gray-900 mb-8">
            Comparaison complète 📊
          </h2>
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  <th className="text-left p-4 font-bold">Fonctionnalité</th>
                  <th className="text-center p-4 font-bold">🆓 Basic</th>
                  <th className="text-center p-4 font-bold">💜 Premium</th>
                  <th className="text-center p-4 font-bold">👑 Gold</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Likes', 'Illimités', 'Illimités', 'Illimités'],
                  ['Super Likes', '1/jour', '5/jour', 'Illimités'],
                  ['Boosts', '1/24h', '3/jour', 'Illimités'],
                  ['Voir qui m\'a liké', '❌', '✅', '✅'],
                  ['Rewind', 'Limité', 'Illimité', 'Illimité'],
                  ['Mode incognito', '❌', '❌', '✅'],
                  ['Badge Premium', '❌', '💜 Violet', '👑 Doré'],
                  ['Priorité Discover', 'Standard', 'Élevée', '#1'],
                  ['Support', 'Standard', 'Prioritaire', 'VIP 24/7'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 font-medium text-gray-700">{row[0]}</td>
                    <td className="p-4 text-center text-sm text-gray-600">{row[1]}</td>
                    <td className="p-4 text-center text-sm font-semibold text-purple-600">{row[2]}</td>
                    <td className="p-4 text-center text-sm font-semibold text-orange-500">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-center text-gray-900 mb-8">
            Questions fréquentes ❓
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <span className="text-2xl text-gray-400 transition-transform" style={{
                    transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)'
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA FINAL */}
        <div className="text-center bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl p-10 border-2 border-purple-200">
          <div className="text-5xl mb-4">💜</div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">
            Prêt(e) à trouver l'amour ?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Commence dès maintenant avec le plan gratuit et passe Premium 
            dès que le paiement sera disponible !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/discover"
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              💕 Découvrir des profils
            </a>
            <a
              href="/boost"
              className="bg-white text-purple-600 border-2 border-purple-300 px-8 py-4 rounded-2xl font-bold hover:bg-purple-50 transition-all"
            >
              🚀 Booster mon profil
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
