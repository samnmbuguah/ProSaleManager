import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sequelize from './config/database.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());
app.use(cookieParser());

// Initialize database
try {
  // Test database connection
  await sequelize.authenticate();
  console.log('Database connection established successfully.');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
    console.log('Note: Use `npm run seed` to sync and seed the database');
  }
} catch (error) {
  console.error('Unable to connect to the database:', error);
  process.exit(1);
}

// Routes
import authRoutes from './routes/auth/index.js';
import productsRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import customersRoutes from './routes/customers.js';
import suppliersRoutes from './routes/suppliers.js';
import expensesRoutes from './routes/expenses.js';

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/expenses', expensesRoutes);

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({ status: 'healthy' });
});

export default app; 