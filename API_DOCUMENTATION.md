# BARIN ALP API Documentation

## Base URL
```
https://your-n8n-instance.com/webhook
```

All endpoints are n8n webhooks. Replace `your-n8n-instance.com` with your actual n8n instance URL.

---

## Authentication

### POST /auth/login
Login user and get session token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "user-id",
    "username": "username",
    "name": "Име Фамилия",
    "role": "director|technician"
  }
}
```

### POST /auth/logout
Logout current user.

**Headers:** `Authorization: Bearer {token}`

### POST /auth/verify
Verify token is still valid.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "valid": true,
  "user": { ... }
}
```

---

## Users

### GET /users
Get all users (Directors only).

**Response:**
```json
[
  {
    "id": "user-id",
    "username": "username",
    "name": "Име Фамилия",
    "role": "director|technician",
    "balance": 1500.00
  }
]
```

### GET /users/{id}
Get specific user.

### GET /users/{id}/balance
Get user balance and recent transactions.

**Response:**
```json
{
  "balance": 1500.00,
  "transactions": [
    {
      "id": "tx-id",
      "type": "cash_funding|bank_transfer|expense|invoice",
      "amount": 500.00,
      "date": "2024-01-15",
      "note": "Optional note"
    }
  ]
}
```

---

## Transactions (Funding)

### GET /transactions
List all transactions with optional filters.

**Query Parameters:**
- `userId` - Filter by user
- `type` - Filter by type
- `dateFrom` - Start date (YYYY-MM-DD)
- `dateTo` - End date (YYYY-MM-DD)

### POST /transactions
Create new funding transaction.

**Request Body:**
```json
{
  "userId": "user-id",
  "type": "cash_funding|bank_transfer",
  "amount": 1000.00,
  "date": "2024-01-15",
  "note": "Optional note"
}
```

---

## Invoices

### GET /invoices
List invoices with optional filters.

**Query Parameters:**
- `objectId` - Filter by object
- `technicianId` - Filter by technician
- `dateFrom` - Start date
- `dateTo` - End date

**Response:**
```json
[
  {
    "id": "invoice-id",
    "invoiceNumber": "0000000001",
    "date": "2024-01-15",
    "vendor": "Доставчик ООД",
    "totalAmount": 450.50,
    "paymentMethod": "cash|bank|card",
    "technicianId": "user-id",
    "technicianName": "Иван Иванов",
    "objectName": "Обект 1",
    "notes": "Optional notes"
  }
]
```

### POST /invoices
Create new invoice with positions.

**Request Body:**
```json
{
  "invoiceNumber": "0000000001",
  "date": "2024-01-15",
  "vendor": "Доставчик ООД",
  "paymentMethod": "cash",
  "technicianId": "user-id",
  "notes": "Optional notes",
  "positions": [
    {
      "name": "Цимент 25кг",
      "quantity": 10,
      "unitPrice": 12.50,
      "total": 125.00,
      "objectId": "object-id"
    }
  ],
  "totalAmount": 450.50
}
```

**Logic:**
1. Create invoice record in Invoices sheet
2. Create position records in InvoicePositions sheet
3. Deduct totalAmount from technician balance
4. Add amounts to respective objects

### GET /invoices/{id}
Get invoice with positions.

### DELETE /invoices/{id}
Delete invoice and restore balance (Directors only).

---

## Invoice Positions

### GET /invoices/{id}/positions
Get positions for specific invoice.

### POST /positions/allocate
Allocate/reallocate positions to objects.

**Request Body:**
```json
{
  "allocations": [
    {
      "positionId": "position-id",
      "objectId": "object-id",
      "quantity": 5
    }
  ]
}
```

---

## Objects (Construction Sites)

### GET /objects
List all objects.

**Query Parameters:**
- `includeArchived` - Include archived objects (default: false)

**Response:**
```json
[
  {
    "id": "object-id",
    "name": "Небет Тепе - Етап 2",
    "address": "гр. Пловдив",
    "description": "Description",
    "status": "active|completed|archived",
    "startDate": "2024-01-01",
    "totalExpenses": 15000.00,
    "invoiceCount": 25
  }
]
```

### POST /objects
Create new object.

**Request Body:**
```json
{
  "name": "Име на обект",
  "address": "Адрес",
  "description": "Описание",
  "startDate": "2024-01-15",
  "status": "active"
}
```

### GET /objects/{id}
Get object details with expense summary.

### PUT /objects/{id}
Update object.

### POST /objects/{id}/archive
Archive/complete object.

---

## Inventory (Tools)

### GET /inventory
List all tools.

**Query Parameters:**
- `status` - Filter by status (available|assigned|maintenance|lost)
- `search` - Search by name or code

