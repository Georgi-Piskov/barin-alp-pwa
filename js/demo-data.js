/**
 * BARIN ALP PWA - Demo Data
 * Mock data for testing without backend
 */

const DEMO_DATA = {
    // Users
    users: [
        { id: 1, username: 'director1', name: 'Georgi Direktor', role: 'director', balance: 0 },
        { id: 2, username: 'director2', name: 'Ivan Direktor', role: 'director', balance: 0 },
        { id: 3, username: 'tech1', name: 'Petar Tehnik', role: 'technician', balance: 2500.00 },
        { id: 4, username: 'tech2', name: 'Stoyan Tehnik', role: 'technician', balance: 1800.50 },
        { id: 5, username: 'tech3', name: 'Dimitar Tehnik', role: 'technician', balance: 3200.00 }
    ],

    // Objects (Construction Sites)
    objects: [
        { id: 1, name: 'Obekt Vitosha', address: 'bul. Vitoshka 100', status: 'active', totalExpenses: 15000 },
        { id: 2, name: 'Obekt Lyulin', address: 'zh.k. Lyulin bl. 205', status: 'active', totalExpenses: 8500 },
        { id: 3, name: 'Obekt Mladost', address: 'zh.k. Mladost 4', status: 'active', totalExpenses: 12300 },
        { id: 4, name: 'Obekt Centar', address: 'ul. Graf Ignatiev 45', status: 'completed', totalExpenses: 45000 }
    ],

    // Invoices
    invoices: [
        { 
            id: 1, 
            date: '2025-12-15', 
            supplier: 'Stroyko EOOD', 
            invoiceNumber: 'INV-001',
            total: 1250.00,
            description: 'Stroitelni materiali',
            createdBy: 3,
            createdByName: 'Petar Tehnik',
            objectId: 1,
            objectName: 'Obekt Vitosha'
        },
        { 
            id: 2, 
            date: '2025-12-14', 
            supplier: 'Tehnomarket', 
            invoiceNumber: 'INV-002',
            total: 450.00,
            description: 'Elektro materiali',
            createdBy: 4,
            createdByName: 'Stoyan Tehnik',
            objectId: 2,
            objectName: 'Obekt Lyulin'
        },
        { 
            id: 3, 
            date: '2025-12-13', 
            supplier: 'Praktiker', 
            invoiceNumber: 'INV-003',
            total: 890.50,
            description: 'ViK materiali',
            createdBy: 3,
            createdByName: 'Petar Tehnik',
            objectId: 1,
            objectName: 'Obekt Vitosha'
        }
    ],

    // Inventory (Tools)
    inventory: [
        { 
            id: 1, 
            name: 'Bormashina Bosch', 
            category: 'Elektroinstrumenti',
            status: 'in-use',
            assignedTo: 3,
            assignedToName: 'Petar Tehnik',
            objectId: 1,
            objectName: 'Obekt Vitosha',
            photos: []
        },
        { 
            id: 2, 
            name: 'Agloshlaif Makita', 
            category: 'Elektroinstrumenti',
            status: 'available',
            assignedTo: null,
            assignedToName: null,
            objectId: null,
            objectName: null,
            photos: []
        },
        { 
            id: 3, 
            name: 'Stalba aluminieva 3m', 
            category: 'Oborudvane',
            status: 'in-use',
            assignedTo: 4,
            assignedToName: 'Stoyan Tehnik',
            objectId: 2,
            objectName: 'Obekt Lyulin',
            photos: []
        },
        { 
            id: 4, 
            name: 'Komplekt rachni instrumenti', 
            category: 'Rachni instrumenti',
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
        { id: 1, type: 'cash_funding', userId: 3, amount: 3000, date: '2025-12-10', description: 'Zahranvane s pari v broi', createdBy: 1 },
        { id: 2, type: 'expense', userId: 3, amount: -500, date: '2025-12-12', description: 'Razhod po faktura INV-001', invoiceId: 1 },
        { id: 3, type: 'bank_transfer', userId: 4, amount: 2000, date: '2025-12-11', description: 'Bankov prevod', createdBy: 1 },
        { id: 4, type: 'expense', userId: 4, amount: -200, date: '2025-12-13', description: 'Razhod po faktura INV-002', invoiceId: 2 }
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
