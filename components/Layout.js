import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function Layout({ children, title, description }) {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('howtomgr-theme', newTheme);
    setTheme(newTheme);
  };

  return (
    <>
      <Head>
        <title>{title ? `${title} - HowToMgr` : 'HowToMgr - Installation Guides & Tutorials'}</title>
        <meta
          name="description"
          content={description || 'Comprehensive installation guides for popular software and services. Mobile-first design with security hardening and cross-platform support.'}
        />
        <meta name="keywords" content="installation guides, tutorials, linux, docker, kubernetes, mobile-first, responsive" />

        {/* Open Graph */}
        <meta property="og:title" content={title ? `${title} - HowToMgr` : 'HowToMgr - Installation Guides'} />
        <meta property="og:description" content={description || 'Learn. Install. Deploy. Mobile-first installation guides.'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://howtomgr.github.io" />
        <meta property="og:image" content="https://howtomgr.github.io/social-preview.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={title ? `${title} - HowToMgr` : 'HowToMgr'} />
        <meta property="twitter:description" content={description || 'Mobile-first installation guides'} />
      </Head>

      <div className="app-container">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Mobile Navigation */}
        <nav className="mobile-nav">
          <div className="mobile-nav-content">
            <Link href="/" className="mobile-brand">
              <span role="img" aria-label="Books">📚</span>
              HowToMgr
            </Link>

            <div className="nav-links">
              <Link href="/all/" className="nav-link">All</Link>
              <Link href="/search/" className="nav-link">Search</Link>
            </div>

            <button
              className="mobile-theme-toggle touch-target"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Switch theme"
            >
              <span className="theme-icon-dark">🌙</span>
              <span className="theme-icon-light" style={{ display: 'none' }}>☀️</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main id="main-content" className="main-content" tabIndex="-1">
          <div className="container">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="mobile-footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-links">
                <Link href="/">Home</Link>
                <a href="https://github.com/howtomgr" target="_blank" rel="noopener">
                  GitHub
                </a>
                <a href="https://github.com/howtomgr/howtomgr.github.io" target="_blank" rel="noopener">
                  Source
                </a>
              </div>

              <div className="footer-separator"></div>

              <p className="footer-text">
                © {new Date().getFullYear()} HowToMgr Organization. Open source installation guides.
              </p>

              <p className="footer-tech">
                Built with ❤️ using Next.js + GitHub Pages
              </p>

              <p className="footer-disclaimer">
                <small>All guides are provided as-is. Please review and test before production use.</small>
              </p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding-top: 56px; /* Account for fixed nav */
        }

        .main-content {
          flex: 1;
          padding: var(--space-6) 0;
        }

        .mobile-footer {
          background: var(--bg-secondary);
          border-top: 1px solid var(--bg-surface);
          padding: var(--space-6) 0;
          margin-top: auto;
        }

        .footer-content {
          text-align: center;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: var(--space-6);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }

        .footer-links a {
          color: var(--accent-primary);
          text-decoration: none;
          font-size: var(--font-sm);
        }

        .footer-links a:hover {
          color: var(--accent-secondary);
        }

        .footer-separator {
          height: 1px;
          background: var(--bg-surface);
          margin: var(--space-4) auto;
          width: 200px;
        }

        .footer-text,
        .footer-tech {
          color: var(--text-secondary);
          font-size: var(--font-sm);
          margin-bottom: var(--space-2);
        }

        .footer-disclaimer {
          color: var(--text-muted);
          font-size: var(--font-xs);
        }

        .nav-links {
          display: flex;
          gap: var(--space-4);
        }

        .nav-link {
          color: var(--text-primary);
          text-decoration: none;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--border-radius);
          font-size: var(--font-sm);
          font-weight: 500;
          transition: var(--transition);
          min-height: 36px;
          display: flex;
          align-items: center;
        }

        .nav-link:hover {
          background: var(--bg-surface);
          color: var(--accent-primary);
          text-decoration: none;
        }

        /* Theme icon toggle */
        [data-theme="light"] .theme-icon-dark {
          display: none;
        }

        [data-theme="light"] .theme-icon-light {
          display: inline !important;
        }

        @media (max-width: 767px) {
          .main-content {
            padding: var(--space-4) 0;
          }

          .footer-links {
            gap: var(--space-4);
          }
        }
      `}</style>
    </>
  );
}