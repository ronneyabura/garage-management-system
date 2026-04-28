# GMS API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require: `Authorization: Bearer <token>`

## Authentication

### POST /auth/register
```json
{ "name": "John", "email": "john@gms.com", "password": "secret123", "role": "WORKSHOP_STAFF" }
```

### POST /auth/login
```json
{ "email": "admin@gms.com", "password": "password123" }
```
Response: `{ success, token, user }`

### GET /auth/me (protected)
Returns current user.

## Vehicles /vehicles
- GET / - List (filter: search, status, page, limit)
- GET /:id - Single vehicle
- GET /:id/history - Service history
- GET /downtime - Downtime stats
- POST / - Create (Admin/Staff)
- PATCH /:id - Update (Admin/Staff)
- DELETE /:id - Delete (Admin)

Status values: AVAILABLE | IN_SERVICE | UNDER_REPAIR | OUT_OF_SERVICE

## Job Cards /job-cards
- GET / - List (filter: status, vehicleId, search)
- GET /:id - Full detail with repairs and timeline
- POST / - Create
- PATCH /:id - Update fields
- PATCH /:id/status - Advance workflow: { "status": "DIAGNOSIS", "notes": "..." }
- POST /:id/repairs - Add repair: { "description", "laborCost", "parts": [{ "partId", "quantity", "unitCost" }] }

Status flow: INTAKE -> DIAGNOSIS -> REPAIR -> TESTING -> COMPLETED

## Inventory /inventory
- GET / - List parts
- GET /low-stock - Below minimum
- GET /:id - Part detail
- GET /:id/transactions - Transaction history
- POST / - Create part
- PATCH /:id - Update
- DELETE /:id - Delete
- POST /:id/transactions - Stock transaction: { "type": "IN|OUT", "quantity", "notes" }

## Reports /reports
- GET /dashboard - KPIs
- GET /maintenance-cost - Cost per job
- GET /repair-frequency - Repairs per vehicle
- GET /parts-consumption - Parts usage

## Integrations /integrations (Admin/Manager)
- POST /erp/sync - Simulate ERP pull
- POST /inventory/sync - Simulate inventory sync
- POST /erp/export-jobs - Export completed jobs

## Users /users (Admin)
- GET / - All users
- GET /technicians - Workshop staff
- PATCH /:id - Update user
