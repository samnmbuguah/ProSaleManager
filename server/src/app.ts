import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env';
import authRouter from './routes/auth';
import seedRoutes from './routes/seed';
import productsRouter from './routes/products';
import suppliersRouter from './routes/suppliers';
import salesRouter from './routes/sales';
import customersRouter from './routes/customers';

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser(env.COOKIE_SECRET));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Routes
app.use('/api/auth', authRouter);
app.use('/api', seedRoutes);
app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/customers', customersRouter);

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({ status: 'healthy' });
});

export default app; 