**Response:**
```json
[
  {
    "id": "tool-id",
    "name": "Бормашина Makita",
    "code": "INV-001",
    "description": "Description",
    "status": "available|assigned|maintenance|lost",
    "assignedToId": "user-id",
    "assignedToName": "Иван Иванов",
    "objectId": "object-id",
    "objectName": "Обект 1",
    "photoUrl": "https://drive.google.com/..."
  }
]
```

### POST /inventory
Create new tool.

**Request Body:**
```json
{
  "name": "Име на инструмент",
  "code": "INV-001",
  "description": "Description",
  "status": "available",
  "photo": "base64-encoded-image"
}
```

### GET /inventory/{id}
Get tool details with transfer history.

### PUT /inventory/{id}
Update tool.

### POST /inventory/{id}/transfer
Transfer tool to another user or storage.

**Request Body:**
```json
{
  "toUserId": "user-id|null",
  "photo": "base64-encoded-image"
}
```

**Logic:**
1. Update tool's assignedToId
2. Save photo to Google Drive
3. Create transfer history record

### POST /inventory/{id}/photo
Upload/update tool photo.

**Request Body:**
```json
{
  "photo": "base64-encoded-image"
}
```

---

## Bank Statements

### POST /bank/upload
Upload and parse Asset Bank PDF statement.

**Request Body:**
```json
{
  "file": "base64-encoded-pdf",
  "filename": "statement.pdf"
}
```

**Response:**
```json
{
  "transactions": [
    {
      "date": "2024-01-15",
      "reference": "REF123456",
      "description": "Payment description",
      "amount": 1500.00
    }
  ]
}
```

**Asset Bank PDF Format:**
```
Date (DD.MM.YYYY) | Reference | Description | BGN | Amount | Balance
15.01.2024       | REF123   | Description | BGN | 1500.00 | 5000.00
```

### GET /bank/transactions
Get imported bank transactions.

**Query Parameters:**
- `limit` - Number of records (default: 50)

---

## Reports

### GET /reports/object/{id}
Get detailed object expense report.

**Response:**
```json
{
  "totalExpenses": 15000.00,
  "invoiceCount": 25,
  "byCategory": [
    {
      "name": "Материали",
      "count": 15,
      "total": 10000.00
    }
  ]
}
```

### GET /reports/technician/{id}
Get technician balance report.

### GET /reports/overview
Get overall dashboard data.

**Response:**
```json
{
  "totalExpenses": 50000.00,
  "totalExpensesMonth": 8000.00,
  "totalTechnicianBalance": 5000.00,
  "unallocatedExpenses": 500.00,
  "activeObjects": 3,
  "totalTools": 45,
  "objectsExpenses": [
    {
      "id": "object-id",
      "name": "Обект 1",
      "totalExpenses": 15000.00,
      "invoiceCount": 25,
      "status": "active"
    }
  ],
  "recentExpenses": [
    {
      "id": "invoice-id",
      "vendor": "Доставчик",
      "amount": 450.50,
      "date": "2024-01-15",
      "technicianName": "Иван"
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Google Sheets Structure

### Sheet: Users
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| username | string | Login username |
| password | string | Hashed password |
| name | string | Display name |
| role | string | director/technician |
| balance | number | Current balance |

### Sheet: Objects
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| name | string | Object name |
| address | string | Address |
| description | string | Description |
| status | string | active/completed/archived |
| startDate | date | Start date |

### Sheet: Invoices
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| invoiceNumber | string | Invoice number |
| date | date | Invoice date |
| vendor | string | Vendor name |
| totalAmount | number | Total amount |
| paymentMethod | string | cash/bank/card |
| technicianId | string | FK to Users |
| notes | string | Notes |

### Sheet: InvoicePositions
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| invoiceId | string | FK to Invoices |
| name | string | Position description |
| quantity | number | Quantity |
| unitPrice | number | Price per unit |
| total | number | Line total |
| objectId | string | FK to Objects |

### Sheet: Transactions
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| userId | string | FK to Users |
| type | string | cash_funding/bank_transfer/expense/invoice |
| amount | number | Amount |
| date | date | Transaction date |
| note | string | Note |
| invoiceId | string | FK to Invoices (if type=invoice) |

### Sheet: Inventory
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| name | string | Tool name |
| code | string | Inventory code |
| description | string | Description |
| status | string | available/assigned/maintenance/lost |
| assignedToId | string | FK to Users |
| photoUrl | string | Google Drive URL |

### Sheet: InventoryTransfers
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique ID |
| toolId | string | FK to Inventory |
| fromUserId | string | FK to Users |
| toUserId | string | FK to Users |
| date | datetime | Transfer datetime |
| photoUrl | string | Photo at transfer |
