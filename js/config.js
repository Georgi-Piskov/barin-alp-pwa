/**
 * BARIN ALP PWA - Configuration
 * All API endpoints and app settings
 */

const CONFIG = {
    // App Info
    APP_NAME: 'БАРИН АЛП',
    APP_VERSION: '1.0.0',
    
    // API Base URL - n8n webhook URL (replace with actual)
    API_BASE_URL: 'https://your-n8n-instance.com/webhook',
    
    // API Endpoints
    ENDPOINTS: {
        // Authentication
        AUTH_LOGIN: '/auth/login',
        AUTH_LOGOUT: '/auth/logout',
        AUTH_VERIFY: '/auth/verify',
        
        // Users
        USERS_LIST: '/users',
        USERS_GET: '/users/{id}',
        USERS_BALANCE: '/users/{id}/balance',
        
        // Transactions (Funding)
        TRANSACTIONS_LIST: '/transactions',
        TRANSACTIONS_CREATE: '/transactions',
        TRANSACTIONS_GET: '/transactions/{id}',
        
        // Invoices
        INVOICES_LIST: '/invoices',
        INVOICES_CREATE: '/invoices',
        INVOICES_GET: '/invoices/{id}',
        INVOICES_DELETE: '/invoices/{id}',
        
        // Invoice Positions
        POSITIONS_LIST: '/invoices/{id}/positions',
        POSITIONS_ALLOCATE: '/positions/allocate',
        
        // Objects (Construction Sites)
        OBJECTS_LIST: '/objects',
        OBJECTS_CREATE: '/objects',
        OBJECTS_GET: '/objects/{id}',
        OBJECTS_UPDATE: '/objects/{id}',
        OBJECTS_ARCHIVE: '/objects/{id}/archive',
        
        // Inventory (Tools)
        INVENTORY_LIST: '/inventory',
        INVENTORY_CREATE: '/inventory',
        INVENTORY_GET: '/inventory/{id}',
        INVENTORY_UPDATE: '/inventory/{id}',
        INVENTORY_TRANSFER: '/inventory/{id}/transfer',
        INVENTORY_UPLOAD_PHOTO: '/inventory/{id}/photo',
        
        // Bank Statements
        BANK_UPLOAD: '/bank/upload',
        BANK_TRANSACTIONS: '/bank/transactions',
        
        // Reports
        REPORTS_OBJECT_SUMMARY: '/reports/object/{id}',
        REPORTS_TECHNICIAN_BALANCE: '/reports/technician/{id}',
        REPORTS_OVERVIEW: '/reports/overview'
    },
    
    // User Roles
    ROLES: {
        DIRECTOR: 'director',
        TECHNICIAN: 'technician'
    },
    
    // Transaction Types
    TRANSACTION_TYPES: {
        CASH_FUNDING: 'cash_funding',
        BANK_TRANSFER: 'bank_transfer',
        EXPENSE: 'expense',
        INVOICE: 'invoice'
    },
    
    // Tool Statuses
    TOOL_STATUS: {
        AVAILABLE: 'available',
        ASSIGNED: 'assigned',
        MAINTENANCE: 'maintenance',
        LOST: 'lost'
    },
    
    // Object Statuses
    OBJECT_STATUS: {
        ACTIVE: 'active',
        COMPLETED: 'completed',
        ARCHIVED: 'archived'
    },
    
    // Photo Settings
    PHOTO: {
        MAX_SIZE: 500 * 1024, // 500KB
        MAX_WIDTH: 1200,
        MAX_HEIGHT: 1200,
        QUALITY: 0.8,
        MAX_PHOTOS_PER_TOOL: 5
    },
    
    // Session Settings
    SESSION: {
        KEY: 'barin_alp_session',
        TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
    },
    
    // UI Settings
    UI: {
        TOAST_DURATION: 3000,
        DEBOUNCE_DELAY: 300,
        PAGE_SIZE: 20
    },
    
    // Currency
    CURRENCY: {
        CODE: 'BGN',
        SYMBOL: 'лв.',
        DECIMALS: 2
    },
    
    // Date Format
    DATE_FORMAT: {
        DISPLAY: 'DD.MM.YYYY',
        API: 'YYYY-MM-DD'
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.ROLES);
Object.freeze(CONFIG.TRANSACTION_TYPES);
Object.freeze(CONFIG.TOOL_STATUS);
Object.freeze(CONFIG.OBJECT_STATUS);
Object.freeze(CONFIG.PHOTO);
Object.freeze(CONFIG.SESSION);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.CURRENCY);
Object.freeze(CONFIG.DATE_FORMAT);

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
