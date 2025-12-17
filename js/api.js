/**
 * BARIN ALP PWA - API Module
 * Handles all communication with n8n backend
 */

const API = {
    /**
     * Check if in demo mode
     */
    isDemoMode() {
        return CONFIG.API_BASE_URL.includes('your-n8n-instance');
    },

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
        // Demo mode handled in Auth module
        return this.request(CONFIG.ENDPOINTS.AUTH_LOGIN, {
            method: 'POST',
            body: { username, password }
        });
    },

    async logout() {
        if (this.isDemoMode()) return { success: true };
        return this.request(CONFIG.ENDPOINTS.AUTH_LOGOUT, {
            method: 'POST'
        });
    },

    async verifyToken() {
        if (this.isDemoMode()) return Auth.getUser();
        return this.request(CONFIG.ENDPOINTS.AUTH_VERIFY, {
            method: 'POST'
        });
    },

    // ==========================================
    // Users
    // ==========================================

    async getUsers() {
        if (this.isDemoMode()) return [...DEMO_DATA.users];
        return this.request(CONFIG.ENDPOINTS.USERS_LIST);
    },

    async getUser(id) {
        if (this.isDemoMode()) return DEMO_DATA.getUserById(id);
        return this.request(CONFIG.ENDPOINTS.USERS_GET, {
            params: { id }
        });
    },

    async getUserBalance(id) {
        if (this.isDemoMode()) {
            const user = DEMO_DATA.getUserById(id);
            return { balance: user?.balance || 0 };
        }
        return this.request(CONFIG.ENDPOINTS.USERS_BALANCE, {
            params: { id }
        });
    },

    // ==========================================
    // Transactions (Funding)
    // ==========================================

    async getTransactions(filters = {}) {
        if (this.isDemoMode()) return [...DEMO_DATA.transactions];
        return this.request(CONFIG.ENDPOINTS.TRANSACTIONS_LIST, {
            query: filters
        });
    },

    async createTransaction(data) {
        if (this.isDemoMode()) {
            const newTx = { id: DEMO_DATA.nextId('transactions'), ...data, date: new Date().toISOString().split('T')[0] };
            DEMO_DATA.transactions.push(newTx);
            return newTx;
        }
        return this.request(CONFIG.ENDPOINTS.TRANSACTIONS_CREATE, {
            method: 'POST',
            body: data
        });
    },

    async getTransaction(id) {
        if (this.isDemoMode()) return DEMO_DATA.transactions.find(t => t.id === id);
        return this.request(CONFIG.ENDPOINTS.TRANSACTIONS_GET, {
            params: { id }
        });
    },

    // ==========================================
    // Invoices
    // ==========================================

    async getInvoices(filters = {}) {
        if (this.isDemoMode()) return [...DEMO_DATA.invoices];
        return this.request(CONFIG.ENDPOINTS.INVOICES_LIST, {
            query: filters
        });
    },

    async createInvoice(data) {
        if (this.isDemoMode()) {
            const newInvoice = { 
                id: DEMO_DATA.nextId('invoices'), 
                ...data, 
                createdByName: Auth.getDisplayName()
            };
            DEMO_DATA.invoices.unshift(newInvoice);
            return newInvoice;
        }
        return this.request(CONFIG.ENDPOINTS.INVOICES_CREATE, {
            method: 'POST',
            body: data
        });
    },

    async getInvoice(id) {
        if (this.isDemoMode()) return DEMO_DATA.invoices.find(i => i.id === id);
        return this.request(CONFIG.ENDPOINTS.INVOICES_GET, {
            params: { id }
        });
    },

    async deleteInvoice(id) {
        if (this.isDemoMode()) {
            const idx = DEMO_DATA.invoices.findIndex(i => i.id === id);
            if (idx > -1) DEMO_DATA.invoices.splice(idx, 1);
            return { success: true };
        }
        return this.request(CONFIG.ENDPOINTS.INVOICES_DELETE, {
            method: 'DELETE',
            params: { id }
        });
    },

    // ==========================================
    // Invoice Positions
    // ==========================================

    async getPositions(invoiceId) {
        if (this.isDemoMode()) return [];
        return this.request(CONFIG.ENDPOINTS.POSITIONS_LIST, {
            params: { id: invoiceId }
        });
    },

    async allocatePositions(allocations) {
        if (this.isDemoMode()) return { success: true };
        return this.request(CONFIG.ENDPOINTS.POSITIONS_ALLOCATE, {
            method: 'POST',
            body: { allocations }
        });
    },

    // ==========================================
    // Objects (Construction Sites)
    // ==========================================

    async getObjects(includeArchived = false) {
        if (this.isDemoMode()) {
            return includeArchived 
                ? [...DEMO_DATA.objects]
                : DEMO_DATA.objects.filter(o => o.status === 'active');
        }
        return this.request(CONFIG.ENDPOINTS.OBJECTS_LIST, {
            query: { includeArchived }
        });
    },

    async createObject(data) {
        if (this.isDemoMode()) {
            const newObj = { id: DEMO_DATA.nextId('objects'), ...data, totalExpenses: 0, status: 'active' };
            DEMO_DATA.objects.push(newObj);
            return newObj;
        }
        return this.request(CONFIG.ENDPOINTS.OBJECTS_CREATE, {
            method: 'POST',
            body: data
        });
    },

    async getObject(id) {
        if (this.isDemoMode()) return DEMO_DATA.getObjectById(id);
        return this.request(CONFIG.ENDPOINTS.OBJECTS_GET, {
            params: { id }
        });
    },

    async updateObject(id, data) {
        if (this.isDemoMode()) {
            const obj = DEMO_DATA.objects.find(o => o.id === id);
            if (obj) Object.assign(obj, data);
            return obj;
        }
        return this.request(CONFIG.ENDPOINTS.OBJECTS_UPDATE, {
            method: 'PUT',
            params: { id },
            body: data
        });
    },

    async archiveObject(id) {
        if (this.isDemoMode()) {
            const obj = DEMO_DATA.objects.find(o => o.id === id);
            if (obj) obj.status = 'archived';
            return { success: true };
        }
        return this.request(CONFIG.ENDPOINTS.OBJECTS_ARCHIVE, {
            method: 'POST',
            params: { id }
        });
    },

    // ==========================================
    // Inventory (Tools)
    // ==========================================

    async getInventory(filters = {}) {
        if (this.isDemoMode()) {
            let items = [...DEMO_DATA.inventory];
            if (filters.status) {
                items = items.filter(i => i.status === filters.status);
            }
            return items;
        }
        return this.request(CONFIG.ENDPOINTS.INVENTORY_LIST, {
            query: filters
        });
    },

    async createTool(data) {
        if (this.isDemoMode()) {
            const newTool = { id: DEMO_DATA.nextId('inventory'), ...data, photos: [] };
            DEMO_DATA.inventory.push(newTool);
            return newTool;
        }
        return this.request(CONFIG.ENDPOINTS.INVENTORY_CREATE, {
            method: 'POST',
            body: data
        });
    },

    async getTool(id) {
        if (this.isDemoMode()) return DEMO_DATA.inventory.find(t => t.id === id);
        return this.request(CONFIG.ENDPOINTS.INVENTORY_GET, {
            params: { id }
        });
    },

    async updateTool(id, data) {
        if (this.isDemoMode()) {
            const tool = DEMO_DATA.inventory.find(t => t.id === id);
            if (tool) Object.assign(tool, data);
            return tool;
        }
        return this.request(CONFIG.ENDPOINTS.INVENTORY_UPDATE, {
            method: 'PUT',
            params: { id },
            body: data
        });
    },

    async transferTool(id, data) {
        if (this.isDemoMode()) {
            const tool = DEMO_DATA.inventory.find(t => t.id === id);
            if (tool) {
                tool.assignedTo = data.assignedTo;
                tool.assignedToName = data.assignedToName || DEMO_DATA.getUserById(data.assignedTo)?.name;
                tool.objectId = data.objectId;
                tool.objectName = data.objectName || DEMO_DATA.getObjectById(data.objectId)?.name;
                tool.status = data.assignedTo ? 'in-use' : 'available';
            }
            return tool;
        }
        return this.request(CONFIG.ENDPOINTS.INVENTORY_TRANSFER, {
            method: 'POST',
            params: { id },
            body: data
        });
    },

    async uploadToolPhoto(id, photoBase64) {
        if (this.isDemoMode()) {
            const tool = DEMO_DATA.inventory.find(t => t.id === id);
            if (tool) tool.photos.push(photoBase64);
            return { success: true };
        }
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
        if (this.isDemoMode()) {
            return {
                transactions: [
                    { date: '2025-12-15', description: 'ПЕТЪР ТЕХНИК', amount: 1500, type: 'credit' },
                    { date: '2025-12-14', description: 'СТОЯН ТЕХНИК', amount: 1000, type: 'credit' }
                ]
            };
        }
        return this.request(CONFIG.ENDPOINTS.BANK_UPLOAD, {
            method: 'POST',
            body: { 
                file: pdfBase64,
                filename 
            }
        });
    },

    async getBankTransactions(filters = {}) {
        if (this.isDemoMode()) return [];
        return this.request(CONFIG.ENDPOINTS.BANK_TRANSACTIONS, {
            query: filters
        });
    },

    // ==========================================
    // Reports
    // ==========================================

    async getObjectReport(objectId) {
        if (this.isDemoMode()) {
            const obj = DEMO_DATA.getObjectById(objectId);
            return {
                object: obj,
                expenses: DEMO_DATA.invoices.filter(i => i.objectId === objectId),
                totalExpenses: obj?.totalExpenses || 0
            };
        }
        return this.request(CONFIG.ENDPOINTS.REPORTS_OBJECT_SUMMARY, {
            params: { id: objectId }
        });
    },

    async getTechnicianReport(technicianId) {
        if (this.isDemoMode()) {
            const user = DEMO_DATA.getUserById(technicianId);
            return {
                user,
                balance: user?.balance || 0,
                transactions: DEMO_DATA.transactions.filter(t => t.userId === technicianId)
            };
        }
        return this.request(CONFIG.ENDPOINTS.REPORTS_TECHNICIAN_BALANCE, {
            params: { id: technicianId }
        });
    },

    async getOverviewReport() {
        if (this.isDemoMode()) {
            return {
                totalBalance: DEMO_DATA.getTechnicians().reduce((sum, t) => sum + t.balance, 0),
                totalExpenses: DEMO_DATA.objects.reduce((sum, o) => sum + o.totalExpenses, 0),
                activeObjects: DEMO_DATA.objects.filter(o => o.status === 'active').length,
                totalTools: DEMO_DATA.inventory.length,
                recentExpenses: DEMO_DATA.invoices.slice(0, 5)
            };
        }
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
