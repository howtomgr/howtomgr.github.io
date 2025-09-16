import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { LoadingSpinner, EmptyState, ErrorMessage } from '../../components/LoadingStates';
import { getCategoryInfo, getCategoriesFromGuides } from '../../lib/categories';

export default function GuidePage({ guide, category, relatedGuides = [] }) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Loading Guide...">
        <LoadingSpinner size="large" message="Loading installation guide..." />
      </Layout>
    );
  }

  if (!guide) {
    return (
      <Layout title="Guide Not Found">
        <EmptyState
          icon="🔍"
          title="Installation Guide Not Found"
          message="The guide you're looking for doesn't exist or may have been moved."
        >
          <div className="error-actions">
            <Link href="/" className="btn btn-primary">
              ← Back to Home
            </Link>
            {category && (
              <Link href={`/${category.key}/`} className="btn btn-secondary">
                Browse {category.name}
              </Link>
            )}
          </div>
        </EmptyState>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${guide.displayName} Installation Guide`}
      description={guide.description}
    >
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="separator">→</span>
        <Link href={`/${category.key}/`}>{category.name}</Link>
        <span className="separator">→</span>
        <span className="current">{guide.displayName}</span>
      </nav>

      {/* Guide Header */}
      <header className="guide-header">
        <div className="guide-meta-top">
          <h1 className="guide-title">{guide.displayName}</h1>
          <p className="guide-description">{guide.description}</p>

          <div className="guide-badges">
            <span className="mobile-badge mobile-badge-primary">
              {category.name}
            </span>
            {guide.language && (
              <span className="mobile-badge mobile-badge-secondary">
                {guide.language}
              </span>
            )}
            {guide.difficultyLevel && (
              <span className={`mobile-badge difficulty-${guide.difficultyLevel}`}>
                {guide.difficultyLevel === 'beginner' ? '🟢' :
                 guide.difficultyLevel === 'intermediate' ? '🟡' : '🔴'} {guide.difficultyLevel}
              </span>
            )}
            <span className="mobile-badge mobile-badge-info">
              {guide.readTime}
            </span>
            {guide.estimatedSetupTime && (
              <span className="mobile-badge mobile-badge-secondary">
                ⏱️ {guide.estimatedSetupTime}
              </span>
            )}
            {guide.stars > 0 && (
              <span className="mobile-badge mobile-badge-primary">
                ⭐ {guide.stars}
              </span>
            )}
          </div>

          <div className="guide-actions">
            <a
              href={guide.githubUrl}
              target="_blank"
              rel="noopener"
              className="btn btn-secondary"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Guide Content */}
      <article className="guide-content">
        {guide.readmeHtml ? (
          <>
            {/* Table of Contents */}
            {guide.tableOfContents && guide.tableOfContents.length > 0 && (
              <nav className="toc">
                <h4>Table of Contents</h4>
                <ul>
                  {guide.tableOfContents.map((item, index) => (
                    <li key={index} className={`toc-level-${item.level}`}>
                      <a href={`#${item.id}`}>{item.text}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {/* README Content */}
            <div
              className="readme-content"
              dangerouslySetInnerHTML={{ __html: guide.readmeHtml }}
            />
          </>
        ) : (
          <EmptyState
            icon="📄"
            title="Installation Guide Coming Soon"
            message={`The installation guide for ${guide.displayName} is being prepared. Please check back soon or visit the GitHub repository for now.`}
          >
            <div className="content-actions">
              <a
                href={guide.githubUrl}
                target="_blank"
                rel="noopener"
                className="btn btn-primary"
              >
                View on GitHub
              </a>
              <Link href={`/${category.key}/`} className="btn btn-secondary">
                More {category.name}
              </Link>
            </div>
          </EmptyState>
        )}
      </article>

      {/* Related Guides */}
      {relatedGuides.length > 0 && (
        <section className="related-section">
          <h2 className="section-title">Related {category.name} Guides</h2>
          <div className="mobile-grid">
            {relatedGuides.slice(0, 3).map(relatedGuide => (
              <Link
                key={relatedGuide.slug}
                href={`/${category.key}/${relatedGuide.slug}/`}
                className="mobile-card"
              >
                <div className="mobile-card-header">
                  <h3 className="mobile-card-title">{relatedGuide.displayName}</h3>
                  <p className="mobile-card-description">{relatedGuide.description}</p>
                </div>
                <div className="mobile-card-meta">
                  <span className="mobile-badge mobile-badge-info">
                    {relatedGuide.readTime}
                  </span>
                  {relatedGuide.stars > 0 && (
                    <span className="mobile-badge mobile-badge-primary">
                      ⭐ {relatedGuide.stars}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Navigation */}
      <nav className="guide-navigation">
        <Link href={`/${category.key}/`} className="btn btn-secondary">
          ← All {category.name}
        </Link>
        <Link href="/" className="btn btn-secondary">
          All Categories
        </Link>
      </nav>

      <style jsx>{`
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          font-size: var(--font-sm);
          color: var(--text-secondary);
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
        }

        .breadcrumb a {
          color: var(--accent-primary);
          text-decoration: none;
          flex-shrink: 0;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .separator {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .current {
          color: var(--text-primary);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .guide-header {
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-8);
          border: 1px solid var(--bg-surface);
        }

        .guide-title {
          color: var(--accent-primary);
          font-size: var(--font-3xl);
          margin-bottom: var(--space-4);
          line-height: 1.2;
          word-break: break-word;
        }

        .guide-description {
          color: var(--text-secondary);
          font-size: var(--font-lg);
          margin-bottom: var(--space-5);
          line-height: 1.5;
        }

        .guide-badges {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-5);
          flex-wrap: wrap;
        }

        .guide-actions {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .difficulty-beginner {
          background: var(--accent-secondary);
          color: var(--bg-primary);
        }

        .difficulty-intermediate {
          background: var(--accent-warning);
          color: var(--bg-primary);
        }

        .difficulty-advanced {
          background: var(--accent-error);
          color: var(--bg-primary);
        }

        .guide-content {
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-8);
          border: 1px solid var(--bg-surface);
          overflow-x: hidden;
        }

        .related-section {
          margin-bottom: var(--space-8);
        }

        .section-title {
          color: var(--accent-primary);
          font-size: var(--font-2xl);
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .guide-navigation {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: var(--space-8);
        }

        .loading-container,
        .error-container {
          text-align: center;
          padding: var(--space-8);
        }

        .error-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          margin-top: var(--space-6);
          flex-wrap: wrap;
        }

        .toc-level-1 {
          font-weight: 600;
        }

        .toc-level-2 {
          margin-left: var(--space-4);
        }

        .toc-level-3 {
          margin-left: var(--space-8);
          font-size: var(--font-xs);
        }

        @media (max-width: 767px) {
          .guide-header {
            padding: var(--space-4);
            margin-bottom: var(--space-6);
          }

          .guide-title {
            font-size: var(--font-2xl);
          }

          .guide-description {
            font-size: var(--font-base);
          }

          .guide-content {
            padding: var(--space-4);
            margin-bottom: var(--space-6);
          }

          .guide-badges {
            gap: var(--space-2);
          }

          .guide-actions {
            flex-direction: column;
          }

          .guide-navigation {
            flex-direction: column;
          }

          .breadcrumb {
            margin-bottom: var(--space-4);
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

      const paths = guidesData.guides.map(guide => ({
        params: {
          category: guide.category,
          guide: guide.slug
        }
      }));

      return {
        paths,
        fallback: 'blocking'
      };
    } catch (fileError) {
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
  const { category: categoryKey, guide: guideSlug } = params;

  try {
    const fs = require('fs').promises;
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'guides.json');

    try {
      const data = await fs.readFile(dataPath, 'utf8');
      const guidesData = JSON.parse(data);

      const guide = guidesData.guides.find(g => g.slug === guideSlug && g.category === categoryKey);

      if (!guide) {
        return { notFound: true };
      }

      // Get category info
      const category = getCategoryInfo(categoryKey);
      if (!category) {
        return { notFound: true };
      }

      // Get related guides from same category
      const relatedGuides = guidesData.guides
        .filter(g => g.category === categoryKey && g.slug !== guideSlug)
        .slice(0, 3);

      return {
        props: {
          guide,
          category,
          relatedGuides
        }
      };
    } catch (fileError) {
      return { notFound: true };
    }
  } catch (error) {
    console.error('Error loading guide:', error);
    return { notFound: true };
  }
}