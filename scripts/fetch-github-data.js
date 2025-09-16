#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Import category system (for Node.js)
const CATEGORIES = {
  'web-server': {
    keywords: ['nginx', 'apache', 'haproxy', 'traefik', 'caddy']
  },
  'database': {
    keywords: ['mysql', 'postgresql', 'mongodb', 'redis', 'mariadb', 'databases']
  },
  'container': {
    keywords: ['docker', 'kubernetes', 'k3s', 'portainer', 'rancher', 'minikube']
  },
  'security': {
    keywords: ['vault', 'authelia', 'keycloak', 'pihole', 'fail2ban', 'wireguard', 'openvpn']
  },
  'monitoring': {
    keywords: ['prometheus', 'grafana', 'loki', 'jaeger', 'nagios', 'zabbix']
  },
  'communication': {
    keywords: ['mattermost', 'rocketchat', 'matrix', 'mastodon', 'element', 'jitsi']
  },
  'productivity': {
    keywords: ['nextcloud', 'wordpress', 'ghost', 'bookstack', 'outline', 'bitwarden']
  },
  'media': {
    keywords: ['plex', 'jellyfin', 'sonarr', 'radarr', 'lidarr', 'prowlarr']
  },
  'infrastructure': {
    keywords: ['ansible', 'terraform', 'gitlab', 'jenkins', 'consul', 'etcd']
  }
};

class GitHubDataFetcher {
  constructor() {
    this.orgName = 'howtomgr';
    this.dataDir = path.join(process.cwd(), 'data');
  }

  async build() {
    console.log('🚀 Fetching GitHub data for Next.js build...');

    try {
      await this.ensureDataDirectory();
      const repositories = await this.fetchAllRepositories();
      const guides = await this.processRepositories(repositories);
      await this.generateDataFiles(guides);

      console.log(`✅ Successfully processed ${guides.length} guides!`);
    } catch (error) {
      console.error('❌ Data fetch failed:', error);
      process.exit(1);
    }
  }

