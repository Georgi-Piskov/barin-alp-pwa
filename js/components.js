/**
 * BARIN ALP PWA - UI Components
 * Reusable UI components (Toast, Modal, Lists, etc.)
 */

const Components = {
    // ==========================================
    // Toast Notifications
    // ==========================================
    
    toast: {
        container: null,

        init() {
            this.container = Utils.$('#toast-container');
        },

        /**
         * Show toast message
         * @param {string} message 
         * @param {string} type - 'success', 'error', 'warning', 'info'
         * @param {number} duration 
         */
        show(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
            if (!this.container) this.init();

            const toast = Utils.createElement('div', {
                className: `toast ${type}`
            });

            // Icon
            const icons = {
                success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>`,
                error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
                warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
                info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
            };

            toast.innerHTML = `
                ${icons[type] || icons.info}
                <span>${message}</span>
            `;

            this.container.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                toast.style.animation = 'slideUp 0.25s ease reverse';
                setTimeout(() => toast.remove(), 250);
            }, duration);
        },

        success(message) {
            this.show(message, 'success');
        },

        error(message) {
            this.show(message, 'error');
        },

        warning(message) {
            this.show(message, 'warning');
        },

        info(message) {
            this.show(message, 'info');
        }
    },

    // ==========================================
    // Modal
    // ==========================================

    modal: {
        container: null,
        currentModal: null,

        init() {
            this.container = Utils.$('#modal-container');
            
            // Close on overlay click
            this.container?.addEventListener('click', (e) => {
                if (e.target === this.container) {
                    this.close();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen()) {
                    this.close();
                }
            });
        },

        /**
         * Show modal
         * @param {Object} options 
         */
        show(options = {}) {
            const {
                title = '',
                content = '',
                footer = '',
                size = 'default',
                closeable = true,
                onClose = null
            } = options;

            if (!this.container) this.init();

            this.container.innerHTML = `
                <div class="modal ${size}">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        ${closeable ? `
                            <button type="button" class="btn-icon modal-close" aria-label="Затвори">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                    <div class="modal-body">${content}</div>
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            `;

            // Close button
            const closeBtn = this.container.querySelector('.modal-close');
            closeBtn?.addEventListener('click', () => this.close());

            this.currentModal = { onClose };
            this.container.classList.add('open');
            document.body.style.overflow = 'hidden';

            return this.container.querySelector('.modal');
        },

        /**
         * Close modal
         */
        close() {
            if (!this.container) return;

            this.container.classList.remove('open');
            document.body.style.overflow = '';

            if (this.currentModal?.onClose) {
                this.currentModal.onClose();
            }
            this.currentModal = null;
        },

        /**
         * Check if modal is open
         * @returns {boolean}
         */
        isOpen() {
            return this.container?.classList.contains('open');
        },

        /**
         * Confirm dialog
         * @param {string} message 
         * @param {Object} options 
         * @returns {Promise<boolean>}
         */
        confirm(message, options = {}) {
            return new Promise((resolve) => {
                const {
                    title = 'Потвърждение',
                    confirmText = 'Да',
                    cancelText = 'Не',
                    confirmClass = 'btn-primary'
                } = options;

                this.show({
                    title,
                    content: `<p>${message}</p>`,
                    footer: `
                        <button type="button" class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                        <button type="button" class="btn ${confirmClass}" data-action="confirm">${confirmText}</button>
                    `,
                    onClose: () => resolve(false)
                });

                // Button handlers
                const modal = this.container.querySelector('.modal');
                modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
                    this.close();
                    resolve(false);
                });
                modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
                    this.close();
                    resolve(true);
                });
            });
        },

        /**
         * Alert dialog
         * @param {string} message 
         * @param {string} title 
         */
        alert(message, title = 'Информация') {
            return new Promise((resolve) => {
                this.show({
                    title,
                    content: `<p>${message}</p>`,
                    footer: `<button type="button" class="btn btn-primary" data-action="ok">OK</button>`
                });

                const modal = this.container.querySelector('.modal');
                modal.querySelector('[data-action="ok"]').addEventListener('click', () => {
                    this.close();
                    resolve();
                });
            });
        }
    },

    // ==========================================
    // Loading
    // ==========================================

    loading: {
        /**
         * Show loading overlay
         * @param {string} message 
         */
        show(message = 'Зареждане...') {
            let overlay = Utils.$('.loading-overlay');
            
            if (!overlay) {
                overlay = Utils.createElement('div', {
                    className: 'loading-overlay'
                }, `
                    <div class="loader"></div>
                    <p class="loading-message">${message}</p>
                `);
                document.body.appendChild(overlay);
            } else {
                overlay.querySelector('.loading-message').textContent = message;
                overlay.classList.remove('hidden');
            }
        },

        /**
         * Hide loading overlay
         */
        hide() {
            const overlay = Utils.$('.loading-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
        }
    },

    // ==========================================
    // List Component
    // ==========================================

    /**
     * Create list item
     * @param {Object} options 
     * @returns {HTMLElement}
     */
    createListItem(options = {}) {
        const {
            icon = '',
            iconClass = '',
            title = '',
            subtitle = '',
            value = '',
            valueClass = '',
            badge = '',
            badgeClass = '',
            onClick = null,
            data = {}
        } = options;

        const item = Utils.createElement('div', {
            className: 'list-item',
            ...Object.entries(data).reduce((acc, [key, val]) => {
                acc[`data-${key}`] = val;
                return acc;
            }, {})
        });

        item.innerHTML = `
            ${icon ? `<div class="list-item-icon ${iconClass}">${icon}</div>` : ''}
            <div class="list-item-content">
                <div class="list-item-title">${title}</div>
                ${subtitle ? `<div class="list-item-subtitle">${subtitle}</div>` : ''}
            </div>
            ${badge ? `<span class="badge ${badgeClass}">${badge}</span>` : ''}
            ${value ? `<div class="list-item-value ${valueClass}">${value}</div>` : ''}
        `;

        if (onClick) {
            item.addEventListener('click', onClick);
        }

        return item;
    },

    /**
     * Create empty state
     * @param {Object} options 
     * @returns {HTMLElement}
     */
    createEmptyState(options = {}) {
        const {
            icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>`,
            message = 'Няма данни',
            action = null,
            actionText = ''
        } = options;

        const container = Utils.createElement('div', {
            className: 'empty-state'
        });

        container.innerHTML = `
            ${icon}
            <p>${message}</p>
            ${action && actionText ? `<button type="button" class="btn btn-primary">${actionText}</button>` : ''}
        `;

        if (action) {
            const btn = container.querySelector('.btn');
            btn?.addEventListener('click', action);
        }

        return container;
    },

    // ==========================================
    // Stat Card
    // ==========================================

    /**
     * Create stat card
     * @param {Object} options 
     * @returns {HTMLElement}
     */
    createStatCard(options = {}) {
        const {
            label = '',
            value = '',
            type = '', // primary, success, warning, danger
            change = null,
            changePositive = true
        } = options;

        const card = Utils.createElement('div', {
            className: `stat-card ${type}`
        });

        card.innerHTML = `
            <div class="stat-label">${label}</div>
            <div class="stat-value">${value}</div>
            ${change !== null ? `
                <div class="stat-change ${changePositive ? 'text-success' : 'text-danger'}">
                    ${changePositive ? '↑' : '↓'} ${change}
                </div>
            ` : ''}
        `;

        return card;
    },

    // ==========================================
    // Select Options
    // ==========================================

    /**
     * Populate select with options
     * @param {HTMLSelectElement} select 
     * @param {Array} options 
     * @param {string} valueField 
     * @param {string} textField 
     * @param {string} placeholder 
     */
    populateSelect(select, options, valueField = 'id', textField = 'name', placeholder = '-- Изберете --') {
        select.innerHTML = '';
        
        if (placeholder) {
            const placeholderOption = Utils.createElement('option', {
                value: '',
                disabled: true,
                selected: true
            }, placeholder);
            select.appendChild(placeholderOption);
        }

        options.forEach(opt => {
            const option = Utils.createElement('option', {
                value: opt[valueField]
            }, opt[textField]);
            select.appendChild(option);
        });
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Components;
}
