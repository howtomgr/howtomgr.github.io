/**
 * Search keyword mappings and aliases for better search results
 */

export const SEARCH_KEYWORDS = {
  // Container orchestration
  'kubectl': ['kubernetes', 'k8s'],
  'k8s': ['kubernetes', 'kubectl'],
  'kubernetes': ['kubectl', 'k8s', 'container', 'orchestration'],
  'docker': ['container', 'containerization'],
  'containers': ['docker', 'kubernetes', 'k8s', 'podman'],

  // Web servers
  'nginx': ['web server', 'reverse proxy', 'load balancer', 'http'],
  'apache': ['web server', 'http server', 'httpd'],
  'web server': ['nginx', 'apache', 'haproxy', 'traefik', 'caddy'],
  'reverse proxy': ['nginx', 'haproxy', 'traefik'],
  'load balancer': ['nginx', 'haproxy', 'traefik'],

  // Databases
  'postgres': ['postgresql'],
  'postgresql': ['postgres', 'sql', 'database'],
  'mysql': ['mariadb', 'sql', 'database'],
  'mariadb': ['mysql', 'sql', 'database'],
  'mongodb': ['mongo', 'nosql', 'database'],
  'mongo': ['mongodb'],
  'redis': ['cache', 'key-value', 'database'],
  'database': ['mysql', 'postgresql', 'mongodb', 'redis', 'sql', 'nosql'],
  'sql': ['mysql', 'postgresql', 'mariadb'],
  'nosql': ['mongodb', 'redis'],

  // Security
  'authentication': ['keycloak', 'authelia', 'auth'],
  'auth': ['keycloak', 'authelia', 'authentication'],
  'vpn': ['wireguard', 'openvpn'],
  'firewall': ['fail2ban', 'security'],
  'secrets': ['vault', 'security'],
  'vault': ['secrets', 'hashicorp', 'security'],

  // Monitoring
  'metrics': ['prometheus', 'grafana', 'monitoring'],
  'monitoring': ['prometheus', 'grafana', 'nagios', 'zabbix'],
  'dashboards': ['grafana', 'monitoring'],
  'alerting': ['prometheus', 'grafana', 'monitoring'],

  // Communication
  'chat': ['mattermost', 'rocketchat', 'matrix', 'communication'],
  'slack': ['mattermost', 'rocketchat'],
  'teams': ['mattermost', 'rocketchat'],
  'video': ['jitsi', 'communication'],
  'conference': ['jitsi', 'communication'],

  // Media
  'streaming': ['plex', 'jellyfin', 'media'],
  'movies': ['plex', 'jellyfin', 'radarr', 'media'],
  'tv': ['plex', 'jellyfin', 'sonarr', 'media'],
  'music': ['plex', 'jellyfin', 'lidarr', 'media'],
  'media server': ['plex', 'jellyfin'],

  // Productivity
  'cms': ['wordpress', 'drupal', 'ghost'],
  'blog': ['wordpress', 'ghost'],
  'wiki': ['bookstack', 'outline'],
  'notes': ['bookstack', 'outline'],
  'files': ['nextcloud', 'owncloud'],
  'cloud storage': ['nextcloud', 'owncloud'],

  // Infrastructure
  'automation': ['ansible', 'terraform'],
  'infrastructure as code': ['terraform', 'ansible'],
  'iac': ['terraform', 'ansible'],
  'ci/cd': ['gitlab', 'jenkins'],
  'continuous integration': ['gitlab', 'jenkins'],
  'git': ['gitlab', 'gitea'],
  'repository': ['gitlab', 'gitea'],

  // Common abbreviations
  'k8': ['kubernetes'],
  'tf': ['terraform'],
  'pg': ['postgresql'],
  'db': ['database'],
  'lb': ['load balancer'],
  'rp': ['reverse proxy']
};

/**
 * Expand search query with related keywords
 */
export function expandSearchQuery(query) {
  const normalizedQuery = query.toLowerCase().trim();
  const expandedTerms = new Set([normalizedQuery]);

  // Add direct keyword mappings
  if (SEARCH_KEYWORDS[normalizedQuery]) {
    SEARCH_KEYWORDS[normalizedQuery].forEach(term => expandedTerms.add(term));
  }

  // Add partial matches for longer queries
  if (normalizedQuery.length > 3) {
    for (const [keyword, aliases] of Object.entries(SEARCH_KEYWORDS)) {
      if (keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword)) {
        expandedTerms.add(keyword);
        aliases.forEach(alias => expandedTerms.add(alias));
      }
    }
  }

  return Array.from(expandedTerms);
}

/**
 * Enhanced search scoring with keyword matching
 */
export function calculateSearchScore(item, query, expandedTerms) {
  let score = 0;
  const searchableText = [
    item.name,
    item.displayName,
    item.description,
    item.category,
    item.language,
    ...(item.topics || [])
  ].filter(Boolean).join(' ').toLowerCase();

  // Exact query match (highest score)
  if (searchableText.includes(query.toLowerCase())) {
    score += 1.0;
  }

  // Expanded keyword matches
  for (const term of expandedTerms) {
    if (searchableText.includes(term)) {
      score += 0.7;
    }
  }

  // Partial word matches
  const words = searchableText.split(/\s+/);
  for (const word of words) {
    if (word.includes(query.toLowerCase())) {
      score += 0.5;
    }
  }

  // Name/title boost
  if (item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.displayName.toLowerCase().includes(query.toLowerCase())) {
    score += 0.8;
  }

  // Popular items boost
  if (item.stars > 10) {
    score += 0.1;
  }

  return Math.min(score, 2.0); // Cap at 2.0
}

/**
 * Search suggestions based on partial input
 */
export function getSearchSuggestions(query, maxSuggestions = 5) {
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const suggestions = [];

  // Find keywords that start with or contain the query
  for (const keyword of Object.keys(SEARCH_KEYWORDS)) {
    if (keyword.startsWith(normalizedQuery)) {
      suggestions.push({ text: keyword, type: 'exact' });
    } else if (keyword.includes(normalizedQuery)) {
      suggestions.push({ text: keyword, type: 'partial' });
    }
  }

  // Sort by relevance (exact matches first, then by length)
  suggestions.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'exact' ? -1 : 1;
    }
    return a.text.length - b.text.length;
  });

  return suggestions.slice(0, maxSuggestions);
}