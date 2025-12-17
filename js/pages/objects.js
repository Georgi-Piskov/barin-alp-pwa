/**
 * BARIN ALP PWA - Objects Page
 * Manage construction sites/objects
 */

const ObjectsPage = {
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
        const container = Utils.$('#page-objects');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header flex-between">
                <div>
                    <h1 class="page-title">Обекти</h1>
                    <p class="page-subtitle" id="objects-count">Зареждане...</p>
                </div>
                <button type="button" class="btn btn-primary" id="add-object-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Нов обект
                </button>
            </div>
            
            <!-- Filter tabs -->
            <div class="filter-tabs mb-md" style="display: flex; gap: 8px;">
                <button type="button" class="btn btn-sm filter-tab active" data-filter="active">Активни</button>
                <button type="button" class="btn btn-sm btn-outline filter-tab" data-filter="completed">Завършени</button>
                <button type="button" class="btn btn-sm btn-outline filter-tab" data-filter="all">Всички</button>
            </div>
            
            <div id="objects-list">
                <div class="skeleton-list"></div>
            </div>
        `;

        this.setupEventListeners();
        await this.loadObjects('active');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add object button
        Utils.$('#add-object-btn')?.addEventListener('click', () => this.showAddObjectModal());

        // Filter tabs
        Utils.$$('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                Utils.$$('.filter-tab').forEach(t => {
                    t.classList.remove('active');
                    t.classList.add('btn-outline');
                });
                e.target.classList.add('active');
                e.target.classList.remove('btn-outline');
                
                this.loadObjects(e.target.dataset.filter);
            });
        });
    },

    /**
     * Load objects
     */
    async loadObjects(filter = 'active') {
        const container = Utils.$('#objects-list');
        if (!container) return;

        try {
            const includeArchived = filter === 'all' || filter === 'completed';
            const objects = await API.getObjects(includeArchived);

            // Filter based on tab
            let filtered = objects;
            if (filter === 'active') {
                filtered = objects.filter(o => o.status === CONFIG.OBJECT_STATUS.ACTIVE);
            } else if (filter === 'completed') {
                filtered = objects.filter(o => o.status !== CONFIG.OBJECT_STATUS.ACTIVE);
            }

            // Update count
            Utils.$('#objects-count').textContent = `${filtered.length} обекта`;

            // Render
            this.renderObjects(filtered);

            // Update cache
            App.cache.objects = objects;

        } catch (error) {
            console.error('Failed to load objects:', error);
            Components.toast.error('Грешка при зареждане');
        }
    },

    /**
     * Render objects list
     */
    renderObjects(objects) {
        const container = Utils.$('#objects-list');
        if (!container) return;

        container.innerHTML = '';

        if (!objects || objects.length === 0) {
            container.appendChild(Components.createEmptyState({
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>`,
                message: 'Няма обекти',
                actionText: 'Добави обект',
                action: () => this.showAddObjectModal()
            }));
            return;
        }

        const list = Utils.createElement('div', { className: 'list' });

        objects.forEach(obj => {
            const statusBadge = this.getStatusBadge(obj.status);
            
            list.appendChild(Components.createListItem({
                icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>`,
                title: obj.name,
                subtitle: obj.address || 'Без адрес',
                badge: statusBadge.label,
                badgeClass: statusBadge.class,
                value: obj.totalExpenses ? Utils.formatCurrency(obj.totalExpenses) : '',
                onClick: () => this.showObjectDetails(obj)
            }));
        });

        container.appendChild(list);
    },

    /**
     * Get status badge
     */
    getStatusBadge(status) {
        const badges = {
            [CONFIG.OBJECT_STATUS.ACTIVE]: { label: 'Активен', class: 'success' },
            [CONFIG.OBJECT_STATUS.COMPLETED]: { label: 'Завършен', class: 'primary' },
            [CONFIG.OBJECT_STATUS.ARCHIVED]: { label: 'Архивиран', class: '' }
        };
        return badges[status] || { label: status, class: '' };
    },

    /**
     * Show add object modal
     */
    showAddObjectModal() {
        Components.modal.show({
            title: 'Нов обект',
            content: `
                <form id="add-object-form">
                    <div class="form-group">
                        <label>Име на обекта *</label>
                        <input type="text" name="name" required placeholder="Небет Тепе - Етап 2">
                    </div>
                    
                    <div class="form-group">
                        <label>Адрес</label>
                        <input type="text" name="address" placeholder="гр. Пловдив, ул. Примерна 1">
                    </div>
                    
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea name="description" rows="3" placeholder="Допълнителна информация за обекта..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Начална дата</label>
                        <input type="date" name="startDate" value="${Utils.today()}">
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Отказ</button>
                <button type="button" class="btn btn-primary" id="save-object-btn">Създай</button>
            `
        });

        Utils.$('#save-object-btn').addEventListener('click', async () => {
            const form = Utils.$('#add-object-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = Utils.getFormData(form);

            try {
                await API.createObject({
                    name: formData.name,
                    address: formData.address || null,
                    description: formData.description || null,
                    startDate: formData.startDate || Utils.today(),
                    status: CONFIG.OBJECT_STATUS.ACTIVE
                });

                Components.toast.success('Обектът е създаден');
                Components.modal.close();
                App.invalidateCache('objects');
                this.loadObjects('active');

            } catch (error) {
                Components.toast.error(error.message || 'Грешка при създаване');
            }
        });
    },

    /**
     * Show object details
     */
    async showObjectDetails(obj) {
        try {
            const fullObject = await API.getObject(obj.id);
            const statusBadge = this.getStatusBadge(fullObject.status);

            Components.modal.show({
                title: fullObject.name,
                content: `
                    <div style="margin-bottom: 16px;">
                        <span class="badge ${statusBadge.class}">${statusBadge.label}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Адрес</div>
                            <div>${fullObject.address || '-'}</div>
                        </div>
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Начало</div>
                            <div>${Utils.formatDate(fullObject.startDate) || '-'}</div>
                        </div>
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Общо разходи</div>
                            <div style="font-weight: 600;">${Utils.formatCurrency(fullObject.totalExpenses || 0)}</div>
                        </div>
                        <div>
                            <div class="text-muted" style="font-size: 12px;">Фактури</div>
                            <div>${fullObject.invoiceCount || 0}</div>
                        </div>
                    </div>
                    
                    ${fullObject.description ? `
                        <div style="margin-bottom: 16px;">
                            <div class="text-muted" style="font-size: 12px;">Описание</div>
                            <div>${fullObject.description}</div>
                        </div>
                    ` : ''}
                    
                    ${fullObject.status === CONFIG.OBJECT_STATUS.ACTIVE ? `
                        <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
                            <button type="button" class="btn btn-warning btn-block" id="complete-object-btn">
                                Маркирай като завършен
                            </button>
                        </div>
                    ` : ''}
                `,
                footer: `
                    <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Затвори</button>
                    <button type="button" class="btn btn-outline" id="edit-object-btn">Редактирай</button>
                `
            });

            // Complete object handler
            Utils.$('#complete-object-btn')?.addEventListener('click', async () => {
                const confirmed = await Components.modal.confirm(
                    'Сигурни ли сте, че искате да маркирате обекта като завършен?',
                    { title: 'Завършване на обект' }
                );

                if (confirmed) {
                    try {
                        await API.archiveObject(obj.id);
                        Components.toast.success('Обектът е маркиран като завършен');
                        Components.modal.close();
                        App.invalidateCache('objects');
                        this.loadObjects('active');
                    } catch (error) {
                        Components.toast.error('Грешка при обновяване');
                    }
                }
            });

            // Edit handler
            Utils.$('#edit-object-btn')?.addEventListener('click', () => {
                Components.modal.close();
                this.showEditObjectModal(fullObject);
            });

        } catch (error) {
            Components.toast.error('Грешка при зареждане');
        }
    },

    /**
     * Show edit object modal
     */
    showEditObjectModal(obj) {
        Components.modal.show({
            title: 'Редактирай обект',
            content: `
                <form id="edit-object-form">
                    <div class="form-group">
                        <label>Име *</label>
                        <input type="text" name="name" value="${obj.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Адрес</label>
                        <input type="text" name="address" value="${obj.address || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea name="description" rows="3">${obj.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Статус</label>
                        <select name="status">
                            <option value="${CONFIG.OBJECT_STATUS.ACTIVE}" ${obj.status === CONFIG.OBJECT_STATUS.ACTIVE ? 'selected' : ''}>Активен</option>
                            <option value="${CONFIG.OBJECT_STATUS.COMPLETED}" ${obj.status === CONFIG.OBJECT_STATUS.COMPLETED ? 'selected' : ''}>Завършен</option>
                            <option value="${CONFIG.OBJECT_STATUS.ARCHIVED}" ${obj.status === CONFIG.OBJECT_STATUS.ARCHIVED ? 'selected' : ''}>Архивиран</option>
                        </select>
                    </div>
                </form>
            `,
            footer: `
                <button type="button" class="btn btn-secondary" onclick="Components.modal.close()">Отказ</button>
                <button type="button" class="btn btn-primary" id="update-object-btn">Запази</button>
            `
        });

        Utils.$('#update-object-btn').addEventListener('click', async () => {
            const form = Utils.$('#edit-object-form');
            const formData = Utils.getFormData(form);

            try {
                await API.updateObject(obj.id, formData);
                Components.toast.success('Обектът е обновен');
                Components.modal.close();
                App.invalidateCache('objects');
                this.loadObjects('active');
            } catch (error) {
                Components.toast.error('Грешка при запис');
            }
        });
    }
};

// Register page
App.registerPage('objects', ObjectsPage);
