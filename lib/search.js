import { expandSearchQuery, calculateSearchScore } from './search-keywords';

/**
 * Advanced Fuzzy Search for HowToMgr
 * Mobile-optimized with keyboard navigation and instant results
 */

export class FuzzySearch {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.3;
    this.distance = options.distance || 100;
    this.keys = options.keys || ['name', 'displayName', 'description'];
    this.includeScore = options.includeScore !== false;
    this.includeMatches = options.includeMatches !== false;
  }

  /**
   * Enhanced search with keyword expansion and better scoring
   */
  search(items, query) {
    if (!query || query.length < 2) {
      return items.map(item => ({
        item,
        score: 0,
        matches: [],
        refIndex: items.indexOf(item)
      }));
    }

    const normalizedQuery = query.toLowerCase().trim();
    const expandedTerms = expandSearchQuery(normalizedQuery);
    const results = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let totalScore = 0;
      let bestMatches = [];
      let bestKey = '';

      // Calculate enhanced score using keywords
      const keywordScore = calculateSearchScore(item, query, expandedTerms);
      totalScore += keywordScore;

      // Original fuzzy matching for direct text matches
      let bestFuzzyScore = 0;
      for (const key of this.keys) {
        const value = this.getValue(item, key);
        if (!value) continue;

        // Test original query
        const directResult = this.fuzzyMatch(normalizedQuery, value.toLowerCase());
        if (directResult.score > bestFuzzyScore) {
          bestFuzzyScore = directResult.score;
          bestMatches = directResult.matches.map(match => ({
            ...match,
            key,
            value: value
          }));
          bestKey = key;
        }

        // Test expanded terms
        for (const term of expandedTerms) {
          const expandedResult = this.fuzzyMatch(term, value.toLowerCase());
          if (expandedResult.score > bestFuzzyScore) {
            bestFuzzyScore = expandedResult.score * 0.8; // Slightly lower score for expanded terms
            bestMatches = expandedResult.matches.map(match => ({
              ...match,
              key,
              value: value,
              expandedTerm: term
            }));
            bestKey = key;
          }
        }
      }

      totalScore += bestFuzzyScore;

      // Include if total score is above threshold
      if (totalScore >= this.threshold) {
        results.push({
          item,
          score: totalScore,
          matches: bestMatches,
          refIndex: i,
          matchedKey: bestKey,
          keywordScore: keywordScore,
          fuzzyScore: bestFuzzyScore
        });
      }
    }

    // Sort by total score (higher = better match)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get value from object using dot notation
   */
  getValue(obj, key) {
    const keys = key.split('.');
    let value = obj;

    for (const k of keys) {
      value = value?.[k];
    }

    if (Array.isArray(value)) {
      return value.join(' ');
    }

    return String(value || '');
  }

  /**
   * Perform fuzzy matching between query and text
   */
  fuzzyMatch(query, text) {
    const queryLen = query.length;
    const textLen = text.length;

    if (queryLen > textLen) {
      return { score: 0, matches: [] };
    }

    // Exact match gets highest score
    const exactIndex = text.indexOf(query);
    if (exactIndex !== -1) {
      return {
        score: 1.0,
        matches: [{
          start: exactIndex,
          end: exactIndex + queryLen,
          matchType: 'exact'
        }]
      };
    }

    // Word boundary match gets high score
    const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(query)}`, 'i');
    const wordMatch = text.match(wordBoundaryRegex);
    if (wordMatch) {
      return {
        score: 0.9,
        matches: [{
          start: wordMatch.index,
          end: wordMatch.index + queryLen,
          matchType: 'word-boundary'
        }]
      };
    }

    // Fuzzy character matching
    return this.fuzzyCharacterMatch(query, text);
  }

  /**
   * Fuzzy character-by-character matching
   */
  fuzzyCharacterMatch(query, text) {
    const queryLen = query.length;
    const textLen = text.length;

    let score = 0;
    let matches = [];
    let queryIndex = 0;
    let lastMatchIndex = -1;
    let consecutiveMatches = 0;

    for (let textIndex = 0; textIndex < textLen && queryIndex < queryLen; textIndex++) {
      if (text[textIndex] === query[queryIndex]) {
        // Track match position
        matches.push({
          start: textIndex,
          end: textIndex + 1,
          queryIndex: queryIndex,
          matchType: 'character'
        });

        // Bonus for consecutive matches
        if (textIndex === lastMatchIndex + 1) {
          consecutiveMatches++;
          score += 0.1 + (consecutiveMatches * 0.05); // Increasing bonus
        } else {
          consecutiveMatches = 0;
        }

        // Base score for match
        score += 0.8 / queryLen;

        // Bonus for matches at word boundaries
        if (textIndex === 0 || /\s|-|_/.test(text[textIndex - 1])) {
          score += 0.1;
        }

        lastMatchIndex = textIndex;
        queryIndex++;
      }
    }

    // Check if all query characters were found
    if (queryIndex === queryLen) {
      // Penalty for distance between first and last match
      if (matches.length > 1) {
        const distance = matches[matches.length - 1].start - matches[0].start;
        const maxDistance = Math.min(this.distance, textLen);
        score *= Math.max(0.1, 1 - (distance / maxDistance));
      }

      // Bonus for shorter text (more precise match)
      score += Math.max(0, (50 - textLen) / 100);

      return {
        score: Math.min(score, 1),
        matches: this.mergeConsecutiveMatches(matches)
      };
    }

    return { score: 0, matches: [] };
  }

  /**
   * Merge consecutive character matches
   */
  mergeConsecutiveMatches(matches) {
    if (matches.length <= 1) return matches;

    const merged = [];
    let current = { ...matches[0] };

    for (let i = 1; i < matches.length; i++) {
      const match = matches[i];

      if (match.start === current.end) {
        // Consecutive match - extend current
        current.end = match.end;
      } else {
        // Non-consecutive - save current and start new
        merged.push(current);
        current = { ...match };
      }
    }

    merged.push(current);
    return merged;
  }

  /**
   * Highlight matches in text for display
   */
  highlightMatches(text, matches, highlightClass = 'search-highlight') {
    if (!matches || matches.length === 0) {
      return text;
    }

    let result = '';
    let lastIndex = 0;

    // Sort matches by start position
    const sortedMatches = matches.sort((a, b) => a.start - b.start);

    for (const match of sortedMatches) {
      // Add text before match
      result += text.slice(lastIndex, match.start);

      // Add highlighted match
      const matchText = text.slice(match.start, match.end);
      result += `<mark class="${highlightClass}">${matchText}</mark>`;

      lastIndex = match.end;
    }

    // Add remaining text
    result += text.slice(lastIndex);
    return result;
  }

  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Create search index for faster searching
   */
  createIndex(items) {
    return items.map((item, index) => {
      const searchableText = this.keys
        .map(key => this.getValue(item, key))
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return {
        ...item,
        _searchText: searchableText,
        _searchWords: searchableText.split(/\s+/).filter(word => word.length > 1),
        _originalIndex: index
      };
    });
  }

  /**
   * Search with pre-built index (faster for large datasets)
   */
  searchIndex(indexedItems, query) {
    if (!query || query.length < 2) {
      return indexedItems.map(item => ({
        item,
        score: 0,
        matches: []
      }));
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results = [];

    for (const item of indexedItems) {
      // Quick word-based filtering first
      const hasWordMatch = item._searchWords.some(word =>
        word.includes(normalizedQuery) || normalizedQuery.includes(word)
      );

      if (!hasWordMatch && normalizedQuery.length > 3) {
        continue; // Skip expensive fuzzy matching for unlikely matches
      }

      // Perform full fuzzy search
      const result = this.search([item], query)[0];
      if (result && result.score >= this.threshold) {
        results.push(result);
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }
}

/**
 * Search component state management
 */
export class SearchManager {
  constructor(options = {}) {
    this.fuzzySearch = new FuzzySearch(options.searchOptions);
    this.onResultClick = options.onResultClick || (() => {});
    this.onSearchChange = options.onSearchChange || (() => {});
    this.maxResults = options.maxResults || 8;
    this.minQueryLength = options.minQueryLength || 2;

    this.searchData = [];
    this.searchIndex = [];
    this.currentQuery = '';
    this.selectedIndex = -1;
  }

  /**
   * Initialize search with data
   */
  setData(data) {
    this.searchData = data;
    this.searchIndex = this.fuzzySearch.createIndex(data);
  }

  /**
   * Perform search and return formatted results
   */
  search(query) {
    this.currentQuery = query;
    this.selectedIndex = -1;

    if (!query || query.length < this.minQueryLength) {
      return [];
    }

    const results = this.fuzzySearch.searchIndex(this.searchIndex, query);
    return results.slice(0, this.maxResults).map(result => ({
      ...result.item,
      score: result.score,
      highlightedName: this.fuzzySearch.highlightMatches(
        result.item.displayName || result.item.name,
        result.matches
      ),
      highlightedDescription: this.fuzzySearch.highlightMatches(
        result.item.description,
        result.matches
      )
    }));
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event, results, onSelect) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, results.length - 1);
        this.updateSelection();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;

      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && results[this.selectedIndex]) {
          onSelect(results[this.selectedIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.selectedIndex = -1;
        this.onSearchChange('');
        break;
    }
  }

  /**
   * Update visual selection
   */
  updateSelection() {
    const items = document.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      } else {
        item.classList.remove('selected');
      }
    });
  }
}

/**
 * Search analytics and performance tracking
 */
export class SearchAnalytics {
  constructor() {
    this.searches = [];
    this.popularTerms = new Map();
  }

  trackSearch(query, resultsCount, selectedResult = null) {
    const search = {
      query,
      resultsCount,
      selectedResult,
      timestamp: Date.now()
    };

    this.searches.push(search);

    // Track popular terms
    if (query.length >= 2) {
      const count = this.popularTerms.get(query) || 0;
      this.popularTerms.set(query, count + 1);
    }

    // Keep only last 100 searches
    if (this.searches.length > 100) {
      this.searches = this.searches.slice(-100);
    }
  }

  getPopularTerms(limit = 10) {
    return Array.from(this.popularTerms.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
  }

  getSearchStats() {
    const total = this.searches.length;
    const withResults = this.searches.filter(s => s.resultsCount > 0).length;
    const withClicks = this.searches.filter(s => s.selectedResult).length;

    return {
      totalSearches: total,
      successRate: total > 0 ? (withResults / total) : 0,
      clickRate: total > 0 ? (withClicks / total) : 0,
      avgResultsPerSearch: total > 0 ?
        this.searches.reduce((sum, s) => sum + s.resultsCount, 0) / total : 0
    };
  }
}