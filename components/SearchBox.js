import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ErrorMessage } from './LoadingStates';

export default function SearchBox({ guides = [], placeholder = "Search guides..." }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const router = useRouter();

  // Enhanced debounced search with error handling
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setSearchError(null);

        if (query.length >= 2) {
          setIsLoading(true);

          // Simple but effective search
          const searchResults = guides.filter(guide => {
            try {
              const searchTarget = [
                guide.name,
                guide.displayName,
                guide.description,
                guide.category,
                guide.language,
                ...(guide.topics || []),
                guide.searchText || ''
              ].filter(Boolean).join(' ').toLowerCase();

              const normalizedQuery = query.toLowerCase();

              // Direct match
              if (searchTarget.includes(normalizedQuery)) {
                return true;
              }

              // Word boundary matching
              const words = searchTarget.split(/[\s\-_\.]+/);
              if (words.some(word => word.startsWith(normalizedQuery))) {
                return true;
              }

              // Fuzzy character matching for typos
              if (normalizedQuery.length >= 3) {
                return words.some(word => {
                  if (word.length < 3) return false;
                  let matches = 0;
                  let queryIndex = 0;

                  for (let i = 0; i < word.length && queryIndex < normalizedQuery.length; i++) {
                    if (word[i] === normalizedQuery[queryIndex]) {
                      matches++;
                      queryIndex++;
                    }
                  }

                  return matches >= Math.min(normalizedQuery.length * 0.7, word.length * 0.6);
                });
              }

              return false;
            } catch (error) {
              console.warn('Error filtering guide:', guide.name, error);
              return false;
            }
          })
          .sort((a, b) => {
            try {
              // Simple relevance scoring
              const aScore = getSimpleScore(a, query);
              const bScore = getSimpleScore(b, query);
              return bScore - aScore;
            } catch (error) {
              console.warn('Error scoring guides:', error);
              return 0;
            }
          })
          .slice(0, 8);

          setResults(searchResults);
          setIsOpen(searchResults.length > 0 || query.length >= 2);
          setIsLoading(false);
        } else {
          setResults([]);
          setIsOpen(false);
        }
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('Search temporarily unavailable. Please try again.');
        setIsLoading(false);
        setIsOpen(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, guides]);

  // Simple scoring function
  const getSimpleScore = (guide, query) => {
    const normalizedQuery = query.toLowerCase();
    let score = 0;

    // Exact name match
    if (guide.name.toLowerCase() === normalizedQuery) score += 100;
    if (guide.displayName.toLowerCase() === normalizedQuery) score += 90;

    // Name contains query
    if (guide.name.toLowerCase().includes(normalizedQuery)) score += 50;
    if (guide.displayName.toLowerCase().includes(normalizedQuery)) score += 40;

    // Description contains query
    if (guide.description.toLowerCase().includes(normalizedQuery)) score += 20;

    // Category/language match
    if (guide.category.includes(normalizedQuery)) score += 30;
    if (guide.language?.toLowerCase().includes(normalizedQuery)) score += 15;

    // Stars boost
    score += Math.min(guide.stars || 0, 10);

    return score;
  };

  // Universal relevance matching for any search term
  const isRelevantMatch = (guide, query) => {
    const normalizedQuery = query.toLowerCase().trim();

    // Build comprehensive searchable content
    const searchableContent = [
      guide.name,
      guide.displayName,
      guide.description,
      guide.category,
      guide.language,
      ...(guide.topics || []),
      // Add the pre-built searchText if available
      guide.searchText || ''
    ].filter(Boolean).join(' ').toLowerCase();

    // 1. Direct substring match (most important)
    if (searchableContent.includes(normalizedQuery)) {
      return true;
    }

    // 2. Word boundary matching (start of words)
    const words = searchableContent.split(/[\s\-_\.]/);
    if (words.some(word => word.startsWith(normalizedQuery))) {
      return true;
    }

    // 3. Partial word matching (middle of words) - good for abbreviations
    if (normalizedQuery.length >= 3) {
      if (words.some(word => word.length >= 4 && word.includes(normalizedQuery))) {
        return true;
      }
    }

    // 4. Character-based fuzzy matching for typos and abbreviations
    if (normalizedQuery.length >= 3) {
      const queryChars = normalizedQuery.split('');

      return words.some(word => {
        if (word.length < 3) return false;

        let matchedChars = 0;
        let lastMatchIndex = -1;

        for (const char of queryChars) {
          const charIndex = word.indexOf(char, lastMatchIndex + 1);
          if (charIndex !== -1) {
            matchedChars++;
            lastMatchIndex = charIndex;
          }
        }

        // Allow match if most characters are found in order
        const threshold = Math.max(
          Math.ceil(queryChars.length * 0.7), // At least 70% of query chars
          Math.min(3, queryChars.length) // Or at least 3 chars (whichever is smaller)
        );

        return matchedChars >= threshold;
      });
    }

    // 5. Levenshtein distance for close typos
    if (normalizedQuery.length >= 4) {
      return words.some(word => {
        if (word.length < 3) return false;
        const distance = this.levenshteinDistance(normalizedQuery, word);
        const maxDistance = Math.floor(Math.max(normalizedQuery.length, word.length) * 0.3);
        return distance <= maxDistance;
      });
    }

    return false;
  };

  // Calculate Levenshtein distance for typo tolerance
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  // Universal relevance scoring that works for any search term
  const calculateRelevanceScore = (guide, query) => {
    const normalizedQuery = query.toLowerCase().trim();
    let score = 0;

    const searchableFields = {
      name: guide.name?.toLowerCase() || '',
      displayName: guide.displayName?.toLowerCase() || '',
      description: guide.description?.toLowerCase() || '',
      category: guide.category?.toLowerCase() || '',
      language: guide.language?.toLowerCase() || '',
      topics: (guide.topics || []).join(' ').toLowerCase(),
      searchText: guide.searchText || ''
    };

    // 1. Exact matches (highest priority)
    if (searchableFields.name === normalizedQuery) score += 1000;
    if (searchableFields.displayName === normalizedQuery) score += 900;

    // 2. Exact word matches in any field
    for (const [field, content] of Object.entries(searchableFields)) {
      const words = content.split(/[\s\-_\.]+/);
      if (words.includes(normalizedQuery)) {
        const fieldWeight = field === 'name' ? 500 :
                           field === 'displayName' ? 450 :
                           field === 'category' ? 300 :
                           field === 'topics' ? 250 : 200;
        score += fieldWeight;
      }
    }

    // 3. Starts with query (strong relevance)
    for (const [field, content] of Object.entries(searchableFields)) {
      if (content.startsWith(normalizedQuery)) {
        const fieldWeight = field === 'name' ? 400 :
                           field === 'displayName' ? 350 : 150;
        score += fieldWeight;
      }

      // Word starts with query
      const words = content.split(/[\s\-_\.]+/);
      if (words.some(word => word.startsWith(normalizedQuery))) {
        const fieldWeight = field === 'name' ? 300 :
                           field === 'displayName' ? 250 : 100;
        score += fieldWeight;
      }
    }

    // 4. Contains query (substring matching)
    for (const [field, content] of Object.entries(searchableFields)) {
      if (content.includes(normalizedQuery)) {
        const fieldWeight = field === 'name' ? 200 :
                           field === 'displayName' ? 150 :
                           field === 'description' ? 75 :
                           field === 'searchText' ? 100 : 50;
        score += fieldWeight;
      }
    }

    // 5. Fuzzy character matching for any length query
    if (normalizedQuery.length >= 2) {
      for (const [field, content] of Object.entries(searchableFields)) {
        const words = content.split(/[\s\-_\.]+/);

        for (const word of words) {
          if (word.length < 2) continue;

          const fuzzyScore = this.calculateFuzzyScore(normalizedQuery, word);
          if (fuzzyScore > 0.6) { // 60% character match threshold
            const fieldWeight = field === 'name' ? 150 :
                               field === 'displayName' ? 100 : 50;
            score += fieldWeight * fuzzyScore;
          }
        }
      }
    }

    // 6. Acronym matching (first letters of words)
    if (normalizedQuery.length >= 2) {
      for (const [field, content] of Object.entries(searchableFields)) {
        const words = content.split(/[\s\-_\.]+/).filter(w => w.length > 0);
        if (words.length >= normalizedQuery.length) {
          const acronym = words.slice(0, normalizedQuery.length)
                              .map(w => w[0])
                              .join('');

          if (acronym === normalizedQuery) {
            score += 300;
          }
        }
      }
    }

    // 7. Popularity and recency boost
    score += Math.min((guide.stars || 0) * 2, 50);

    // 8. Category relevance boost for exact category matches
    if (searchableFields.category.includes(normalizedQuery)) {
      score += 100;
    }

    return score;
  };

  // Calculate fuzzy character matching score
  const calculateFuzzyScore = (query, target) => {
    if (query.length === 0 || target.length === 0) return 0;

    let matches = 0;
    let queryIndex = 0;

    for (let i = 0; i < target.length && queryIndex < query.length; i++) {
      if (target[i] === query[queryIndex]) {
        matches++;
        queryIndex++;
      }
    }

    return matches / query.length;
  };

  // Keyboard navigation
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

  // Close search
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

  // Auto-focus on mobile when results open
  useEffect(() => {
    if (isOpen && results.length > 0 && selectedIndex >= 0) {
      const selectedElement = resultsRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex, isOpen, results]);

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
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          aria-label="Search installation guides"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* Search icon/loading indicator */}
        <div className="search-indicator">
          {isLoading ? (
            <div className="loading-spinner" aria-label="Searching..."></div>
          ) : (
            <span className="search-icon" aria-hidden="true">🔍</span>
          )}
        </div>

        {/* Clear button */}
        {query && (
          <button
            className="search-clear"
            onClick={handleClose}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && (
        <div
          className="search-results"
          ref={resultsRef}
          role="listbox"
          aria-label="Search results"
        >
          {results.length > 0 ? (
            <>
              {results.map((result, index) => (
                <Link
                  key={result.slug}
                  href={`/${result.category}/${result.slug}/`}
                  className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={handleClose}
                >
                  <div className="result-content">
                    <div className="result-header">
                      <h3
                        className="result-title"
                        dangerouslySetInnerHTML={{
                          __html: result.highlightedName || result.displayName
                        }}
                      />
                      <div className="result-badges">
                        <span className="result-category">{result.category}</span>
                        {result.language && (
                          <span className="result-language">{result.language}</span>
                        )}
                      </div>
                    </div>
                    <p
                      className="result-description"
                      dangerouslySetInnerHTML={{
                        __html: result.highlightedDescription || result.description
                      }}
                    />
                    <div className="result-meta">
                      <span className="result-readtime">{result.readTime}</span>
                      {result.stars > 0 && (
                        <span className="result-stars">⭐ {result.stars}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Search footer */}
              <div className="search-footer">
                <span className="search-count">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
                <span className="search-hint">
                  Press ↵ to select • ESC to close
                </span>
              </div>
            </>
          ) : searchError ? (
            <div className="search-error">
              <div className="error-icon">⚠️</div>
              <div className="error-text">
                <strong>Search Error</strong>
                <p>{searchError}</p>
                <button
                  className="retry-button"
                  onClick={() => {
                    setSearchError(null);
                    setQuery('');
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : query.length >= 2 ? (
            <div className="search-empty">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">
                <strong>No guides found</strong>
                <p>Try a different search term or browse categories</p>
              </div>
            </div>
          ) : null}
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
          padding-right: 80px; /* Space for icons */
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
          box-shadow: 0 0 0 3px rgba(189, 147, 249, 0.15);
          outline: none;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .search-indicator {
          position: absolute;
          right: 50px;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .search-icon {
          color: var(--text-muted);
          font-size: var(--font-lg);
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--bg-surface);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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
          transition: var(--transition);
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
          -webkit-overflow-scrolling: touch;
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

        .search-result-item:last-of-type {
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
          line-height: 1.3;
        }

        .result-title :global(.search-highlight) {
          background: var(--accent-warning);
          color: var(--bg-primary);
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }

        .result-badges {
          display: flex;
          gap: var(--space-1);
          flex-shrink: 0;
        }

        .result-category,
        .result-language {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--border-radius-sm);
          font-size: var(--font-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          line-height: 1.4;
          margin: 0 0 var(--space-2) 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .result-description :global(.search-highlight) {
          background: var(--accent-info);
          color: var(--bg-primary);
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }

        .result-meta {
          display: flex;
          gap: var(--space-3);
          font-size: var(--font-xs);
          color: var(--text-muted);
        }

        .result-readtime,
        .result-stars {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .search-footer {
          padding: var(--space-3) var(--space-4);
          background: var(--bg-surface);
          border-top: 1px solid var(--bg-surface);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-xs);
          color: var(--text-muted);
        }

        .search-hint {
          display: none;
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

        .search-error {
          padding: var(--space-4);
          text-align: center;
          background: rgba(255, 85, 85, 0.1);
          border: 1px solid var(--accent-error);
          border-radius: var(--border-radius);
          margin: var(--space-2);
        }

        .search-error .error-icon {
          font-size: var(--font-2xl);
          margin-bottom: var(--space-2);
          color: var(--accent-error);
        }

        .search-error .error-text strong {
          display: block;
          color: var(--accent-error);
          margin-bottom: var(--space-2);
          font-size: var(--font-base);
        }

        .search-error .error-text p {
          margin: 0 0 var(--space-3) 0;
          color: var(--text-primary);
          font-size: var(--font-sm);
        }

        .retry-button {
          background: var(--accent-error);
          color: var(--bg-primary);
          border: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--border-radius-sm);
          font-size: var(--font-sm);
          cursor: pointer;
          transition: var(--transition);
          min-height: 36px;
        }

        .retry-button:hover {
          background: var(--accent-warning);
          transform: translateY(-1px);
        }

        /* Mobile optimizations */
        @media (max-width: 767px) {
          .search-input {
            padding: var(--space-4);
            font-size: var(--font-base);
            min-height: 52px;
          }

          .search-results {
            max-height: 60vh;
            border-radius: var(--border-radius);
          }

          .search-result-item {
            padding: var(--space-3);
          }

          .result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-2);
          }

          .result-badges {
            order: -1;
            margin-bottom: var(--space-1);
          }

          .result-title {
            font-size: var(--font-sm);
          }

          .result-description {
            font-size: var(--font-xs);
            -webkit-line-clamp: 1;
          }
        }

        /* Desktop enhancements */
        @media (min-width: 768px) {
          .search-hint {
            display: inline;
          }

          .search-input {
            font-size: var(--font-sm);
          }

          .search-results {
            border-radius: var(--border-radius-lg);
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .search-input {
            border-width: 3px;
          }

          .search-result-item.selected {
            outline: 3px solid var(--accent-primary);
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .search-result-item,
          .search-input {
            transition: none;
          }

          .loading-spinner {
            animation: none;
            border-top-color: var(--accent-primary);
          }
        }
      `}</style>
    </div>
  );
}