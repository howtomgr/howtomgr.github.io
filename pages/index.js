import Link from 'next/link';
import Layout from '../components/Layout';
import SimpleSearch from '../components/SimpleSearch';
import { getCategoriesFromGuides, getAllCategories } from '../lib/categories';

export default function HomePage({ guides = [], categories = [], lastUpdated }) {

  const totalGuides = guides.length;
  const totalStars = guides.reduce((sum, guide) => sum + (guide.stars || 0), 0);

  return (
    <Layout
      title="Installation Guides & Tutorials"
      description={`${totalGuides} comprehensive installation guides for popular software and services. Mobile-first design with security hardening and cross-platform support.`}
      lastUpdated={lastUpdated}
    >
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon" role="img" aria-label="Books">📚</span>
            HowToMgr
          </h1>
          <p className="hero-description">Installation guides and how-to tutorials</p>
          <p className="hero-tagline">Learn. Install. Deploy.</p>

          <div className="hero-stats">
            <div className="stat">
              <strong>{totalGuides}</strong>
              <span>Installation Guides</span>
            </div>
            <div className="stat">
              <strong>{totalStars}</strong>
              <span>GitHub Stars</span>
            </div>
            <div className="stat">
              <strong>Mobile-First</strong>
              <span>Responsive Design</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <SimpleSearch
          guides={guides}
          placeholder="Search installation guides..."
        />
        <div className="search-links">
          <Link href="/all/" className="search-link">
            📚 Browse All Guides ({totalGuides})
          </Link>
          <Link href="/search/" className="search-link">
            🔍 Advanced Search
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2 className="section-title">Browse by Category</h2>
        <div className="mobile-grid">
          {categories.map(category => {
            const categoryGuides = guides.filter(guide => guide.category === category.key);
            return (
              <Link
                key={category.key}
                href={`/${category.key}/`}
                className="mobile-card category-card"
              >
                <div className="mobile-card-header">
                  <div className="category-icon" style={{ color: category.color }}>
                    {category.icon}
                  </div>
                  <h3 className="mobile-card-title">{category.name}</h3>
                  <p className="mobile-card-description">{category.description}</p>
                </div>
                <div className="mobile-card-meta">
                  <span className="mobile-badge mobile-badge-primary">
                    {categoryGuides.length} guides
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Guides */}
      <section className="recent-section">
        <h2 className="section-title">Recently Updated</h2>
        <div className="mobile-grid">
          {guides.slice(0, 6).map(guide => (
            <Link
              key={guide.slug}
              href={`/${guide.category}/${guide.slug}/`}
              className="mobile-card"
            >
              <div className="mobile-card-header">
                <h3 className="mobile-card-title">{guide.displayName}</h3>
                <p className="mobile-card-description">{guide.description}</p>
              </div>
              <div className="mobile-card-meta">
                <span className="mobile-badge mobile-badge-info">{guide.category}</span>
                {guide.language && (
                  <span className="mobile-badge mobile-badge-secondary">{guide.language}</span>
                )}
                <span className="mobile-badge mobile-badge-primary">{guide.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <style jsx>{`
        .hero-section {
          text-align: center;
          padding: var(--space-8) 0;
          background: linear-gradient(135deg, var(--bg-secondary), var(--bg-surface));
          border-radius: var(--border-radius-lg);
          margin-bottom: var(--space-8);
        }

        .hero-title {
          font-size: var(--font-3xl);
          color: var(--accent-primary);
          margin-bottom: var(--space-4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
        }

        .hero-icon {
          font-size: var(--font-3xl);
        }

        .hero-description {
          font-size: var(--font-lg);
          color: var(--text-secondary);
          margin-bottom: var(--space-2);
        }

        .hero-tagline {
          font-size: var(--font-base);
          color: var(--text-muted);
          font-style: italic;
          margin-bottom: var(--space-6);
        }

        .hero-stats {
          display: flex;
          justify-content: center;
          gap: var(--space-6);
          flex-wrap: wrap;
        }

        .stat {
          text-align: center;
        }

        .stat strong {
          display: block;
          font-size: var(--font-xl);
          color: var(--accent-primary);
          font-weight: 600;
        }

        .stat span {
          font-size: var(--font-sm);
          color: var(--text-secondary);
        }

        .search-section {
          margin-bottom: var(--space-8);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .search-links {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
          justify-content: center;
        }

        .search-link {
          background: var(--bg-surface);
          color: var(--text-primary);
          text-decoration: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--border-radius);
          font-size: var(--font-sm);
          transition: var(--transition);
          border: 1px solid var(--bg-surface);
        }

        .search-link:hover {
          background: var(--accent-primary);
          color: var(--bg-primary);
          text-decoration: none;
        }

        .category-search {
          margin-bottom: var(--space-6);
          display: flex;
          justify-content: center;
        }

        .categories-section,
        .recent-section {
          margin-bottom: var(--space-8);
        }

        .section-title {
          color: var(--accent-primary);
          font-size: var(--font-2xl);
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .category-card .category-icon {
          font-size: var(--font-3xl);
          margin-bottom: var(--space-3);
          text-align: center;
        }

        .search-result-title {
          color: var(--accent-primary);
          font-weight: 500;
          margin-bottom: var(--space-1);
        }

        .search-result-description {
          color: var(--text-secondary);
          font-size: var(--font-sm);
          margin-bottom: var(--space-2);
        }

        .search-result-meta {
          display: flex;
          gap: var(--space-2);
          font-size: var(--font-xs);
          color: var(--text-muted);
        }

        @media (max-width: 767px) {
          .hero-section {
            padding: var(--space-6) var(--space-4);
            margin-bottom: var(--space-6);
          }

          .hero-title {
            font-size: var(--font-2xl);
            flex-direction: column;
            gap: var(--space-2);
          }

          .hero-stats {
            gap: var(--space-4);
          }

          .stat strong {
            font-size: var(--font-lg);
          }
        }
      `}</style>
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    const fs = require('fs').promises;
    const path = require('path');

    // Try to load guides data
    const dataPath = path.join(process.cwd(), 'data', 'guides.json');

    try {
      const data = await fs.readFile(dataPath, 'utf8');
      const guidesData = JSON.parse(data);

      const guides = guidesData.guides || [];
      const categories = getCategoriesFromGuides(guides);

      return {
        props: {
          guides,
          categories,
          lastUpdated: guidesData.metadata?.lastUpdated || null
        }
      };
    } catch (fileError) {
      // Return empty state if no data
      return {
        props: {
          guides: [],
          categories: getAllCategories(),
          lastUpdated: null
        }
      };
    }
  } catch (error) {
    console.error('Error loading homepage data:', error);
    return {
      props: {
        guides: [],
        categories: getAllCategories(),
        lastUpdated: null
      }
    };
  }
}