/**
 * BARIN ALP PWA - Authentication Module
 * Handles login, session management, and role-based access
 */

const Auth = {
    // Current user data
    currentUser: null,

    /**
     * Initialize authentication
     * Check for existing session
     */
    async init() {
        const session = this.getSession();
        
        if (session && session.expiresAt > Date.now()) {
            // Session exists and not expired - use it without API call
            this.currentUser = {
                id: session.userId,
                username: session.username,
                role: session.role,
                name: session.name
            };
            return true;
        }
        
        // No valid session
        this.clearSession();
        return false;
    },

    // Demo users for testing (remove in production)
    DEMO_USERS: {
        'director1': { id: 1, username: 'director1', name: '\u0413\u0435\u043E\u0440\u0433\u0438 \u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440', role: 'director', pin: '1234' },
        'director2': { id: 2, username: 'director2', name: '\u0418\u0432\u0430\u043D \u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440', role: 'director', pin: '1234' },
        'tech1': { id: 3, username: 'tech1', name: '\u041F\u0435\u0442\u044A\u0440 \u0422\u0435\u0445\u043D\u0438\u043A', role: 'technician', pin: '1234' },
        'tech2': { id: 4, username: 'tech2', name: '\u0421\u0442\u043E\u044F\u043D \u0422\u0435\u0445\u043D\u0438\u043A', role: 'technician', pin: '1234' },
        'tech3': { id: 5, username: 'tech3', name: '\u0414\u0438\u043C\u0438\u0442\u044A\u0440 \u0422\u0435\u0445\u043D\u0438\u043A', role: 'technician', pin: '1234' }
    },

    /**
     * Login user
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<Object>} User data
     */
    async login(username, password) {
        // DEMO MODE - remove when backend is ready
        if (CONFIG.API_BASE_URL.includes('your-n8n-instance')) {
            const demoUser = this.DEMO_USERS[username];
            if (!demoUser) {
                throw new Error('Невалиден потребител');
            }
            if (demoUser.pin !== password) {
                throw new Error('Грешен PIN код');
            }
            
            // Save session
            this.saveSession({
                token: 'demo-token-' + Date.now(),
                userId: demoUser.id,
                username: demoUser.username,
                role: demoUser.role,
                name: demoUser.name,
                expiresAt: Date.now() + CONFIG.SESSION.TIMEOUT
            });
            
            this.currentUser = demoUser;
            return demoUser;
        }

        // Real API login
        try {
            const response = await API.login(username, password);
            
            // Save session
            this.saveSession({
                token: response.token,
                userId: response.user.id,
                username: response.user.username,
                role: response.user.role,
                name: response.user.name,
                expiresAt: Date.now() + CONFIG.SESSION.TIMEOUT
            });
            
            this.currentUser = response.user;
            
            return response.user;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            await API.logout();
        } catch (error) {
            // Ignore logout errors
            console.warn('Logout API error:', error);
        }
        
        this.clearSession();
        this.currentUser = null;
    },

    /**
     * Save session to localStorage
     * @param {Object} sessionData 
     */
    saveSession(sessionData) {
        try {
            localStorage.setItem(
                CONFIG.SESSION.KEY, 
                JSON.stringify(sessionData)
            );
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    },

    /**
     * Get session from localStorage
     * @returns {Object|null} Session data or null
     */
    getSession() {
        try {
            const data = localStorage.getItem(CONFIG.SESSION.KEY);
            if (!data) return null;
            
            const session = JSON.parse(data);
            
            // Check if session expired
            if (session.expiresAt && session.expiresAt < Date.now()) {
                this.clearSession();
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('Failed to get session:', error);
            return null;
        }
    },

    /**
     * Clear session from localStorage
     */
    clearSession() {
        try {
            localStorage.removeItem(CONFIG.SESSION.KEY);
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    },

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.getSession() !== null;
    },

    /**
     * Get current user
     * @returns {Object|null}
     */
    getUser() {
        const session = this.getSession();
        if (!session) return null;
        
        return {
            id: session.userId,
            username: session.username,
            name: session.name,
            role: session.role
        };
    },

    /**
     * Check if current user is director
     * @returns {boolean}
     */
    isDirector() {
        const user = this.getUser();
        return user?.role === CONFIG.ROLES.DIRECTOR;
    },

    /**
     * Check if current user is technician
     * @returns {boolean}
     */
    isTechnician() {
        const user = this.getUser();
        return user?.role === CONFIG.ROLES.TECHNICIAN;
    },

    /**
     * Check if user has permission for action
     * @param {string} permission 
     * @returns {boolean}
     */
    hasPermission(permission) {
        const user = this.getUser();
        if (!user) return false;
        
        // Directors have all permissions
        if (user.role === CONFIG.ROLES.DIRECTOR) {
            return true;
        }
        
        // Technician permissions
        const technicianPermissions = [
            'view_own_balance',
            'create_invoice',
            'view_inventory',
            'transfer_tool'
        ];
        
        return technicianPermissions.includes(permission);
    },

    /**
     * Get display name for current user
     * @returns {string}
     */
    getDisplayName() {
        const user = this.getUser();
        return user?.name || user?.username || 'Потребител';
    },

    /**
     * Get role display name
     * @returns {string}
     */
    getRoleDisplayName() {
        const user = this.getUser();
        if (!user) return '';
        
        return user.role === CONFIG.ROLES.DIRECTOR ? 'Директор' : 'Техник';
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}
