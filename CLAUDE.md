# HowToMgr - AI Assistant Documentation

## Project Overview

**HowToMgr** is a Next.js-powered static site that automatically generates installation guide pages from GitHub repositories. The site features a mobile-first design with Dracula theming and comprehensive search functionality.

## Architecture

### **Framework**: Next.js 14 with Static Export
- **Deployment**: GitHub Pages via `gh-pages` branch
- **Build System**: GitHub Actions (twice daily + on push)
- **Styling**: Mobile-first CSS with Dracula color scheme
- **Search**: Multi-algorithm fuzzy search with keyboard navigation

### **URL Structure**
```
/                           → Homepage with categories
/all/                       → All guides with filtering
/search/                    → Advanced search page
/{category}/                → Category listing (e.g., /web-server/)
/{category}/{guide}/        → Individual guide (e.g., /web-server/nginx/)
```

### **Categories**
- `web-server`: NGINX, Apache, HAProxy, Traefik, Caddy
- `database`: PostgreSQL, MySQL, MongoDB, Redis
- `container`: Docker, Kubernetes, K3s, Portainer
- `security`: Vault, Keycloak, Fail2ban, WireGuard
- `monitoring`: Prometheus, Grafana, Nagios, Zabbix
- `communication`: Mattermost, RocketChat, Matrix
- `productivity`: NextCloud, WordPress, Ghost
- `media`: Plex, Jellyfin, Sonarr, Radarr
- `infrastructure`: Ansible, Terraform, GitLab, Jenkins

## File Structure

```
/
├── pages/
│   ├── index.js                     # Homepage
│   ├── all.js                       # All guides page
│   ├── search.js                    # Advanced search
│   ├── [category]/
│   │   ├── index.js                 # Category page
│   │   └── [guide].js               # Individual guide
│   ├── _app.js                      # Global app wrapper
│   ├── _document.js                 # HTML document
│   ├── _error.js                    # Custom error pages
│   └── 404.js                       # 404 page
├── components/
│   ├── Layout.js                    # Main layout with nav/footer
│   ├── SimpleSearch.js              # Search component
│   ├── ErrorBoundary.js             # React error boundary
│   └── LoadingStates.js             # Loading/empty components
├── lib/
│   ├── categories.js                # Category definitions
│   ├── markdown.js                  # Markdown processor
│   ├── search.js                    # Search algorithms
│   └── search-keywords.js           # Search keyword mappings
├── styles/
│   ├── globals.css                  # Global Dracula theme
│   ├── mobile.css                   # Mobile-first components
│   ├── main.css                     # Legacy styles (preserved)
│   └── guide.css                    # Legacy guide styles (preserved)
├── scripts/
│   └── fetch-github-data.js         # GitHub API integration
├── data/                            # Generated at build time
│   ├── guides.json                  # All guide data
│   └── search-index.json            # Search optimization
└── out/                             # Next.js build output
```

## Build Process

### **GitHub Actions Workflow** (`.github/workflows/build.yml`)
1. **Triggers**: Schedule (6 AM & 6 PM UTC), push to main, manual
2. **Loop Prevention**: Ignores commits from `github-actions[bot]`
3. **Data Fetching**: Fetches all repositories from `howtomgr` organization
4. **Content Processing**: Downloads README files, processes markdown
5. **Static Generation**: Next.js build with all routes
6. **Deployment**: Pushes to `gh-pages` branch

### **Excluded Repositories**
- `howtomgr.github.io` (this website)
- `.claude` (Claude assistant files)
- `.github` (GitHub configuration)
- `community` (community files)
- `template` (repository templates)

### **Data Generation Script** (`scripts/fetch-github-data.js`)
- Fetches organization repositories with pagination
- Downloads README content for each repository
- Processes markdown to mobile-optimized HTML
- Auto-categorizes repositories based on name/topics
- Generates search index with keyword aliases

## Search System

### **Search Capabilities**
- **Universal matching**: Works for any search term
- **Keyword aliases**: "kubectl" finds "kubernetes"
- **Typo tolerance**: "nginix" finds "nginx"
- **Multi-field search**: Name, description, topics, README content
- **Fuzzy matching**: Character-based matching for abbreviations

### **Search Components**
- `SimpleSearch.js`: Basic search with dropdown results
- `pages/search.js`: Advanced search with filters
- Keyboard navigation (Arrow keys, Enter, Escape)
- Mobile-optimized touch targets

### **Search Algorithms**
1. **Direct text matching**: Exact substring matches
2. **Word boundary matching**: Start of words
3. **Partial word matching**: Middle of words
4. **Character fuzzy matching**: Handles typos
5. **Levenshtein distance**: Close typo tolerance
6. **Acronym matching**: First letters of words

## Theming

### **Dracula Color Palette**
```css
--bg-primary: #282a36;      /* Dark background */
--bg-secondary: #44475a;    /* Current line */
--bg-surface: #383a59;      /* Selection */
--text-primary: #f8f8f2;    /* Foreground */
--text-secondary: #6272a4;  /* Comment */
--accent-primary: #bd93f9;  /* Purple */
--accent-secondary: #50fa7b; /* Green */
--accent-warning: #ffb86c;  /* Orange */
--accent-error: #ff5555;    /* Red */
--accent-info: #8be9fd;     /* Cyan */
```

