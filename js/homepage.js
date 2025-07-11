/**
 * Homepage JavaScript for Brightlens News
 * Handles homepage functionality and theme management
 */

class Homepage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.initializeThemes();
        this.setupMobileMenu();
    }

    setupEventListeners() {
        // Theme toggle functionality
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.openThemeModal();
            });
        }

        // Close loading screen
        document.addEventListener('DOMContentLoaded', () => {
            this.hideLoadingScreen();
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500);
        }
    }

    initializeThemes() {
        // Initialize theme manager
        if (typeof ThemeManager !== 'undefined') {
            this.themeManager = new ThemeManager();
        }
    }

    openThemeModal() {
        if (this.themeManager) {
            this.themeManager.openThemeModal();
        }
    }

    setupMobileMenu() {
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
}

// Initialize homepage when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Homepage();
});