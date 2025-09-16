import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import SimpleSearch from '../../components/SimpleSearch';
import { LoadingSpinner, EmptyState } from '../../components/LoadingStates';
import { getCategoryInfo, getCategoriesFromGuides } from '../../lib/categories';

export default function CategoryPage({ category, guides = [] }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('name');

  if (router.isFallback) {
    return (
      <Layout title="Loading...">
        <LoadingSpinner size="large" message="Loading category..." />
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout title="Category Not Found">
        <div className="error-container">
          <h1>Category Not Found</h1>
          <p>The category you're looking for doesn't exist.</p>
          <Link href="/" className="btn btn-primary">
            ← Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  // Sort guides
  const sortedGuides = [...guides].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      case 'updated':
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case 'stars':
        return (b.stars || 0) - (a.stars || 0);
      default:
        return a.displayName.localeCompare(b.displayName);
    }
  });

  return (
    <Layout
      title={`${category.name} Installation Guides`}
      description={`${guides.length} ${category.name.toLowerCase()} installation guides. ${category.description}`}
    >
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">→</span>
        <span className="current">{category.name}</span>
      </nav>

      {/* Category Header */}
      <section className="category-header">
        <div className="category-icon" style={{ color: category.color }}>
          {category.icon}
        </div>
        <h1 className="category-title">{category.name}</h1>
        <p className="category-description">{category.description}</p>
        <div className="category-stats">
          <span className="mobile-badge mobile-badge-primary">
            {guides.length} guides available
          </span>
        </div>
      </section>

      {/* Search within category */}
      <section className="category-search">
        <SimpleSearch
          guides={guides}
          placeholder={`Search ${category.name.toLowerCase()}...`}
        />
      </section>

      {/* Controls */}
      <section className="controls-section">
        <div className="sort-controls">
          <label htmlFor="sort-select" className="sr-only">Sort guides</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Name (A-Z)</option>
            <option value="updated">Recently Updated</option>
            <option value="stars">Most Popular</option>
          </select>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="guides-section">
        {sortedGuides.length > 0 ? (
          <div className="mobile-grid">
            {sortedGuides.map(guide => (
              <Link
                key={guide.slug}
                href={`/${category.key}/${guide.slug}/`}
                className="mobile-card guide-card"
              >
                <div className="mobile-card-header">
                  <h3 className="mobile-card-title">{guide.displayName}</h3>
                  <p className="mobile-card-description">{guide.description}</p>
                </div>
                <div className="mobile-card-meta">
                  {guide.language && (
                    <span className="mobile-badge mobile-badge-secondary">
                      {guide.language}
                    </span>
                  )}
                  <span className="mobile-badge mobile-badge-info">
                    {guide.readTime}
                  </span>
                  {guide.stars > 0 && (
                    <span className="mobile-badge mobile-badge-primary">
                      ⭐ {guide.stars}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📭"
            title="No guides found"
            message={`This ${category.name.toLowerCase()} category doesn't have any installation guides yet. Check back soon or browse other categories.`}
          >
            <div className="empty-actions">
              <Link href="/" className="btn btn-primary">
                Browse All Categories
              </Link>
              <a
                href="https://github.com/howtomgr"
                target="_blank"
                rel="noopener"
                className="btn btn-secondary"
              >
                View GitHub Organization
              </a>
            </div>
          </EmptyState>
        )}
      </section>

      <style jsx>{`
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          font-size: var(--font-sm);
          color: var(--text-secondary);
        }

        .breadcrumb a {
          color: var(--accent-primary);
          text-decoration: none;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .separator {
          color: var(--text-muted);
        }

        .current {
          color: var(--text-primary);
          font-weight: 500;
        }

        .category-header {
          text-align: center;
          margin-bottom: var(--space-8);
          padding: var(--space-6) 0;
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
        }

        .category-icon {
          font-size: 3rem;
          margin-bottom: var(--space-4);
        }

        .category-title {
          color: var(--accent-primary);
          font-size: var(--font-3xl);
          margin-bottom: var(--space-4);
        }

        .category-description {
          color: var(--text-secondary);
          font-size: var(--font-lg);
          margin-bottom: var(--space-4);
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .category-stats {
          margin-top: var(--space-4);
        }

        .category-search {
          margin-bottom: var(--space-6);
          display: flex;
          justify-content: center;
        }

        .controls-section {
          margin-bottom: var(--space-6);
          display: flex;
          justify-content: center;
        }

        .sort-select {
          padding: var(--space-2) var(--space-4);
          border: 1px solid var(--bg-surface);
          border-radius: var(--border-radius);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: var(--font-sm);
        }

        .guides-section {
          margin-bottom: var(--space-8);
        }

        .guide-card:hover .mobile-card-title {
          color: var(--accent-secondary);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-secondary);
        }

        .empty-state h3 {
          color: var(--text-primary);
          margin-bottom: var(--space-4);
        }

        .loading-container {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-secondary);
        }

        .error-container {
          text-align: center;
          padding: var(--space-8);
        }

        @media (max-width: 767px) {
          .category-header {
            padding: var(--space-4);
            margin-bottom: var(--space-6);
          }

          .category-title {
            font-size: var(--font-2xl);
          }

          .category-description {
            font-size: var(--font-base);
          }

          .category-icon {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}

export async function getStaticPaths() {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'guides.json');

    try {
      const data = await fs.readFile(dataPath, 'utf8');
      const guidesData = JSON.parse(data);
      const guides = guidesData.guides || [];

      // Get categories dynamically from actual guide data
      const categories = getCategoriesFromGuides(guides);
      const paths = categories.map(category => ({
        params: { category: category.key }
      }));

      return {
        paths,
        fallback: 'blocking'
      };
    } catch (fileError) {
      // Return empty paths if no data
      return {
        paths: [],
        fallback: 'blocking'
      };
    }
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

export async function getStaticProps({ params }) {
  const { category: categoryKey } = params;

  try {
    const fs = require('fs').promises;
    const path = require('path');

    const dataPath = path.join(process.cwd(), 'data', 'guides.json');

    try {
      const data = await fs.readFile(dataPath, 'utf8');
      const guidesData = JSON.parse(data);
      const guides = guidesData.guides || [];

      const categoryGuides = guides.filter(guide => guide.category === categoryKey);

      if (categoryGuides.length === 0) {
        return { notFound: true };
      }

      const category = getCategoryInfo(categoryKey);
      if (!category) {
        return { notFound: true };
      }

      return {
        props: {
          category,
          guides: categoryGuides
        }
      };
    } catch (fileError) {
      return { notFound: true };
    }
  } catch (error) {
    console.error('Error loading category data:', error);
    return { notFound: true };
  }
}