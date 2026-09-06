import { NextRequest, NextResponse } from 'next/server';
import { sendMetaEvent, generateEventId } from '@/lib/meta-capi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, url } = body;

    // FIX Meta: vraie IP client derrière Vercel
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : req.headers.get('x-real-ip') || '0.0.0.0';

    const userAgent = req.headers.get('user-agent') || undefined;
    const fbp = req.cookies.get('_fbp')?.value;
    const fbc = req.cookies.get('_fbc')?.value;

    await sendMetaEvent({
      eventName: 'PageView',
      eventId: eventId || generateEventId(),
      eventSourceUrl: url || 'https://lovelink237.com',
      userData: {
        clientIpAddress: clientIp,
        clientUserAgent: userAgent,
        fbp,
        fbc,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CAPI PageView] Erreur:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}