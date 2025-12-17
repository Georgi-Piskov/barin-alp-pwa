/**
 * BARIN ALP PWA - Admin Overview Page
 * Comprehensive overview for directors
 */

const AdminOverviewPage = {
    /**
     * Initialize page
     */
    init() {
        // Setup done on load
    },

    /**
     * Load page data
     */
    async load() {
        const container = Utils.$('#page-admin-overview');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Общ преглед</h1>
                <p class="page-subtitle">Финансово състояние</p>
            </div>
            
            <!-- Overview Stats -->
            <div class="stats-grid" id="overview-stats">
                <div class="stat-card skeleton"></div>
                <div class="stat-card skeleton"></div>
                <div class="stat-card skeleton"></div>
                <div class="stat-card skeleton"></div>
            </div>
            
            <!-- Objects Summary -->
            <div class="card mt-lg">
                <div class="card-header">
                    <h3 class="card-title">Разходи по обекти</h3>
                </div>
                <div class="card-body" id="objects-summary">
                    <div class="skeleton-list"></div>
                </div>
            </div>
            
            <!-- Monthly Breakdown -->
            <div class="card mt-lg">
                <div class="card-header">
                    <h3 class="card-title">Месечен отчет</h3>
                    <select id="month-select" style="width: auto;">
                        <!-- Will be populated -->
                    </select>
                </div>
                <div class="card-body" id="monthly-breakdown">
                    <div class="skeleton-list"></div>
                </div>
            </div>
        `;

        // Setup month selector
        this.setupMonthSelector();

        // Load data
        await this.loadOverviewData();
    },

    /**
     * Setup month selector
     */
    setupMonthSelector() {
        const select = Utils.$('#month-select');
        if (!select) return;

        const months = [
            'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
            'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
        ];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Add last 12 months
        for (let i = 0; i < 12; i++) {
            const monthIndex = (currentMonth - i + 12) % 12;
            const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
            
            const option = Utils.createElement('option', {
                value: `${year}-${String(monthIndex + 1).padStart(2, '0')}`
            }, `${months[monthIndex]} ${year}`);
            
            select.appendChild(option);
        }

        select.addEventListener('change', () => this.loadMonthlyData(select.value));
    },

    /**
     * Load overview data
     */
    async loadOverviewData() {
        try {
            const overview = await API.getOverviewReport();

            // Render stats
            this.renderStats(overview);

            // Render objects summary
            this.renderObjectsSummary(overview.objectsExpenses || []);

            // Load current month data
            const monthSelect = Utils.$('#month-select');
            if (monthSelect?.value) {
                await this.loadMonthlyData(monthSelect.value);
            }

        } catch (error) {
            console.error('Failed to load overview:', error);
            Components.toast.error('Грешка при зареждане на данни');
        }
    },

    /**
     * Render stats
     */
    renderStats(overview) {
        const container = Utils.$('#overview-stats');
        if (!container) return;

        container.innerHTML = '';

        const stats = [
            {
                label: 'Общо разходи (всичко)',
                value: Utils.formatCurrency(overview.totalExpenses || 0),
                type: ''
            },
            {
                label: 'Този месец',
                value: Utils.formatCurrency(overview.totalExpensesMonth || 0),
                type: 'primary'
            },
            {
                label: 'Баланс техници',
                value: Utils.formatCurrency(overview.totalTechnicianBalance || 0),
                type: 'success'
            },
            {
                label: 'Неразпределени',
                value: Utils.formatCurrency(overview.unallocatedExpenses || 0),
                type: overview.unallocatedExpenses > 0 ? 'warning' : ''
            }
        ];

        stats.forEach(stat => {
            container.appendChild(Components.createStatCard(stat));
        });
    },

    /**
     * Render objects expenses summary
     */
    renderObjectsSummary(objects) {
        const container = Utils.$('#objects-summary');
        if (!container) return;

        container.innerHTML = '';

        if (!objects || objects.length === 0) {
            container.appendChild(Components.createEmptyState({
                message: 'Няма данни за обекти'
            }));
            return;
        }

        const list = Utils.createElement('div', { className: 'list' });

        objects.forEach(obj => {
            list.appendChild(Components.createListItem({
                icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>`,
                title: obj.name,
                subtitle: `${obj.invoiceCount || 0} фактури`,
                value: Utils.formatCurrency(obj.totalExpenses || 0),
                valueClass: 'negative',
                badge: obj.status === CONFIG.OBJECT_STATUS.ACTIVE ? 'Активен' : 'Завършен',
                badgeClass: obj.status === CONFIG.OBJECT_STATUS.ACTIVE ? 'success' : '',
                onClick: () => this.showObjectReport(obj)
            }));
        });

        container.appendChild(list);
    },

    /**
     * Load monthly breakdown data
     */
    async loadMonthlyData(yearMonth) {
        const container = Utils.$('#monthly-breakdown');
        if (!container) return;

        container.innerHTML = '<div class="skeleton-list"></div>';

        try {
            // Parse year-month
            const [year, month] = yearMonth.split('-');
            
            // Get invoices for this month
            const invoices = await API.getInvoices({
                dateFrom: `${year}-${month}-01`,
                dateTo: `${year}-${month}-31`
            });

            this.renderMonthlyBreakdown(invoices);

        } catch (error) {
            console.error('Failed to load monthly data:', error);
            container.innerHTML = '';
            container.appendChild(Components.createEmptyState({
                message: 'Грешка при зареждане'
            }));
        }
    },

    /**
     * Render monthly breakdown
     */
    renderMonthlyBreakdown(invoices) {
        const container = Utils.$('#monthly-breakdown');
        if (!container) return;

        container.innerHTML = '';

        if (!invoices || invoices.length === 0) {
            container.appendChild(Components.createEmptyState({
                message: 'Няма разходи за този месец'
            }));
            return;
        }

        // Group by vendor
        const byVendor = {};
        invoices.forEach(inv => {
            const vendor = inv.vendor || 'Други';
            if (!byVendor[vendor]) {
                byVendor[vendor] = { count: 0, total: 0 };
            }
            byVendor[vendor].count++;
            byVendor[vendor].total += inv.totalAmount || 0;
        });

        // Sort by total descending
        const sorted = Object.entries(byVendor)
            .sort((a, b) => b[1].total - a[1].total);

        const list = Utils.createElement('div', { className: 'list' });

        sorted.forEach(([vendor, data]) => {
            list.appendChild(Components.createListItem({
                title: vendor,
                subtitle: `${data.count} фактури`,
                value: Utils.formatCurrency(data.total)
            }));
        });

        // Total row
        const total = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        const totalDiv = Utils.createElement('div', {
            style: 'display: flex; justify-content: space-between; padding: 16px; background: var(--bg-secondary); border-radius: 8px; margin-top: 16px; font-weight: 600;'
        });
        totalDiv.innerHTML = `<span>Общо за месеца</span><span>${Utils.formatCurrency(total)}</span>`;

        container.appendChild(list);
        container.appendChild(totalDiv);
    },

    /**
     * Show object detailed report
     */
    async showObjectReport(obj) {
        try {
            const report = await API.getObjectReport(obj.id);

            Components.modal.show({
                title: obj.name,
                content: `
                    <div class="stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 16px;">
                        <div class="stat-card">
                            <div class="stat-label">Общо разходи</div>
                            <div class="stat-value">${Utils.formatCurrency(report.totalExpenses || 0)}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Брой фактури</div>
                            <div class="stat-value">${report.invoiceCount || 0}</div>
                        </div>
                    </div>
                    
                    <div class="text-muted" style="font-size: 12px; margin-bottom: 8px;">Разбивка по категории</div>
                    <div class="list">
                        ${(report.byCategory || []).map(cat => `
                            <div class="list-item">
                                <div class="list-item-content">
                                    <div class="list-item-title">${cat.name}</div>
                                    <div class="list-item-subtitle">${cat.count} позиции</div>
                                </div>
                                <div class="list-item-value">${Utils.formatCurrency(cat.total)}</div>
                            </div>
                        `).join('') || '<div class="empty-state"><p>Няма данни</p></div>'}
                    </div>
                `,
                footer: `
                    <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Затвори</button>
                `
            });

        } catch (error) {
            Components.toast.error('Грешка при зареждане на отчет');
        }
    }
};

// Register page
App.registerPage('admin-overview', AdminOverviewPage);
