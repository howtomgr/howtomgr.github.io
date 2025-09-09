/**
 * HowToMgr Main Application
 * Handles UI interactions, data management, and user experience
 */

class HowToMgrApp {
    constructor() {
        this.gitHubAPI = new GitHubAPI();
        this.repositories = [];
        this.filteredRepositories = [];
        this.currentPage = 1;
        this.itemsPerPage = 24;
        this.currentSort = 'updated';
        this.currentCategory = '';
        this.currentView = 'grid';
        this.searchTerm = '';
        this.isLoading = false;
        
        this.elements = {};
        this.initializeElements();
        this.bindEvents();
        this.initializeTheme();
        this.loadData();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            // Header elements
            searchInput: document.getElementById('search-input'),
            themeToggle: document.getElementById('theme-toggle'),
            currentThemeSpan: document.getElementById('current-theme'),
            
            // Stats elements
            repoCount: document.getElementById('repo-count'),
            totalStars: document.getElementById('total-stars'),
            
            // Controls
            categoryFilter: document.getElementById('category-filter'),
            sortSelect: document.getElementById('sort-select'),
            gridViewBtn: document.getElementById('grid-view'),
            listViewBtn: document.getElementById('list-view'),
            clearFilters: document.getElementById('clear-filters'),
            
            // Content areas
            loadingState: document.getElementById('loading-state'),
            repositoryGrid: document.getElementById('repository-grid'),
            emptyState: document.getElementById('empty-state'),
            
            // Pagination
            paginationNav: document.getElementById('pagination-nav'),
            prevPageBtn: document.getElementById('prev-page'),
            nextPageBtn: document.getElementById('next-page'),
            paginationPages: document.getElementById('pagination-pages'),
            currentPageSpan: document.getElementById('current-page'),
            totalPagesSpan: document.getElementById('total-pages'),
            showingCountSpan: document.getElementById('showing-count'),
            totalCountSpan: document.getElementById('total-count')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.currentPage = 1;
                this.filterAndRender();
            }, 300));
        }

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Filters and sorting
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.currentPage = 1;
                this.filterAndRender();
            });
        }

        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.filterAndRender();
            });
        }

        // View toggles
        if (this.elements.gridViewBtn) {
            this.elements.gridViewBtn.addEventListener('click', () => {
                this.setView('grid');
            });
        }

        if (this.elements.listViewBtn) {
            this.elements.listViewBtn.addEventListener('click', () => {
                this.setView('list');
            });
        }

        // Clear filters
        if (this.elements.clearFilters) {
            this.elements.clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Pagination
        if (this.elements.prevPageBtn) {
            this.elements.prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderRepositories();
                    this.scrollToSection();
                }
            });
        }

        if (this.elements.nextPageBtn) {
            this.elements.nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredRepositories.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderRepositories();
                    this.scrollToSection();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Focus search with '/'
            if (e.key === '/' && !this.isInputFocused()) {
                e.preventDefault();
                this.elements.searchInput?.focus();
            }
            
            // Toggle theme with 't'
            if (e.key === 't' && !this.isInputFocused()) {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Clear search with Escape
            if (e.key === 'Escape' && this.elements.searchInput === document.activeElement) {
                this.elements.searchInput.value = '';
                this.searchTerm = '';
                this.filterAndRender();
                this.elements.searchInput.blur();
            }
        });

        // Handle URL hash changes for deep linking
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    }

    /**
     * Check if an input element is currently focused
     * @returns {boolean}
     */
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT' || activeElement.tagName === 'TEXTAREA');
    }

    /**
     * Initialize theme system
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem('howtomgr-theme') || 'dark';
        this.setTheme(savedTheme);
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Set theme and update UI
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('howtomgr-theme', theme);
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
        }
        
        if (this.elements.currentThemeSpan) {
            this.elements.currentThemeSpan.textContent = theme;
        }
    }

    /**
     * Load repository data
     */
    async loadData() {
        try {
            this.showLoading(true);
            
            // Load repositories from GitHub API
            this.repositories = await this.gitHubAPI.fetchAllRepositories();
            this.filteredRepositories = [...this.repositories];
            
            // Update stats
            this.updateStats();
            
            // Initial render
            this.filterAndRender();
            
            // Handle initial hash if present
            this.handleHashChange();
            
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showError('Failed to load installation guides. Please try again later.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Show or hide loading state
     * @param {boolean} loading - Whether to show loading
     */
    showLoading(loading) {
        this.isLoading = loading;
        
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = loading ? 'flex' : 'none';
        }
        
        if (this.elements.repositoryGrid) {
            this.elements.repositoryGrid.style.display = loading ? 'none' : 'grid';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'block';
            this.elements.emptyState.innerHTML = `
                <div class="empty-content">
                    <h3>⚠️ Error Loading Guides</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Update statistics display
     */
    updateStats() {
        if (this.elements.repoCount) {
            this.elements.repoCount.textContent = this.repositories.length;
        }
        
        if (this.elements.totalStars) {
            const totalStars = this.repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
            this.elements.totalStars.textContent = totalStars;
        }
    }

    /**
     * Filter repositories and trigger re-render
     */
    filterAndRender() {
        this.applyFilters();
        this.applySorting();
        this.renderRepositories();
        this.updateURL();
    }

    /**
     * Apply search and category filters
     */
    applyFilters() {
        this.filteredRepositories = this.repositories.filter(repo => {
            // Search filter
            const matchesSearch = !this.searchTerm || 
                repo.name.toLowerCase().includes(this.searchTerm) ||
                repo.display_name.toLowerCase().includes(this.searchTerm) ||
                repo.description.toLowerCase().includes(this.searchTerm) ||
                repo.topics.some(topic => topic.toLowerCase().includes(this.searchTerm));

            // Category filter
            const matchesCategory = !this.currentCategory || repo.category === this.currentCategory;

            return matchesSearch && matchesCategory;
        });

        // Update counts
        if (this.elements.showingCountSpan) {
            this.elements.showingCountSpan.textContent = this.filteredRepositories.length;
        }
        
        if (this.elements.totalCountSpan) {
            this.elements.totalCountSpan.textContent = this.repositories.length;
        }
    }

    /**
     * Apply sorting to filtered repositories
     */
    applySorting() {
        this.filteredRepositories.sort((a, b) => {
            switch (this.currentSort) {
                case 'name':
                    return a.display_name.localeCompare(b.display_name);
                case 'stars':
                    return (b.stargazers_count || 0) - (a.stargazers_count || 0);
                case 'created':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'activity':
                    return (b.activity_score || 0) - (a.activity_score || 0);
                case 'updated':
                default:
                    return new Date(b.updated_at) - new Date(a.updated_at);
            }
        });
    }

    /**
     * Render repositories with pagination
     */
    renderRepositories() {
        if (!this.elements.repositoryGrid) return;

        const totalPages = Math.ceil(this.filteredRepositories.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredRepositories.length);
        const pageRepositories = this.filteredRepositories.slice(startIndex, endIndex);

        // Show/hide sections based on data
        if (this.filteredRepositories.length === 0) {
            this.elements.repositoryGrid.style.display = 'none';
            this.elements.emptyState.style.display = 'block';
            this.elements.paginationNav.style.display = 'none';
        } else {
            this.elements.repositoryGrid.style.display = this.currentView === 'grid' ? 'grid' : 'flex';
            this.elements.repositoryGrid.className = `repository-grid ${this.currentView === 'list' ? 'list-view' : ''}`;
            this.elements.emptyState.style.display = 'none';
            this.elements.paginationNav.style.display = totalPages > 1 ? 'flex' : 'none';
        }

        // Render repository cards
        this.elements.repositoryGrid.innerHTML = pageRepositories.map(repo => 
            this.renderRepositoryCard(repo)
        ).join('');

        // Update pagination
        this.updatePagination(totalPages);

        // Announce to screen readers
        this.announceResults();
    }

    /**
     * Render individual repository card
     * @param {Object} repo - Repository data
     * @returns {string} HTML string for repository card
     */
    renderRepositoryCard(repo) {
        const starsDisplay = repo.stargazers_count > 0 ? `
            <span class="badge badge-info" title="${repo.stargazers_count} stars">
                ⭐ ${repo.stargazers_count}
            </span>
        ` : '';

        const complexityColor = {
            'Beginner': 'badge-secondary',
            'Intermediate': 'badge-primary', 
            'Advanced': 'badge-warning'
        };

        const topicsHtml = repo.topics && repo.topics.length > 0 ? `
            <div class="card-topics">
                ${repo.topics.slice(0, 4).map(topic => 
                    `<span class="topic-tag">${topic}</span>`
                ).join('')}
                ${repo.topics.length > 4 ? `<span class="topic-tag">+${repo.topics.length - 4} more</span>` : ''}
            </div>
        ` : '';

        return `
            <article class="repository-card ${this.currentView === 'list' ? 'list-view' : ''}" 
                     data-category="${repo.category}"
                     data-name="${repo.name.toLowerCase()}"
                     itemscope itemtype="https://schema.org/SoftwareApplication">
                
                <div class="card-content">
                    <header class="card-header">
                        <h3 class="card-title">
                            <a href="${repo.html_url}" 
                               target="_blank" 
                               rel="noopener"
                               itemprop="url"
                               aria-label="View ${repo.display_name} installation guide on GitHub">
                                <span itemprop="name">${repo.display_name}</span>
                            </a>
                        </h3>
                        <p class="card-description" itemprop="description">
                            ${repo.description}
                        </p>
                    </header>

                    <div class="card-meta">
                        ${repo.language ? `<span class="badge badge-primary" itemprop="programmingLanguage">${repo.language}</span>` : ''}
                        <span class="badge ${complexityColor[repo.complexity] || 'badge-muted'}">${repo.complexity}</span>
                        <span class="badge badge-muted" title="Last updated: ${new Date(repo.updated_at).toLocaleString()}">
                            ${repo.display_date}
                        </span>
                        ${starsDisplay}
                    </div>

                    ${topicsHtml}
                </div>

                <footer class="card-actions">
                    <a href="${repo.html_url}" 
                       target="_blank" 
                       rel="noopener"
                       class="btn btn-primary"
                       aria-label="View ${repo.display_name} installation guide">
                        📖 View Guide
                    </a>
                    
                    <a href="${repo.html_url}/issues" 
                       target="_blank" 
                       rel="noopener"
                       class="btn btn-ghost"
                       aria-label="Report issue for ${repo.display_name}">
                        🐛 Issues
                    </a>
                </footer>
            </article>
        `;
    }

    /**
     * Update pagination controls
     * @param {number} totalPages - Total number of pages
     */
    updatePagination(totalPages) {
        if (!this.elements.paginationNav || totalPages <= 1) return;

        // Update navigation buttons
        if (this.elements.prevPageBtn) {
            this.elements.prevPageBtn.disabled = this.currentPage <= 1;
        }
        
        if (this.elements.nextPageBtn) {
            this.elements.nextPageBtn.disabled = this.currentPage >= totalPages;
        }

        // Update page numbers
        if (this.elements.paginationPages) {
            this.elements.paginationPages.innerHTML = this.generatePageNumbers(totalPages);
        }

        // Update page info
        if (this.elements.currentPageSpan) {
            this.elements.currentPageSpan.textContent = this.currentPage;
        }
        
        if (this.elements.totalPagesSpan) {
            this.elements.totalPagesSpan.textContent = totalPages;
        }
    }

    /**
     * Generate page number buttons
     * @param {number} totalPages - Total number of pages
     * @returns {string} HTML for page numbers
     */
    generatePageNumbers(totalPages) {
        const pages = [];
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        // Adjust start if we're near the end
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}"
                        data-page="${i}"
                        aria-label="Go to page ${i}"
                        ${i === this.currentPage ? 'aria-current="page"' : ''}>
                    ${i}
                </button>
            `);
        }

        // Add click listeners after render
        setTimeout(() => {
            document.querySelectorAll('.page-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const page = parseInt(e.target.dataset.page);
                    if (page && page !== this.currentPage) {
                        this.currentPage = page;
                        this.renderRepositories();
                        this.scrollToSection();
                    }
                });
            });
        }, 0);

        return pages.join('');
    }

    /**
     * Set view mode (grid or list)
     * @param {string} view - View mode ('grid' or 'list')
     */
    setView(view) {
        this.currentView = view;
        
        // Update button states
        if (this.elements.gridViewBtn && this.elements.listViewBtn) {
            this.elements.gridViewBtn.classList.toggle('active', view === 'grid');
            this.elements.listViewBtn.classList.toggle('active', view === 'list');
            
            this.elements.gridViewBtn.setAttribute('aria-pressed', view === 'grid');
            this.elements.listViewBtn.setAttribute('aria-pressed', view === 'list');
        }
        
        // Re-render with new view
        this.renderRepositories();
        
        // Save preference
        localStorage.setItem('howtomgr-view', view);
    }

    /**
     * Clear all filters and reset state
     */
    clearAllFilters() {
        this.searchTerm = '';
        this.currentCategory = '';
        this.currentPage = 1;
        
        // Reset form controls
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.value = '';
        }
        
        // Re-filter and render
        this.filterAndRender();
    }

    /**
     * Handle URL hash changes for deep linking
     */
    handleHashChange() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const search = params.get('search');
        const category = params.get('category');
        const page = params.get('page');
        
        if (search && search !== this.searchTerm) {
            this.searchTerm = search;
            if (this.elements.searchInput) {
                this.elements.searchInput.value = search;
            }
        }
        
        if (category && category !== this.currentCategory) {
            this.currentCategory = category;
            if (this.elements.categoryFilter) {
                this.elements.categoryFilter.value = category;
            }
        }
        
        if (page && parseInt(page) !== this.currentPage) {
            this.currentPage = parseInt(page);
        }
        
        this.filterAndRender();
    }

    /**
     * Update URL with current state for deep linking
     */
    updateURL() {
        const params = new URLSearchParams();
        
        if (this.searchTerm) params.set('search', this.searchTerm);
        if (this.currentCategory) params.set('category', this.currentCategory);
        if (this.currentPage > 1) params.set('page', this.currentPage.toString());
        
        const hash = params.toString();
        const newURL = hash ? `${window.location.pathname}#${hash}` : window.location.pathname;
        
        // Update URL without triggering hashchange event
        history.replaceState(null, '', newURL);
    }

    /**
     * Scroll to guides section
     */
    scrollToSection() {
        const guidesSection = document.getElementById('guides');
        if (guidesSection) {
            guidesSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Announce results to screen readers
     */
    announceResults() {
        const count = this.filteredRepositories.length;
        const message = this.searchTerm || this.currentCategory
            ? `${count} guides found`
            : `Showing ${count} installation guides`;
            
        // Create temporary announcement element
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Debounce utility function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HowToMgrApp();
    
    // Add global error handling
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        
        // Show user-friendly error message
        if (window.app && window.app.elements.emptyState) {
            window.app.showError('Something went wrong. Please refresh the page.');
        }
    });
    
    // Add unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        e.preventDefault();
        
        // Show user-friendly error message
        if (window.app && window.app.elements.emptyState) {
            window.app.showError('Failed to load data. Please check your internet connection and try again.');
        }
    });
});

// Expose app for debugging in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.HowToMgrApp = HowToMgrApp;
    console.log('HowToMgr App initialized in development mode');
}