/**
 * BARIN ALP PWA - New Expense Page
 * Invoice entry form with position allocation
 */

const NewExpensePage = {
    // Form state
    positions: [],
    selectedObject: null,
    allocationMode: 'whole', // 'whole' or 'split'

    /**
     * Initialize page
     */
    init() {
        // Setup form event listeners after DOM is ready
        setTimeout(() => this.setupEventListeners(), 100);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const form = Utils.$('#expense-form');
        if (!form) return;

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add position button
        Utils.$('#add-position-btn')?.addEventListener('click', () => this.addPosition());
        
        // Allocation mode toggle
        Utils.$$('input[name="allocation-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.setAllocationMode(e.target.value));
        });
    },

    /**
     * Load page data
     */
    async load() {
        const container = Utils.$('#page-new-expense');
        if (!container) return;

        // Reset state
        this.positions = [];
        this.selectedObject = null;
        this.allocationMode = 'whole';

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Нов разход / Фактура</h1>
            </div>
            
            <form id="expense-form">
                <!-- Invoice Header -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Данни за фактура</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="invoice-number">Номер фактура</label>
                                <input type="text" id="invoice-number" name="invoiceNumber" placeholder="0000000001">
                            </div>
                            <div class="form-group">
                                <label for="invoice-date">Дата</label>
                                <input type="date" id="invoice-date" name="date" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="vendor">Доставчик</label>
                            <input type="text" id="vendor" name="vendor" required placeholder="Име на доставчик">
                        </div>
                        
                        <div class="form-group">
                            <label for="payment-method">Начин на плащане</label>
                            <select id="payment-method" name="paymentMethod" required>
                                <option value="">-- Изберете --</option>
                                <option value="cash" selected>В брой</option>
                                <option value="bank">Банков превод</option>
                                <option value="card">Карта</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Invoice Positions -->
                <div class="card mt-md">
                    <div class="card-header">
                        <h3 class="card-title">Позиции</h3>
                        <button type="button" id="add-position-btn" class="btn btn-sm btn-primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Добави
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="positions-list">
                            <!-- Positions will be added here -->
                        </div>
                        
                        <div class="invoice-total mt-md">
                            <span class="invoice-total-label">Общо:</span>
                            <span class="invoice-total-value" id="invoice-total">0.00 лв.</span>
                        </div>
                    </div>
                </div>
                
                <!-- Object Allocation -->
                <div class="card mt-md">
                    <div class="card-header">
                        <h3 class="card-title">Разпределение по обект</h3>
                    </div>
                    <div class="card-body">
                        <div class="allocation-options">
                            <label class="allocation-option selected">
                                <input type="radio" name="allocation-mode" value="whole" checked>
                                <div>
                                    <strong>Цялата фактура към един обект</strong>
                                    <p class="text-muted" style="font-size: 12px; margin-top: 4px;">
                                        Всички позиции отиват към един обект
                                    </p>
                                </div>
                            </label>
                            
                            <label class="allocation-option">
                                <input type="radio" name="allocation-mode" value="split">
                                <div>
                                    <strong>Разпредели по позиции</strong>
                                    <p class="text-muted" style="font-size: 12px; margin-top: 4px;">
                                        Всяка позиция може да е към различен обект
                                    </p>
                                </div>
                            </label>
                        </div>
                        
                        <div id="allocation-whole" class="mt-md">
                            <div class="form-group">
                                <label for="object-select">Обект</label>
                                <select id="object-select" name="objectId" required>
                                    <option value="">-- Изберете обект --</option>
                                </select>
                            </div>
                        </div>
                        
                        <div id="allocation-split" class="mt-md hidden">
                            <!-- Split allocation will appear here -->
                        </div>
                    </div>
                </div>
                
                <!-- Notes -->
                <div class="card mt-md">
                    <div class="card-body">
                        <div class="form-group">
                            <label for="notes">Бележки (опционално)</label>
                            <textarea id="notes" name="notes" rows="2" placeholder="Допълнителна информация..."></textarea>
                        </div>
                    </div>
                </div>
                
                <!-- Submit -->
                <div class="mt-lg">
                    <button type="submit" class="btn btn-primary btn-block btn-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        Запази разход
                    </button>
                </div>
            </form>
        `;

        // Re-setup event listeners
        this.setupEventListeners();
        
        // Set default date to today
        Utils.$('#invoice-date').value = Utils.today();
        
        // Add first position
        this.addPosition();
        
        // Load objects
        await this.loadObjects();
    },

    /**
     * Load objects for selection
     */
    async loadObjects() {
        try {
            const objects = await App.getObjects();
            const activeObjects = objects.filter(o => o.status === CONFIG.OBJECT_STATUS.ACTIVE);
            
            const select = Utils.$('#object-select');
            Components.populateSelect(select, activeObjects, 'id', 'name', '-- Изберете обект --');
            
            // Store for split allocation
            this.objects = activeObjects;
            
        } catch (error) {
            console.error('Failed to load objects:', error);
            Components.toast.error('Грешка при зареждане на обекти');
        }
    },

    /**
     * Add position row
     */
    addPosition() {
        const positionId = Utils.generateId();
        const positionIndex = this.positions.length + 1;
        
        this.positions.push({
            id: positionId,
            name: '',
            quantity: 1,
            price: 0,
            objectId: null
        });

        const container = Utils.$('#positions-list');
        
        const row = Utils.createElement('div', {
            className: 'invoice-item',
            'data-id': positionId
        });

        row.innerHTML = `
            <input type="text" class="item-name" placeholder="Описание на позиция ${positionIndex}" 
                   data-field="name" required>
            <input type="number" class="item-qty" placeholder="К-во" value="1" min="0.01" step="0.01"
                   data-field="quantity">
            <input type="number" class="item-price" placeholder="Цена" min="0" step="0.01"
                   data-field="price">
            <span class="item-total">0.00 лв.</span>
            <button type="button" class="btn-icon" data-action="remove" aria-label="Изтрий">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        // Event listeners for inputs
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => this.updatePosition(positionId, e.target.dataset.field, e.target.value));
        });

        // Remove button
        row.querySelector('[data-action="remove"]').addEventListener('click', () => {
            this.removePosition(positionId);
        });

        container.appendChild(row);
    },

    /**
     * Update position data
     */
    updatePosition(id, field, value) {
        const position = this.positions.find(p => p.id === id);
        if (!position) return;

        if (field === 'quantity' || field === 'price') {
            position[field] = parseFloat(value) || 0;
        } else {
            position[field] = value;
        }

        // Update row total
        const row = Utils.$(`[data-id="${id}"]`);
        const total = position.quantity * position.price;
        row.querySelector('.item-total').textContent = Utils.formatCurrency(total);

        // Update invoice total
        this.updateTotal();
        
        // Update split allocation if visible
        if (this.allocationMode === 'split') {
            this.renderSplitAllocation();
        }
    },

    /**
     * Remove position
     */
    removePosition(id) {
        if (this.positions.length <= 1) {
            Components.toast.warning('Трябва да има поне една позиция');
            return;
        }

        this.positions = this.positions.filter(p => p.id !== id);
        Utils.$(`[data-id="${id}"]`)?.remove();
        this.updateTotal();
        
        if (this.allocationMode === 'split') {
            this.renderSplitAllocation();
        }
    },

    /**
     * Update invoice total
     */
    updateTotal() {
        const total = this.positions.reduce((sum, p) => sum + (p.quantity * p.price), 0);
        Utils.$('#invoice-total').textContent = Utils.formatCurrency(total);
    },

    /**
     * Set allocation mode
     */
    setAllocationMode(mode) {
        this.allocationMode = mode;
        
        // Update visual selection
        Utils.$$('.allocation-option').forEach(opt => {
            const radio = opt.querySelector('input[type="radio"]');
            opt.classList.toggle('selected', radio.value === mode);
        });

        if (mode === 'whole') {
            Utils.show('#allocation-whole');
            Utils.hide('#allocation-split');
            Utils.$('#object-select').required = true;
        } else {
            Utils.hide('#allocation-whole');
            Utils.show('#allocation-split');
            Utils.$('#object-select').required = false;
            this.renderSplitAllocation();
        }
    },

    /**
     * Render split allocation UI
     */
    renderSplitAllocation() {
        const container = Utils.$('#allocation-split');
        if (!container || !this.objects) return;

        container.innerHTML = this.positions.map(pos => `
            <div class="allocation-item">
                <div class="allocation-item-info">
                    <strong>${pos.name || 'Позиция'}</strong>
                    <span class="text-muted"> - ${Utils.formatCurrency(pos.quantity * pos.price)}</span>
                </div>
                <select class="allocation-item-select" data-position-id="${pos.id}">
                    <option value="">-- Обект --</option>
                    ${this.objects.map(obj => `
                        <option value="${obj.id}" ${pos.objectId === obj.id ? 'selected' : ''}>
                            ${obj.name}
                        </option>
                    `).join('')}
                </select>
            </div>
        `).join('');

        // Add change listeners
        container.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', (e) => {
                const position = this.positions.find(p => p.id === e.target.dataset.positionId);
                if (position) {
                    position.objectId = e.target.value || null;
                }
            });
        });
    },

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = Utils.getFormData(form);
        
        // Validate positions
        const validPositions = this.positions.filter(p => p.name && p.price > 0);
        if (validPositions.length === 0) {
            Components.toast.error('Добавете поне една позиция с описание и цена');
            return;
        }

        // Validate allocation
        if (this.allocationMode === 'whole') {
            if (!formData.objectId) {
                Components.toast.error('Изберете обект');
                return;
            }
            // Apply object to all positions
            validPositions.forEach(p => p.objectId = formData.objectId);
        } else {
            // Check all positions have objects
            const unallocated = validPositions.filter(p => !p.objectId);
            if (unallocated.length > 0) {
                Components.toast.error('Разпределете всички позиции към обекти');
                return;
            }
        }

        // Build invoice data
        const invoiceData = {
            invoiceNumber: formData.invoiceNumber || null,
            date: formData.date,
            vendor: formData.vendor,
            paymentMethod: formData.paymentMethod,
            notes: formData.notes || null,
            technicianId: Auth.getUser().id,
            positions: validPositions.map(p => ({
                name: p.name,
                quantity: p.quantity,
                unitPrice: p.price,
                total: p.quantity * p.price,
                objectId: p.objectId
            })),
            totalAmount: validPositions.reduce((sum, p) => sum + (p.quantity * p.price), 0)
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            await API.createInvoice(invoiceData);
            
            Components.toast.success('Разходът е записан успешно!');
            App.invalidateCache('invoices');
            App.navigateTo('dashboard');
            
        } catch (error) {
            console.error('Invoice save error:', error);
            Components.toast.error(error.message || 'Грешка при запис');
        } finally {
            submitBtn.disabled = false;
        }
    }
};

// Register page
App.registerPage('new-expense', NewExpensePage);
