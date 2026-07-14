'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../layout';
import { X, Loader2, Phone, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    emoji: '🆓',
    priceMonthly: 0,
    priceYearly: 0,
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
    priceMonthly: 2500,
    priceYearly: 21000,
    period: 'par mois',
    color: 'from-pink-500 to-purple-600',
    border: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-700',
    button: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90',
    buttonText: 'S\'abonner',
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
    priceMonthly: 5000,
    priceYearly: 42000,
    period: 'par mois',
    color: 'from-yellow-400 to-orange-500',
    border: 'border-yellow-400',
    badge: 'bg-yellow-100 text-yellow-700',
    button: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:opacity-90',
    buttonText: 'S\'abonner',
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
    q: 'Comment fonctionne le paiement ?',
    a: 'Le paiement se fait de manière sécurisée via CinetPay. Nous acceptons Orange Money, Wave, MTN Mobile Money et cartes bancaires. Ton abonnement est activé immédiatement après confirmation.',
  },
  {
    q: 'Puis-je annuler mon abonnement ?',
    a: 'Oui, ton abonnement n\'est pas automatiquement renouvelé. Il expire à la fin de la période choisie (1 mois ou 1 an). Tu peux racheter à tout moment.',
  },
  {
    q: 'Quels moyens de paiement sont acceptés ?',
    a: 'Orange Money, Wave, MTN Mobile Money, Free Money, et cartes bancaires (Visa, Mastercard). Tous les paiements sont sécurisés par CinetPay.',
  },
  {
    q: 'Le plan Basic restera-t-il gratuit ?',
    a: 'Oui ! Le plan Basic restera toujours 100% gratuit. LoveLink est fait pour tout le monde, avec ou sans Premium.',
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const { user } = useUser();

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  // Modal de paiement
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'gold' | null>(null);
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPaymentModal = (planId: 'premium' | 'gold') => {
    setSelectedPlan(planId);
    setError(null);
    setPhone('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (processing) return;
    setModalOpen(false);
    setSelectedPlan(null);
    setError(null);
    setPhone('');
  };

  const startPayment = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingPeriod: billing,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création du paiement');
        setProcessing(false);
        return;
      }

      // ✅ Redirection vers CinetPay
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError('URL de paiement introuvable');
        setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setError('Erreur réseau. Veuillez réessayer.');
      setProcessing(false);
    }
  };

  const currentPlan = plans.find((p) => p.id === selectedPlan);
  const amount = currentPlan
    ? billing === 'yearly'
      ? currentPlan.priceYearly
      : currentPlan.priceMonthly
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white pb-20">
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white py-16 px-4 text-center">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-48 translate-y-48" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Paiement sécurisé par CinetPay
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Passe à la vitesse supérieure
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Plus de matchs, plus de connexions, plus d&apos;amour.
            Découvre qui t&apos;a liké et booste ta visibilité.
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
            const displayPrice =
              billing === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const displayPerMonth =
              billing === 'yearly' && plan.priceYearly > 0
                ? Math.round(plan.priceYearly / 12)
                : plan.priceMonthly;

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
                      {plan.priceMonthly === 0 ? (
                        <div className="text-3xl font-black text-gray-500">Gratuit</div>
                      ) : (
                        <>
                          <div className="text-4xl font-black text-gray-900">
                            {displayPrice.toLocaleString('fr-FR')} <span className="text-lg font-bold">FCFA</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {billing === 'yearly'
                              ? `Soit ${displayPerMonth.toLocaleString('fr-FR')} FCFA/mois`
                              : plan.period}
                          </div>
                          {billing === 'yearly' && (
                            <div className="inline-block mt-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                              Économise {(plan.priceMonthly * 12 - plan.priceYearly).toLocaleString('fr-FR')} FCFA/an
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bouton */}
                  <button
                    onClick={() => {
                      if (plan.id !== 'basic') {
                        openPaymentModal(plan.id as 'premium' | 'gold');
                      }
                    }}
                    disabled={plan.id === 'basic'}
                    className={`w-full py-3 rounded-2xl font-bold text-sm transition-all mb-6 ${plan.button}`}
                  >
                    {plan.id === 'basic' ? '✓ Plan actuel' : '🚀 ' + plan.buttonText}
                  </button>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            feature.included
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {feature.included ? '✓' : '✕'}
                        </div>
                        <span
                          className={`text-sm ${
                            feature.included
                              ? 'text-gray-800'
                              : 'text-gray-400 line-through'
                          }`}
                        >
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

        {/* BANDEAU SÉCURITÉ */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 rounded-3xl p-8 text-white text-center mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl md:text-3xl font-black mb-3">
              Paiement 100% sécurisé
            </h2>
            <p className="text-white/90 max-w-xl mx-auto mb-6">
              Tous les paiements sont traités de manière sécurisée par CinetPay,
              leader africain des paiements en ligne.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-3 text-sm font-semibold">
                🍊 Orange Money
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-3 text-sm font-semibold">
                🌊 Wave
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-3 text-sm font-semibold">
                📱 MTN Money
              </div>
              <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-3 text-sm font-semibold">
                💳 Visa / Mastercard
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
              <div
                key={i}
                className={`border-2 ${item.color} rounded-2xl p-6 text-center`}
              >
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
                    <td className="p-4 text-center text-sm font-semibold text-purple-600">
                      {row[2]}
                    </td>
                    <td className="p-4 text-center text-sm font-semibold text-orange-500">
                      {row[3]}
                    </td>
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
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <span
                    className="text-2xl text-gray-400 transition-transform"
                    style={{
                      transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  >
                    +
                  </span>
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
            Prêt(e) à trouver l&apos;amour ?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Passe Premium dès maintenant et débloque toutes les fonctionnalités
            pour multiplier tes chances de rencontrer LA bonne personne !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => openPaymentModal('premium')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              💜 Passer Premium
            </button>
            <button
              onClick={() => openPaymentModal('gold')}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              👑 Devenir Gold
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL DE PAIEMENT */}
      {/* ============================================ */}
      {modalOpen && currentPlan && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div
              className={`bg-gradient-to-r ${currentPlan.color} text-white p-6 relative`}
            >
              <button
                onClick={closeModal}
                disabled={processing}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-4xl mb-2">{currentPlan.emoji}</div>
              <h3 className="text-2xl font-black">LoveLink {currentPlan.name}</h3>
              <p className="text-white/90 text-sm mt-1">
                Abonnement {billing === 'yearly' ? '1 an' : '1 mois'}
              </p>
            </div>

            {/* Corps modal */}
            <div className="p-6">
              {/* Récap prix */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Plan choisi</span>
                  <span className="font-bold text-slate-900">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Durée</span>
                  <span className="font-bold text-slate-900">
                    {billing === 'yearly' ? '1 an' : '1 mois'}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">Total</span>
                  <span className="text-2xl font-black text-slate-900">
                    {amount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              {/* Champ téléphone */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Numéro Mobile Money (optionnel)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 XX XXX XX XX"
                  disabled={processing}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 Pré-remplir pour un paiement plus rapide (Orange, Wave, MTN, Free)
                </p>
              </div>

              {/* Erreur */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Sécurité */}
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Paiement 100% sécurisé
                  </p>
                  <p className="text-xs text-green-700">
                    Traité par CinetPay, leader africain
                  </p>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={processing}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={startPayment}
                  disabled={processing}
                  className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${currentPlan.color} text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>Continuer →</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
