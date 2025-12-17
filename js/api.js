/**
 * BARIN ALP PWA - API Module
 * Handles all communication with n8n backend
 */

const API = {
    /**
     * Build full URL from endpoint template
     * @param {string} endpoint - Endpoint template with placeholders
     * @param {Object} params - Parameters to replace placeholders
     * @returns {string} Full URL
     */
    buildUrl(endpoint, params = {}) {
        let url = CONFIG.API_BASE_URL + endpoint;
        
        // Replace URL parameters
        Object.keys(params).forEach(key => {
            url = url.replace(`{${key}}`, encodeURIComponent(params[key]));
        });
        
        return url;
    },

    /**
     * Make HTTP request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            params = {},
            body = null,
            query = {}
        } = options;

        let url = this.buildUrl(endpoint, params);
        
        // Add query parameters
        const queryString = new URLSearchParams(query).toString();
        if (queryString) {
            url += '?' + queryString;
        }

        const headers = {
            'Content-Type': 'application/json'
        };

        // Add auth token if available
        const session = Auth.getSession();
        if (session?.token) {
            headers['Authorization'] = `Bearer ${session.token}`;
        }

        const config = {
            method,
            headers,
            mode: 'cors'
        };

        if (body && method !== 'GET') {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, config);
            
            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new APIError(
                    data.message || 'Грешка при заявката',
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            
            // Network error
            throw new APIError(
                'Няма връзка със сървъра',
                0,
                { originalError: error.message }
            );
        }
    },

    // ==========================================
    // Authentication
    // ==========================================
    
    async login(username, password) {
        return this.request(CONFIG.ENDPOINTS.AUTH_LOGIN, {
            method: 'POST',
            body: { username, password }
        });
    },

    async logout() {
        return this.request(CONFIG.ENDPOINTS.AUTH_LOGOUT, {
            method: 'POST'
        });
    },

    async verifyToken() {
        return this.request(CONFIG.ENDPOINTS.AUTH_VERIFY, {
            method: 'POST'
        });
    },

    // ==========================================
    // Users
    // ==========================================

    async getUsers() {
        return this.request(CONFIG.ENDPOINTS.USERS_LIST);
    },

    async getUser(id) {
        return this.request(CONFIG.ENDPOINTS.USERS_GET, {
            params: { id }
        });
    },

    async getUserBalance(id) {
        return this.request(CONFIG.ENDPOINTS.USERS_BALANCE, {
            params: { id }
        });
    },

    // ==========================================
    // Transactions (Funding)
    // ==========================================

    async getTransactions(filters = {}) {
        return this.request(CONFIG.ENDPOINTS.TRANSACTIONS_LIST, {
            query: filters
        });
    },

    async createTransaction(data) {
        return this.request(CONFIG.ENDPOINTS.TRANSACTIONS_CREATE, {
            method: 'POST',
            body: data
        });
    },

    async getTransaction(id) {
        return this.request(CONFIG.ENDPOINTS.TRANSACTIONS_GET, {
            params: { id }
        });
    },

    // ==========================================
    // Invoices
    // ==========================================

    async getInvoices(filters = {}) {
        return this.request(CONFIG.ENDPOINTS.INVOICES_LIST, {
            query: filters
        });
    },

    async createInvoice(data) {
        return this.request(CONFIG.ENDPOINTS.INVOICES_CREATE, {
            method: 'POST',
            body: data
        });
    },

    async getInvoice(id) {
        return this.request(CONFIG.ENDPOINTS.INVOICES_GET, {
            params: { id }
        });
    },

    async deleteInvoice(id) {
        return this.request(CONFIG.ENDPOINTS.INVOICES_DELETE, {
            method: 'DELETE',
            params: { id }
        });
    },

    // ==========================================
    // Invoice Positions
    // ==========================================

    async getPositions(invoiceId) {
        return this.request(CONFIG.ENDPOINTS.POSITIONS_LIST, {
            params: { id: invoiceId }
        });
    },

    async allocatePositions(allocations) {
        return this.request(CONFIG.ENDPOINTS.POSITIONS_ALLOCATE, {
            method: 'POST',
            body: { allocations }
        });
    },

    // ==========================================
    // Objects (Construction Sites)
    // ==========================================

    async getObjects(includeArchived = false) {
        return this.request(CONFIG.ENDPOINTS.OBJECTS_LIST, {
            query: { includeArchived }
        });
    },

    async createObject(data) {
        return this.request(CONFIG.ENDPOINTS.OBJECTS_CREATE, {
            method: 'POST',
            body: data
        });
    },

    async getObject(id) {
        return this.request(CONFIG.ENDPOINTS.OBJECTS_GET, {
            params: { id }
        });
    },

    async updateObject(id, data) {
        return this.request(CONFIG.ENDPOINTS.OBJECTS_UPDATE, {
            method: 'PUT',
            params: { id },
            body: data
        });
    },

    async archiveObject(id) {
        return this.request(CONFIG.ENDPOINTS.OBJECTS_ARCHIVE, {
            method: 'POST',
            params: { id }
        });
    },

    // ==========================================
    // Inventory (Tools)
    // ==========================================

    async getInventory(filters = {}) {
        return this.request(CONFIG.ENDPOINTS.INVENTORY_LIST, {
            query: filters
        });
    },

    async createTool(data) {
        return this.request(CONFIG.ENDPOINTS.INVENTORY_CREATE, {
            method: 'POST',
            body: data
        });
    },

    async getTool(id) {
        return this.request(CONFIG.ENDPOINTS.INVENTORY_GET, {
            params: { id }
        });
    },

    async updateTool(id, data) {
        return this.request(CONFIG.ENDPOINTS.INVENTORY_UPDATE, {
            method: 'PUT',
            params: { id },
            body: data
        });
    },

    async transferTool(id, data) {
        return this.request(CONFIG.ENDPOINTS.INVENTORY_TRANSFER, {
            method: 'POST',
            params: { id },
            body: data
        });
    },

    async uploadToolPhoto(id, photoBase64) {
        return this.request(CONFIG.ENDPOINTS.INVENTORY_UPLOAD_PHOTO, {
            method: 'POST',
            params: { id },
            body: { photo: photoBase64 }
        });
    },

    // ==========================================
    // Bank Statements
    // ==========================================

    async uploadBankStatement(pdfBase64, filename) {
        return this.request(CONFIG.ENDPOINTS.BANK_UPLOAD, {
            method: 'POST',
            body: { 
                file: pdfBase64,
                filename 
            }
        });
    },

    async getBankTransactions(filters = {}) {
        return this.request(CONFIG.ENDPOINTS.BANK_TRANSACTIONS, {
            query: filters
        });
    },

    // ==========================================
    // Reports
    // ==========================================

    async getObjectReport(objectId) {
        return this.request(CONFIG.ENDPOINTS.REPORTS_OBJECT_SUMMARY, {
            params: { id: objectId }
        });
    },

    async getTechnicianReport(technicianId) {
        return this.request(CONFIG.ENDPOINTS.REPORTS_TECHNICIAN_BALANCE, {
            params: { id: technicianId }
        });
    },

    async getOverviewReport() {
        return this.request(CONFIG.ENDPOINTS.REPORTS_OVERVIEW);
    }
};

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, status, data = {}) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, APIError };
}
