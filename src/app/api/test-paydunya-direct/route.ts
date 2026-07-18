import { NextResponse } from 'next/server';

export async function GET() {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY || '';
  const publicKey = process.env.PAYDUNYA_PUBLIC_KEY || '';
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY || '';
  const token = process.env.PAYDUNYA_TOKEN || '';
  const mode = process.env.PAYDUNYA_MODE || 'test';

  const url = mode === 'live'
    ? 'https://app.paydunya.com/api/v1/checkout-invoice/create'
    : 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create';

  const body = {
    invoice: {
      items: {
        item_0: {
          name: 'Test LoveLink',
          quantity: 1,
          unit_price: '2500',
          total_price: '2500',
          description: 'Test paiement',
        }
      },
      total_amount: 2500,
      description: 'Test LoveLink Premium',
    },
    store: {
      name: 'LoveLink',
      tagline: 'Trouvez l amour',
      postal_address: 'Dakar, Senegal',
      website_url: 'https://lovelink237.com',
      phone: '+221778161664',
    },
    actions: {
      cancel_url: 'https://lovelink237.com/premium/failed',
      return_url: 'https://lovelink237.com/premium/success',
      callback_url: 'https://lovelink237.com/api/payment/webhook',
    },
    customer: {
      name: 'Test User',
      email: 'test@lovelink237.com',
      phone: '+221778161664',
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'PAYDUNYA-MASTER-KEY': masterKey,
        'PAYDUNYA-PUBLIC-KEY': publicKey,
        'PAYDUNYA-PRIVATE-KEY': privateKey,
        'PAYDUNYA-TOKEN': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json({
      url_used: url,
      mode: mode,
      http_status: response.status,
      paydunya_response: data,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Erreur fetch',
      details: String(error),
      url_used: url,
    });
  }
}
