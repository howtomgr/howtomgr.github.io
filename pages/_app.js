import { useEffect } from 'react';
import Head from 'next/head';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/globals.css';
import '../styles/mobile.css';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('howtomgr-theme');
      const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      const theme = savedTheme || systemTheme;

      document.documentElement.setAttribute('data-theme', theme);
    };

    initializeTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = (e) => {
      if (!localStorage.getItem('howtomgr-theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Add mobile optimizations
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
    }

    // Global copy code function
    window.copyCode = (button) => {
      const codeBlock = button.closest('.mobile-code-block').querySelector('code');
      const text = codeBlock.textContent;

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          showCopySuccess(button);
        }).catch(() => {
          fallbackCopy(text, button);
        });
      } else {
        fallbackCopy(text, button);
      }
    };

    window.showCopySuccess = (button) => {
      const originalText = button.querySelector('.copy-text').textContent;
      const iconElement = button.querySelector('.copy-icon');
      const textElement = button.querySelector('.copy-text');

      iconElement.textContent = '✅';
      textElement.textContent = 'Copied!';
      button.classList.add('copied');
      button.disabled = true;

      setTimeout(() => {
        iconElement.textContent = '📋';
        textElement.textContent = originalText;
        button.classList.remove('copied');
        button.disabled = false;
      }, 2000);
    };

    window.fallbackCopy = (text, button) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        showCopySuccess(button);
      } catch (err) {
        console.error('Copy failed:', err);
        const iconElement = button.querySelector('.copy-icon');
        iconElement.textContent = '❌';
        setTimeout(() => iconElement.textContent = '📋', 2000);
      } finally {
        document.body.removeChild(textArea);
      }
    };

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="theme-color" content="#bd93f9" />
        <link rel="icon" href="/favicon.ico" />

        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </Head>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </>
  );
}