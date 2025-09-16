import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { LoadingSpinner, EmptyState } from '../components/LoadingStates';
import { getCategoriesFromGuides, getAllCategories, getCategoryInfo } from '../lib/categories';

export default function AdvancedSearchPage({ guides = [], categories = [] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Advanced filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [minStars, setMinStars] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [searchIn, setSearchIn] = useState(['name', 'description', 'topics']);

  // Get unique languages
  const languages = [...new Set(guides.map(guide => guide.language).filter(Boolean))].sort();

  // Load query from URL on mount
  useEffect(() => {
    if (router.query.q) {
      setQuery(router.query.q);
    }
  }, [router.query.q]);

  // Advanced search with multiple filters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 1) {
        setIsLoading(true);
        performAdvancedSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedCategories, selectedLanguages, minStars, sortBy, searchIn, guides]);

  const performAdvancedSearch = () => {
    try {
      const normalizedQuery = query.toLowerCase().trim();

      let filtered = guides.filter(guide => {
        // Category filter
        if (selectedCategories.length > 0 && !selectedCategories.includes(guide.category)) {
          return false;
        }

        // Language filter
        if (selectedLanguages.length > 0 && !selectedLanguages.includes(guide.language)) {
          return false;
        }

        // Minimum stars filter
        if ((guide.stars || 0) < minStars) {
          return false;
        }

        // Search in selected fields
        const searchFields = [];
        if (searchIn.includes('name')) {
          searchFields.push(guide.name, guide.displayName);
        }
        if (searchIn.includes('description')) {
          searchFields.push(guide.description);
        }
        if (searchIn.includes('topics')) {
          searchFields.push(...(guide.topics || []), guide.category);
        }
        if (searchIn.includes('readme')) {
          searchFields.push(guide.readmeRaw || '');
        }

        const searchText = searchFields.filter(Boolean).join(' ').toLowerCase();

        // Comprehensive search matching
        return searchText.includes(normalizedQuery) ||
               searchText.split(/[\s\-_\.]+/).some(word =>
                 word.startsWith(normalizedQuery) ||
                 (normalizedQuery.length >= 3 && word.includes(normalizedQuery))
               );
      });

      // Advanced sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'relevance':
            return calculateAdvancedScore(b, normalizedQuery) - calculateAdvancedScore(a, normalizedQuery);
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

      setResults(filtered);
      setIsLoading(false);

      // Update URL with search query
      if (normalizedQuery) {
        router.replace(`/search?q=${encodeURIComponent(normalizedQuery)}`, undefined, { shallow: true });
      }
    } catch (error) {
      console.error('Advanced search error:', error);
      setResults([]);
      setIsLoading(false);
    }
  };

  const calculateAdvancedScore = (guide, query) => {
    let score = 0;

    // Exact matches
    if (guide.name.toLowerCase() === query) score += 1000;
    if (guide.displayName.toLowerCase() === query) score += 900;

    // Field-specific scoring
    if (searchIn.includes('name')) {
      if (guide.name.toLowerCase().includes(query)) score += 500;
      if (guide.displayName.toLowerCase().includes(query)) score += 400;
    }

    if (searchIn.includes('description')) {
      if (guide.description.toLowerCase().includes(query)) score += 200;
    }

    if (searchIn.includes('topics')) {
      if (guide.topics?.some(topic => topic.toLowerCase().includes(query))) score += 300;
      if (guide.category.toLowerCase().includes(query)) score += 250;
    }

    // Popularity boost
    score += Math.min((guide.stars || 0) * 5, 100);

    return score;
  };

  const toggleCategory = (categoryKey) => {
    setSelectedCategories(prev =>
      prev.includes(categoryKey)
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const toggleLanguage = (language) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const toggleSearchField = (field) => {
    setSearchIn(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedLanguages([]);
    setMinStars(0);
    setSortBy('relevance');
    setSearchIn(['name', 'description', 'topics']);
  };

  const hasActiveFilters = selectedCategories.length > 0 ||
                          selectedLanguages.length > 0 ||
                          minStars > 0 ||
                          sortBy !== 'relevance' ||
                          JSON.stringify(searchIn) !== JSON.stringify(['name', 'description', 'topics']);

  return (
    <Layout
      title="Advanced Search"
      description="Advanced search for installation guides with filters, sorting, and comprehensive search options."
    >
      {/* Header */}
      <section className="search-header">
        <h1 className="page-title">Advanced Search</h1>
        <p className="page-description">
          Find exactly what you need with powerful filters and search options
        </p>
      </section>

      {/* Search Input */}
      <section className="main-search">
        <div className="search-input-container">
          <input
            type="search"
            className="advanced-search-input"
            placeholder="Search installation guides..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="search-stats">
            {query && (
              <span>
                {isLoading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        </div>

        {/* Search Results - Immediately under search box */}
        {query.length >= 1 && (
          <div className="immediate-results">
            {isLoading ? (
              <div className="search-loading">
                <div className="loading-spinner"></div>
                <span>Searching guides...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="search-results-immediate">
                <div className="results-header">
                  <h3>Found {results.length} guide{results.length !== 1 ? 's' : ''}</h3>
                </div>
                <div className="results-grid">
                  {results.map(guide => (
                    <Link
                      key={guide.slug}
                      href={`/${guide.category}/${guide.slug}/`}
                      className="immediate-result-card"
                    >
                      <div className="card-header">
                        <h4 className="card-title">{guide.displayName}</h4>
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
                        <span>{guide.readTime}</span>
                        {guide.stars > 0 && <span>⭐ {guide.stars}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-results-immediate">
                <div className="no-results-content">
                  <span className="no-results-icon">🔍</span>
                  <p><strong>No guides found</strong> for "{query}"</p>
                  <p>Try adjusting your search or filters below</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Advanced Filters */}
      <section className="filters-section">
        <div className="filters-note">
          <p>🔧 Use the filters below to refine your search results</p>
        </div>

        <div className="filters-container">
          {/* Search Fields */}
          <div className="filter-group">
            <h3 className="filter-title">Search In:</h3>
            <div className="checkbox-group">
              {[
                { key: 'name', label: 'Name & Title' },
                { key: 'description', label: 'Description' },
                { key: 'topics', label: 'Topics & Categories' },
                { key: 'readme', label: 'README Content' }
              ].map(field => (
                <label key={field.key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={searchIn.includes(field.key)}
                    onChange={() => toggleSearchField(field.key)}
                    className="checkbox"
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="filter-group">
            <h3 className="filter-title">Categories:</h3>
            <div className="checkbox-group">
              {categories.map(category => (
                <label key={category.key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.key)}
                    onChange={() => toggleCategory(category.key)}
                    className="checkbox"
                  />
                  {category.icon} {category.name}
                </label>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="filter-group">
            <h3 className="filter-title">Languages:</h3>
            <div className="checkbox-group">
              {languages.map(language => (
                <label key={language} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(language)}
                    onChange={() => toggleLanguage(language)}
                    className="checkbox"
                  />
                  {language}
                </label>
              ))}
            </div>
          </div>

          {/* Popularity Filter */}
          <div className="filter-group">
            <h3 className="filter-title">Minimum Stars:</h3>
            <input
              type="range"
              min="0"
              max="50"
              value={minStars}
              onChange={(e) => setMinStars(parseInt(e.target.value))}
              className="stars-slider"
            />
            <span className="stars-value">⭐ {minStars}+</span>
          </div>

          {/* Sort Options */}
          <div className="filter-group">
            <h3 className="filter-title">Sort By:</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="relevance">Relevance</option>
              <option value="name">Name (A-Z)</option>
              <option value="updated">Recently Updated</option>
              <option value="stars">Most Popular</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="filter-group">
              <button className="clear-all-filters" onClick={clearAllFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Help section when no search */}
      {!query && (
        <section className="help-section">
          <div className="search-help">
            <h2>How to Use Advanced Search</h2>
            <div className="help-grid">
              <div className="help-item">
                <h3>🔍 Search Fields</h3>
                <p>Choose which fields to search in: names, descriptions, topics, or README content.</p>
              </div>
              <div className="help-item">
                <h3>🏷️ Category Filters</h3>
                <p>Filter by specific categories like web servers, databases, or containers.</p>
              </div>
              <div className="help-item">
                <h3>💻 Language Filters</h3>
                <p>Find guides written in specific programming languages or technologies.</p>
              </div>
              <div className="help-item">
                <h3>⭐ Popularity Filter</h3>
                <p>Filter by GitHub stars to find the most popular installation guides.</p>
              </div>
            </div>

            <div className="quick-searches">
              <h3>Quick Searches:</h3>
              <div className="quick-search-buttons">
                <button onClick={() => setQuery('docker')} className="quick-btn">Docker</button>
                <button onClick={() => setQuery('kubernetes')} className="quick-btn">Kubernetes</button>
                <button onClick={() => setQuery('nginx')} className="quick-btn">NGINX</button>
                <button onClick={() => setQuery('postgresql')} className="quick-btn">PostgreSQL</button>
                <button onClick={() => setQuery('monitoring')} className="quick-btn">Monitoring</button>
                <button onClick={() => setQuery('security')} className="quick-btn">Security</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        .search-header {
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
        }

        .main-search {
          margin-bottom: var(--space-8);
        }

        .search-input-container {
          position: relative;
          max-width: 600px;
          margin: 0 auto;
        }

        .advanced-search-input {
          width: 100%;
          padding: var(--space-4) var(--space-5);
          border: 2px solid var(--bg-surface);
          border-radius: var(--border-radius-lg);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: var(--font-lg);
          transition: var(--transition);
          min-height: 60px;
        }

        .advanced-search-input:focus {
          border-color: var(--accent-primary);
          outline: none;
          box-shadow: 0 0 0 4px rgba(189, 147, 249, 0.15);
        }

        .search-stats {
          text-align: center;
          margin-top: var(--space-3);
          color: var(--text-secondary);
          font-size: var(--font-sm);
        }

        .immediate-results {
          margin-top: var(--space-4);
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--bg-surface);
          overflow: hidden;
          max-height: 70vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .search-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          padding: var(--space-6);
          color: var(--text-secondary);
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--bg-surface);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .search-results-immediate .results-header {
          padding: var(--space-4);
          border-bottom: 1px solid var(--bg-surface);
          text-align: center;
        }

        .search-results-immediate .results-header h3 {
          margin: 0;
          color: var(--accent-primary);
          font-size: var(--font-lg);
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-3);
          padding: var(--space-4);
        }

        .immediate-result-card {
          background: var(--bg-primary);
          border-radius: var(--border-radius);
          padding: var(--space-3);
          border: 1px solid var(--bg-surface);
          transition: var(--transition);
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .immediate-result-card:hover {
          background: var(--bg-surface);
          transform: translateY(-1px);
          text-decoration: none;
          color: inherit;
        }

        .immediate-result-card .card-header {
          margin-bottom: var(--space-2);
        }

        .immediate-result-card .card-title {
          color: var(--accent-primary);
          font-size: var(--font-base);
          margin-bottom: var(--space-2);
          font-weight: 600;
        }

        .immediate-result-card .card-description {
          color: var(--text-secondary);
          font-size: var(--font-sm);
          line-height: 1.4;
          margin-bottom: var(--space-2);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .immediate-result-card .card-meta {
          display: flex;
          gap: var(--space-2);
          font-size: var(--font-xs);
          color: var(--text-muted);
        }

        .no-results-immediate {
          padding: var(--space-6);
          text-align: center;
        }

        .no-results-content {
          color: var(--text-secondary);
        }

        .no-results-icon {
          font-size: var(--font-2xl);
          display: block;
          margin-bottom: var(--space-3);
          opacity: 0.7;
        }

        .no-results-content p {
          margin: var(--space-1) 0;
        }

        .no-results-content strong {
          color: var(--text-primary);
        }

        .filters-section {
          margin-bottom: var(--space-8);
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--bg-surface);
          padding: var(--space-6);
        }

        .filters-note {
          text-align: center;
          margin-bottom: var(--space-4);
          padding: var(--space-3);
          background: rgba(189, 147, 249, 0.1);
          border-radius: var(--border-radius);
          border: 1px solid var(--accent-primary);
        }

        .filters-note p {
          margin: 0;
          color: var(--accent-primary);
          font-size: var(--font-sm);
          font-weight: 500;
        }

        .filters-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
        }

        .filter-group {
          background: var(--bg-primary);
          padding: var(--space-4);
          border-radius: var(--border-radius);
          border: 1px solid var(--bg-surface);
        }

        .filter-title {
          color: var(--accent-primary);
          font-size: var(--font-base);
          margin-bottom: var(--space-3);
          font-weight: 600;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--border-radius-sm);
          transition: var(--transition);
          font-size: var(--font-sm);
          color: var(--text-primary);
        }

        .checkbox-label:hover {
          background: var(--bg-surface);
        }

        .checkbox {
          accent-color: var(--accent-primary);
          transform: scale(1.1);
        }

        .stars-slider {
          width: 100%;
          margin-bottom: var(--space-2);
          accent-color: var(--accent-primary);
        }

        .stars-value {
          color: var(--text-secondary);
          font-size: var(--font-sm);
          font-weight: 500;
        }

        .sort-select {
          width: 100%;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--bg-surface);
          border-radius: var(--border-radius);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--font-sm);
        }

        .clear-all-filters {
          width: 100%;
          background: var(--accent-error);
          color: var(--bg-primary);
          border: none;
          padding: var(--space-3);
          border-radius: var(--border-radius);
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
        }

        .clear-all-filters:hover {
          background: var(--accent-warning);
        }

        .results-header {
          margin-bottom: var(--space-6);
          text-align: center;
        }

        .results-header h2 {
          color: var(--accent-primary);
          margin-bottom: var(--space-2);
        }

        .results-header p {
          color: var(--text-secondary);
          margin: 0;
        }

        .search-result-card {
          background: var(--bg-secondary);
          border-radius: var(--border-radius);
          padding: var(--space-4);
          border: 1px solid var(--bg-surface);
          transition: var(--transition);
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .search-result-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--box-shadow-lg);
          text-decoration: none;
          color: inherit;
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

        .search-help {
          text-align: center;
          padding: var(--space-8);
        }

        .search-help h2 {
          color: var(--accent-primary);
          margin-bottom: var(--space-6);
        }

        .help-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-8);
        }

        .help-item {
          background: var(--bg-secondary);
          padding: var(--space-4);
          border-radius: var(--border-radius);
          border: 1px solid var(--bg-surface);
        }

        .help-item h3 {
          color: var(--accent-primary);
          margin-bottom: var(--space-2);
          font-size: var(--font-base);
        }

        .help-item p {
          color: var(--text-secondary);
          font-size: var(--font-sm);
          margin: 0;
          line-height: 1.5;
        }

        .quick-searches h3 {
          color: var(--accent-primary);
          margin-bottom: var(--space-4);
        }

        .quick-search-buttons {
          display: flex;
          gap: var(--space-2);
          justify-content: center;
          flex-wrap: wrap;
        }

        .quick-btn {
          background: var(--accent-primary);
          color: var(--bg-primary);
          border: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: var(--transition);
          font-size: var(--font-sm);
        }

        .quick-btn:hover {
          background: var(--accent-secondary);
          transform: translateY(-1px);
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

        .empty-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Mobile responsiveness */
        @media (max-width: 767px) {
          .search-header {
            padding: var(--space-4);
          }

          .page-title {
            font-size: var(--font-2xl);
          }

          .page-description {
            font-size: var(--font-base);
          }

          .advanced-search-input {
            font-size: var(--font-base);
            min-height: 52px;
          }

          .filters-container {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }

          .help-grid {
            grid-template-columns: 1fr;
          }

          .quick-search-buttons {
            gap: var(--space-1);
          }

          .quick-btn {
            font-size: var(--font-xs);
            padding: var(--space-1) var(--space-3);
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
    console.error('Error loading search page data:', error);
    return {
      props: {
        guides: [],
        categories: getAllCategories()
      }
    };
  }
}