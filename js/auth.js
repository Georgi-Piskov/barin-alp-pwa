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
        
        if (session) {
            // Verify session is still valid
            try {
                const userData = await API.verifyToken();
                this.currentUser = userData;
                return true;
            } catch (error) {
                // Session invalid, clear it
                this.clearSession();
                return false;
            }
        }
        
        return false;
    },

    /**
     * Login user
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<Object>} User data
     */
    async login(username, password) {
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
