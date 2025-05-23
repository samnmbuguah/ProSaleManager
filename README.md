# ProSaleManager

A modern Point of Sale (POS) system built with React, Express, and PostgreSQL. ProSaleManager helps businesses manage their inventory, track sales, and handle product pricing with multiple unit types.

## Features

- 🏪 Product Management
  - Multiple unit pricing (per piece, three piece, dozen)
  - Stock tracking
  - Category management
  - Supplier management

- 💰 Sales Management
  - Purchase orders
  - Dynamic pricing based on unit types
  - Real-time stock updates

- 🎨 Modern UI
  - Professional theme with light/dark mode support
  - Responsive design using Tailwind CSS
  - Beautiful component library with Radix UI

- 🔒 Secure Authentication
  - Session-based authentication
  - Role-based access control
  - Secure password handling with bcrypt


## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL (v16)
- npm or yarn


## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ProSaleManager.git
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/prosalemanager
PORT=5000
```

4. Initialize the database:

```bash
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run seed          # (Optional) Seed demo data
```


## Development

Start the development server:

```bash
npm run dev
```

This will start:
- Frontend development server with Vite
- Backend Express server with hot reload
- TypeScript type checking

## Building for Production

```bash
npm run build
```

This will:
- Build the React frontend
- Bundle the Express backend
- Generate production assets

## Deployment

The application includes a robust deployment pipeline with:
- Pre-deployment database backups
- Environment validation
- Database migration checks
- Progressive rollout support
- Health checks and monitoring

## Tech Stack

- **Frontend**
  - React
  - TypeScript
  - Tailwind CSS
  - Radix UI Components
  - React Query
  - Zustand (State Management)
  - React Hook Form
  - React Router

- **Backend**
  - Express.js
  - PostgreSQL



## Project Structure

```
├── client/              # Frontend React application
├── server/              # Express backend
├── db/                  # Database schema and migrations
├── migrations/          # Generated database migrations
└── dist/                # Production build output
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.