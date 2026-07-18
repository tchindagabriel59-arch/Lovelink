// src/app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, subscriptions, users } from '@/db/schema';
import { getCurrentUserId } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    console.log('=== DEBUT CREATION PAIEMENT ===');
    
    // SANS paramètre !
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('Erreur: utilisateur non authentifie');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    console.log('User connecte ID:', userId);

    const body = await req.json();
    const { plan, billingPeriod, phone } = body;
    console.log('Params recus:', { plan, billingPeriod, phone });

    if (!plan || !billingPeriod) {
      return NextResponse.json(
        { error: 'Plan et période requis' },
        { status: 400 }
      );
    }

    if (!['premium', 'gold'].includes(plan)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json({ error: 'Période invalide' }, { status: 400 });
    }

    const prices: Record<string, Record<string, number>> = {
      premium: { monthly: 2500, yearly: 21000 },
      gold: { monthly: 5000, yearly: 42000 },
    };

    const amount = prices[plan][billingPeriod];
    const planNames: Record<string, string> = {
      premium: 'Premium',
      gold: 'Gold',
    };
    const periodNames: Record<string, string> = {
      monthly: 'mensuel',
      yearly: 'annuel',
    };

    const description = `LoveLink ${planNames[plan]} ${periodNames[billingPeriod]}`;

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult[0]) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const user = userResult[0];
    const merchantTransactionId = `LL-${randomUUID()}`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelink237.com';
    const returnUrl = `${siteUrl}/premium/success?txn=${merchantTransactionId}`;
    const cancelUrl = `${siteUrl}/premium/failed?txn=${merchantTransactionId}`;

    const mode = process.env.PAYDUNYA_MODE || 'test';
    const paydunyaUrl = mode === 'live'
      ? 'https://app.paydunya.com/api/v1/checkout-invoice/create'
      : 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create';

    const paydunyaBody = {
      invoice: {
  items: {
    item_0: {
      name: description,
      quantity: 1,
      unit_price: String(amount),
      total_price: String(amount),
      description: description,
    },
  },
  total_amount: amount,
  description: description,

  // IMPORTANT: afficher les moyens de paiement (sinon wallet/login)
  channels: ['card', 'orange-money-senegal', 'wave-senegal', 'free-money-senegal'],
},
      store: {
        name: 'LoveLink',
        tagline: 'Trouvez l amour avec LoveLink',
        postal_address: 'Dakar, Senegal',
        website_url: 'https://lovelink237.com',
        phone: '+221778161664',
        logo_url: 'https://i.ibb.co/Y4h4H7R7/LOVELINK-1.jpg',
      },
      actions: {
        cancel_url: cancelUrl,
        return_url: returnUrl,
        callback_url: `${siteUrl}/api/payment/webhook`,
      },
      customer: {
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        email: user.email,
        phone: phone || '+221778161664',
      },
      custom_data: {
        merchant_transaction_id: merchantTransactionId,
        user_id: String(userId),
      },
    };

    console.log('Appel PayDunya URL:', paydunyaUrl);

    const paydunyaResponse = await fetch(paydunyaUrl, {
      method: 'POST',
      headers: {
        'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY || '',
        'PAYDUNYA-PUBLIC-KEY': process.env.PAYDUNYA_PUBLIC_KEY || '',
        'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY || '',
        'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paydunyaBody),
    });

    const paydunyaData = await paydunyaResponse.json();
    console.log('Reponse PayDunya:', paydunyaData);

    if (paydunyaData.response_code !== '00') {
      console.error('Erreur PayDunya:', paydunyaData);
      return NextResponse.json(
        {
          error: paydunyaData.response_text || 'Erreur PayDunya',
          details: paydunyaData.description || paydunyaData.response_text,
          full: paydunyaData,
        },
        { status: 400 }
      );
    }

    const paymentToken = paydunyaData.token;
    const paymentUrl = mode === 'live'
      ? `https://paydunya.com/checkout/invoice/${paymentToken}`
      : `https://paydunya.com/sandbox-checkout/invoice/${paymentToken}`;

    const startsAt = new Date();
    const expiresAt = new Date();
    if (billingPeriod === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        userId: userId,
        plan: plan as 'premium' | 'gold',
        billingPeriod: billingPeriod as 'monthly' | 'yearly',
        amount,
        currency: 'XOF',
        status: 'active',
        startsAt,
        expiresAt,
        autoRenew: false,
      })
      .returning();

    await db.insert(payments).values({
      userId: userId,
      subscriptionId: newSubscription.id,
      merchantTransactionId,
      cinetpayTransactionId: paymentToken,
      paymentToken,
      paymentUrl,
      amount,
      currency: 'XOF',
      plan: plan as 'premium' | 'gold',
      billingPeriod: billingPeriod as 'monthly' | 'yearly',
      paymentMethod: 'paydunya',
      status: 'pending',
      clientEmail: user.email,
      clientFirstName: user.firstName,
      clientLastName: user.lastName || '',
      clientPhone: phone || '+221778161664',
      initiatedAt: new Date(),
    });

    console.log('=== SUCCES ===');
    return NextResponse.json({
      success: true,
      paymentUrl,
      token: paymentToken,
      merchantTransactionId,
    });

  } catch (error) {
    console.error('=== ERREUR CREATION PAIEMENT ===');
    console.error(error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur', 
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
