# ProSaleManager

A comprehensive Point of Sale (POS) system with inventory management, customer tracking, and sales analytics.

## Live Demo

- **URL:** https://byccollections.com/

### Demo Store Logins

These demo credentials are seeded for the **Demo Store** and are safe to share in interviews/demos:

- **Demo Admin**
  - Email: `demo.admin@prosale.com`
  - Password: `demoadmin123`
- **Demo Manager**
  - Email: `demo.manager@prosale.com`
  - Password: `demomgr123`
- **Demo Cashier**
  - Email: `demo.cashier@prosale.com`
  - Password: `demo123`

## Database Management

### Migrations
This project uses Sequelize migrations for safe database schema management. **Never use destructive syncs in production.**

#### Available Migration Commands:
```bash
# Apply all pending migrations
npm run migrate

# Undo the last migration
npm run migrate:undo

# Undo all migrations
npm run migrate:undo:all

# Check migration status
npm run migrate:status

# Generate a new migration
npm run migrate:generate migration-name
```

#### Migration Workflow:
1. **Update your models** in `src/models/`
2. **Generate a migration**: `npm run migrate:generate your-change-name`
3. **Edit the migration file** in `src/database/migrations/` to match your model changes
4. **Test the migration**: `npm run migrate`
5. **Deploy safely**: The deployment script includes automatic database backups

### Seeding
This project uses Sequelize CLI for database seeding with safe, reversible operations.

#### Available Seeding Commands:
```bash
# Seed all data (recommended)
npm run seed:all

# Undo all seeding
npm run seed:undo:all

# Undo last seed
npm run seed:undo

# Generate a new seed file
npm run seed:generate seed-name

# Legacy seeding (for development only)
npm run seed:legacy

# Seed demo-only data (development)
cd server && npm run seed:demo
```

#### Seeding Workflow:
1. **Use `npm run seed:all`** for initial data setup
2. **Generate new seeds**: `npm run seed:generate your-seed-name`
3. **Edit the seed file** in `src/database/seeders/`
4. **Test the seed**: `npm run seed:all`
5. **Undo if needed**: `npm run seed:undo:all`

### Safe Production Deployment
- **Database backups** are automatically created before each deployment
- **Non-destructive syncs** in production (only migrations allowed)
- **Rollback support** for all schema changes
- **Backup retention**: Last 7 days of backups kept automatically

### Development vs Production
- **Development**: Can use `npm run seed:all` for testing
- **Production**: Only migrations allowed, seeding blocked for safety

## Features

- 🏪 Product Management (multi-unit pricing, stock, categories, suppliers)
- 💰 Sales Management (orders, dynamic pricing, real-time stock)
- 🎨 Modern UI (light/dark mode, Tailwind CSS, Radix UI)
- 🔒 Secure Authentication (session-based, role-based, bcrypt)

## Tech Stack

- **Frontend**
  - React (Vite)
  - TypeScript
  - Tailwind CSS
  - Radix UI

- **Backend**
  - Node.js
  - Express
  - Sequelize ORM
  - PostgreSQL

- **Tooling & Infrastructure**
  - Docker & Docker Compose
  - Jest / Vitest and integration/e2e tests (see `tests/` directory)
  - Multer for file uploads
  - Optional Cloudinary integration for product images

## Prerequisites

- Node.js (v20+)
- PostgreSQL (v16+)
- npm

## Project Structure

```
├── client/              # Frontend (Vite + React)
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
├── server/              # Backend (Express + Sequelize)
│   ├── src/
│   ├── migrations/
│   ├── seeders/
│   └── ...
├── tests/               # End-to-end tests
├── docker-compose.yml
├── Dockerfile
├── package.json         # Root scripts for monorepo
└── README.md
```

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/ProSaleManager.git
   cd ProSaleManager
   ```

2. **Install all dependencies:**

   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` in both `client/` and `server/` as needed.
   - Example for server:
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/prosalemanager
     PORT=5000
     ```

4. **Database setup (run in project root):**
   ```bash
   npm run db:generate -- <migration-name>   # Generate new migration
   npm run db:migrate                       # Run migrations
   npm run db:seed:all                      # (Optional) Seed demo data
   ```

## Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

- Frontend: Vite dev server (React)
- Backend: Express with hot reload

## Building for Production

```bash
npm run build
```

- Builds both client and server for production.

## Scripts

**Root `package.json`:**

- `dev` - Run both client and server in dev mode
- `build` - Build both client and server
- `install:all` - Install dependencies in root, client, and server
- `db:generate` - Generate a new Sequelize migration (see below)
- `db:migrate` - Run all migrations
- `db:seed:all` - Seed the database

**Client `package.json`:**

- `dev` - Start Vite dev server
- `build` - Build for production
- `preview` - Preview production build

**Server `package.json`:**

- `dev` - Start Express server with hot reload
- `build` - Build server (if using TypeScript)
- `migrate` - Run Sequelize migrations
- `migrate:undo` - Undo last migration
- `migrate:undo:all` - Undo all migrations
- `seed:all` - Run all seeders
- `seed:undo:all` - Undo all seeders
- `generate:migration <name>` - Generate a new migration

## Example Sequelize Scripts for `server/package.json`

```json
"scripts": {
  "dev": "nodemon src/index.js", // or ts-node if using TypeScript
  "build": "tsc", // if using TypeScript
  "migrate": "npx sequelize-cli db:migrate",
  "migrate:undo": "npx sequelize-cli db:migrate:undo",
  "migrate:undo:all": "npx sequelize-cli db:migrate:undo:all",
  "seed:all": "npx sequelize-cli db:seed:all",
  "seed:undo:all": "npx sequelize-cli db:seed:undo:all",
  "generate:migration": "npx sequelize-cli migration:generate --name"
}
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Product Image Upload Flow

- **Frontend:**
  - Validates image type (must be image) and size (max 5MB) before upload.
  - Shows error messages for invalid files.
  - Shows a progress indicator while uploading.
  - Sends product data and image as multipart/form-data to the backend.

- **Backend:**
  - Uses Multer middleware to handle file uploads.
  - Validates file type and size server-side.
  - If `CLOUDINARY_URL` is set in environment variables, uploads images to Cloudinary and stores the URL in the database.
  - If `CLOUDINARY_URL` is not set (e.g., on cPanel), saves images to `/uploads/products` on the server and stores the relative path in the database.
  - Serves `/uploads` as static files for local access.

### Deployment on cPanel

- By default, images will be stored locally in `/uploads/products`.
- Ensure the `/uploads` directory is writable by the server process.
- The backend serves `/uploads` as static files, so product images are accessible via URLs like `https://yourdomain.com/uploads/products/filename.jpg`.
- If you want to use Cloudinary, set the `CLOUDINARY_URL` environment variable in your deployment environment.
- No code changes are needed to switch between local and Cloudinary storage—just set or unset the environment variable.
