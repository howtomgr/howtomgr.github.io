/**
 * GitHub API Integration for HowToMgr
 * Handles fetching repositories from GitHub API with pagination and caching
 */

class GitHubAPI {
    constructor() {
        this.baseURL = 'https://api.github.com';
        this.orgName = 'howtomgr';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.rateLimit = {
            limit: 60,
            remaining: 60,
            reset: Date.now() + (60 * 60 * 1000)
        };
    }

    /**
     * Fetch all repositories from the organization with pagination
     * @param {Object} options - Fetch options
     * @returns {Promise<Array>} Array of repository objects
     */
    async fetchAllRepositories(options = {}) {
        const {
            sort = 'updated',
            direction = 'desc',
            per_page = 100,
            type = 'all'
        } = options;

        try {
            console.log('Fetching repositories from GitHub API...');
            
            let allRepos = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const url = `${this.baseURL}/orgs/${this.orgName}/repos?sort=${sort}&direction=${direction}&per_page=${per_page}&page=${page}&type=${type}`;
                
                const response = await this.makeRequest(url);
                const repos = await response.json();
                
                // Update rate limit info
                this.updateRateLimit(response.headers);
                
                if (repos.length === 0 || repos.length < per_page) {
                    hasMore = false;
                }
                
                allRepos = allRepos.concat(repos);
                page++;
                
                // Respect rate limits
                if (this.rateLimit.remaining < 10) {
                    console.warn('Approaching rate limit, slowing down requests');
                    await this.sleep(1000);
                }
            }

            console.log(`Fetched ${allRepos.length} repositories`);
            
            // Filter out the website repo itself
            allRepos = allRepos.filter(repo => repo.name !== 'howtomgr.github.io');
            
            // Process and enhance repository data
            const processedRepos = await this.processRepositories(allRepos);
            
            // Cache the results
            this.setCache('all_repositories', processedRepos);
            
            return processedRepos;
        } catch (error) {
            console.error('Error fetching repositories:', error);
            
            // Return cached data if available
            const cachedData = this.getCache('all_repositories');
            if (cachedData) {
                console.log('Returning cached repository data');
                return cachedData;
            }
            
            // Return sample data as fallback
            return this.getSampleData();
        }
    }

    /**
     * Fetch README content for a specific repository
     * @param {string} repoName - Repository name
     * @returns {Promise<string|null>} README content or null
     */
    async fetchReadme(repoName) {
        try {
            const cacheKey = `readme_${repoName}`;
            const cached = this.getCache(cacheKey);
            if (cached) {
                return cached;
            }

            const url = `${this.baseURL}/repos/${this.orgName}/${repoName}/readme`;
            const response = await this.makeRequest(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });

            if (response.ok) {
                const content = await response.text();
                this.setCache(cacheKey, content);
                return content;
            }
            
            return null;
        } catch (error) {
            console.warn(`Failed to fetch README for ${repoName}:`, error);
            return null;
        }
    }

    /**
     * Process repository data to add additional information and categorization
     * @param {Array} repositories - Raw repository data from API
     * @returns {Promise<Array>} Processed repository data
     */
    async processRepositories(repositories) {
        return repositories.map(repo => {
            // Add category based on repository name and topics
            const category = this.categorizeRepository(repo);
            
            // Calculate display metrics
            const displayMetrics = this.calculateDisplayMetrics(repo);
            
            // Generate README preview
            const readmePreview = this.generateReadmePreview(repo);
            
            return {
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description || `Installation guide for ${repo.name}`,
                html_url: repo.html_url,
                homepage: repo.homepage,
                language: repo.language,
                stargazers_count: repo.stargazers_count || 0,
                watchers_count: repo.watchers_count || 0,
                forks_count: repo.forks_count || 0,
                open_issues_count: repo.open_issues_count || 0,
                size: repo.size || 0,
                default_branch: repo.default_branch || 'main',
                topics: repo.topics || [],
                created_at: repo.created_at,
                updated_at: repo.updated_at,
                pushed_at: repo.pushed_at,
                
                // Enhanced data
                category: category,
                display_name: this.formatDisplayName(repo.name),
                tech_stack: this.identifyTechStack(repo),
                complexity: this.assessComplexity(repo),
                ...displayMetrics,
                readme_preview: readmePreview
            };
        }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    /**
     * Categorize repository based on name and topics
     * @param {Object} repo - Repository object
     * @returns {string} Category name
     */
    categorizeRepository(repo) {
        const name = repo.name.toLowerCase();
        const topics = (repo.topics || []).join(' ').toLowerCase();
        
        // Infrastructure
        if (['nginx', 'apache', 'haproxy', 'traefik', 'caddy'].includes(name)) {
            return 'web-server';
        }
        
        // Databases
        if (['mysql', 'mariadb', 'postgresql', 'mongodb', 'redis', 'mssql'].includes(name) || 
            name.includes('db') || topics.includes('database')) {
            return 'database';
        }
        
        // Container & Orchestration
        if (['docker', 'kubernetes', 'k3s', 'minikube', 'portainer', 'rancher'].includes(name) ||
            topics.includes('container') || topics.includes('kubernetes')) {
            return 'container';
        }
        
        // Security
        if (['vault', 'authelia', 'keycloak', 'fail2ban', 'wireguard', 'openvpn', 'pihole'].includes(name) ||
            topics.includes('security') || topics.includes('vpn') || topics.includes('auth')) {
            return 'security';
        }
        
        // Monitoring & Observability
        if (['prometheus', 'grafana', 'loki', 'jaeger', 'tempo', 'alertmanager'].includes(name) ||
            topics.includes('monitoring') || topics.includes('metrics') || topics.includes('observability')) {
            return 'monitoring';
        }
        
        // DevOps & CI/CD
        if (['jenkins', 'gitlab', 'drone', 'ansible', 'terraform', 'consul', 'etcd'].includes(name) ||
            topics.includes('cicd') || topics.includes('devops') || topics.includes('automation')) {
            return 'infrastructure';
        }
        
        // Media & Entertainment
        if (['plex', 'jellyfin', 'sonarr', 'radarr', 'lidarr', 'prowlarr'].includes(name) ||
            topics.includes('media') || topics.includes('entertainment')) {
            return 'media';
        }
        
        // Communication & Collaboration
        if (['mattermost', 'rocketchat', 'matrix', 'mastodon', 'element'].includes(name) ||
            topics.includes('chat') || topics.includes('communication') || topics.includes('collaboration')) {
            return 'communication';
        }
        
        // Productivity
        if (['nextcloud', 'bookstack', 'outline', 'bitwarden'].includes(name) ||
            topics.includes('productivity') || topics.includes('documentation') || topics.includes('wiki')) {
            return 'productivity';
        }
        
        return 'application';
    }

    /**
     * Format display name from repository name
     * @param {string} repoName - Repository name
     * @returns {string} Formatted display name
     */
    formatDisplayName(repoName) {
        // Handle special cases
        const specialCases = {
            'nginx': 'NGINX',
            'mysql': 'MySQL',
            'mariadb': 'MariaDB',
            'postgresql': 'PostgreSQL',
            'mongodb': 'MongoDB',
            'mssql': 'Microsoft SQL Server',
            'redis-server': 'Redis',
            'nodejs': 'Node.js',
            'jellyfin': 'Jellyfin',
            'plex': 'Plex Media Server',
            'pihole': 'Pi-hole',
            'wireguard': 'WireGuard',
            'cloudflare-tunnel': 'Cloudflare Tunnel'
        };

        if (specialCases[repoName]) {
            return specialCases[repoName];
        }

        // General formatting: capitalize and handle hyphens
        return repoName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Identify technology stack from repository data
     * @param {Object} repo - Repository object
     * @returns {Array} Array of technology tags
     */
    identifyTechStack(repo) {
        const stack = [];
        const name = repo.name.toLowerCase();
        const topics = repo.topics || [];
        
        if (repo.language) {
            stack.push(repo.language);
        }
        
        if (topics.includes('docker') || name.includes('docker')) {
            stack.push('Docker');
        }
        
        if (topics.includes('kubernetes') || name.includes('k8s') || name.includes('kubernetes')) {
            stack.push('Kubernetes');
        }
        
        if (topics.includes('security') || name.includes('security')) {
            stack.push('Security');
        }
        
        return stack.slice(0, 3); // Limit to 3 tags
    }

    /**
     * Assess repository complexity based on various factors
     * @param {Object} repo - Repository object
     * @returns {string} Complexity level
     */
    assessComplexity(repo) {
        let score = 0;
        
        // Size factor
        if (repo.size > 10000) score += 3;
        else if (repo.size > 5000) score += 2;
        else if (repo.size > 1000) score += 1;
        
        // Topic factor
        score += (repo.topics || []).length;
        
        // Complex technologies
        const complexTech = ['kubernetes', 'terraform', 'ansible', 'vault', 'consul'];
        if (complexTech.includes(repo.name.toLowerCase())) score += 2;
        
        // Language factor
        if (['Go', 'Rust', 'C++'].includes(repo.language)) score += 1;
        
        if (score >= 6) return 'Advanced';
        if (score >= 3) return 'Intermediate';
        return 'Beginner';
    }

    /**
     * Calculate display metrics for repository card
     * @param {Object} repo - Repository object
     * @returns {Object} Display metrics
     */
    calculateDisplayMetrics(repo) {
        const now = new Date();
        const updated = new Date(repo.updated_at);
        const daysSinceUpdate = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
        
        let freshness = 'Fresh';
        if (daysSinceUpdate > 365) freshness = 'Outdated';
        else if (daysSinceUpdate > 90) freshness = 'Stable';
        else if (daysSinceUpdate > 30) freshness = 'Recent';
        
        return {
            days_since_update: daysSinceUpdate,
            freshness: freshness,
            activity_score: this.calculateActivityScore(repo),
            display_date: this.formatDisplayDate(repo.updated_at)
        };
    }

    /**
     * Calculate activity score based on stars, forks, and updates
     * @param {Object} repo - Repository object
     * @returns {number} Activity score (0-100)
     */
    calculateActivityScore(repo) {
        const stars = repo.stargazers_count || 0;
        const forks = repo.forks_count || 0;
        const daysSinceUpdate = Math.floor((Date.now() - new Date(repo.updated_at)) / (1000 * 60 * 60 * 24));
        
        let score = 0;
        score += Math.min(stars * 2, 50); // Max 50 points from stars
        score += Math.min(forks * 3, 30); // Max 30 points from forks
        score += Math.max(20 - daysSinceUpdate, 0); // Max 20 points from recency
        
        return Math.min(score, 100);
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDisplayDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    /**
     * Generate README preview from repository data
     * @param {Object} repo - Repository object
     * @returns {string} Preview text
     */
    generateReadmePreview(repo) {
        if (repo.description) {
            return repo.description;
        }
        
        const name = this.formatDisplayName(repo.name);
        const category = this.categorizeRepository(repo);
        
        const templates = {
            'web-server': `High-performance web server installation and configuration guide for ${name}.`,
            'database': `Production-ready ${name} database installation with security hardening.`,
            'security': `Enterprise security solution with ${name} installation and configuration.`,
            'monitoring': `Comprehensive monitoring setup with ${name} for observability.`,
            'container': `Container orchestration and management with ${name}.`,
            'media': `Media server setup and configuration for ${name}.`,
            'application': `Complete installation and setup guide for ${name}.`
        };
        
        return templates[category] || templates['application'];
    }

    /**
     * Make HTTP request with error handling and rate limiting
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async makeRequest(url, options = {}) {
        const defaultHeaders = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'HowToMgr-Site/1.0'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
        }

        return response;
    }

    /**
     * Update rate limit information from response headers
     * @param {Headers} headers - Response headers
     */
    updateRateLimit(headers) {
        this.rateLimit = {
            limit: parseInt(headers.get('x-ratelimit-limit') || '60'),
            remaining: parseInt(headers.get('x-ratelimit-remaining') || '60'),
            reset: parseInt(headers.get('x-ratelimit-reset') || '0') * 1000
        };
        
        console.log(`Rate limit: ${this.rateLimit.remaining}/${this.rateLimit.limit} remaining`);
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Set cache with timestamp
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached data if not expired
     * @param {string} key - Cache key
     * @returns {*|null} Cached data or null if expired/not found
     */
    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const isExpired = (Date.now() - cached.timestamp) > this.cacheTimeout;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Get sample data for fallback/development
     * @returns {Array} Sample repository data
     */
    getSampleData() {
        return [
            {
                id: 1,
                name: 'nginx',
                display_name: 'NGINX',
                description: 'High-performance web server and reverse proxy installation guide',
                html_url: 'https://github.com/howtomgr/nginx',
                language: 'Shell',
                stargazers_count: 25,
                forks_count: 8,
                topics: ['nginx', 'web-server', 'reverse-proxy', 'ssl'],
                updated_at: '2024-01-15T12:00:00Z',
                category: 'web-server',
                tech_stack: ['Shell', 'Security'],
                complexity: 'Intermediate',
                freshness: 'Fresh',
                activity_score: 85,
                display_date: '2 days ago',
                readme_preview: 'Complete NGINX installation with security hardening and performance optimization.'
            },
            {
                id: 2,
                name: 'docker',
                display_name: 'Docker',
                description: 'Container platform installation and configuration guide',
                html_url: 'https://github.com/howtomgr/docker',
                language: 'Shell',
                stargazers_count: 42,
                forks_count: 12,
                topics: ['docker', 'containers', 'devops'],
                updated_at: '2024-01-14T14:30:00Z',
                category: 'container',
                tech_stack: ['Shell', 'Docker'],
                complexity: 'Intermediate',
                freshness: 'Fresh',
                activity_score: 92,
                display_date: '3 days ago',
                readme_preview: 'Comprehensive Docker installation with security and orchestration.'
            },
            {
                id: 3,
                name: 'kubernetes',
                display_name: 'Kubernetes',
                description: 'Container orchestration platform setup and configuration',
                html_url: 'https://github.com/howtomgr/kubernetes',
                language: 'YAML',
                stargazers_count: 35,
                forks_count: 15,
                topics: ['kubernetes', 'k8s', 'orchestration', 'containers'],
                updated_at: '2024-01-13T16:45:00Z',
                category: 'container',
                tech_stack: ['YAML', 'Kubernetes'],
                complexity: 'Advanced',
                freshness: 'Fresh',
                activity_score: 88,
                display_date: '4 days ago',
                readme_preview: 'Complete Kubernetes cluster setup with security hardening.'
            }
        ];
    }

    /**
     * Get rate limit status
     * @returns {Object} Rate limit information
     */
    getRateLimitStatus() {
        return {
            ...this.rateLimit,
            resetDate: new Date(this.rateLimit.reset),
            resetIn: Math.max(0, this.rateLimit.reset - Date.now())
        };
    }
}

// Export for use in main app
window.GitHubAPI = GitHubAPI;