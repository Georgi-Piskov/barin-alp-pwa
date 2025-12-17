/**
 * BARIN ALP PWA - Inventory Page
 * Tool management with photo capture
 */

const InventoryPage = {
    // Filter state
    currentFilter: 'all',

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
        const container = Utils.$('#page-inventory');
        if (!container) return;

        const isDirector = Auth.isDirector();

        container.innerHTML = `
            <div class="page-header flex-between">
                <div>
                    <h1 class="page-title">Инвентар</h1>
                    <p class="page-subtitle" id="inventory-count">Зареждане...</p>
                </div>
                ${isDirector ? `
                    <button type="button" class="btn btn-primary" id="add-tool-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Добави
                    </button>
                ` : ''}
            </div>
            
            <!-- Filter tabs -->
            <div class="filter-tabs mb-md" style="display: flex; gap: 8px; overflow-x: auto;">
                <button type="button" class="btn btn-sm filter-tab active" data-filter="all">Всички</button>
                <button type="button" class="btn btn-sm btn-outline filter-tab" data-filter="available">Налични</button>
                <button type="button" class="btn btn-sm btn-outline filter-tab" data-filter="assigned">Раздадени</button>
                <button type="button" class="btn btn-sm btn-outline filter-tab" data-filter="maintenance">В ремонт</button>
            </div>
            
            <!-- Search -->
            <div class="form-group mb-md">
                <input type="search" id="inventory-search" placeholder="Търси по име или код..." 
                       style="width: 100%;">
            </div>
            
            <div id="inventory-list">
                <div class="skeleton-list"></div>
            </div>
        `;

        // Setup event listeners
        this.setupEventListeners();

        // Load inventory
        await this.loadInventory();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add tool button
        Utils.$('#add-tool-btn')?.addEventListener('click', () => this.showAddToolModal());

        // Filter tabs
        Utils.$$('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                Utils.$$('.filter-tab').forEach(t => {
                    t.classList.remove('active');
                    t.classList.add('btn-outline');
                });
                e.target.classList.add('active');
                e.target.classList.remove('btn-outline');
                
                this.currentFilter = e.target.dataset.filter;
                this.loadInventory();
            });
        });

        // Search
        Utils.$('#inventory-search')?.addEventListener('input', 
            Utils.debounce((e) => this.loadInventory(e.target.value), 300)
        );
    },

    /**
     * Load inventory list
     */
    async loadInventory(searchQuery = '') {
        const container = Utils.$('#inventory-list');
        if (!container) return;

        try {
            const filters = {
                status: this.currentFilter !== 'all' ? this.currentFilter : undefined,
                search: searchQuery || undefined
            };

            const inventory = await API.getInventory(filters);

            // Update count
            const countEl = Utils.$('#inventory-count');
            if (countEl) {
                countEl.textContent = `${inventory.length} инструмента`;
            }

            // Render list
            this.renderInventory(inventory);

        } catch (error) {
            console.error('Failed to load inventory:', error);
            container.innerHTML = '';
            container.appendChild(Components.createEmptyState({
                message: 'Грешка при зареждане'
            }));
        }
    },

    /**
     * Render inventory list
     */
    renderInventory(items) {
        const container = Utils.$('#inventory-list');
        if (!container) return;

        container.innerHTML = '';

        if (!items || items.length === 0) {
            container.appendChild(Components.createEmptyState({
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>`,
                message: 'Няма намерени инструменти',
                actionText: Auth.isDirector() ? 'Добави инструмент' : null,
                action: Auth.isDirector() ? () => this.showAddToolModal() : null
            }));
            return;
        }

        const list = Utils.createElement('div', { className: 'list' });

        items.forEach(tool => {
            const statusBadge = this.getStatusBadge(tool.status);
            
            list.appendChild(Components.createListItem({
                icon: tool.photoUrl ? 
                    `<img src="${tool.photoUrl}" alt="${tool.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;">` :
                    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>`,
                title: tool.name,
                subtitle: `${tool.code || ''} ${tool.assignedToName ? `• При ${tool.assignedToName}` : ''}`,
                badge: statusBadge.label,
                badgeClass: statusBadge.class,
                onClick: () => this.showToolDetails(tool)
            }));
        });

        container.appendChild(list);
    },

    /**
     * Get status badge info
     */
    getStatusBadge(status) {
        const badges = {
            [CONFIG.TOOL_STATUS.AVAILABLE]: { label: 'Наличен', class: 'success' },
            [CONFIG.TOOL_STATUS.ASSIGNED]: { label: 'Раздаден', class: 'primary' },
            [CONFIG.TOOL_STATUS.MAINTENANCE]: { label: 'В ремонт', class: 'warning' },
            [CONFIG.TOOL_STATUS.LOST]: { label: 'Изгубен', class: 'danger' }
        };
        return badges[status] || { label: status, class: '' };
    },

    /**
     * Show add tool modal
     */
    showAddToolModal() {
        Components.modal.show({
            title: 'Добави инструмент',
            content: `
                <form id="add-tool-form">
                    <div class="form-group">
                        <label>Име на инструмента *</label>
                        <input type="text" name="name" required placeholder="Бормашина Makita">
                    </div>
                    
                    <div class="form-group">
                        <label>Код / Инв. номер</label>
                        <input type="text" name="code" placeholder="INV-001">
                    </div>
                    
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea name="description" rows="2" placeholder="Допълнителна информация..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Снимка</label>
                        <div id="tool-photo-preview" style="margin-bottom: 8px;"></div>
                        <button type="button" class="btn btn-secondary btn-block" id="capture-photo-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                <circle cx="12" cy="13" r="4"/>
                            </svg>
                            Добави снимка
                        </button>
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Отказ</button>
                <button type="button" class="btn btn-primary" id="save-tool-btn">Запази</button>
            `
        });

        let capturedPhoto = null;

        // Photo capture
        Utils.$('#capture-photo-btn').addEventListener('click', async () => {
            const photo = await Camera.selectPhoto();
            if (photo) {
                capturedPhoto = photo;
                Utils.$('#tool-photo-preview').innerHTML = `
                    <img src="${photo}" style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px;">
                `;
            }
        });

        // Save
        Utils.$('#save-tool-btn').addEventListener('click', async () => {
            const form = Utils.$('#add-tool-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = Utils.getFormData(form);
            
            try {
                const toolData = {
                    name: formData.name,
                    code: formData.code || null,
                    description: formData.description || null,
                    status: CONFIG.TOOL_STATUS.AVAILABLE,
                    photo: capturedPhoto
                };

                await API.createTool(toolData);
                
                Components.toast.success('Инструментът е добавен');
                Components.modal.close();
                this.loadInventory();
                
            } catch (error) {
                Components.toast.error(error.message || 'Грешка при запис');
            }
        });
    },

    /**
     * Show tool details
     */
    async showToolDetails(tool) {
        const isDirector = Auth.isDirector();
        
        try {
            const fullTool = await API.getTool(tool.id);
            const statusBadge = this.getStatusBadge(fullTool.status);

            Components.modal.show({
                title: fullTool.name,
                content: `
                    ${fullTool.photoUrl ? `
                        <img src="${fullTool.photoUrl}" style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; margin-bottom: 16px;">
                    ` : ''}
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Код</div>
                            <div>${fullTool.code || '-'}</div>
                        </div>
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Статус</div>
                            <span class="badge ${statusBadge.class}">${statusBadge.label}</span>
                        </div>
                        <div>
                            <div class="text-muted" style="font-size: 12px;">При</div>
                            <div>${fullTool.assignedToName || 'Склад'}</div>
                        </div>
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Обект</div>
                            <div>${fullTool.objectName || '-'}</div>
                        </div>
                    </div>
                    
                    ${fullTool.description ? `
                        <div style="margin-bottom: 16px;">
                            <div class="text-muted" style="font-size: 12px;">Описание</div>
                            <div>${fullTool.description}</div>
                        </div>
                    ` : ''}
                    
                    <!-- Transfer section -->
                    <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
                        <div class="text-muted" style="font-size: 12px; margin-bottom: 8px;">Предай на</div>
                        <div class="form-row">
                            <select id="transfer-to" style="flex: 1;">
                                <option value="">-- Избери техник --</option>
                            </select>
                            <button type="button" class="btn btn-primary" id="transfer-btn">Предай</button>
                        </div>
                    </div>
                `,
                footer: isDirector ? `
                    <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Затвори</button>
                    <button type="button" class="btn btn-outline" id="edit-tool-btn">Редактирай</button>
                ` : `
                    <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Затвори</button>
                `
            });

            // Load technicians for transfer
            const users = await App.getUsers();
            const techSelect = Utils.$('#transfer-to');
            users.filter(u => u.role === CONFIG.ROLES.TECHNICIAN).forEach(tech => {
                techSelect.appendChild(Utils.createElement('option', { value: tech.id }, tech.name));
            });
            // Add "Склад" option
            techSelect.appendChild(Utils.createElement('option', { value: 'storage' }, 'Склад'));

            // Transfer handler
            Utils.$('#transfer-btn').addEventListener('click', async () => {
                const transferTo = Utils.$('#transfer-to').value;
                if (!transferTo) {
                    Components.toast.warning('Изберете към кого да предадете');
                    return;
                }

                try {
                    // Capture photo before transfer
                    const photo = await Camera.selectPhoto();
                    
                    await API.transferTool(tool.id, {
                        toUserId: transferTo === 'storage' ? null : transferTo,
                        photo: photo
                    });

                    Components.toast.success('Инструментът е предаден');
                    Components.modal.close();
                    this.loadInventory();
                    
                } catch (error) {
                    Components.toast.error(error.message || 'Грешка при предаване');
                }
            });

            // Edit handler
            Utils.$('#edit-tool-btn')?.addEventListener('click', () => {
                Components.modal.close();
                this.showEditToolModal(fullTool);
            });

        } catch (error) {
            console.error('Failed to load tool details:', error);
            Components.toast.error('Грешка при зареждане');
        }
    },

    /**
     * Show edit tool modal
     */
    showEditToolModal(tool) {
        Components.modal.show({
            title: 'Редактирай инструмент',
            content: `
                <form id="edit-tool-form">
                    <div class="form-group">
                        <label>Име *</label>
                        <input type="text" name="name" value="${tool.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Код</label>
                        <input type="text" name="code" value="${tool.code || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Статус</label>
                        <select name="status">
                            <option value="${CONFIG.TOOL_STATUS.AVAILABLE}" ${tool.status === CONFIG.TOOL_STATUS.AVAILABLE ? 'selected' : ''}>Наличен</option>
                            <option value="${CONFIG.TOOL_STATUS.ASSIGNED}" ${tool.status === CONFIG.TOOL_STATUS.ASSIGNED ? 'selected' : ''}>Раздаден</option>
                            <option value="${CONFIG.TOOL_STATUS.MAINTENANCE}" ${tool.status === CONFIG.TOOL_STATUS.MAINTENANCE ? 'selected' : ''}>В ремонт</option>
                            <option value="${CONFIG.TOOL_STATUS.LOST}" ${tool.status === CONFIG.TOOL_STATUS.LOST ? 'selected' : ''}>Изгубен</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea name="description" rows="2">${tool.description || ''}</textarea>
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Отказ</button>
                <button type="button" class="btn btn-primary" id="update-tool-btn">Запази</button>
            `
        });

        Utils.$('#update-tool-btn').addEventListener('click', async () => {
            const form = Utils.$('#edit-tool-form');
            const formData = Utils.getFormData(form);

            try {
                await API.updateTool(tool.id, formData);
                Components.toast.success('Инструментът е обновен');
                Components.modal.close();
                this.loadInventory();
            } catch (error) {
                Components.toast.error('Грешка при запис');
            }
        });
    }
};

// Register page
App.registerPage('inventory', InventoryPage);
