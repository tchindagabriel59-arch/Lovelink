'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const FB_PIXEL_ID = '1502714508561130';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

function PixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Attendre que fbq soit complètement initialisé
    const trackPageView = () => {
      if (
        typeof window !== 'undefined' &&
        typeof window.fbq === 'function' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.fbq as any).loaded === true
      ) {
        window.fbq('track', 'PageView');
      }
    };

    // Petit délai pour s'assurer que le script est chargé
    const timer = setTimeout(trackPageView, 100);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}

export default function FacebookPixel() {
  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PixelTracker />
      </Suspense>
    </>
  );
}
