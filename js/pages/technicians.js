/**
 * BARIN ALP PWA - Technicians Page
 * Manage technician balances and funding
 */

const TechniciansPage = {
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
        const container = Utils.$('#page-technicians');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Техници</h1>
                <p class="page-subtitle">Управление на баланси</p>
            </div>
            
            <!-- Summary -->
            <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="stat-card" id="total-balance-card">
                    <div class="stat-label">Общ баланс</div>
                    <div class="stat-value" id="total-balance">---</div>
                </div>
                <div class="stat-card primary" id="technicians-count-card">
                    <div class="stat-label">Техници</div>
                    <div class="stat-value" id="technicians-count">---</div>
                </div>
            </div>
            
            <!-- Technicians List -->
            <div class="card mt-lg">
                <div class="card-header">
                    <h3 class="card-title">Баланси</h3>
                </div>
                <div class="card-body" id="technicians-list">
                    <div class="skeleton-list"></div>
                </div>
            </div>
        `;

        await this.loadTechnicians();
    },

    /**
     * Load technicians data
     */
    async loadTechnicians() {
        try {
            const users = await App.getUsers();
            const technicians = users.filter(u => u.role === CONFIG.ROLES.TECHNICIAN);

            // Load balances for each technician
            const techsWithBalance = await Promise.all(
                technicians.map(async tech => {
                    try {
                        const balanceData = await API.getUserBalance(tech.id);
                        return { ...tech, balance: balanceData.balance || 0 };
                    } catch (e) {
                        return { ...tech, balance: 0 };
                    }
                })
            );

            // Update stats
            const totalBalance = techsWithBalance.reduce((sum, t) => sum + t.balance, 0);
            Utils.$('#total-balance').textContent = Utils.formatCurrency(totalBalance);
            Utils.$('#technicians-count').textContent = technicians.length;

            // Update card colors based on balance
            const balanceCard = Utils.$('#total-balance-card');
            if (totalBalance >= 0) {
                balanceCard.classList.add('success');
            } else {
                balanceCard.classList.add('danger');
            }

            // Render list
            this.renderTechnicians(techsWithBalance);

        } catch (error) {
            console.error('Failed to load technicians:', error);
            Components.toast.error('Грешка при зареждане');
        }
    },

    /**
     * Render technicians list
     */
    renderTechnicians(technicians) {
        const container = Utils.$('#technicians-list');
        if (!container) return;

        container.innerHTML = '';

        if (!technicians || technicians.length === 0) {
            container.appendChild(Components.createEmptyState({
                message: 'Няма техници'
            }));
            return;
        }

        const list = Utils.createElement('div', { className: 'list' });

        technicians.forEach(tech => {
            const isPositive = tech.balance >= 0;
            
            const item = Components.createListItem({
                icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>`,
                title: tech.name,
                subtitle: tech.username,
                value: Utils.formatCurrency(tech.balance),
                valueClass: isPositive ? 'positive' : 'negative',
                onClick: () => this.showTechnicianDetails(tech)
            });

            // Add funding button
            const actionBtn = Utils.createElement('button', {
                className: 'btn btn-sm btn-primary',
                style: 'margin-left: 8px;',
                onclick: (e) => {
                    e.stopPropagation();
                    this.showFundingModal(tech);
                }
            }, 'Захрани');

            item.querySelector('.list-item-value').after(actionBtn);
            list.appendChild(item);
        });

        container.appendChild(list);
    },

    /**
     * Show technician details modal
     */
    async showTechnicianDetails(tech) {
        try {
            const balanceData = await API.getUserBalance(tech.id);
            const transactions = balanceData.transactions || [];

            Components.modal.show({
                title: tech.name,
                content: `
                    <div class="stat-card ${balanceData.balance >= 0 ? 'success' : 'danger'}" style="margin-bottom: 16px;">
                        <div class="stat-label">Текущ баланс</div>
                        <div class="stat-value">${Utils.formatCurrency(balanceData.balance)}</div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                        <button type="button" class="btn btn-primary flex-1" id="fund-cash-btn">
                            Захрани (каса)
                        </button>
                        <button type="button" class="btn btn-secondary flex-1" id="fund-bank-btn">
                            Банков превод
                        </button>
                    </div>
                    
                    <div class="text-muted" style="font-size: 12px; margin-bottom: 8px;">Последни транзакции</div>
                    <div class="list" style="max-height: 300px; overflow-y: auto;">
                        ${transactions.slice(0, 20).map(tx => {
                            const isIncome = tx.type === CONFIG.TRANSACTION_TYPES.CASH_FUNDING || 
                                           tx.type === CONFIG.TRANSACTION_TYPES.BANK_TRANSFER;
                            return `
                                <div class="list-item">
                                    <div class="list-item-content">
                                        <div class="list-item-title">${this.getTransactionLabel(tx.type)}</div>
                                        <div class="list-item-subtitle">${Utils.formatDate(tx.date)}</div>
                                    </div>
                                    <div class="list-item-value ${isIncome ? 'positive' : 'negative'}">
                                        ${isIncome ? '+' : '-'}${Utils.formatCurrency(Math.abs(tx.amount))}
                                    </div>
                                </div>
                            `;
                        }).join('') || '<div class="empty-state"><p>Няма транзакции</p></div>'}
                    </div>
                `,
                footer: `
                    <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Затвори</button>
                `
            });

            // Fund buttons
            Utils.$('#fund-cash-btn').addEventListener('click', () => {
                Components.modal.close();
                this.showFundingModal(tech, 'cash');
            });

            Utils.$('#fund-bank-btn').addEventListener('click', () => {
                Components.modal.close();
                this.showFundingModal(tech, 'bank');
            });

        } catch (error) {
            Components.toast.error('Грешка при зареждане');
        }
    },

    /**
     * Show funding modal
     */
    showFundingModal(tech, type = 'cash') {
        const isCash = type === 'cash';

        Components.modal.show({
            title: `Захрани ${tech.name}`,
            content: `
                <form id="funding-form">
                    <div class="form-group">
                        <label>Тип</label>
                        <select name="type" id="funding-type">
                            <option value="cash_funding" ${isCash ? 'selected' : ''}>От каса (в брой)</option>
                            <option value="bank_transfer" ${!isCash ? 'selected' : ''}>Банков превод</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Сума *</label>
                        <input type="number" name="amount" required min="0.01" step="0.01" 
                               placeholder="0.00" style="font-size: 24px; text-align: center;">
                    </div>
                    
                    <div class="form-group">
                        <label>Дата</label>
                        <input type="date" name="date" value="${Utils.today()}">
                    </div>
                    
                    <div class="form-group">
                        <label>Бележка</label>
                        <input type="text" name="note" placeholder="Опционална бележка...">
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Отказ</button>
                <button type="button" class="btn btn-primary" id="submit-funding-btn">Захрани</button>
            `
        });

        Utils.$('#submit-funding-btn').addEventListener('click', async () => {
            const form = Utils.$('#funding-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = Utils.getFormData(form);

            try {
                await API.createTransaction({
                    userId: tech.id,
                    type: formData.type,
                    amount: parseFloat(formData.amount),
                    date: formData.date,
                    note: formData.note || null
                });

                Components.toast.success(`${tech.name} е захранен с ${Utils.formatCurrency(formData.amount)}`);
                Components.modal.close();
                
                // Invalidate cache and reload
                App.invalidateCache('users');
                this.loadTechnicians();

            } catch (error) {
                Components.toast.error(error.message || 'Грешка при захранване');
            }
        });
    },

    /**
     * Get transaction type label
     */
    getTransactionLabel(type) {
        const labels = {
            [CONFIG.TRANSACTION_TYPES.CASH_FUNDING]: 'Захранване (каса)',
            [CONFIG.TRANSACTION_TYPES.BANK_TRANSFER]: 'Банков превод',
            [CONFIG.TRANSACTION_TYPES.EXPENSE]: 'Разход',
            [CONFIG.TRANSACTION_TYPES.INVOICE]: 'Фактура'
        };
        return labels[type] || type;
    }
};

// Register page
App.registerPage('technicians', TechniciansPage);
