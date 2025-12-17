/**
 * BARIN ALP PWA - Main Application
 * Entry point and routing
 */

const App = {
    // Current page
    currentPage: null,
    
    // Page modules registry
    pages: {},
    
    // Cached data
    cache: {
        users: null,
        objects: null,
        inventory: null
    },

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing BARIN ALP...');
        
        // Initialize components
        Components.toast.init();
        Components.modal.init();
        
        // Register Service Worker
        this.registerServiceWorker();
        
        // Populate login users (demo mode or from API)
        await this.populateLoginUsers();
        
        // Check authentication
        const isLoggedIn = await Auth.init();
        
        if (isLoggedIn) {
            this.showApp();
            this.navigateTo('dashboard');
        } else {
            this.showLogin();
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Hide loading screen
        this.hideLoading();
    },

    /**
     * Populate login user select
     */
    async populateLoginUsers() {
        const userSelect = Utils.$('#user-select');
        if (!userSelect) {
            console.error('User select element not found');
            return;
        }

        console.log('Populating users, API URL:', CONFIG.API_BASE_URL);

        // DEMO MODE - use demo users
        if (CONFIG.API_BASE_URL.includes('your-n8n-instance')) {
            console.log('Demo mode active, users:', Auth.DEMO_USERS);
            if (Auth.DEMO_USERS) {
                Object.entries(Auth.DEMO_USERS).forEach(([username, user]) => {
                    const option = document.createElement('option');
                    option.value = username;
                    option.textContent = user.name;
                    userSelect.appendChild(option);
                });
            } else {
                console.error('Auth.DEMO_USERS is not defined');
            }
            return;
        }

        // Real API - fetch users list
        try {
            const users = await API.getUsers();
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.username;
                option.textContent = user.name;
                userSelect.appendChild(option);
            });
        } catch (error) {
            console.warn('Could not load users:', error);
        }
    },

    /**
     * Register Service Worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered:', registration.scope);
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    },

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Login form
        const loginForm = Utils.$('#login-form');
        loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Menu toggle
        const menuToggle = Utils.$('#menu-toggle');
        menuToggle?.addEventListener('click', () => this.toggleSideMenu());
        
        // Menu overlay
        const menuOverlay = Utils.$('#menu-overlay');
        menuOverlay?.addEventListener('click', () => this.closeSideMenu());
        
        // Side menu items
        Utils.$$('.menu-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
                this.closeSideMenu();
            });
        });
        
        // Bottom navigation
        Utils.$$('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // Logout
        Utils.$('#logout-btn')?.addEventListener('click', () => this.handleLogout());
        
        // Handle back button
        window.addEventListener('popstate', (e) => {
            if (e.state?.page) {
                this.navigateTo(e.state.page, false);
            }
        });
    },

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const userSelect = Utils.$('#user-select');
        const pinInput = Utils.$('#pin-input');
        const username = userSelect?.value;
        const password = pinInput?.value;
        const submitBtn = form.querySelector('button[type=\"submit\"]');
        
        if (!username || !password) {
            Components.toast.error('Моля изберете потребител и въведете PIN');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Вход...';
        
        try {
            await Auth.login(username, password);
            
            Components.toast.success('Успешен вход!');
            this.showApp();
            this.navigateTo('dashboard');
            
            form.reset();
        } catch (error) {
            Components.toast.error(error.message || 'Грешка при вход');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Вход';
        }
    },

    /**
     * Handle logout
     */
    async handleLogout() {
        const confirmed = await Components.modal.confirm(
            'Сигурни ли сте, че искате да излезете?',
            { title: 'Изход' }
        );
        
        if (confirmed) {
            await Auth.logout();
            this.clearCache();
            this.showLogin();
            Components.toast.info('Излязохте от системата');
        }
    },

    /**
     * Show login screen
     */
    showLogin() {
        Utils.hide('#app');
        Utils.show('#login-screen');
        Utils.$('#user-select')?.focus();
    },

    /**
     * Show main app
     */
    showApp() {
        Utils.hide('#login-screen');
        Utils.show('#app');
        
        // Update user info in header and menu
        const user = Auth.getUser();
        const displayName = Auth.getDisplayName();
        const roleName = Auth.getRoleDisplayName();
        
        const userNameEl = Utils.$('#user-name');
        if (userNameEl) userNameEl.textContent = displayName;
        
        const menuRoleEl = Utils.$('#menu-user-role');
        if (menuRoleEl) menuRoleEl.textContent = roleName;
        
        // Show/hide menu items based on role
        this.updateMenuVisibility();
    },

    /**
     * Update menu visibility based on user role
     */
    updateMenuVisibility() {
        const isDirector = Auth.isDirector();
        
        // Director-only menu items
        Utils.$$('[data-role="director"]').forEach(el => {
            Utils.toggle(el, isDirector);
        });
        
        // Technician-only menu items
        Utils.$$('[data-role="technician"]').forEach(el => {
            Utils.toggle(el, !isDirector);
        });
    },

    /**
     * Navigate to page
     * @param {string} pageName 
     * @param {boolean} pushState 
     */
    navigateTo(pageName, pushState = true) {
        // Check permissions
        const directorOnlyPages = ['admin-overview', 'technicians', 'bank-upload', 'objects'];
        if (directorOnlyPages.includes(pageName) && !Auth.isDirector()) {
            Components.toast.error('Нямате права за достъп');
            return;
        }
        
        // Hide all pages
        Utils.$$('.page').forEach(page => Utils.hide(page));
        
        // Show target page
        const targetPage = Utils.$(`#page-${pageName}`);
        if (targetPage) {
            Utils.show(targetPage);
            this.currentPage = pageName;
            
            // Update navigation states
            this.updateNavigationState(pageName);
            
            // Load page data
            this.loadPageData(pageName);
            
            // Push to history
            if (pushState) {
                history.pushState({ page: pageName }, '', `#${pageName}`);
            }
        } else {
            console.warn(`Page not found: ${pageName}`);
        }
    },

    /**
     * Update navigation active states
     * @param {string} pageName 
     */
    updateNavigationState(pageName) {
        // Side menu
        Utils.$$('.menu-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        
        // Bottom nav
        Utils.$$('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        
        // Update header title
        const titles = {
            'dashboard': 'Табло',
            'new-expense': 'Нов разход',
            'invoices': 'Фактури',
            'inventory': 'Инвентар',
            'admin-overview': 'Общ преглед',
            'technicians': 'Техници',
            'bank-upload': 'Банково извлечение',
            'objects': 'Обекти'
        };
        Utils.$('#header-title').textContent = titles[pageName] || 'БАРИН АЛП';
    },

    /**
     * Load page-specific data
     * @param {string} pageName 
     */
    async loadPageData(pageName) {
        // Call page-specific load function if exists
        const pageModule = this.pages[pageName];
        if (pageModule?.load) {
            try {
                await pageModule.load();
            } catch (error) {
                console.error(`Error loading page ${pageName}:`, error);
                Components.toast.error('Грешка при зареждане на данни');
            }
        }
    },

    /**
     * Register page module
     * @param {string} name 
     * @param {Object} module 
     */
    registerPage(name, module) {
        this.pages[name] = module;
        if (module.init) {
            module.init();
        }
    },

    /**
     * Toggle side menu
     */
    toggleSideMenu() {
        const menu = Utils.$('#side-menu');
        const overlay = Utils.$('#menu-overlay');
        
        menu.classList.toggle('open');
        overlay.classList.toggle('open');
    },

    /**
     * Close side menu
     */
    closeSideMenu() {
        Utils.$('#side-menu')?.classList.remove('open');
        Utils.$('#menu-overlay')?.classList.remove('open');
    },

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingScreen = Utils.$('#loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.remove(), 300);
        }
    },

    /**
     * Clear cached data
     */
    clearCache() {
        this.cache = {
            users: null,
            objects: null,
            inventory: null
        };
    },

    /**
     * Get cached objects or fetch
     * @returns {Promise<Array>}
     */
    async getObjects() {
        if (!this.cache.objects) {
            this.cache.objects = await API.getObjects();
        }
        return this.cache.objects;
    },

    /**
     * Get cached users or fetch
     * @returns {Promise<Array>}
     */
    async getUsers() {
        if (!this.cache.users) {
            this.cache.users = await API.getUsers();
        }
        return this.cache.users;
    },

    /**
     * Invalidate cache
     * @param {string} key 
     */
    invalidateCache(key) {
        if (key) {
            this.cache[key] = null;
        } else {
            this.clearCache();
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
