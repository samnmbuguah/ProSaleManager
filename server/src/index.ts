import "./config/env.js";
import env from "./config/env.js";
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { sequelize } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { ApiError } from './utils/api-error.js';
import { setupAssociations } from './models/associations.js';
import path from "path";

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', routes);

// Serve uploads directory for local file storage
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 404 handler - must be after all routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// Error handling middleware - must be last
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Set up model associations before syncing
    setupAssociations();
    
    await sequelize.sync();
    console.log('All models synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
