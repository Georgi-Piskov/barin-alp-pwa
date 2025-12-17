/**
 * BARIN ALP PWA - Bank Upload Page
 * Upload and parse Asset Bank PDF statements
 */

const BankUploadPage = {
    // Parsed transactions
    parsedTransactions: [],

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
        const container = Utils.$('#page-bank-upload');
        if (!container) return;

        this.parsedTransactions = [];

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Банково извлечение</h1>
                <p class="page-subtitle">Asset Bank PDF</p>
            </div>
            
            <!-- Upload Section -->
            <div class="card">
                <div class="card-body">
                    <div class="upload-area" id="upload-area" style="
                        border: 2px dashed var(--border-color);
                        border-radius: var(--border-radius-lg);
                        padding: 32px;
                        text-align: center;
                        cursor: pointer;
                        transition: border-color 0.2s;
                    ">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom: 16px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17,8 12,3 7,8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <p style="margin-bottom: 8px;">Натиснете за качване или плъзнете PDF файл</p>
                        <p class="text-muted" style="font-size: 12px;">Поддържа се Asset Bank извлечение</p>
                        <input type="file" id="pdf-input" accept=".pdf" style="display: none;">
                    </div>
                    
                    <div id="upload-progress" class="hidden" style="margin-top: 16px;">
                        <div class="flex-between mb-sm">
                            <span>Обработка...</span>
                            <span id="progress-percent">0%</span>
                        </div>
                        <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px; overflow: hidden;">
                            <div id="progress-bar" style="height: 100%; background: var(--primary); width: 0%; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Parsed Results -->
            <div id="parsed-results" class="hidden mt-lg">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Намерени транзакции</h3>
                        <span class="badge primary" id="tx-count">0</span>
                    </div>
                    <div class="card-body" id="transactions-list">
                        <!-- Will be populated -->
                    </div>
                    <div class="card-footer">
                        <button type="button" class="btn btn-secondary" id="clear-results-btn">
                            Изчисти
                        </button>
                        <button type="button" class="btn btn-primary" id="import-btn">
                            Импортирай избраните
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Recent Imports -->
            <div class="card mt-lg">
                <div class="card-header">
                    <h3 class="card-title">Последни импорти</h3>
                </div>
                <div class="card-body" id="recent-imports">
                    <div class="skeleton-list"></div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        await this.loadRecentImports();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const uploadArea = Utils.$('#upload-area');
        const fileInput = Utils.$('#pdf-input');

        // Click to upload
        uploadArea?.addEventListener('click', () => fileInput?.click());

        // File selected
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFile(file);
        });

        // Drag and drop
        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
        });

        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
        });

        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            const file = e.dataTransfer.files[0];
            if (file?.type === 'application/pdf') {
                this.handleFile(file);
            } else {
                Components.toast.error('Моля качете PDF файл');
            }
        });

        // Clear results
        Utils.$('#clear-results-btn')?.addEventListener('click', () => {
            this.parsedTransactions = [];
            Utils.hide('#parsed-results');
        });

        // Import
        Utils.$('#import-btn')?.addEventListener('click', () => this.importSelected());
    },

    /**
     * Handle uploaded file
     */
    async handleFile(file) {
        Utils.show('#upload-progress');
        Utils.$('#progress-bar').style.width = '10%';
        Utils.$('#progress-percent').textContent = '10%';

        try {
            // Convert to base64
            const base64 = await this.fileToBase64(file);
            
            Utils.$('#progress-bar').style.width = '30%';
            Utils.$('#progress-percent').textContent = '30%';

            // Send to API for parsing
            const result = await API.uploadBankStatement(base64, file.name);

            Utils.$('#progress-bar').style.width = '100%';
            Utils.$('#progress-percent').textContent = '100%';

            // Show results
            setTimeout(() => {
                Utils.hide('#upload-progress');
                this.showParsedResults(result.transactions || []);
            }, 500);

        } catch (error) {
            Utils.hide('#upload-progress');
            console.error('Upload error:', error);
            Components.toast.error(error.message || 'Грешка при обработка на файла');
        }

        // Reset file input
        Utils.$('#pdf-input').value = '';
    },

    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Show parsed results
     */
    showParsedResults(transactions) {
        this.parsedTransactions = transactions.map((tx, index) => ({
            ...tx,
            id: index,
            selected: true
        }));

        const container = Utils.$('#transactions-list');
        const countBadge = Utils.$('#tx-count');

        if (!container) return;

        container.innerHTML = '';
        countBadge.textContent = transactions.length;

        if (transactions.length === 0) {
            container.appendChild(Components.createEmptyState({
                message: 'Не са намерени транзакции в документа'
            }));
            Utils.show('#parsed-results');
            return;
        }

        // Create list
        const list = Utils.createElement('div', { className: 'list' });

        this.parsedTransactions.forEach(tx => {
            const isIncome = tx.amount > 0;
            
            const item = Utils.createElement('div', {
                className: 'list-item',
                'data-id': tx.id
            });

            item.innerHTML = `
                <label style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                    <input type="checkbox" ${tx.selected ? 'checked' : ''} 
                           style="margin-right: 12px; width: 20px; height: 20px;">
                    <div class="list-item-content" style="flex: 1;">
                        <div class="list-item-title">${tx.description || 'Транзакция'}</div>
                        <div class="list-item-subtitle">
                            ${Utils.formatDate(tx.date)} • Реф: ${tx.reference || '-'}
                        </div>
                    </div>
                    <div class="list-item-value ${isIncome ? 'positive' : 'negative'}">
                        ${isIncome ? '+' : ''}${Utils.formatCurrency(tx.amount)}
                    </div>
                </label>
            `;

            // Checkbox change handler
            item.querySelector('input').addEventListener('change', (e) => {
                const txItem = this.parsedTransactions.find(t => t.id === tx.id);
                if (txItem) txItem.selected = e.target.checked;
            });

            list.appendChild(item);
        });

        container.appendChild(list);
        Utils.show('#parsed-results');

        // Summary
        const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const summaryDiv = Utils.createElement('div', {
            style: 'margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;'
        });
        summaryDiv.innerHTML = `
            <div class="flex-between">
                <span>Общо транзакции:</span>
                <strong>${transactions.length}</strong>
            </div>
            <div class="flex-between mt-sm">
                <span>Нетна сума:</span>
                <strong class="${total >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(total)}</strong>
            </div>
        `;
        container.appendChild(summaryDiv);
    },

    /**
     * Import selected transactions
     */
    async importSelected() {
        const selected = this.parsedTransactions.filter(tx => tx.selected);

        if (selected.length === 0) {
            Components.toast.warning('Изберете поне една транзакция');
            return;
        }

        // Show technician selection modal
        Components.modal.show({
            title: 'Свържи с техник',
            content: `
                <p style="margin-bottom: 16px;">Избрахте ${selected.length} транзакции за импорт.</p>
                <p style="margin-bottom: 8px;">Изберете техник за банковите преводи:</p>
                <select id="import-technician" style="width: 100%; padding: 12px;">
                    <option value="">-- Без техник (само запис) --</option>
                </select>
                <p class="text-muted" style="font-size: 12px; margin-top: 8px;">
                    Ако изберете техник, входящите суми ще се добавят към баланса му.
                </p>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Отказ</button>
                <button type="button" class="btn btn-primary" id="confirm-import-btn">Импортирай</button>
            `
        });

        // Load technicians
        try {
            const users = await App.getUsers();
            const select = Utils.$('#import-technician');
            users.filter(u => u.role === CONFIG.ROLES.TECHNICIAN).forEach(tech => {
                select.appendChild(Utils.createElement('option', { value: tech.id }, tech.name));
            });
        } catch (e) {
            console.error('Failed to load technicians:', e);
        }

        // Confirm import
        Utils.$('#confirm-import-btn').addEventListener('click', async () => {
            const technicianId = Utils.$('#import-technician').value || null;

            try {
                // Import transactions
                for (const tx of selected) {
                    if (tx.amount > 0 && technicianId) {
                        // Incoming transfer - add to technician balance
                        await API.createTransaction({
                            userId: technicianId,
                            type: CONFIG.TRANSACTION_TYPES.BANK_TRANSFER,
                            amount: tx.amount,
                            date: tx.date,
                            note: `Банков превод: ${tx.description || ''} (Реф: ${tx.reference || '-'})`
                        });
                    }
                }

                Components.toast.success(`Импортирани ${selected.length} транзакции`);
                Components.modal.close();
                
                // Clear and reload
                this.parsedTransactions = [];
                Utils.hide('#parsed-results');
                App.invalidateCache('users');
                this.loadRecentImports();

            } catch (error) {
                Components.toast.error(error.message || 'Грешка при импорт');
            }
        });
    },

    /**
     * Load recent imports
     */
    async loadRecentImports() {
        const container = Utils.$('#recent-imports');
        if (!container) return;

        try {
            const transactions = await API.getBankTransactions({ limit: 10 });

            container.innerHTML = '';

            if (!transactions || transactions.length === 0) {
                container.appendChild(Components.createEmptyState({
                    message: 'Няма импортирани транзакции'
                }));
                return;
            }

            const list = Utils.createElement('div', { className: 'list' });

            transactions.forEach(tx => {
                list.appendChild(Components.createListItem({
                    title: tx.description || 'Банкова транзакция',
                    subtitle: `${Utils.formatDate(tx.date)} • ${tx.technicianName || 'Без техник'}`,
                    value: Utils.formatCurrency(tx.amount),
                    valueClass: tx.amount >= 0 ? 'positive' : 'negative'
                }));
            });

            container.appendChild(list);

        } catch (error) {
            console.error('Failed to load recent imports:', error);
            container.innerHTML = '';
            container.appendChild(Components.createEmptyState({
                message: 'Грешка при зареждане'
            }));
        }
    }
};

// Register page
App.registerPage('bank-upload', BankUploadPage);
