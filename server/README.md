# Made4Pharma Backend API

Backend API server for Made4Pharma Medical Store Management System built with Node.js, Express, Prisma, and PostgreSQL.

## Tech Stack

- **Node.js** & **Express** - Server framework
- **Prisma** - ORM for database management
- **PostgreSQL** - Database (can be switched to MySQL)
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/made4pharma"
PORT=5000
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
```

### 3. Setup Database

**For PostgreSQL:**
```bash
# Create database
psql -U postgres
CREATE DATABASE made4pharma;
\q
```

**For MySQL (alternative):**
- Change `provider` in `prisma/schema.prisma` from `postgresql` to `mysql`
- Update `DATABASE_URL` in `.env`

### 4. Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Seed Database

```bash
npm run prisma:seed
```

This creates test users:
- **Admin**: admin@made4pharma.com / admin123
- **Owner**: owner@healthcare.com / owner123
- **Cashier**: cashier@healthcare.com / cashier123

### 6. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Medical Owner)
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (requires auth)
- `POST /api/auth/logout` - Logout user

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Schema

### Users
- id, email, password, name, role, isActive
- Roles: ADMIN, MEDICAL_OWNER, CASHIER

### Stores
- id, name, address, phone, licenseNo, gstNo

### Products
- id, name, genericName, manufacturer, batchNo, expiryDate, quantity, price, mrp

### Sales & SaleItems
- Invoice management and transaction tracking

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create/Apply migrations
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Database seeding
├── src/
│   ├── config/
│   │   └── database.js    # Prisma client setup
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── user.routes.js
│   └── server.js          # Main server file
├── .env                   # Environment variables
├── .env.example           # Example environment file
└── package.json
```

## Role-Based Access Control

- **ADMIN**: Full system access
- **MEDICAL_OWNER**: Manage store, inventory, staff
- **CASHIER**: Process sales, view products

## Next Steps

1. Install dependencies: `npm install`
2. Set up your database
3. Configure `.env` file
4. Run migrations and seed
5. Start the server
6. Test endpoints with the provided credentials
