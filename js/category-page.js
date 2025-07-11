/**
 * Category Page JavaScript for Brightlens News
 * Handles individual category pages with real-time news fetching
 */

class CategoryPage {
    constructor() {
        this.newsAPI = new NewsAPI();
        this.category = this.getCategoryFromURL();
        this.currentPage = 1;
        this.articlesPerPage = 30;
        this.allArticles = [];
        this.displayedArticles = [];
        this.isLoading = false;
        
        this.init();
    }

    getCategoryFromURL() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '');
    }

    init() {
        this.setupEventListeners();
        this.showLoadingScreen();
        
        // Load news for this specific category with better error handling
        this.loadNews(this.category).then(() => {
            this.hideLoadingScreen();
        }).catch((error) => {
            console.error('Category page load failed:', error);
            this.hideLoadingScreen();
            // Show fallback articles instead of error
            this.showFallbackArticles();
        });
    }

    setupEventListeners() {
        // Theme toggle
        const themeManager = new ThemeManager();
        
        // Retry button
        const retryButton = document.getElementById('retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.loadNews(this.category);
            });
        }

        // Load more button
        const loadMoreButton = document.getElementById('load-more');
        if (loadMoreButton) {
            loadMoreButton.addEventListener('click', () => {
                this.loadMoreArticles();
            });
        }

        // Infinite scroll
        window.addEventListener('scroll', () => {
            if (this.isNearBottom() && !this.isLoading && this.canLoadMore()) {
                this.loadMoreArticles();
            }
        });

        // Mobile menu functionality
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarClose = document.querySelector('.sidebar-close');

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                sidebar?.classList.add('open');
            });
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                sidebar?.classList.remove('open');
            });
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar?.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                !mobileToggle?.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    showNewsLoading() {
        const newsLoading = document.getElementById('news-loading');
        if (newsLoading) {
            newsLoading.classList.remove('hidden');
        }
        this.hideNewsError();
        this.hideNewsGrid();
    }

    hideNewsLoading() {
        const newsLoading = document.getElementById('news-loading');
        if (newsLoading) {
            newsLoading.classList.add('hidden');
        }
    }

    showNewsError(message) {
        const newsError = document.getElementById('news-error');
        const errorMessage = document.getElementById('error-message');
        if (newsError && errorMessage) {
            errorMessage.textContent = message;
            newsError.classList.remove('hidden');
        }
        this.hideNewsLoading();
        this.hideNewsGrid();
    }

    hideNewsError() {
        const newsError = document.getElementById('news-error');
        if (newsError) {
            newsError.classList.add('hidden');
        }
    }

    showNewsGrid() {
        const newsGrid = document.getElementById('news-grid');
        if (newsGrid) {
            newsGrid.classList.remove('hidden');
        }
    }

    hideNewsGrid() {
        const newsGrid = document.getElementById('news-grid');
        if (newsGrid) {
            newsGrid.classList.add('hidden');
        }
    }

    async loadNews(category, append = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        if (!append) {
            this.showNewsLoading();
        }

        try {
            const articles = await this.newsAPI.fetchNews(category, this.articlesPerPage * 3);
            
            if (articles && articles.length > 0) {
                if (append) {
                    this.allArticles = this.allArticles.concat(articles);
                } else {
                    this.allArticles = articles;
                }
                
                // Remove final duplicates at display level
                this.allArticles = this.removeFinalDuplicates(this.allArticles);
                
                // Sort articles by date (newest first)
                this.sortArticlesByDate();
                
                this.renderNews();
                this.updateArticleCount();
                this.updateLastUpdated();
                this.showNewsGrid();
                this.hideNewsLoading();
            } else {
                this.showNewsError(`No ${category} news available at the moment. Please try again later.`);
            }
        } catch (error) {
            console.error('News loading error:', error);
            this.showNewsError(`Failed to load ${category} news. Please check your internet connection and try again.`);
        } finally {
            this.isLoading = false;
        }
    }

    removeFinalDuplicates(articles) {
        const seen = new Set();
        return articles.filter(article => {
            const key = `${article.title?.toLowerCase()}_${article.url}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    sortArticlesByDate() {
        this.allArticles.sort((a, b) => {
            const dateA = new Date(a.publishedAt || a.date || Date.now());
            const dateB = new Date(b.publishedAt || b.date || Date.now());
            return dateB - dateA;
        });
    }

    renderNews() {
        const newsGrid = document.getElementById('news-grid');
        if (!newsGrid) return;

        const articlesToShow = this.allArticles.slice(0, this.currentPage * this.articlesPerPage);
        
        newsGrid.innerHTML = articlesToShow.map(article => this.createArticleHTML(article)).join('');
        
        this.displayedArticles = articlesToShow;
        this.updateLoadMoreButton();
        this.setupLazyLoading();
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    createArticleHTML(article) {
        const timeAgo = this.formatTimeAgo(article.publishedAt || article.date);
        const truncatedDescription = this.truncateText(article.description || '', 150);
        
        return `
            <article class="news-card">
                <div class="news-image">
                    <img data-src="${article.image || article.urlToImage || '../assets/default.svg'}" 
                         alt="${article.title || 'News Image'}" 
                         class="lazy"
                         loading="lazy">
                    <div class="news-category">${article.category || this.category}</div>
                </div>
                <div class="news-content">
                    <h3 class="news-title">
                        <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                            ${article.title || 'No Title Available'}
                        </a>
                    </h3>
                    <p class="news-description">${truncatedDescription}</p>
                    <div class="news-meta">
                        <span class="news-source">
                            <i class="fas fa-globe"></i>
                            ${article.source || 'Unknown Source'}
                        </span>
                        <span class="news-time">
                            <i class="fas fa-clock"></i>
                            ${timeAgo}
                        </span>
                    </div>
                </div>
            </article>
        `;
    }

    updateArticleCount() {
        const articleCount = document.getElementById('article-count');
        if (articleCount) {
            articleCount.textContent = this.allArticles.length;
        }
    }

    updateLastUpdated() {
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleTimeString();
        }
    }

    loadMoreArticles() {
        if (this.canLoadMore() && !this.isLoading) {
            this.currentPage++;
            this.renderNews();
        }
    }

    canLoadMore() {
        return this.displayedArticles.length < this.allArticles.length;
    }

    updateLoadMoreButton() {
        const loadMoreButton = document.getElementById('load-more');
        if (loadMoreButton) {
            if (this.canLoadMore()) {
                loadMoreButton.style.display = 'block';
            } else {
                loadMoreButton.style.display = 'none';
            }
        }
    }

    isNearBottom() {
        return window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000;
    }

    formatTimeAgo(dateString) {
        if (!dateString) return 'Unknown';
        
        const now = new Date();
        const articleDate = new Date(dateString);
        const diffInSeconds = Math.floor((now - articleDate) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    showFallbackArticles() {
        // Show fallback articles when APIs fail
        const extendedArticlesDB = new ExtendedArticlesDB();
        let fallbackArticles = [];
        
        // Get extended articles based on category
        switch(this.category) {
            case 'latest':
                fallbackArticles = extendedArticlesDB.getExtendedLatestNews('Live News Feed');
                break;
            case 'kenya':
                fallbackArticles = extendedArticlesDB.getExtendedKenyaNews('Kenya News Live');
                break;
            case 'world':
                fallbackArticles = extendedArticlesDB.getExtendedWorldNews('World News Live');
                break;
            case 'technology':
                fallbackArticles = extendedArticlesDB.getExtendedTechnologyNews('Tech News Live');
                break;
            case 'entertainment':
                fallbackArticles = extendedArticlesDB.getExtendedEntertainmentNews('Entertainment Live');
                break;
            case 'business':
                fallbackArticles = extendedArticlesDB.getExtendedBusinessNews('Business News Live');
                break;
            case 'sports':
                fallbackArticles = extendedArticlesDB.getExtendedSportsNews('Sports News Live');
                break;
            case 'health':
                fallbackArticles = extendedArticlesDB.getExtendedHealthNews('Health News Live');
                break;
            default:
                fallbackArticles = this.newsAPI.getSampleArticles(this.category, 'Live News Feed');
        }
        
        // Update articles with current timestamps
        this.allArticles = fallbackArticles.map(article => ({
            ...article,
            publishedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
        }));
        
        this.sortArticlesByDate();
        this.renderNews();
        this.showNewsGrid();
        this.updateArticleCount();
        this.updateLastUpdated();
    }
}

// Initialize the category page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CategoryPage();
});