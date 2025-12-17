/**
 * BARIN ALP PWA - Dashboard Page
 * Shows balance overview for technicians or summary for directors
 */

const DashboardPage = {
    /**
     * Initialize page
     */
    init() {
        // Nothing to initialize yet
    },

    /**
     * Load page data
     */
    async load() {
        const container = Utils.$('#page-dashboard');
        if (!container) return;

        if (Auth.isDirector()) {
            await this.loadDirectorDashboard(container);
        } else {
            await this.loadTechnicianDashboard(container);
        }
    },

    /**
     * Load director dashboard with overview
     */
    async loadDirectorDashboard(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Общ преглед</h1>
                <p class="page-subtitle">Добре дошли, ${Auth.getDisplayName()}</p>
            </div>
            
            <div class="stats-grid" id="dashboard-stats">
                <div class="stat-card skeleton"></div>
                <div class="stat-card skeleton"></div>
                <div class="stat-card skeleton"></div>
                <div class="stat-card skeleton"></div>
            </div>
            
            <div class="card mt-lg">
                <div class="card-header">
                    <h3 class="card-title">Баланси по техници</h3>
                </div>
                <div class="card-body" id="technicians-balance-list">
                    <div class="skeleton-list"></div>
                </div>
            </div>
            
            <div class="card mt-lg">
                <div class="card-header">
                    <h3 class="card-title">Последни разходи</h3>
                    <a href="#invoices" class="btn btn-sm btn-outline">Виж всички</a>
                </div>
                <div class="card-body" id="recent-expenses-list">
                    <div class="skeleton-list"></div>
                </div>
            </div>
        `;

        try {
            // Load overview data
            const [overview, users] = await Promise.all([
                API.getOverviewReport(),
                API.getUsers()
            ]);

            // Update stats
            this.renderStats(overview);
            
            // Update technicians list
            this.renderTechnicianBalances(users.filter(u => u.role === CONFIG.ROLES.TECHNICIAN));
            
            // Update recent expenses
            this.renderRecentExpenses(overview.recentExpenses || []);
            
        } catch (error) {
            console.error('Dashboard load error:', error);
            Components.toast.error('Грешка при зареждане на данни');
        }
    },

    /**
     * Load technician dashboard with personal balance
     */
    async loadTechnicianDashboard(container) {
        const user = Auth.getUser();
        
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Моят баланс</h1>
                <p class="page-subtitle">Здравей, ${Auth.getDisplayName()}</p>
            </div>
            
            <div class="stat-card primary" style="margin-bottom: var(--spacing-lg);">
                <div class="stat-label">Наличен баланс</div>
                <div class="stat-value" id="my-balance">---</div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Последни транзакции</h3>
                </div>
                <div class="card-body" id="my-transactions-list">
                    <div class="skeleton-list"></div>
                </div>
            </div>
            
            <div class="mt-lg">
                <button type="button" class="btn btn-primary btn-block btn-lg" onclick="App.navigateTo('new-expense')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Нов разход
                </button>
            </div>
        `;

        try {
            // Load balance and transactions
            const balanceData = await API.getUserBalance(user.id);
            
            Utils.$('#my-balance').textContent = Utils.formatCurrency(balanceData.balance);
            
            this.renderMyTransactions(balanceData.transactions || []);
            
        } catch (error) {
            console.error('Dashboard load error:', error);
            Components.toast.error('Грешка при зареждане на баланс');
        }
    },

    /**
     * Render stats cards
     */
    renderStats(overview) {
        const statsContainer = Utils.$('#dashboard-stats');
        if (!statsContainer) return;

        statsContainer.innerHTML = '';
        
        const stats = [
            {
                label: 'Общо разходи (месец)',
                value: Utils.formatCurrency(overview.totalExpensesMonth || 0),
                type: ''
            },
            {
                label: 'Активни обекти',
                value: overview.activeObjects || 0,
                type: 'primary'
            },
            {
                label: 'Общ баланс техници',
                value: Utils.formatCurrency(overview.totalTechnicianBalance || 0),
                type: 'success'
            },
            {
                label: 'Инструменти',
                value: overview.totalTools || 0,
                type: ''
            }
        ];

        stats.forEach(stat => {
            statsContainer.appendChild(Components.createStatCard(stat));
        });
    },

    /**
     * Render technician balances list
     */
    renderTechnicianBalances(technicians) {
        const container = Utils.$('#technicians-balance-list');
        if (!container) return;

        if (!technicians || technicians.length === 0) {
            container.appendChild(Components.createEmptyState({
                message: 'Няма техници'
            }));
            return;
        }

        const list = Utils.createElement('div', { className: 'list' });
        
        technicians.forEach(tech => {
            const isPositive = (tech.balance || 0) >= 0;
            list.appendChild(Components.createListItem({
                icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
                title: tech.name,
                subtitle: tech.username,
                value: Utils.formatCurrency(tech.balance || 0),
                valueClass: isPositive ? 'positive' : 'negative',
                onClick: () => App.navigateTo('technicians')
            }));
        });

        container.innerHTML = '';
        container.appendChild(list);
    },

    /**
     * Render recent expenses
     */
    renderRecentExpenses(expenses) {
        const container = Utils.$('#recent-expenses-list');
        if (!container) return;

        if (!expenses || expenses.length === 0) {
            container.appendChild(Components.createEmptyState({
                message: 'Няма скорошни разходи'
            }));
            return;
        }

        const list = Utils.createElement('div', { className: 'list' });
        
        expenses.slice(0, 5).forEach(expense => {
            list.appendChild(Components.createListItem({
                title: expense.vendor || 'Разход',
                subtitle: `${expense.technicianName} • ${Utils.formatDate(expense.date)}`,
                value: Utils.formatCurrency(expense.amount),
                valueClass: 'negative',
                onClick: () => App.navigateTo('invoices')
            }));
        });

        container.innerHTML = '';
        container.appendChild(list);
    },

    /**
     * Render my transactions (for technician)
     */
    renderMyTransactions(transactions) {
        const container = Utils.$('#my-transactions-list');
        if (!container) return;

        if (!transactions || transactions.length === 0) {
            container.appendChild(Components.createEmptyState({
                message: 'Няма транзакции'
            }));
            return;
        }

        const list = Utils.createElement('div', { className: 'list' });
        
        transactions.slice(0, 10).forEach(tx => {
            const isIncome = tx.type === CONFIG.TRANSACTION_TYPES.CASH_FUNDING || 
                            tx.type === CONFIG.TRANSACTION_TYPES.BANK_TRANSFER;
            
            const typeLabels = {
                [CONFIG.TRANSACTION_TYPES.CASH_FUNDING]: 'Захранване (каса)',
                [CONFIG.TRANSACTION_TYPES.BANK_TRANSFER]: 'Банков превод',
                [CONFIG.TRANSACTION_TYPES.EXPENSE]: 'Разход',
                [CONFIG.TRANSACTION_TYPES.INVOICE]: 'Фактура'
            };

            list.appendChild(Components.createListItem({
                title: typeLabels[tx.type] || tx.type,
                subtitle: Utils.formatDate(tx.date),
                value: (isIncome ? '+' : '-') + Utils.formatCurrency(Math.abs(tx.amount)),
                valueClass: isIncome ? 'positive' : 'negative'
            }));
        });

        container.innerHTML = '';
        container.appendChild(list);
    }
};

// Register page
App.registerPage('dashboard', DashboardPage);
