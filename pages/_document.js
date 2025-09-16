import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//api.github.com" />
        <link rel="dns-prefetch" href="//github.com" />

        {/* Preload critical resources */}
        <link rel="preload" href="/favicon.ico" as="image" />

        {/* PWA meta tags */}
        <meta name="application-name" content="HowToMgr" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HowToMgr" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* No-JS fallback styles */}
        <noscript>
          <style>{`
            .requires-js { display: none !important; }
            .no-js-message { display: block !important; }
          `}</style>
        </noscript>
      </Head>
      <body>
        <noscript>
          <div className="no-js-message" style={{
            padding: '1rem',
            background: '#ff5555',
            color: '#f8f8f2',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            This site requires JavaScript to function properly. Please enable JavaScript in your browser.
          </div>
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}