  async ensureDataDirectory() {
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  async fetchAllRepositories() {
    console.log('📡 Fetching repositories...');

    let allRepos = [];
    let page = 1;

    while (true) {
      const repos = await this.makeGitHubRequest(`/orgs/${this.orgName}/repos?per_page=100&page=${page}&sort=updated`);

      if (repos.length === 0) break;

      allRepos = allRepos.concat(repos);
      console.log(`   📄 Page ${page}: ${repos.length} repositories`);

      if (repos.length < 100) break;
      page++;
    }

    // Filter out excluded directories, forks, and archived repos
    const excludedRepos = [
      'howtomgr.github.io',
      '.claude',
      '.github',
      'community',
      'template'
    ];

    allRepos = allRepos.filter(repo =>
      !excludedRepos.includes(repo.name) &&
      !repo.archived &&
      !repo.fork
    );

    console.log(`✅ Found ${allRepos.length} active repositories`);
    return allRepos;
  }

  async processRepositories(repositories) {
    console.log('📖 Processing repositories with META.json and README files...');

    const guides = [];

    for (const repo of repositories) {
      try {
        console.log(`   Processing ${repo.name}...`);

        // Fetch META.json first
        const metadata = await this.fetchMetadata(repo.name);
        if (!metadata) {
          console.log(`   ⚠️  No META.json for ${repo.name}, skipping...`);
          continue;
        }

        const readme = await this.fetchReadme(repo.name);
        if (!readme) {
          console.log(`   ⚠️  No README for ${repo.name}, using META.json only...`);
        }

        const guide = {
          // Basic info
          name: repo.name,
          displayName: metadata.title || this.formatDisplayName(repo.name),
          slug: repo.name,
          description: metadata.description || repo.description || `Installation guide for ${repo.name}`,

          // META.json data (use exact category from META.json)
          category: metadata.category || 'miscellaneous',
          subcategory: metadata.subcategory,
          difficultyLevel: metadata.difficulty_level,
          estimatedSetupTime: metadata.estimated_setup_time,
          supportedOS: metadata.supported_os || [],
          defaultPorts: metadata.default_ports || [],
          installationMethods: metadata.installation_methods || [],
          features: metadata.features || [],
          tags: metadata.tags || [],
          maintenanceStatus: metadata.maintenance_status || 'unknown',
          specVersion: metadata.spec_version || '1.0',
          version: metadata.version || '1.0.0',
          license: metadata.license || 'Unknown',
          websiteUrl: metadata.website_url,
          documentationUrl: metadata.documentation_url,

          // GitHub data
          language: repo.language,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          topics: repo.topics || [],
          githubUrl: repo.html_url,
          updatedAt: repo.updated_at,
          createdAt: repo.created_at,

          // README content (if available)
          readmeRaw: readme || '',
          readmeHtml: readme ? this.processMarkdown(readme) : '',
          readTime: readme ? this.calculateReadTime(readme) : '2 min',
          wordCount: readme ? readme.split(/\s+/).length : 0,
          tableOfContents: readme ? this.generateTableOfContents(readme) : [],

          // Build metadata
          lastBuilt: new Date().toISOString(),
          metadataVersion: metadata.spec_version || '1.0'
        };

        guides.push(guide);

      } catch (error) {
        console.error(`   ❌ Error processing ${repo.name}:`, error.message);
      }
    }

    console.log(`✅ Processed ${guides.length} guides`);
    return guides.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async generateDataFiles(guides) {
    // Create API directory
    const apiDir = path.join(process.cwd(), 'public', 'api', 'v1');
    await fs.mkdir(apiDir, { recursive: true });

    // Discover categories dynamically from META.json with rich metadata
    const discoveredCategories = {};
    const categoryMetadata = {};

    guides.forEach(guide => {
      if (!discoveredCategories[guide.category]) {
        // Generate category display info from the category name
        const categoryDisplay = this.generateCategoryDisplay(guide.category);

        discoveredCategories[guide.category] = {
          name: guide.category.charAt(0).toUpperCase() + guide.category.slice(1).replace(/-/g, ' '),
          description: `${guide.category.charAt(0).toUpperCase() + guide.category.slice(1).replace(/-/g, ' ')} tools and applications`,
          guides: [],
          ...categoryDisplay
        };

        // Build category metadata from all guides in this category
        categoryMetadata[guide.category] = {
          totalGuides: 0,
          languages: new Set(),
          difficultyLevels: new Set(),
          features: new Set(),
          avgStars: 0,
          totalStars: 0,
          supportedOS: new Set(),
          maintenanceStatuses: new Set()
        };
      }

      discoveredCategories[guide.category].guides.push(guide);

      // Collect metadata
      const meta = categoryMetadata[guide.category];
      meta.totalGuides++;
      if (guide.language) meta.languages.add(guide.language);
      if (guide.difficultyLevel) meta.difficultyLevels.add(guide.difficultyLevel);
      if (guide.features) guide.features.forEach(f => meta.features.add(f));
      if (guide.supportedOS) guide.supportedOS.forEach(os => meta.supportedOS.add(os));
      if (guide.maintenanceStatus) meta.maintenanceStatuses.add(guide.maintenanceStatus);
      meta.totalStars += guide.stars || 0;
    });

    // Calculate averages and convert sets to arrays
    Object.keys(categoryMetadata).forEach(categoryKey => {
      const meta = categoryMetadata[categoryKey];
      meta.avgStars = meta.totalGuides > 0 ? Math.round(meta.totalStars / meta.totalGuides) : 0;
      meta.languages = Array.from(meta.languages).sort();
      meta.difficultyLevels = Array.from(meta.difficultyLevels).sort();
      meta.features = Array.from(meta.features).sort();
      meta.supportedOS = Array.from(meta.supportedOS).sort();
      meta.maintenanceStatuses = Array.from(meta.maintenanceStatuses).sort();

      // Add metadata to category
      discoveredCategories[categoryKey].metadata = meta;
    });

    const data = {
      metadata: {
        totalGuides: guides.length,
        lastUpdated: new Date().toISOString(),
        buildTrigger: process.env.GITHUB_EVENT_NAME || 'manual',
        categories: Object.keys(discoveredCategories).sort(),
        categoriesWithMetadata: discoveredCategories
      },
      guides
    };

    // Generate main data file for Next.js
    await fs.writeFile(
      path.join(this.dataDir, 'guides.json'),
      JSON.stringify(data, null, 2),
      'utf8'
    );

    // Generate static API files
    await this.generateStaticAPI(guides, discoveredCategories, apiDir);

    console.log('✅ Generated data files and static API');
  }

  async generateStaticAPI(guides, categories, apiDir) {
    // 1. Generate main API overview (/api/v1/index.json)
    const apiOverview = {
      api: {
        name: 'HowToMgr API',
        version: '1.0',
        description: 'Installation guides and tutorials API',
        base_url: 'https://howtomgr.github.io/api/v1',
        documentation: 'https://howtomgr.github.io/api/docs'
      },
      meta: {
        total_guides: guides.length,
        total_categories: Object.keys(categories).length,
        last_updated: new Date().toISOString()
      },
      categories: Object.entries(categories).map(([key, category]) => ({
        name: key,
        display_name: category.name,
        count: category.guides.length,
        url: `https://howtomgr.github.io/${key}/`,
        api_url: `https://howtomgr.github.io/api/v1/${key}.json`
      })),
      endpoints: {
        overview: '/api/v1/index.json',
        categories: Object.keys(categories).map(cat => `/api/v1/${cat}.json`),
        tools: guides.map(guide => `/api/v1/${guide.category}/${guide.slug}.json`)
      }
    };

    await fs.writeFile(
      path.join(apiDir, 'index.json'),
      JSON.stringify(apiOverview, null, 2),
      'utf8'
    );

    // 2. Generate category API files (/api/v1/{category}.json)
    for (const [categoryKey, category] of Object.entries(categories)) {
      const categoryAPI = {
        category: {
          name: categoryKey,
          display_name: category.name,
          total_guides: category.guides.length
        },
        meta: {
          generated_at: new Date().toISOString(),
          api_version: '1.0'
        },
        guides: category.guides.map(guide => ({
          name: guide.name,
          title: guide.displayName,
          description: guide.description,
          difficulty_level: guide.difficultyLevel,
          estimated_setup_time: guide.estimatedSetupTime,
          language: guide.language,
          stars: guide.stars || 0,
          maintenance_status: guide.maintenanceStatus,
          supported_os: guide.supportedOS || [],
          features: guide.features || [],
          tags: guide.tags || [],
          site: `https://howtomgr.github.io/${guide.category}/${guide.slug}/`,
          api: `https://howtomgr.github.io/api/v1/${guide.category}/${guide.slug}.json`,
          github: guide.githubUrl
        }))
      };

      await fs.writeFile(
        path.join(apiDir, `${categoryKey}.json`),
        JSON.stringify(categoryAPI, null, 2),
        'utf8'
      );
    }

    // 3. Generate individual tool API files (/api/v1/{category}/{tool}.json)
    for (const guide of guides) {
      const categoryDir = path.join(apiDir, guide.category);
      await fs.mkdir(categoryDir, { recursive: true });

      const toolAPI = {
        meta: {
          api_version: '1.0',
          generated_at: new Date().toISOString(),
          spec_version: guide.specVersion || '2.0'
        },
        tool: {
          name: guide.name,
          title: guide.displayName,
          description: guide.description,
          version: guide.version || '1.0.0',
          license: guide.license || 'Unknown',
          category: guide.category,
          subcategory: guide.subcategory,
          difficulty_level: guide.difficultyLevel,
          estimated_setup_time: guide.estimatedSetupTime,
          installation_methods: guide.installationMethods || [],
          supported_os: guide.supportedOS || [],
          default_ports: guide.defaultPorts || [],
          features: guide.features || [],
          tags: guide.tags || [],
          maintenance_status: guide.maintenanceStatus || 'unknown',
          site: `https://howtomgr.github.io/${guide.category}/${guide.slug}/`,
          api: `https://howtomgr.github.io/api/v1/${guide.category}/${guide.slug}.json`,
          documentation_url: guide.documentationUrl,
          website_url: guide.websiteUrl,
          github_url: guide.githubUrl,
          github_stats: {
            stars: guide.stars || 0,
            forks: guide.forks || 0,
            language: guide.language,
            topics: guide.topics || [],
            last_updated: guide.updatedAt,
            created: guide.createdAt
          },
          guide_info: {
            word_count: guide.wordCount || 0,
            estimated_read_time: guide.readTime || '2 min',
            has_readme: !!(guide.readmeRaw && guide.readmeRaw.length > 0),
            last_built: guide.lastBuilt
          }
        }
      };

      await fs.writeFile(
        path.join(categoryDir, `${guide.slug}.json`),
        JSON.stringify(toolAPI, null, 2),
        'utf8'
      );
    }

    console.log(`Generated static API files for ${guides.length} guides across ${Object.keys(categories).length} categories`);
  }

  processMarkdown(markdown) {
    if (!markdown) return '';

    const lines = markdown.split('\n');
    const result = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines = [];
    let skipFirstH1 = true; // Skip first H1 to avoid duplicate title

    for (const line of lines) {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          const code = codeLines.join('\n');
          result.push(this.createMobileCodeBlock(code, codeLanguage));
          inCodeBlock = false;
          codeLanguage = '';
          codeLines = [];
        } else {
          // Start code block
          codeLanguage = line.substring(3).trim() || 'text';
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Skip first H1 to avoid duplicate with META.json title
      if (skipFirstH1 && line.startsWith('# ')) {
        skipFirstH1 = false;
        continue;
      }

      result.push(this.processMarkdownLine(line));
    }

    return result.filter(line => line.trim()).join('\n');
  }

  createMobileCodeBlock(code, language) {
    const escapedCode = this.escapeHtml(code);
    return `<div class="mobile-code-block" data-language="${language}">
      <div class="mobile-code-header">
        <span class="mobile-code-language">${language}</span>
        <button class="mobile-copy-button" onclick="copyCode(this)" title="Copy code">
          <span class="copy-icon">📋</span>
          <span class="copy-text">Copy</span>
        </button>
      </div>
      <div class="mobile-code-content">
        <pre><code class="language-${language}">${escapedCode}</code></pre>
      </div>
    </div>`;
  }

  processMarkdownLine(line) {
    // Headers with proper anchor links for TOC
    if (line.startsWith('### ')) {
      const text = line.substring(4).trim();
      const id = this.createProperAnchorId(text);
      return `<h3 id="${id}" class="mobile-header">${text}</h3>`;
    }
    if (line.startsWith('## ')) {
      const text = line.substring(3).trim();
      const id = this.createProperAnchorId(text);
      return `<h2 id="${id}" class="mobile-header">${text}</h2>`;
    }
    if (line.startsWith('# ')) {
      const text = line.substring(2).trim();
      const id = this.createProperAnchorId(text);
      return `<h1 id="${id}" class="mobile-header">${text}</h1>`;
    }

    // Lists
    if (line.match(/^\s*[-*]\s+/)) {
      const content = line.replace(/^\s*[-*]\s+/, '');
      return `<li class="mobile-list-item">${this.processInline(content)}</li>`;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      const content = line.substring(2);
      return `<blockquote class="mobile-blockquote">${this.processInline(content)}</blockquote>`;
    }

    // Empty lines
    if (line.trim() === '') {
      return '';
    }

    // Regular paragraphs
    return `<p class="mobile-paragraph">${this.processInline(line)}</p>`;
  }

  processInline(text) {
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="mobile-inline-code">$1</code>');

    // Bold and italic
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="mobile-link">$1</a>');

    return text;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  createProperAnchorId(text) {
    // Create GitHub-style anchor IDs for proper TOC linking
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, hyphens
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
  }

  createId(text) {
    return this.createProperAnchorId(text);
  }

  generateTableOfContents(markdown) {
    if (!markdown) return [];

    const lines = markdown.split('\n');
    const toc = [];
    let skipFirstH1 = true;

    for (const line of lines) {
      // Skip code blocks
      if (line.startsWith('```')) continue;

      // Extract headers
      if (line.startsWith('### ')) {
        const text = line.substring(4).trim();
        const id = this.createProperAnchorId(text);
        toc.push({ level: 3, text, id });
      } else if (line.startsWith('## ')) {
        const text = line.substring(3).trim();
        const id = this.createProperAnchorId(text);
        toc.push({ level: 2, text, id });
      } else if (line.startsWith('# ')) {
        const text = line.substring(2).trim();
        if (skipFirstH1) {
          skipFirstH1 = false;
          continue; // Skip first H1 since it duplicates META.json title
        }
        const id = this.createProperAnchorId(text);
        toc.push({ level: 1, text, id });
      }
    }

    return toc;
  }



  generateCategoryDisplay(categoryName) {
    // Generate icon based on category name keywords
    const name = categoryName.toLowerCase();

    let icon = '🔧'; // default
    let color = '#6272a4'; // default Dracula color

    // Smart icon assignment based on category name
    if (name.includes('web') || name.includes('server') || name.includes('dns')) {
      icon = '🌐'; color = '#50fa7b';
    } else if (name.includes('database') || name.includes('storage') || name.includes('data')) {
      icon = '🗄️'; color = '#8be9fd';
    } else if (name.includes('container') || name.includes('orchestration')) {
      icon = '📦'; color = '#bd93f9';
    } else if (name.includes('security') || name.includes('auth') || name.includes('intrusion') || name.includes('vulnerability')) {
      icon = '🔒'; color = '#ff5555';
    } else if (name.includes('monitor') || name.includes('logging') || name.includes('tracing') || name.includes('alert')) {
      icon = '📊'; color = '#ffb86c';
    } else if (name.includes('communication') || name.includes('chat') || name.includes('video') || name.includes('mail') || name.includes('xmpp') || name.includes('matrix')) {
      icon = '💬'; color = '#f1fa8c';
    } else if (name.includes('media') || name.includes('streaming') || name.includes('music')) {
      icon = '🎬'; color = '#6272a4';
    } else if (name.includes('cms') || name.includes('documentation') || name.includes('education') || name.includes('business')) {
      icon = '📝'; color = '#ff79c6';
    } else if (name.includes('ci') || name.includes('git') || name.includes('infrastructure') || name.includes('configuration')) {
      icon = '🏗️'; color = '#44475a';
    } else if (name.includes('development') || name.includes('workflow') || name.includes('task') || name.includes('queue')) {
      icon = '💻'; color = '#8be9fd';
    }

    return { icon, color };
  }

  formatDisplayName(repoName) {
    const specialCases = {
      'nginx': 'NGINX',
      'mysql': 'MySQL',
      'postgresql': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'redis': 'Redis',
      'nodejs': 'Node.js',
      'pihole': 'Pi-hole'
    };

    return specialCases[repoName] ||
           repoName.split('-').map(word =>
             word.charAt(0).toUpperCase() + word.slice(1)
           ).join(' ');
  }

  calculateReadTime(text) {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes === 1 ? '1 min' : `${minutes} min`;
  }

  async makeGitHubRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: endpoint,
        method: 'GET',
        headers: {
          'User-Agent': 'HowToMgr-NextJS/3.0',
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`GitHub API error: ${res.statusCode} - ${json.message}`));
            } else {
              resolve(json);
            }
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async fetchMetadata(repoName) {
    try {
      const metaFile = await this.makeGitHubRequest(`/repos/${this.orgName}/${repoName}/contents/META.json`);

      if (metaFile.content) {
        const content = Buffer.from(metaFile.content, 'base64').toString('utf-8');
        return JSON.parse(content);
      }

      return null;
    } catch (error) {
      console.warn(`Could not fetch META.json for ${repoName}: ${error.message}`);
      return null;
    }
  }

  async fetchReadme(repoName) {
    try {
      const readme = await this.makeGitHubRequest(`/repos/${this.orgName}/${repoName}/readme`);

      if (readme.content) {
        return Buffer.from(readme.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (error) {
      console.warn(`Could not fetch README for ${repoName}: ${error.message}`);
      return null;
    }
  }
}

// Run the fetcher
if (require.main === module) {
  const fetcher = new GitHubDataFetcher();
  fetcher.build().catch(console.error);
}

module.exports = GitHubDataFetcher;