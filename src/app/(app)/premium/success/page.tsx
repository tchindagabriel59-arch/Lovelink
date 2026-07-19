'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Déclaration TypeScript pour Facebook Pixel
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading');
  const [message, setMessage] = useState('Vérification de votre paiement...');
  const [plan, setPlan] = useState<string>('');
  const [pixelTracked, setPixelTracked] = useState(false);

  useEffect(() => {
    const txn = searchParams.get('txn');
    const token = searchParams.get('token');

    if (!txn && !token) {
      setStatus('failed');
      setMessage('Transaction ID manquant');
      return;
    }

    const verifyId = txn || token;

    fetch(`/api/payment/verify?txn=${verifyId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage('Paiement réussi ! Votre compte Premium est activé.');
          setPlan(data.plan || '');

          // 🎯 FACEBOOK PIXEL - Tracker le PURCHASE réussi
          if (!pixelTracked && typeof window !== 'undefined' && typeof window.fbq === 'function') {
            // Prix approximatif selon le plan
            const prices: Record<string, number> = {
              premium: data.billingPeriod === 'yearly' ? 21000 : 2500,
              gold: data.billingPeriod === 'yearly' ? 42000 : 5000,
            };
            const priceFCFA = prices[data.plan] || 2500;
            const priceUSD = priceFCFA / 600; // Conversion FCFA → USD approximative

            window.fbq('track', 'Purchase', {
              content_name: `LoveLink ${data.plan}`,
              content_category: 'Subscription',
              content_ids: [data.plan],
              content_type: 'product',
              value: priceUSD,
              currency: 'USD',
              num_items: 1,
            });

            // Événement personnalisé avec le vrai montant en FCFA
            window.fbq('trackCustom', 'PurchaseFCFA', {
              plan: data.plan,
              billing_period: data.billingPeriod,
              value_fcfa: priceFCFA,
              currency: 'XOF',
            });

            console.log('✅ Facebook Pixel: Purchase tracked', {
              plan: data.plan,
              value: priceUSD,
              currency: 'USD',
            });

            setPixelTracked(true);
          }
        } else if (data.status === 'pending') {
          setStatus('pending');
          setMessage('Paiement en cours de traitement...');
          setTimeout(() => window.location.reload(), 3000);
        } else {
          setStatus('failed');
          setMessage(data.error || 'Le paiement n\'a pas été confirmé.');
        }
      })
      .catch(err => {
        console.error('Erreur vérification:', err);
        setStatus('failed');
        setMessage('Erreur lors de la vérification du paiement');
      });
  }, [searchParams, pixelTracked]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <h1 className="text-2xl font-bold mb-2">Vérification...</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-600">Paiement Réussi ! 🎉</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            {plan && (
              <p className="text-sm text-gray-500 mb-4">
                Plan activé : <strong className="capitalize">{plan}</strong>
              </p>
            )}
            <div className="space-y-3">
              <Link
                href="/profile"
                className="block w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Voir mon profil Premium 💎
              </Link>
              <Link
                href="/discover"
                className="block w-full border-2 border-pink-500 text-pink-500 py-3 rounded-xl font-semibold hover:bg-pink-50 transition"
              >
                Découvrir des profils
              </Link>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-yellow-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-yellow-600">Paiement en cours...</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Cette page se rafraîchit automatiquement</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-600">Erreur de vérification</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              href="/premium"
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
            >
              Retour à la page Premium
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
