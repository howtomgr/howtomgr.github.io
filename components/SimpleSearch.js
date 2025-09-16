import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SimpleSearch({ guides = [], placeholder = "Search guides..." }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef(null);
  const router = useRouter();

  // Simple search with enhanced keyword matching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        const normalizedQuery = query.toLowerCase().trim();

        const searchResults = guides.filter(guide => {
          // Build searchable text including keyword aliases
          const searchableText = [
            guide.name,
            guide.displayName,
            guide.description,
            guide.category,
            guide.language,
            ...(guide.topics || []),
            // Add keyword aliases for better matching
            guide.name === 'kubernetes' ? 'kubectl k8s k8 container orchestration' : '',
            guide.name === 'docker' ? 'container containerization' : '',
            guide.name === 'postgresql' ? 'postgres sql database' : '',
            guide.name === 'mongodb' ? 'mongo nosql database' : '',
            guide.name === 'nginx' ? 'web server reverse proxy http' : '',
            guide.name === 'apache' ? 'web server http httpd' : '',
            guide.name === 'prometheus' ? 'metrics monitoring alerting' : '',
            guide.name === 'grafana' ? 'dashboards visualization monitoring' : '',
            guide.name === 'vault' ? 'secrets hashicorp security' : '',
            guide.name === 'mattermost' ? 'chat slack teams communication' : '',
            guide.name === 'rocketchat' ? 'chat slack teams communication' : '',
            guide.name === 'jellyfin' ? 'media server streaming movies tv' : '',
            guide.name === 'plex' ? 'media server streaming movies tv music' : '',
            guide.name === 'nextcloud' ? 'files cloud storage sync' : '',
            guide.name === 'wordpress' ? 'cms blog website' : '',
            guide.name === 'gitlab' ? 'git repository ci cd devops' : '',
            guide.name === 'jenkins' ? 'ci cd continuous integration devops' : '',
            guide.name === 'ansible' ? 'automation configuration management' : '',
            guide.name === 'terraform' ? 'iac infrastructure automation' : '',
            guide.searchText || ''
          ].filter(Boolean).join(' ').toLowerCase();

          // Check for matches
          return searchableText.includes(normalizedQuery) ||
                 searchableText.split(' ').some(word =>
                   word.startsWith(normalizedQuery) ||
                   word.includes(normalizedQuery)
                 );
        })
        .sort((a, b) => {
          // Simple but effective scoring
          const aScore = calculateScore(a, normalizedQuery);
          const bScore = calculateScore(b, normalizedQuery);
          return bScore - aScore;
        })
        .slice(0, 8);

        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
      } else {
        setResults([]);
        setIsOpen(false);
      }
      setSelectedIndex(-1);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, guides]);

  const calculateScore = (guide, query) => {
    let score = 0;

    // Exact matches
    if (guide.name.toLowerCase() === query) score += 100;
    if (guide.displayName.toLowerCase() === query) score += 90;

    // Name contains
    if (guide.name.toLowerCase().includes(query)) score += 50;
    if (guide.displayName.toLowerCase().includes(query)) score += 40;

    // Description contains
    if (guide.description.toLowerCase().includes(query)) score += 20;

    // Category/language
    if (guide.category.toLowerCase().includes(query)) score += 30;
    if (guide.language?.toLowerCase().includes(query)) score += 15;

    // Popularity
    score += Math.min(guide.stars || 0, 10);

    return score;
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          const result = results[selectedIndex];
          router.push(`/${result.category}/${result.slug}/`);
          handleClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedIndex(-1);
    setQuery('');
    searchRef.current?.blur();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-box" ref={searchRef}>
      <div className="search-input-container">
        <input
          type="search"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          autoComplete="off"
          aria-label="Search installation guides"
        />

        <div className="search-indicator">
          <span className="search-icon">🔍</span>
        </div>

        {query && (
          <button className="search-clear" onClick={handleClose}>
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-results">
          {results.length > 0 ? (
            results.map((result, index) => (
              <Link
                key={result.slug}
                href={`/${result.category}/${result.slug}/`}
                className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={handleClose}
              >
                <div className="result-content">
                  <div className="result-header">
                    <h3 className="result-title">{result.displayName}</h3>
                    <div className="result-badges">
                      <span className="result-category">{result.category}</span>
                      {result.language && (
                        <span className="result-language">{result.language}</span>
                      )}
                    </div>
                  </div>
                  <p className="result-description">{result.description}</p>
                  <div className="result-meta">
                    <span>{result.readTime}</span>
                    {result.stars > 0 && <span>⭐ {result.stars}</span>}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="search-empty">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">
                <strong>No guides found</strong>
                <p>Try a different search term</p>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .search-box {
          position: relative;
          width: 100%;
          max-width: 500px;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          padding-right: 80px;
          border: 2px solid var(--bg-surface);
          border-radius: var(--border-radius-lg);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: var(--font-base);
          transition: var(--transition);
          min-height: 48px;
        }

        .search-input:focus {
          border-color: var(--accent-primary);
          outline: none;
          box-shadow: 0 0 0 3px rgba(189, 147, 249, 0.15);
        }

        .search-indicator {
          position: absolute;
          right: 50px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-clear {
          position: absolute;
          right: var(--space-3);
          background: var(--bg-surface);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          font-size: var(--font-sm);
        }

        .search-clear:hover {
          background: var(--accent-error);
          color: var(--bg-primary);
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--bg-surface);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--box-shadow-lg);
          max-height: 400px;
          overflow-y: auto;
          z-index: var(--z-dropdown);
          margin-top: var(--space-2);
        }

        .search-result-item {
          display: block;
          padding: var(--space-4);
          border-bottom: 1px solid var(--bg-surface);
          cursor: pointer;
          transition: var(--transition);
          text-decoration: none;
          color: inherit;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover,
        .search-result-item.selected {
          background: var(--bg-surface);
          text-decoration: none;
          color: inherit;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
        }

        .result-title {
          color: var(--accent-primary);
          font-size: var(--font-base);
          font-weight: 600;
          margin: 0;
        }

        .result-badges {
          display: flex;
          gap: var(--space-1);
        }

        .result-category,
        .result-language {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--border-radius-sm);
          font-size: var(--font-xs);
          font-weight: 600;
          text-transform: uppercase;
        }

        .result-category {
          background: var(--accent-primary);
          color: var(--bg-primary);
        }

        .result-language {
          background: var(--accent-secondary);
          color: var(--bg-primary);
        }

        .result-description {
          color: var(--text-secondary);
          font-size: var(--font-sm);
          margin: 0 0 var(--space-2) 0;
          line-height: 1.4;
        }

        .result-meta {
          display: flex;
          gap: var(--space-3);
          font-size: var(--font-xs);
          color: var(--text-muted);
        }

        .search-empty {
          padding: var(--space-6) var(--space-4);
          text-align: center;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: var(--font-2xl);
          margin-bottom: var(--space-3);
          opacity: 0.5;
        }

        .empty-text strong {
          display: block;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .empty-text p {
          margin: 0;
          font-size: var(--font-sm);
        }

        @media (max-width: 767px) {
          .search-input {
            min-height: 52px;
            font-size: var(--font-base);
          }

          .result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-2);
          }

          .result-badges {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}