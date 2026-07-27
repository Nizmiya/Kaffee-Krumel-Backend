# Kaffee Krümel Backend

Admin & Superadmin API for the Kaffee Krümel dashboard — shared MongoDB database (`kaffee-krumel`) for the mobile app (customers, cashiers) as well.

## Stack

- Node.js + Express 4
- MongoDB + Mongoose
- JWT authentication (access + refresh tokens)
- Multer file uploads

## Quick Start

```bash
cd kaffee-krumel-backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Server runs at `http://localhost:5000`

**Database:** `kaffee-krumel` (set via `MONGO_URI` in `.env`)

## Seed Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Superadmin | `superadmin@kaffe.com` | `superadmin123` |
| Admin | `admin@kaffe.com` | `admin123` |

`npm run seed` creates **login users only**. Products, offers, orders, branches, staff, and customers start empty and are created through the admin UI / mobile app.

## Project Structure

```
kaffee-krumel-backend/
├── server.js                 # Entry point
├── src/
│   ├── app.js                # Express app + route mounting
│   ├── config/               # Database, CORS
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Auth, roles, error handler
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API route definitions
│   ├── seeders/              # Database seed script
│   └── utils/                # JWT, ID generator, helpers
└── uploads/                  # Uploaded images
```

## Role Permissions

| Feature | Superadmin | Admin |
|---------|------------|-------|
| Dashboard | Read | Read |
| Products | Full CRUD + status | Read only |
| Sub-categories | Full CRUD | Read only |
| Customizations | Full CRUD | No access |
| Offers | Read, status, delete | Full CRUD |
| Sales — Top Products | Read | Read |
| Sales — Branch Performance | Read | No access |
| Orders | Read, status advance, delete | Read, status advance |
| Branches | Full CRUD | No access |
| Staff/Users | Full CRUD | No access |
| Customers | Read only | No access |
| Media upload | Yes | Yes |

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | `{ email, password }` |
| POST | `/api/auth/refresh` | Public | `{ refreshToken }` |
| POST | `/api/auth/logout` | Public | `{ refreshToken }` |
| GET | `/api/auth/me` | Auth | Current user profile |

### Dashboard
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/dashboard/stats` | superadmin, admin |

### Products
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/products` | superadmin, admin |
| GET | `/api/products/:id` | superadmin, admin |
| GET | `/api/products/catalog` | superadmin, admin |
| POST | `/api/products` | superadmin |
| PUT | `/api/products/:id` | superadmin |
| DELETE | `/api/products/:id` | superadmin |
| PATCH | `/api/products/:id/status` | superadmin |

### Sub-categories
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/sub-categories` | superadmin, admin |
| POST | `/api/sub-categories` | superadmin |
| PUT | `/api/sub-categories/:id` | superadmin |
| DELETE | `/api/sub-categories/:id` | superadmin |

### Customizations
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/customizations` | superadmin |
| GET | `/api/customizations/:id` | superadmin |
| POST | `/api/customizations` | superadmin |
| PUT | `/api/customizations/:id` | superadmin |
| DELETE | `/api/customizations/:id` | superadmin |
| PATCH | `/api/customizations/:id/status` | superadmin |

### Offers
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/offers` | superadmin, admin |
| GET | `/api/offers/:id` | superadmin, admin |
| POST | `/api/offers/single` | admin |
| POST | `/api/offers/combo` | admin |
| PUT | `/api/offers/single/:id` | admin |
| PUT | `/api/offers/combo/:id` | admin |
| DELETE | `/api/offers/:id` | superadmin, admin |
| PATCH | `/api/offers/:id/status` | superadmin, admin |

### Orders
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/orders` | superadmin, admin |
| GET | `/api/orders/stats` | superadmin, admin |
| GET | `/api/orders/:id` | superadmin, admin |
| PATCH | `/api/orders/:id/status` | superadmin, admin |
| DELETE | `/api/orders/:id` | superadmin |

### Sales
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/sales/stats` | superadmin, admin |
| GET | `/api/sales/products` | superadmin, admin |
| GET | `/api/sales/branch-performance` | superadmin |

### Branches
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/branches` | superadmin |
| GET | `/api/branches/stats` | superadmin |
| GET | `/api/branches/:id` | superadmin |
| POST | `/api/branches` | superadmin |
| PUT | `/api/branches/:id` | superadmin |
| DELETE | `/api/branches/:id` | superadmin |
| PATCH | `/api/branches/:id/status` | superadmin |

### Staff/Users
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/staff` | superadmin |
| GET | `/api/staff/stats` | superadmin |
| POST | `/api/staff` | superadmin |
| PUT | `/api/staff/:id` | superadmin |
| DELETE | `/api/staff/:id` | superadmin |
| PATCH | `/api/staff/:id/status` | superadmin |

### Customers
| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/customers` | superadmin |
| GET | `/api/customers/stats` | superadmin |
| GET | `/api/customers/closure-analysis` | superadmin |
| GET | `/api/customers/:id` | superadmin |

### Media
| Method | Path | Roles |
|--------|------|-------|
| POST | `/api/media/upload` | superadmin, admin |

## Response Format

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

## Notes for Mobile App Team

This backend uses a single database (`kaffee-krumel`) for the admin dashboard and mobile app. Dashboard auth roles are `superadmin` and `admin`. Mobile roles (`customer`, `cashier`) will share the same database — staff user records (`/api/staff`) are already seeded and can be extended for cashier auth; customer records live in `/api/customers`.
