import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import SimpleSearch from '../components/SimpleSearch';
import { LoadingSpinner, EmptyState } from '../components/LoadingStates';
import { getCategoriesFromGuides, getAllCategories, getCategoryInfo } from '../lib/categories';

export default function AllGuidesPage({ guides = [], categories = [] }) {
  const [filteredGuides, setFilteredGuides] = useState(guides);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');

  const guidesPerPage = 50;

  // Get unique languages
  const languages = [...new Set(guides.map(guide => guide.language).filter(Boolean))].sort();

  // Filter and sort guides
  useEffect(() => {
    let filtered = [...guides];

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(guide => guide.category === selectedCategory);
    }

    // Apply language filter
    if (selectedLanguage) {
      filtered = filtered.filter(guide => guide.language === selectedLanguage);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'updated':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'stars':
          return (b.stars || 0) - (a.stars || 0);
        case 'category':
          return a.category.localeCompare(b.category) || a.displayName.localeCompare(b.displayName);
        default:
          return a.displayName.localeCompare(b.displayName);
      }
    });

    setFilteredGuides(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [guides, selectedCategory, selectedLanguage, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredGuides.length / guidesPerPage);
  const startIndex = (currentPage - 1) * guidesPerPage;
  const currentGuides = filteredGuides.slice(startIndex, startIndex + guidesPerPage);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLanguage('');
    setSortBy('name');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory || selectedLanguage || sortBy !== 'name';

  return (
    <Layout
      title={`All Installation Guides (${guides.length})`}
      description={`Browse all ${guides.length} installation guides across ${categories.length} categories. Find guides for web servers, databases, containers, security tools, and more.`}
    >
      {/* Header */}
      <section className="all-header">
        <h1 className="page-title">All Installation Guides</h1>
        <p className="page-description">
          Complete collection of {guides.length} installation guides across {categories.length} categories
        </p>

        <div className="header-stats">
          <div className="stat">
            <strong>{filteredGuides.length}</strong>
            <span>{filteredGuides.length === guides.length ? 'Total' : 'Filtered'} Guides</span>
          </div>
          <div className="stat">
            <strong>{categories.length}</strong>
            <span>Categories</span>
          </div>
          <div className="stat">
            <strong>{languages.length}</strong>
            <span>Languages</span>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="search-section">
        <SimpleSearch
          guides={guides}
          placeholder="Search all installation guides..."
        />
        <div className="search-hint">
          <Link href="/search/" className="advanced-search-link">
            🔍 Advanced Search
          </Link>
        </div>
      </section>

      {/* Filters & Controls */}
      <section className="controls-section">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="category-filter" className="filter-label">Category:</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.key} value={category.key}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="language-filter" className="filter-label">Language:</label>
            <select
              id="language-filter"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="filter-select"
            >
              <option value="">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-filter" className="filter-label">Sort by:</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Name (A-Z)</option>
              <option value="updated">Recently Updated</option>
              <option value="stars">Most Popular</option>
              <option value="category">Category</option>
            </select>
          </div>

          <div className="filter-actions">
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                ⊞
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                ☰
              </button>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="results-section">
        {currentGuides.length > 0 ? (
          <>
            <div className={viewMode === 'grid' ? 'mobile-grid' : 'list-view'}>
              {currentGuides.map(guide => (
                <Link
                  key={guide.slug}
                  href={`/${guide.category}/${guide.slug}/`}
                  className={`guide-card ${viewMode === 'list' ? 'list-card' : 'grid-card'}`}
                >
                  <div className="card-header">
                    <h3 className="card-title">{guide.displayName}</h3>
                    <div className="card-badges">
                      <span className="category-badge" style={{ background: getCategoryInfo(guide.category)?.color }}>
                        {getCategoryInfo(guide.category)?.icon} {getCategoryInfo(guide.category)?.name}
                      </span>
                      {guide.language && (
                        <span className="language-badge">{guide.language}</span>
                      )}
                    </div>
                  </div>

                  <p className="card-description">{guide.description}</p>

                  <div className="card-meta">
                    <span className="read-time">{guide.readTime}</span>
                    <span className="updated">
                      Updated {new Date(guide.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {guide.stars > 0 && (
                      <span className="stars">⭐ {guide.stars}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="pagination" aria-label="Guide pagination">
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  ← Previous
                </button>

                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (page > totalPages) return null;

                    return (
                      <button
                        key={page}
                        className={`page-number ${page === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                >
                  Next →
                </button>

                <div className="page-info">
                  Page {currentPage} of {totalPages} ({filteredGuides.length} guides)
                </div>
              </nav>
            )}
          </>
        ) : (
          <EmptyState
            icon="🔍"
            title="No guides found"
            message="Try adjusting your filters or search for something else."
          >
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear All Filters
              </button>
              <Link href="/" className="btn btn-secondary">
                Browse Categories
              </Link>
            </div>
          </EmptyState>
        )}
      </section>

      <style jsx>{`
        .all-header {
          text-align: center;
          margin-bottom: var(--space-8);
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--bg-surface);
        }

        .page-title {
          color: var(--accent-primary);
          font-size: var(--font-3xl);
          margin-bottom: var(--space-3);
        }

        .page-description {
          color: var(--text-secondary);
          font-size: var(--font-lg);
          margin-bottom: var(--space-5);
        }

        .header-stats {
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
          margin-bottom: var(--space-6);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
        }

        .search-hint {
          text-align: center;
        }

        .advanced-search-link {
          color: var(--accent-info);
          text-decoration: none;
          font-size: var(--font-sm);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--border-radius);
          background: var(--bg-surface);
          transition: var(--transition);
        }

        .advanced-search-link:hover {
          background: var(--accent-info);
          color: var(--bg-primary);
        }

        .controls-section {
          margin-bottom: var(--space-6);
        }

        .filters {
          display: flex;
          gap: var(--space-4);
          align-items: end;
          flex-wrap: wrap;
          justify-content: center;
          padding: var(--space-4);
          background: var(--bg-secondary);
          border-radius: var(--border-radius);
          border: 1px solid var(--bg-surface);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          min-width: 140px;
        }

        .filter-label {
          font-size: var(--font-sm);
          color: var(--text-secondary);
          font-weight: 500;
        }

        .filter-select {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--bg-surface);
          border-radius: var(--border-radius);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: var(--font-sm);
          min-height: 40px;
        }

        .filter-actions {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }

        .view-toggle {
          display: flex;
          border: 1px solid var(--bg-surface);
          border-radius: var(--border-radius);
          overflow: hidden;
        }

        .view-btn {
          padding: var(--space-2) var(--space-3);
          border: none;
          background: var(--bg-surface);
          color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition);
          min-height: 40px;
          min-width: 40px;
        }

        .view-btn.active,
        .view-btn:hover {
          background: var(--accent-primary);
          color: var(--bg-primary);
        }

        .clear-filters {
          background: var(--accent-warning);
          color: var(--bg-primary);
          border: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--border-radius);
          font-size: var(--font-sm);
          cursor: pointer;
          transition: var(--transition);
          min-height: 40px;
        }

        .clear-filters:hover {
          background: var(--accent-error);
        }

        .results-section {
          margin-bottom: var(--space-8);
        }

        .mobile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-4);
        }

        .list-view {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .guide-card {
          background: var(--bg-secondary);
          border-radius: var(--border-radius);
          padding: var(--space-4);
          border: 1px solid var(--bg-surface);
          transition: var(--transition);
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .guide-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--box-shadow-lg);
          text-decoration: none;
          color: inherit;
        }

        .list-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-3) var(--space-4);
        }

        .list-card .card-header {
          flex: 1;
          margin-bottom: 0;
        }

        .list-card .card-description {
          display: none;
        }

        .card-header {
          margin-bottom: var(--space-3);
        }

        .card-title {
          color: var(--accent-primary);
          font-size: var(--font-lg);
          margin-bottom: var(--space-2);
          font-weight: 600;
        }

        .card-badges {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .category-badge,
        .language-badge {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--border-radius-sm);
          font-size: var(--font-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .category-badge {
          color: var(--bg-primary);
        }

        .language-badge {
          background: var(--accent-secondary);
          color: var(--bg-primary);
        }

        .card-description {
          color: var(--text-secondary);
          font-size: var(--font-sm);
          line-height: 1.5;
          margin-bottom: var(--space-3);
        }

        .card-meta {
          display: flex;
          gap: var(--space-3);
          font-size: var(--font-xs);
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--space-4);
          margin-top: var(--space-8);
          flex-wrap: wrap;
        }

        .page-btn {
          padding: var(--space-2) var(--space-4);
          border: 1px solid var(--accent-primary);
          background: transparent;
          color: var(--accent-primary);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: var(--transition);
          min-height: 44px;
        }

        .page-btn:hover:not(:disabled) {
          background: var(--accent-primary);
          color: var(--bg-primary);
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: var(--space-1);
        }

        .page-number {
          width: 40px;
          height: 40px;
          border: 1px solid var(--bg-surface);
          background: var(--bg-surface);
          color: var(--text-primary);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: var(--transition);
          font-weight: 500;
        }

        .page-number.active,
        .page-number:hover {
          background: var(--accent-primary);
          color: var(--bg-primary);
          border-color: var(--accent-primary);
        }

        .page-info {
          color: var(--text-secondary);
          font-size: var(--font-sm);
          text-align: center;
        }

        .empty-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: var(--space-3) var(--space-4);
          border-radius: var(--border-radius);
          text-decoration: none;
          font-weight: 500;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          min-height: 44px;
          border: none;
          cursor: pointer;
        }

        .btn-primary {
          background: var(--accent-primary);
          color: var(--bg-primary);
        }

        .btn-primary:hover {
          background: var(--accent-secondary);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: transparent;
          color: var(--accent-primary);
          border: 2px solid var(--accent-primary);
        }

        .btn-secondary:hover {
          background: var(--accent-primary);
          color: var(--bg-primary);
        }

        /* Mobile responsiveness */
        @media (max-width: 767px) {
          .all-header {
            padding: var(--space-4);
            margin-bottom: var(--space-6);
          }

          .page-title {
            font-size: var(--font-2xl);
          }

          .page-description {
            font-size: var(--font-base);
          }

          .header-stats {
            gap: var(--space-4);
          }

          .filters {
            flex-direction: column;
            gap: var(--space-3);
            align-items: stretch;
          }

          .filter-group {
            min-width: auto;
          }

          .filter-actions {
            justify-content: center;
          }

          .mobile-grid {
            grid-template-columns: 1fr;
          }

          .list-card {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-2);
          }

          .list-card .card-description {
            display: block;
          }

          .pagination {
            flex-direction: column;
            gap: var(--space-3);
          }

          .page-numbers {
            order: -1;
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
    const dataPath = path.join(process.cwd(), 'data', 'guides.json');

    try {
      const data = await fs.readFile(dataPath, 'utf8');
      const guidesData = JSON.parse(data);

      return {
        props: {
          guides: guidesData.guides || [],
          categories: getAllCategories()
        }
      };
    } catch (fileError) {
      return {
        props: {
          guides: [],
          categories: getAllCategories()
        }
      };
    }
  } catch (error) {
    console.error('Error loading all guides data:', error);
    return {
      props: {
        guides: [],
        categories: getAllCategories()
      }
    };
  }
}