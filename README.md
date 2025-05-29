# ProSaleManager

A modern Point of Sale (POS) system built with React (Vite), Express, and PostgreSQL. ProSaleManager helps businesses manage inventory, track sales, and handle product pricing with multiple unit types.

## Features

- 🏪 Product Management (multi-unit pricing, stock, categories, suppliers)
- 💰 Sales Management (orders, dynamic pricing, real-time stock)
- 🎨 Modern UI (light/dark mode, Tailwind CSS, Radix UI)
- 🔒 Secure Authentication (session-based, role-based, bcrypt)

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