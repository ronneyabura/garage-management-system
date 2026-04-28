# GMS Local Development Setup

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 2. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE gms_db;
```

## 3. Environment Variables

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/gms_db"
# JWT_SECRET="your-super-secret-key"
```

## 4. Run Migrations & Seed

```bash
cd backend
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations (creates tables)
npm run db:seed        # Load sample data
```

## 5. Start the Application

Terminal 1 (Backend):
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## 6. Access the App

Open http://localhost:3000

Demo credentials:
- Admin:   admin@gms.com / password123
- Manager: manager@gms.com / password123
- Tech:    tech1@gms.com / password123

## Database Exploration

```bash
cd backend
npm run db:studio    # Opens Prisma Studio at http://localhost:5555
```

## Project Structure

```
/backend/src
  /controllers  - Request handlers
  /middleware   - Auth, error handling
  /routes       - API route definitions
  /utils        - Logger, Prisma client, JWT, seed

/frontend/src
  /components   - Reusable UI components
  /pages        - Route-level page components
  /services     - API client functions
  /store        - Zustand auth store
  /types        - TypeScript interfaces
```

## Key Technologies
- Backend: Express + TypeScript + Prisma ORM
- Frontend: React + TypeScript + TailwindCSS
- Database: PostgreSQL
- Auth: JWT + Role-Based Access Control
- State: Zustand + React Query
- Charts: Recharts
