# ASICS Registration — Node.js Backend

A production-ready REST API built with **Node.js + Express + MongoDB Atlas (Mongoose)**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB Atlas (Mongoose 8) |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Logging | morgan |
| Excel Export | exceljs |

---

## Folder Structure

```
backend/
├── .env
├── package.json
└── src/
    ├── app.js                         # Express app (middleware + routes)
    ├── server.js                      # HTTP entry point
    ├── config/
    │   └── db.js                      # MongoDB Mongoose connection
    ├── models/
    │   └── registration.model.js      # Mongoose schema & model
    ├── controllers/
    │   └── registration.controller.js # All route handlers
    ├── routes/
    │   └── registration.routes.js     # Express Router
    ├── middleware/
    │   ├── errorHandler.js            # Global error handler
    │   └── validate.js                # express-validator rules
    └── utils/
        └── excelExport.js             # exceljs workbook generator
```

---

## Setup & Running Locally

### Prerequisites
- Node.js 18 or later
- npm 9+
- Internet access (MongoDB Atlas)

### 1. Install Dependencies

```powershell
cd d:\DIRECTRONICS\ASICS\backend
npm install
```

### 2. Environment Variables

The `.env` file is pre-configured. To customise:

```env
PORT=5000
MONGO_URI=mongodb://
NODE_ENV=development
```

### 3. Start the Server

```powershell
# Development (auto-restart on save)
npm run dev

# Production
npm start
```

Expected output:
```
✅  MongoDB Connected: cluster0.1vupymj.mongodb.net
🚀  Server running on port 5000  [development]
📋  API base: http://localhost:5000/api
❤️   Health:   http://localhost:5000/health
```

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

---

### 1. Create Registration

**`POST /registrations`**

**Request Body (JSON):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `fullName` | string | ✅ | 2–100 characters |
| `email` | string | ✅ | Valid email |
| `phone` | string | ✅ | 7–20 chars, digits/+/-/spaces |
| `dob` | string | ✅ | `DD/MM/YYYY` format |
| `gender` | string | ✅ | `Male`, `Female`, or `Other` |
| `address` | string | ✅ | 5–500 characters |
| `organization` | string | ❌ | Optional, max 200 chars |
| `deviceId` | string | ❌ | For offline-sync tracking |
| `submittedAt` | ISO date | ❌ | Defaults to server time |

**Example:**
```bash
curl -X POST http://localhost:5000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "9876543210",
    "dob": "15/08/1995",
    "gender": "Female",
    "address": "42 MG Road, Bengaluru, Karnataka",
    "organization": "ACME Corp"
  }'
```

**Success Response `201`:**
```json
{
  "success": true,
  "message": "Registration created successfully.",
  "data": { "_id": "...", "fullName": "Jane Doe", ... }
}
```

---

### 2. Get All Registrations (Paginated)

**`GET /registrations?page=1&limit=20`**

| Query Param | Default | Max |
|---|---|---|
| `page` | 1 | — |
| `limit` | 20 | 100 |

**Success Response `200`:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 3. Get Single Registration

**`GET /registrations/:id`**

```bash
curl http://localhost:5000/api/registrations/64abc123def456789012345a
```

---

### 4. Delete Registration

**`DELETE /registrations/:id`**

```bash
curl -X DELETE http://localhost:5000/api/registrations/64abc123def456789012345a
```

---

### 5. Export Excel

**`GET /registrations/export/excel`**

Downloads an `.xlsx` file named `registrations_YYYY-MM-DD.xlsx`.

**In browser:** Visit `http://localhost:5000/api/registrations/export/excel`

**PowerShell:**
```powershell
Invoke-WebRequest http://localhost:5000/api/registrations/export/excel -OutFile registrations.xlsx
```

**curl:**
```bash
curl -o registrations.xlsx http://localhost:5000/api/registrations/export/excel
```

### Excel Format
- Sheet: **Registrations**
- Columns: `No. | Full Name | Email | Phone | DOB | Gender | Address | Organization | Submitted At`
- Header row: **bold white text on blue background**
- Alternating row background colors
- Frozen header row (scroll-friendly)

---

## Flutter Integration

Flutter base URL config:
```dart
const String baseUrl = 'http://YOUR_LOCAL_IP:5000/api';
```

> Replace `YOUR_LOCAL_IP` with your PC's local network IP (not `localhost`) so Flutter devices/emulators can reach it.

Find your IP:
```powershell
ipconfig | findstr "IPv4"
```

---

## Error Responses

All errors follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [ { "field": "email", "message": "Please provide a valid email address" } ]
}
```

| Status | Meaning |
|---|---|
| `400` | Bad request / invalid ID |
| `404` | Resource not found |
| `409` | Duplicate entry |
| `422` | Validation failed |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Security

- **Helmet.js** — sets secure HTTP headers
- **CORS** — configurable allowed origins
- **Rate Limiting** — 200 requests per IP per 15 minutes on `/api/*`
- **Input Validation** — every POST field validated with express-validator
- **Input Sanitisation** — email normalised, strings trimmed on both Flutter and backend
