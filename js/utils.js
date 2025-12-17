/**
 * BARIN ALP PWA - Utility Functions
 */

const Utils = {
    // ==========================================
    // Date Formatting
    // ==========================================

    /**
     * Format date for display (DD.MM.YYYY)
     * @param {Date|string} date 
     * @returns {string}
     */
    formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        return `${day}.${month}.${year}`;
    },

    /**
     * Format date for API (YYYY-MM-DD)
     * @param {Date|string} date 
     * @returns {string}
     */
    formatDateAPI(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        return d.toISOString().split('T')[0];
    },

    /**
     * Format date and time
     * @param {Date|string} date 
     * @returns {string}
     */
    formatDateTime(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const dateStr = this.formatDate(d);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return `${dateStr} ${hours}:${minutes}`;
    },

    /**
     * Get today's date in API format
     * @returns {string}
     */
    today() {
        return this.formatDateAPI(new Date());
    },

    /**
     * Parse date from Bulgarian format (DD.MM.YYYY)
     * @param {string} dateStr 
     * @returns {Date|null}
     */
    parseBulgarianDate(dateStr) {
        if (!dateStr) return null;
        
        const parts = dateStr.split('.');
        if (parts.length !== 3) return null;
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? null : date;
    },

    // ==========================================
    // Currency Formatting
    // ==========================================

    /**
     * Format number as currency
     * @param {number} amount 
     * @param {boolean} showSymbol 
     * @returns {string}
     */
    formatCurrency(amount, showSymbol = true) {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return showSymbol ? `0.00 ${CONFIG.CURRENCY.SYMBOL}` : '0.00';
        }
        
        const formatted = Number(amount).toFixed(CONFIG.CURRENCY.DECIMALS);
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        
        const result = parts.join('.');
        return showSymbol ? `${result} ${CONFIG.CURRENCY.SYMBOL}` : result;
    },

    /**
     * Parse currency string to number
     * @param {string} value 
     * @returns {number}
     */
    parseCurrency(value) {
        if (!value) return 0;
        
        // Remove currency symbol and spaces
        const cleaned = String(value)
            .replace(CONFIG.CURRENCY.SYMBOL, '')
            .replace(/\s/g, '')
            .replace(',', '.');
        
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    },

    // ==========================================
    // String Utilities
    // ==========================================

    /**
     * Truncate string with ellipsis
     * @param {string} str 
     * @param {number} maxLength 
     * @returns {string}
     */
    truncate(str, maxLength = 50) {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    },

    /**
     * Capitalize first letter
     * @param {string} str 
     * @returns {string}
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Generate unique ID
     * @returns {string}
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // ==========================================
    // DOM Utilities
    // ==========================================

    /**
     * Get element by selector
     * @param {string} selector 
     * @returns {Element|null}
     */
    $(selector) {
        return document.querySelector(selector);
    },

    /**
     * Get all elements by selector
     * @param {string} selector 
     * @returns {NodeList}
     */
    $$(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * Create element with attributes and content
     * @param {string} tag 
     * @param {Object} attrs 
     * @param {string|Element|Array} content 
     * @returns {Element}
     */
    createElement(tag, attrs = {}, content = null) {
        const el = document.createElement(tag);
        
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    el.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.substring(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        
        if (content) {
            if (Array.isArray(content)) {
                content.forEach(child => {
                    if (child instanceof Element) {
                        el.appendChild(child);
                    } else {
                        el.appendChild(document.createTextNode(String(child)));
                    }
                });
            } else if (content instanceof Element) {
                el.appendChild(content);
            } else {
                el.innerHTML = content;
            }
        }
        
        return el;
    },

    /**
     * Show element
     * @param {Element|string} element 
     */
    show(element) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) el.classList.remove('hidden');
    },

    /**
     * Hide element
     * @param {Element|string} element 
     */
    hide(element) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) el.classList.add('hidden');
    },

    /**
     * Toggle element visibility
     * @param {Element|string} element 
     * @param {boolean} force 
     */
    toggle(element, force) {
        const el = typeof element === 'string' ? this.$(element) : element;
        if (el) el.classList.toggle('hidden', !force);
    },

    // ==========================================
    // Form Utilities
    // ==========================================

    /**
     * Get form data as object
     * @param {HTMLFormElement} form 
     * @returns {Object}
     */
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            if (data[key]) {
                // Handle multiple values (checkboxes, multi-select)
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });
        
        return data;
    },

    /**
     * Set form data from object
     * @param {HTMLFormElement} form 
     * @param {Object} data 
     */
    setFormData(form, data) {
        Object.entries(data).forEach(([key, value]) => {
            const field = form.elements[key];
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = Boolean(value);
                } else if (field.type === 'radio') {
                    const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                } else {
                    field.value = value;
                }
            }
        });
    },

    /**
     * Validate form
     * @param {HTMLFormElement} form 
     * @returns {boolean}
     */
    validateForm(form) {
        return form.checkValidity();
    },

    // ==========================================
    // Debounce & Throttle
    // ==========================================

    /**
     * Debounce function
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    debounce(func, wait = CONFIG.UI.DEBOUNCE_DELAY) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func 
     * @param {number} limit 
     * @returns {Function}
     */
    throttle(func, limit = 100) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ==========================================
    // Storage
    // ==========================================

    /**
     * Save to localStorage
     * @param {string} key 
     * @param {*} value 
     */
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Storage set error:', e);
            }
        },

        get(key, defaultValue = null) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('Storage remove error:', e);
            }
        }
    },

    // ==========================================
    // Miscellaneous
    // ==========================================

    /**
     * Deep clone object
     * @param {Object} obj 
     * @returns {Object}
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if object is empty
     * @param {Object} obj 
     * @returns {boolean}
     */
    isEmpty(obj) {
        if (!obj) return true;
        return Object.keys(obj).length === 0;
    },

    /**
     * Sleep/delay utility
     * @param {number} ms 
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
