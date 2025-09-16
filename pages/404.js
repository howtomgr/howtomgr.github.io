import Link from 'next/link';
import Layout from '../components/Layout';
import SimpleSearch from '../components/SimpleSearch';

export default function Custom404({ guides = [] }) {
  return (
    <Layout
      title="Page Not Found"
      description="The installation guide you're looking for doesn't exist or may have been moved."
    >
      <div className="error-page">
        <div className="error-content">
          <div className="error-icon">404</div>
          <h1 className="error-title">Installation Guide Not Found</h1>

          <p className="error-message">
            The installation guide you're looking for doesn't exist or may have been moved.
          </p>

          {/* Search to help find what they need */}
          <div className="error-search">
            <h3>Search for what you need:</h3>
            <SimpleSearch
              guides={guides}
              placeholder="Search installation guides..."
            />
          </div>

          <div className="error-suggestions">
            <h3>What you can do:</h3>
            <ul>
              <li>Check the URL for typos</li>
              <li>Use the search box above to find the guide you need</li>
              <li>Browse installation guides by category</li>
              <li>Visit our GitHub organization for the latest updates</li>
            </ul>
          </div>

          <div className="error-actions">
            <Link href="/" className="btn btn-primary">
              🏠 Back to Home
            </Link>

            <a
              href="https://github.com/howtomgr"
              target="_blank"
              rel="noopener"
              className="btn btn-secondary"
            >
              🔗 GitHub Organization
            </a>
          </div>

          <div className="popular-categories">
            <h3>Popular Categories:</h3>
            <div className="category-links">
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
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .error-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
          text-align: center;
          padding: var(--space-8) 0;
        }

        .error-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .error-icon {
          font-size: 6rem;
          color: var(--accent-primary);
          margin-bottom: var(--space-4);
          font-weight: 700;
          line-height: 1;
        }

        .error-title {
          color: var(--text-primary);
          margin-bottom: var(--space-4);
          font-size: var(--font-2xl);
        }

        .error-message {
          color: var(--text-secondary);
          font-size: var(--font-lg);
          margin-bottom: var(--space-6);
          line-height: 1.5;
        }

        .error-search {
          margin: var(--space-6) 0;
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--bg-surface);
        }

        .error-search h3 {
          color: var(--accent-primary);
          margin-bottom: var(--space-4);
          font-size: var(--font-lg);
        }

        .error-suggestions {
          text-align: left;
          margin: var(--space-6) 0;
          padding: var(--space-4);
          background: var(--bg-secondary);
          border-radius: var(--border-radius);
          border: 1px solid var(--bg-surface);
        }

        .error-suggestions h3 {
          color: var(--accent-primary);
          margin-bottom: var(--space-3);
          text-align: center;
        }

        .error-suggestions ul {
          margin: 0;
          padding-left: var(--space-6);
          color: var(--text-primary);
        }

        .error-suggestions li {
          margin-bottom: var(--space-2);
          line-height: 1.5;
        }

        .error-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          margin: var(--space-6) 0;
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
          margin-bottom: var(--space-4);
        }

        .category-links {
          display: flex;
          gap: var(--space-3);
          justify-content: center;
          flex-wrap: wrap;
        }

        .category-link {
          padding: var(--space-2) var(--space-4);
          background: var(--accent-primary);
          color: var(--bg-primary);
          text-decoration: none;
          border-radius: var(--border-radius);
          font-size: var(--font-sm);
          font-weight: 500;
          transition: var(--transition);
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .category-link:hover {
          background: var(--accent-secondary);
          transform: translateY(-1px);
          text-decoration: none;
          color: var(--bg-primary);
        }

        @media (max-width: 767px) {
          .error-icon {
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

          .category-links {
            gap: var(--space-2);
          }

          .category-link {
            font-size: var(--font-xs);
            padding: var(--space-2) var(--space-3);
          }

          .error-search,
          .error-suggestions,
          .popular-categories {
            padding: var(--space-4);
          }
        }
      `}</style>
    </Layout>
  );
}

// Load guides data for search functionality on 404 page
export async function getStaticProps() {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'guides.json');

    try {
      const data = await fs.readFile(dataPath, 'utf8');
      const guidesData = JSON.parse(data);

      return {
        props: {
          guides: guidesData.guides || []
        }
      };
    } catch (fileError) {
      return {
        props: {
          guides: []
        }
      };
    }
  } catch (error) {
    return {
      props: {
        guides: []
      }
    };
  }
}