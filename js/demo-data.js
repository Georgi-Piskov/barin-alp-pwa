/**
 * BARIN ALP PWA - Demo Data
 * Mock data for testing without backend
 * Using Unicode escape sequences for Cyrillic
 */

const DEMO_DATA = {
    // Users - \u0413\u0435\u043E\u0440\u0433\u0438 = Георги, etc.
    users: [
        { id: 1, username: 'director1', name: '\u0413\u0435\u043E\u0440\u0433\u0438 \u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440', role: 'director', balance: 0 },
        { id: 2, username: 'director2', name: '\u0418\u0432\u0430\u043D \u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440', role: 'director', balance: 0 },
        { id: 3, username: 'tech1', name: '\u041F\u0435\u0442\u044A\u0440 \u0422\u0435\u0445\u043D\u0438\u043A', role: 'technician', balance: 2500.00 },
        { id: 4, username: 'tech2', name: '\u0421\u0442\u043E\u044F\u043D \u0422\u0435\u0445\u043D\u0438\u043A', role: 'technician', balance: 1800.50 },
        { id: 5, username: 'tech3', name: '\u0414\u0438\u043C\u0438\u0442\u044A\u0440 \u0422\u0435\u0445\u043D\u0438\u043A', role: 'technician', balance: 3200.00 }
    ],

    // Objects (Construction Sites)
    objects: [
        { id: 1, name: '\u041E\u0431\u0435\u043A\u0442 \u0412\u0438\u0442\u043E\u0448\u0430', address: '\u0431\u0443\u043B. \u0412\u0438\u0442\u043E\u0448\u043A\u0430 100', status: 'active', totalExpenses: 15000 },
        { id: 2, name: '\u041E\u0431\u0435\u043A\u0442 \u041B\u044E\u043B\u0438\u043D', address: '\u0436.\u043A. \u041B\u044E\u043B\u0438\u043D \u0431\u043B. 205', status: 'active', totalExpenses: 8500 },
        { id: 3, name: '\u041E\u0431\u0435\u043A\u0442 \u041C\u043B\u0430\u0434\u043E\u0441\u0442', address: '\u0436.\u043A. \u041C\u043B\u0430\u0434\u043E\u0441\u0442 4', status: 'active', totalExpenses: 12300 },
        { id: 4, name: '\u041E\u0431\u0435\u043A\u0442 \u0426\u0435\u043D\u0442\u044A\u0440', address: '\u0443\u043B. \u0413\u0440\u0430\u0444 \u0418\u0433\u043D\u0430\u0442\u0438\u0435\u0432 45', status: 'completed', totalExpenses: 45000 }
    ],

    // Invoices
    invoices: [
        { 
            id: 1, 
            date: '2025-12-15', 
            supplier: '\u0421\u0442\u0440\u043E\u0439\u043A\u043E \u0415\u041E\u041E\u0414', 
            invoiceNumber: 'INV-001',
            total: 1250.00,
            description: '\u0421\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u043D\u0438 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u0438',
            createdBy: 3,
            createdByName: '\u041F\u0435\u0442\u044A\u0440 \u0422\u0435\u0445\u043D\u0438\u043A',
            objectId: 1,
            objectName: '\u041E\u0431\u0435\u043A\u0442 \u0412\u0438\u0442\u043E\u0448\u0430'
        },
        { 
            id: 2, 
            date: '2025-12-14', 
            supplier: '\u0422\u0435\u0445\u043D\u043E\u043C\u0430\u0440\u043A\u0435\u0442', 
            invoiceNumber: 'INV-002',
            total: 450.00,
            description: '\u0415\u043B\u0435\u043A\u0442\u0440\u043E \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u0438',
            createdBy: 4,
            createdByName: '\u0421\u0442\u043E\u044F\u043D \u0422\u0435\u0445\u043D\u0438\u043A',
            objectId: 2,
            objectName: '\u041E\u0431\u0435\u043A\u0442 \u041B\u044E\u043B\u0438\u043D'
        },
        { 
            id: 3, 
            date: '2025-12-13', 
            supplier: '\u041F\u0440\u0430\u043A\u0442\u0438\u043A\u0435\u0440', 
            invoiceNumber: 'INV-003',
            total: 890.50,
            description: '\u0412\u0438\u041A \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u0438',
            createdBy: 3,
            createdByName: '\u041F\u0435\u0442\u044A\u0440 \u0422\u0435\u0445\u043D\u0438\u043A',
            objectId: 1,
            objectName: '\u041E\u0431\u0435\u043A\u0442 \u0412\u0438\u0442\u043E\u0448\u0430'
        }
    ],

    // Inventory (Tools)
    inventory: [
        { 
            id: 1, 
            name: '\u0411\u043E\u0440\u043C\u0430\u0448\u0438\u043D\u0430 Bosch', 
            category: '\u0415\u043B\u0435\u043A\u0442\u0440\u043E\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0438',
            status: 'in-use',
            assignedTo: 3,
            assignedToName: '\u041F\u0435\u0442\u044A\u0440 \u0422\u0435\u0445\u043D\u0438\u043A',
            objectId: 1,
            objectName: '\u041E\u0431\u0435\u043A\u0442 \u0412\u0438\u0442\u043E\u0448\u0430',
            photos: []
        },
        { 
            id: 2, 
            name: '\u042A\u0433\u043B\u043E\u0448\u043B\u0430\u0439\u0444 Makita', 
            category: '\u0415\u043B\u0435\u043A\u0442\u0440\u043E\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0438',
            status: 'available',
            assignedTo: null,
            assignedToName: null,
            objectId: null,
            objectName: null,
            photos: []
        },
        { 
            id: 3, 
            name: '\u0421\u0442\u044A\u043B\u0431\u0430 \u0430\u043B\u0443\u043C\u0438\u043D\u0438\u0435\u0432\u0430 3\u043C', 
            category: '\u041E\u0431\u043E\u0440\u0443\u0434\u0432\u0430\u043D\u0435',
            status: 'in-use',
            assignedTo: 4,
            assignedToName: '\u0421\u0442\u043E\u044F\u043D \u0422\u0435\u0445\u043D\u0438\u043A',
            objectId: 2,
            objectName: '\u041E\u0431\u0435\u043A\u0442 \u041B\u044E\u043B\u0438\u043D',
            photos: []
        },
        { 
            id: 4, 
            name: '\u041A\u043E\u043C\u043F\u043B\u0435\u043A\u0442 \u0440\u044A\u0447\u043D\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0438', 
            category: '\u0420\u044A\u0447\u043D\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0438',
            status: 'available',
            assignedTo: null,
            assignedToName: null,
            objectId: null,
            objectName: null,
            photos: []
        }
    ],

    // Transactions
    transactions: [
        { id: 1, type: 'cash_funding', userId: 3, amount: 3000, date: '2025-12-10', description: '\u0417\u0430\u0445\u0440\u0430\u043D\u0432\u0430\u043D\u0435 \u0441 \u043F\u0430\u0440\u0438 \u0432 \u0431\u0440\u043E\u0439', createdBy: 1 },
        { id: 2, type: 'expense', userId: 3, amount: -500, date: '2025-12-12', description: '\u0420\u0430\u0437\u0445\u043E\u0434 \u043F\u043E \u0444\u0430\u043A\u0442\u0443\u0440\u0430 INV-001', invoiceId: 1 },
        { id: 3, type: 'bank_transfer', userId: 4, amount: 2000, date: '2025-12-11', description: '\u0411\u0430\u043D\u043A\u043E\u0432 \u043F\u0440\u0435\u0432\u043E\u0434', createdBy: 1 },
        { id: 4, type: 'expense', userId: 4, amount: -200, date: '2025-12-13', description: '\u0420\u0430\u0437\u0445\u043E\u0434 \u043F\u043E \u0444\u0430\u043A\u0442\u0443\u0440\u0430 INV-002', invoiceId: 2 }
    ],

    // Helper methods
    getUserById(id) {
        return this.users.find(u => u.id === id);
    },

    getObjectById(id) {
        return this.objects.find(o => o.id === id);
    },

    getTechnicians() {
        return this.users.filter(u => u.role === 'technician');
    },

    // Generate next ID
    nextId(collection) {
        const items = this[collection];
        return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    }
};
