/**
 * BARIN ALP PWA - Invoices Page
 * List and view invoices/expenses
 */

const InvoicesPage = {
    // Filters
    filters: {
        objectId: '',
        technicianId: '',
        dateFrom: '',
        dateTo: ''
    },

    /**
     * Initialize page
     */
    init() {
        // Setup will be done on load
    },

    /**
     * Load page data
     */
    async load() {
        const container = Utils.$('#page-invoices');
        if (!container) return;

        const isDirector = Auth.isDirector();

        container.innerHTML = `
            <div class="page-header flex-between">
                <div>
                    <h1 class="page-title">Фактури и разходи</h1>
                    <p class="page-subtitle" id="invoices-count">Зареждане...</p>
                </div>
                <button type="button" class="btn btn-primary" onclick="App.navigateTo('new-expense')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Нов
                </button>
            </div>
            
            ${isDirector ? `
                <div class="card mb-md">
                    <div class="card-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Обект</label>
                                <select id="filter-object">
                                    <option value="">Всички обекти</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Техник</label>
                                <select id="filter-technician">
                                    <option value="">Всички техници</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>От дата</label>
                                <input type="date" id="filter-date-from">
                            </div>
                            <div class="form-group">
                                <label>До дата</label>
                                <input type="date" id="filter-date-to">
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div id="invoices-list">
                <div class="skeleton-list"></div>
            </div>
        `;

        // Setup filter listeners for directors
        if (isDirector) {
            await this.loadFilters();
            this.setupFilterListeners();
        }

        // Load invoices
        await this.loadInvoices();
    },

    /**
     * Load filter options
     */
    async loadFilters() {
        try {
            const [objects, users] = await Promise.all([
                App.getObjects(),
                App.getUsers()
            ]);

            const objectSelect = Utils.$('#filter-object');
            const techSelect = Utils.$('#filter-technician');

            if (objectSelect) {
                objects.forEach(obj => {
                    objectSelect.appendChild(Utils.createElement('option', { value: obj.id }, obj.name));
                });
            }

            if (techSelect) {
                users.filter(u => u.role === CONFIG.ROLES.TECHNICIAN).forEach(tech => {
                    techSelect.appendChild(Utils.createElement('option', { value: tech.id }, tech.name));
                });
            }
        } catch (error) {
            console.error('Failed to load filters:', error);
        }
    },

    /**
     * Setup filter event listeners
     */
    setupFilterListeners() {
        const applyFilters = Utils.debounce(() => this.loadInvoices(), 300);

        ['#filter-object', '#filter-technician', '#filter-date-from', '#filter-date-to'].forEach(selector => {
            Utils.$(selector)?.addEventListener('change', (e) => {
                const key = selector.replace('#filter-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.filters[key] = e.target.value;
                applyFilters();
            });
        });
    },

    /**
     * Load invoices list
     */
    async loadInvoices() {
        const container = Utils.$('#invoices-list');
        if (!container) return;

        try {
            const filters = Auth.isDirector() ? this.filters : { technicianId: Auth.getUser().id };
            const invoices = await API.getInvoices(filters);

            // Update count
            const countEl = Utils.$('#invoices-count');
            if (countEl) {
                const total = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                countEl.textContent = `${invoices.length} записа • ${Utils.formatCurrency(total)}`;
            }

            // Render list
            this.renderInvoices(invoices);

        } catch (error) {
            console.error('Failed to load invoices:', error);
            container.innerHTML = '';
            container.appendChild(Components.createEmptyState({
                message: 'Грешка при зареждане'
            }));
        }
    },

    /**
     * Render invoices list
     */
    renderInvoices(invoices) {
        const container = Utils.$('#invoices-list');
        if (!container) return;

        container.innerHTML = '';

        if (!invoices || invoices.length === 0) {
            container.appendChild(Components.createEmptyState({
                message: 'Няма намерени фактури',
                actionText: 'Добави разход',
                action: () => App.navigateTo('new-expense')
            }));
            return;
        }

        // Group by date
        const grouped = this.groupByDate(invoices);

        Object.entries(grouped).forEach(([date, items]) => {
            // Date header
            const dateHeader = Utils.createElement('div', {
                className: 'text-muted mb-sm mt-md',
                style: 'font-size: 12px; font-weight: 600;'
            }, date);
            container.appendChild(dateHeader);

            // List for this date
            const list = Utils.createElement('div', { className: 'list' });

            items.forEach(invoice => {
                list.appendChild(Components.createListItem({
                    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>`,
                    title: invoice.vendor,
                    subtitle: `${invoice.technicianName || ''} ${invoice.invoiceNumber ? '• №' + invoice.invoiceNumber : ''}`,
                    value: Utils.formatCurrency(invoice.totalAmount),
                    valueClass: 'negative',
                    badge: invoice.objectName || '',
                    badgeClass: 'primary',
                    onClick: () => this.showInvoiceDetails(invoice)
                }));
            });

            container.appendChild(list);
        });
    },

    /**
     * Group invoices by date
     */
    groupByDate(invoices) {
        const groups = {};
        
        invoices.forEach(inv => {
            const date = Utils.formatDate(inv.date);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(inv);
        });

        // Sort by date descending
        return Object.fromEntries(
            Object.entries(groups).sort((a, b) => {
                const dateA = Utils.parseBulgarianDate(a[0]);
                const dateB = Utils.parseBulgarianDate(b[0]);
                return dateB - dateA;
            })
        );
    },

    /**
     * Show invoice details modal
     */
    async showInvoiceDetails(invoice) {
        // Load full invoice with positions
        try {
            const fullInvoice = await API.getInvoice(invoice.id);
            
            const positions = fullInvoice.positions || [];
            const positionsHtml = positions.map(pos => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <div>${pos.name}</div>
                        <div class="text-muted" style="font-size: 12px;">
                            ${pos.quantity} x ${Utils.formatCurrency(pos.unitPrice)} 
                            ${pos.objectName ? `• ${pos.objectName}` : ''}
                        </div>
                    </div>
                    <div style="font-weight: 500;">${Utils.formatCurrency(pos.total)}</div>
                </div>
            `).join('');

            Components.modal.show({
                title: 'Детайли за разход',
                content: `
                    <div style="margin-bottom: 16px;">
                        <div class="text-muted" style="font-size: 12px;">Доставчик</div>
                        <div style="font-weight: 500;">${fullInvoice.vendor}</div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Дата</div>
                            <div>${Utils.formatDate(fullInvoice.date)}</div>
                        </div>
                        <div>
                            <div class="text-muted" style="font-size: 12px;">№ Фактура</div>
                            <div>${fullInvoice.invoiceNumber || '-'}</div>
                        </div>
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Техник</div>
                            <div>${fullInvoice.technicianName || '-'}</div>
                        </div>
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Плащане</div>
                            <div>${this.getPaymentMethodLabel(fullInvoice.paymentMethod)}</div>
                        </div>
                    </div>
                    
                    <div class="text-muted" style="font-size: 12px; margin-bottom: 8px;">Позиции</div>
                    ${positionsHtml}
                    
                    <div style="display: flex; justify-content: space-between; margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                        <strong>Общо</strong>
                        <strong>${Utils.formatCurrency(fullInvoice.totalAmount)}</strong>
                    </div>
                    
                    ${fullInvoice.notes ? `
                        <div style="margin-top: 16px;">
                            <div class="text-muted" style="font-size: 12px;">Бележки</div>
                            <div>${fullInvoice.notes}</div>
                        </div>
                    ` : ''}
                `,
                footer: Auth.isDirector() ? `
                    <button type="button" class="btn btn-danger" onclick="InvoicesPage.deleteInvoice('${invoice.id}')">
                        Изтрий
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">
                        Затвори
                    </button>
                ` : `
                    <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">
                        Затвори
                    </button>
                `
            });
            
        } catch (error) {
            console.error('Failed to load invoice details:', error);
            Components.toast.error('Грешка при зареждане на детайли');
        }
    },

    /**
     * Delete invoice
     */
    async deleteInvoice(id) {
        const confirmed = await Components.modal.confirm(
            'Сигурни ли сте, че искате да изтриете този разход?',
            { 
                title: 'Изтриване',
                confirmText: 'Изтрий',
                confirmClass: 'btn-danger'
            }
        );

        if (confirmed) {
            try {
                await API.deleteInvoice(id);
                Components.toast.success('Разходът е изтрит');
                Components.modal.close();
                this.loadInvoices();
            } catch (error) {
                Components.toast.error('Грешка при изтриване');
            }
        }
    },

    /**
     * Get payment method label
     */
    getPaymentMethodLabel(method) {
        const labels = {
            'cash': 'В брой',
            'bank': 'Банков превод',
            'card': 'Карта'
        };
        return labels[method] || method || '-';
    }
};

// Register page
App.registerPage('invoices', InvoicesPage);
