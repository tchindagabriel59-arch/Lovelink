// src/app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, subscriptions, users } from '@/db/schema';
import { getCurrentUserId } from '@/lib/auth';
import { eq, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const txn = searchParams.get('txn');

    if (!txn) {
      return NextResponse.json({ error: 'Transaction ID manquant' }, { status: 400 });
    }

    console.log('Verification pour txn:', txn);

    // Chercher par merchantTransactionId OU paymentToken
    const paymentResult = await db
      .select()
      .from(payments)
      .where(
        or(
          eq(payments.merchantTransactionId, txn),
          eq(payments.paymentToken, txn)
        )
      )
      .limit(1);

    if (!paymentResult[0]) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
    }

    const payment = paymentResult[0];

    if (payment.userId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Si déjà success en DB
    if (payment.status === 'success') {
      return NextResponse.json({
        success: true,
        status: 'success',
        plan: payment.plan,
        billingPeriod: payment.billingPeriod,
      });
    }

    // Vérifier via PayDunya API
    if (payment.paymentToken) {
      const mode = process.env.PAYDUNYA_MODE || 'test';
      const paydunyaUrl = mode === 'live'
        ? `https://app.paydunya.com/api/v1/checkout-invoice/confirm/${payment.paymentToken}`
        : `https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/${payment.paymentToken}`;

      const paydunyaResponse = await fetch(paydunyaUrl, {
        method: 'GET',
        headers: {
          'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY || '',
          'PAYDUNYA-PUBLIC-KEY': process.env.PAYDUNYA_PUBLIC_KEY || '',
          'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY || '',
          'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN || '',
          'Content-Type': 'application/json',
        },
      });

      const statusData = await paydunyaResponse.json();
      console.log('Statut PayDunya:', statusData);

      const paydunyaStatus = statusData?.status?.toLowerCase() || '';
      let interpretedStatus: 'pending' | 'success' | 'failed' | 'cancelled' = 'pending';

      if (paydunyaStatus === 'completed') {
        interpretedStatus = 'success';
      } else if (paydunyaStatus === 'cancelled' || paydunyaStatus === 'canceled') {
        interpretedStatus = 'cancelled';
      } else if (paydunyaStatus === 'failed' || paydunyaStatus === 'expired') {
        interpretedStatus = 'failed';
      }

      // Mettre à jour
      if (interpretedStatus !== payment.status) {
        await db
          .update(payments)
          .set({
            status: interpretedStatus,
            verifiedAt: new Date(),
            completedAt: interpretedStatus === 'success' ? new Date() : payment.completedAt,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        // Activer Premium si succès
        if (interpretedStatus === 'success') {
          const expiresAt = new Date();
          if (payment.billingPeriod === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          }

          if (payment.subscriptionId) {
            await db
              .update(subscriptions)
              .set({
                status: 'active',
                startsAt: new Date(),
                expiresAt,
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, payment.subscriptionId));
          }

          await db
            .update(users)
            .set({
              isPremium: true,
              premiumPlan: payment.plan,
              premiumExpiresAt: expiresAt,
              updatedAt: new Date(),
            })
            .where(eq(users.id, payment.userId));

          console.log(`Premium active pour user ${payment.userId}`);
        }
      }

      return NextResponse.json({
        success: interpretedStatus === 'success',
        status: interpretedStatus,
        plan: payment.plan,
        billingPeriod: payment.billingPeriod,
      });
    }

    return NextResponse.json({
      success: false,
      status: payment.status,
    });

  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}
