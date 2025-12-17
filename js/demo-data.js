/**
 * BARIN ALP PWA - Demo Data
 * Mock data for testing without backend
 */

const DEMO_DATA = {
    // Users
    users: [
        { id: 1, username: 'director1', name: 'Георги Директор', role: 'director', balance: 0 },
        { id: 2, username: 'director2', name: 'Иван Директор', role: 'director', balance: 0 },
        { id: 3, username: 'tech1', name: 'Петър Техник', role: 'technician', balance: 2500.00 },
        { id: 4, username: 'tech2', name: 'Стоян Техник', role: 'technician', balance: 1800.50 },
        { id: 5, username: 'tech3', name: 'Димитър Техник', role: 'technician', balance: 3200.00 }
    ],

    // Objects (Construction Sites)
    objects: [
        { id: 1, name: 'Обект Витоша', address: 'бул. Витошка 100', status: 'active', totalExpenses: 15000 },
        { id: 2, name: 'Обект Люлин', address: 'ж.к. Люлин бл. 205', status: 'active', totalExpenses: 8500 },
        { id: 3, name: 'Обект Младост', address: 'ж.к. Младост 4', status: 'active', totalExpenses: 12300 },
        { id: 4, name: 'Обект Център', address: 'ул. Граф Игнатиев 45', status: 'completed', totalExpenses: 45000 }
    ],

    // Invoices
    invoices: [
        { 
            id: 1, 
            date: '2025-12-15', 
            supplier: 'Стройко ЕООД', 
            invoiceNumber: 'INV-001',
            total: 1250.00,
            description: 'Строителни материали',
            createdBy: 3,
            createdByName: 'Петър Техник',
            objectId: 1,
            objectName: 'Обект Витоша'
        },
        { 
            id: 2, 
            date: '2025-12-14', 
            supplier: 'Техномаркет', 
            invoiceNumber: 'INV-002',
            total: 450.00,
            description: 'Електро материали',
            createdBy: 4,
            createdByName: 'Стоян Техник',
            objectId: 2,
            objectName: 'Обект Люлин'
        },
        { 
            id: 3, 
            date: '2025-12-13', 
            supplier: 'Практикер', 
            invoiceNumber: 'INV-003',
            total: 890.50,
            description: 'ВиК материали',
            createdBy: 3,
            createdByName: 'Петър Техник',
            objectId: 1,
            objectName: 'Обект Витоша'
        }
    ],

    // Inventory (Tools)
    inventory: [
        { 
            id: 1, 
            name: 'Бормашина Bosch', 
            category: 'Електроинструменти',
            status: 'in-use',
            assignedTo: 3,
            assignedToName: 'Петър Техник',
            objectId: 1,
            objectName: 'Обект Витоша',
            photos: []
        },
        { 
            id: 2, 
            name: 'Ъглошлайф Makita', 
            category: 'Електроинструменти',
            status: 'available',
            assignedTo: null,
            assignedToName: null,
            objectId: null,
            objectName: null,
            photos: []
        },
        { 
            id: 3, 
            name: 'Стълба алуминиева 3м', 
            category: 'Оборудване',
            status: 'in-use',
            assignedTo: 4,
            assignedToName: 'Стоян Техник',
            objectId: 2,
            objectName: 'Обект Люлин',
            photos: []
        },
        { 
            id: 4, 
            name: 'Комплект ръчни инструменти', 
            category: 'Ръчни инструменти',
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
        { id: 1, type: 'cash_funding', userId: 3, amount: 3000, date: '2025-12-10', description: 'Захранване с пари в брой', createdBy: 1 },
        { id: 2, type: 'expense', userId: 3, amount: -500, date: '2025-12-12', description: 'Разход по фактура INV-001', invoiceId: 1 },
        { id: 3, type: 'bank_transfer', userId: 4, amount: 2000, date: '2025-12-11', description: 'Банков превод', createdBy: 1 },
        { id: 4, type: 'expense', userId: 4, amount: -200, date: '2025-12-13', description: 'Разход по фактура INV-002', invoiceId: 2 }
    ],

    // Overview stats
    overview: {
        totalBalance: 7500.50,
        totalExpenses: 80800,
        activeObjects: 3,
        totalTools: 4,
        recentExpenses: []
    },

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

// Make overview include recent expenses
DEMO_DATA.overview.recentExpenses = DEMO_DATA.invoices.slice(0, 5);

// Freeze to prevent accidental modifications
Object.freeze(DEMO_DATA.overview);