### **Mobile-First Design**
- **Breakpoints**: 480px, 768px, 1024px
- **Touch targets**: 44px minimum (iOS guidelines)
- **Typography scales**: Mobile to desktop progression
- **Container widths**: Responsive with padding
- **Safe areas**: Support for notched devices

## Error Handling

### **Comprehensive Error Coverage**
- **React Error Boundaries**: Prevent component crashes
- **Custom error pages**: 404, 500, 403 with search functionality
- **Loading states**: Spinners and skeleton screens
- **Empty states**: When no content available
- **Network errors**: Graceful degradation

### **Error Page Features**
- **Search integration**: Find guides on error pages
- **Helpful suggestions**: Context-specific guidance
- **Category shortcuts**: Quick navigation to popular sections
- **Retry functionality**: For temporary errors

## Development

### **Local Development**
```bash
npm install
npm run build-data    # Fetch GitHub data
npm run dev          # Start development server
```

### **Build Commands**
```bash
npm run build-data   # Fetch repository data
npm run build        # Build Next.js site
npm run build-all    # Full build pipeline
npm run lint         # Code linting
```

### **Environment Variables**
- `GITHUB_TOKEN`: Required for API access (rate limiting)
- `NODE_ENV`: Controls error display and logging

## Common Tasks

### **Adding New Categories**
1. Edit `lib/categories.js`
2. Add category definition with icon, color, keywords
3. Update search keywords in `scripts/fetch-github-data.js`
4. Rebuild site to generate new routes

### **Updating Search**
1. **Simple search**: Edit `components/SimpleSearch.js`
2. **Advanced search**: Edit `pages/search.js`
3. **Keyword mappings**: Edit `lib/search-keywords.js`
4. **Search scoring**: Modify relevance calculation functions

### **Styling Changes**
1. **Global styles**: Edit `styles/globals.css`
2. **Mobile components**: Edit `styles/mobile.css`
3. **Theme variables**: Update CSS custom properties in `:root`
4. **Component styles**: Use styled-jsx in components

### **Content Updates**
- **Automatic**: Site rebuilds twice daily with latest GitHub data
- **Manual**: Trigger GitHub Actions workflow
- **Repository management**: Add/remove repos in GitHub organization

## Performance

### **Optimization Features**
- **Static generation**: All pages pre-rendered
- **Image optimization**: Disabled for GitHub Pages compatibility
- **CSS optimization**: Minified and bundled
- **Search indexing**: Pre-built search data
- **Mobile optimization**: Touch-friendly interactions

### **Caching Strategy**
- **Build-time caching**: Repository data cached during build
- **Browser caching**: Static assets with cache headers
- **Search caching**: Client-side search index

## Monitoring

### **Build Monitoring**
- **GitHub Actions**: Twice daily automated builds
- **Deployment logs**: Available via `gh run view`
- **Error reporting**: Console logs in development

### **Analytics Integration**
- Ready for Google Analytics or similar
- Search analytics tracking built-in
- Error boundary reporting ready

## Security

### **Best Practices**
- **No secrets in code**: Environment variables only
- **Secure markdown processing**: HTML escaping
- **XSS prevention**: Sanitized content rendering
- **HTTPS only**: GitHub Pages forces HTTPS

### **Content Security**
- **Trusted sources**: Only GitHub organization repositories
- **Markdown sanitization**: Prevents injection attacks
- **Link validation**: External links marked appropriately

## Troubleshooting

### **Common Issues**
1. **Build failures**: Check GitHub API rate limits
2. **Search not working**: Verify guides data is loaded
3. **Style issues**: Check CSS variable definitions
4. **Mobile problems**: Test responsive breakpoints

### **Debugging Commands**
```bash
# Check repository data
cat data/guides.json | jq '.metadata'

# View build logs
gh run view --log-failed

# Test search locally
npm run dev
```

### **Emergency Recovery**
- **Rollback**: Revert to previous commit
- **Manual build**: Trigger workflow manually
- **Fallback data**: Site handles missing data gracefully

## Future Enhancements

### **Potential Features**
- **Guide ratings**: User feedback system
- **Installation tracking**: Track successful deployments
- **AI-powered suggestions**: Related guide recommendations
- **Offline support**: PWA with service worker
- **Multi-language**: i18n for different languages

### **Technical Improvements**
- **TypeScript migration**: Better type safety
- **Testing suite**: Unit and integration tests
- **Performance monitoring**: Core Web Vitals tracking
- **A/B testing**: Search algorithm optimization

---

## Quick Reference

### **Key Files to Modify**
- **Homepage**: `pages/index.js`
- **Search**: `components/SimpleSearch.js`
- **Categories**: `lib/categories.js`
- **Styles**: `styles/globals.css`
- **Build**: `scripts/fetch-github-data.js`

### **Important URLs**
- **Live Site**: https://howtomgr.github.io
- **Repository**: https://github.com/howtomgr/howtomgr.github.io
- **Organization**: https://github.com/howtomgr
- **Actions**: https://github.com/howtomgr/howtomgr.github.io/actions

### **Support Commands**
```bash
# Monitor builds
gh run list
gh run view --log-failed

# Test locally
npm run dev

# Manual deployment
gh workflow run "🚀 Build & Deploy Next.js Site"
```

This documentation should help any AI assistant understand and work with the HowToMgr project effectively.