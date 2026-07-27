// src/app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, subscriptions, users } from '@/db/schema';
import { getCurrentUserId } from '@/lib/auth';
import { eq, or } from 'drizzle-orm';
import { sendMetaEvent, getClientIp, generateEventId } from '@/lib/meta-capi';

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

    // ✅ Si déjà success en DB (probablement traité par le webhook)
    if (payment.status === 'success') {
      return NextResponse.json({
        success: true,
        status: 'success',
        plan: payment.plan,
        billingPeriod: payment.billingPeriod,
        metaEventId: payment.metaEventId, // ← Renvoie l'eventId déjà stocké
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

      let capiEventId = payment.metaEventId;

      // Mettre à jour
      if (interpretedStatus !== payment.status) {
        // Générer un eventId si pas encore de status success (pour CAPI Purchase)
        if (interpretedStatus === 'success' && !capiEventId) {
          capiEventId = generateEventId();
        }

        await db
          .update(payments)
          .set({
            status: interpretedStatus,
            verifiedAt: new Date(),
            completedAt: interpretedStatus === 'success' ? new Date() : payment.completedAt,
            metaEventId: capiEventId,
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

          console.log(`Premium activé pour user ${payment.userId}`);

          // 📊 META CAPI - Envoyer Purchase si pas déjà envoyé par le webhook
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, payment.userId))
            .limit(1);

          if (user && capiEventId) {
            const prices: Record<string, Record<string, number>> = {
              premium: { monthly: 2500, yearly: 21000 },
              gold: { monthly: 5000, yearly: 42000 },
            };
            const priceFCFA =
              prices[payment.plan]?.[payment.billingPeriod] ||
              Number(payment.amount) ||
              2500;

            sendMetaEvent({
              eventName: 'Purchase',
              eventId: capiEventId,
              eventSourceUrl: 'https://lovelink237.com/premium/success',
              userData: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                clientIpAddress: getClientIp(req),
                clientUserAgent: req.headers.get('user-agent') || undefined,
              },
              customData: {
                currency: 'XOF',
                value: priceFCFA,
                content_name: `LoveLink ${payment.plan}`,
                content_ids: [payment.plan],
                content_type: 'product',
              },
            }).catch((err) => {
              console.error('[Meta CAPI] Erreur Purchase (verify):', err);
            });

            console.log(`[Meta CAPI] ✅ Purchase envoyé via verify - eventId: ${capiEventId}`);
          }
        }
      }

      return NextResponse.json({
        success: interpretedStatus === 'success',
        status: interpretedStatus,
        plan: payment.plan,
        billingPeriod: payment.billingPeriod,
        metaEventId: capiEventId, // ← Renvoie l'eventId pour le Pixel
      });
    }

    return NextResponse.json({
      success: false,
      status: payment.status,
      metaEventId: payment.metaEventId,
    });

  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: String(error) },
      { status: 500 }
    );
  }
}
