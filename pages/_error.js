import Link from 'next/link';
import Layout from '../components/Layout';
import SearchBox from '../components/SearchBox';

function Error({ statusCode, hasGetInitialPropsRun, err, guides = [] }) {
  // Determine error type and message
  const getErrorInfo = (statusCode) => {
    switch (statusCode) {
      case 404:
        return {
          title: 'Installation Guide Not Found',
          message: 'The installation guide you\'re looking for doesn\'t exist or may have been moved.',
          icon: '🔍',
          suggestions: [
            'Check the URL for typos',
            'Use the search box to find the guide you need',
            'Browse installation guides by category',
            'Visit our GitHub organization for the latest updates'
          ]
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'Something went wrong while loading the installation guide.',
          icon: '⚠️',
          suggestions: [
            'Try refreshing the page',
            'Check your internet connection',
            'Wait a moment and try again',
            'Report this issue if it persists'
          ]
        };
      case 403:
        return {
          title: 'Access Forbidden',
          message: 'You don\'t have permission to access this installation guide.',
          icon: '🔒',
          suggestions: [
            'Check if you have the correct URL',
            'Try browsing from the homepage',
            'Contact us if you believe this is an error'
          ]
        };
      default:
        return {
          title: 'Something Went Wrong',
          message: statusCode
            ? `A ${statusCode} error occurred while loading the page.`
            : 'An unexpected error occurred while loading the installation guide.',
          icon: '❌',
          suggestions: [
            'Try refreshing the page',
            'Go back to the previous page',
            'Browse from the homepage',
            'Contact support if the problem continues'
          ]
        };
    }
  };

  const errorInfo = getErrorInfo(statusCode);

  return (
    <Layout
      title={`Error ${statusCode || ''} - ${errorInfo.title}`}
      description={errorInfo.message}
    >
      <div className="error-page">
        <div className="error-content">
          <div className="error-header">
            <div className="error-icon">{errorInfo.icon}</div>
            <div className="error-code">{statusCode || 'Error'}</div>
            <h1 className="error-title">{errorInfo.title}</h1>
            <p className="error-message">{errorInfo.message}</p>
          </div>

          {/* Search to help find what they need */}
          {guides.length > 0 && (
            <div className="error-search">
              <h3>Search for what you need:</h3>
              <SearchBox
                guides={guides}
                placeholder="Search installation guides..."
              />
            </div>
          )}

          {/* Helpful suggestions */}
          <div className="error-suggestions">
            <h3>What you can try:</h3>
            <ul>
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>

          {/* Quick actions */}
          <div className="error-actions">
            <Link href="/" className="btn btn-primary">
              🏠 Back to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              ← Go Back
            </button>

            <a
              href="https://github.com/howtomgr"
              target="_blank"
              rel="noopener"
              className="btn btn-secondary"
            >
              🔗 GitHub Organization
            </a>
          </div>

          {/* Popular categories */}
          <div className="popular-categories">
            <h3>Browse Categories:</h3>
            <div className="category-grid">
              <Link href="/web-server/" className="category-link">
                🌐 Web Servers
              </Link>
              <Link href="/database/" className="category-link">
                🗄️ Databases
              </Link>
              <Link href="/container/" className="category-link">
                📦 Containers
              </Link>
              <Link href="/security/" className="category-link">
                🔒 Security
              </Link>
              <Link href="/monitoring/" className="category-link">
                📊 Monitoring
              </Link>
              <Link href="/communication/" className="category-link">
                💬 Communication
              </Link>
            </div>
          </div>

          {/* Technical details for developers */}
          {process.env.NODE_ENV === 'development' && err && (
            <details className="error-details">
              <summary>Technical Details (Development Only)</summary>
              <pre className="error-stack">
                {err.stack || err.message || String(err)}
              </pre>
            </details>
          )}
        </div>
      </div>

      <style jsx>{`
        .error-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
          padding: var(--space-8) 0;
        }

        .error-content {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .error-header {
          margin-bottom: var(--space-8);
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: var(--space-4);
          display: block;
        }

        .error-code {
          font-size: 6rem;
          color: var(--accent-primary);
          margin-bottom: var(--space-4);
          font-weight: 700;
          line-height: 1;
          text-shadow: 0 0 20px rgba(189, 147, 249, 0.3);
        }

        .error-title {
          color: var(--text-primary);
          margin-bottom: var(--space-4);
          font-size: var(--font-2xl);
          font-weight: 600;
        }

        .error-message {
          color: var(--text-secondary);
          font-size: var(--font-lg);
          margin-bottom: var(--space-6);
          line-height: 1.6;
        }

        .error-search {
          margin: var(--space-8) 0;
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--bg-surface);
        }

        .error-search h3 {
          color: var(--accent-primary);
          margin-bottom: var(--space-4);
          font-size: var(--font-xl);
        }

        .error-suggestions {
          text-align: left;
          margin: var(--space-6) 0;
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-radius: var(--border-radius);
          border: 1px solid var(--bg-surface);
        }

        .error-suggestions h3 {
          color: var(--accent-primary);
          margin-bottom: var(--space-4);
          text-align: center;
          font-size: var(--font-lg);
        }

        .error-suggestions ul {
          margin: 0;
          padding-left: var(--space-6);
          color: var(--text-primary);
        }

        .error-suggestions li {
          margin-bottom: var(--space-3);
          line-height: 1.6;
        }

        .error-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          margin: var(--space-8) 0;
          flex-wrap: wrap;
        }

        .popular-categories {
          margin: var(--space-8) 0;
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--bg-surface);
        }

        .popular-categories h3 {
          color: var(--accent-primary);
          margin-bottom: var(--space-5);
          font-size: var(--font-xl);
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        .category-link {
          padding: var(--space-3) var(--space-4);
          background: var(--accent-primary);
          color: var(--bg-primary);
          text-decoration: none;
          border-radius: var(--border-radius);
          font-size: var(--font-sm);
          font-weight: 500;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          min-height: 48px;
          justify-content: center;
        }

        .category-link:hover {
          background: var(--accent-secondary);
          transform: translateY(-2px);
          text-decoration: none;
          color: var(--bg-primary);
          box-shadow: var(--box-shadow);
        }

        .error-details {
          margin-top: var(--space-8);
          text-align: left;
          background: var(--bg-surface);
          border-radius: var(--border-radius);
          padding: var(--space-4);
        }

        .error-details summary {
          color: var(--accent-warning);
          cursor: pointer;
          font-weight: 600;
          margin-bottom: var(--space-3);
        }

        .error-stack {
          background: var(--bg-primary);
          padding: var(--space-4);
          border-radius: var(--border-radius-sm);
          font-family: var(--font-mono);
          font-size: var(--font-xs);
          color: var(--accent-error);
          overflow-x: auto;
          white-space: pre-wrap;
          margin: 0;
        }

        /* Mobile responsiveness */
        @media (max-width: 767px) {
          .error-page {
            min-height: 60vh;
            padding: var(--space-6) 0;
          }

          .error-code {
            font-size: 4rem;
          }

          .error-title {
            font-size: var(--font-xl);
          }

          .error-message {
            font-size: var(--font-base);
          }

          .error-actions {
            flex-direction: column;
            align-items: center;
          }

          .category-grid {
            grid-template-columns: 1fr;
            gap: var(--space-2);
          }

          .category-link {
            font-size: var(--font-xs);
            padding: var(--space-3);
          }

          .error-search,
          .error-suggestions,
          .popular-categories {
            padding: var(--space-4);
            margin: var(--space-6) 0;
          }

          .error-search h3,
          .error-suggestions h3,
          .popular-categories h3 {
            font-size: var(--font-lg);
          }
        }

        /* Dark/light theme support */
        [data-theme="light"] .error-code {
          text-shadow: 0 0 20px rgba(0, 102, 204, 0.3);
        }

        /* High contrast support */
        @media (prefers-contrast: high) {
          .error-code {
            text-shadow: none;
          }

          .category-link {
            border: 2px solid var(--accent-primary);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .category-link:hover {
            transform: none;
          }
        }
      `}</style>
    </Layout>
  );
}

Error.getInitialProps = async ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

  // Load guides data for search functionality on error pages
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'guides.json');

    try {
      const data = await fs.readFile(dataPath, 'utf8');
      const guidesData = JSON.parse(data);

      return {
        statusCode,
        guides: guidesData.guides || [],
        hasGetInitialPropsRun: true
      };
    } catch (fileError) {
      return {
        statusCode,
        guides: [],
        hasGetInitialPropsRun: true
      };
    }
  } catch (error) {
    return {
      statusCode,
      guides: [],
      hasGetInitialPropsRun: true
    };
  }
};

export default Error;