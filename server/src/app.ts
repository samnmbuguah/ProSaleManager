import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import sequelize from "./config/database.js";
import helmet from 'helmet';
import { errorHandler } from './middleware/error.middleware';
import { authLimiter, apiLimiter } from './middleware/auth.middleware';
import { validateCsrfToken } from './utils/csrf';
import routes from './routes';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);

const app = express();

// Development URLs
const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://34.131.30.62:5173",
  "http://34.131.30.62:5174",
];

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  }),
);

// Parse JSON bodies and cookies before any routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use('/auth', authLimiter);
app.use('/api', apiLimiter);

// CSRF protection for non-GET requests, excluding auth routes
app.use('/api', (req, res, next) => {
  // Skip CSRF check for auth routes
  if (req.path.startsWith('/auth')) {
    return next();
  }
  validateCsrfToken(req, res, next);
});

// Initialize database
try {
  // Test database connection
  await sequelize.authenticate();
  console.log("Database connection established successfully.");

  if (process.env.NODE_ENV === "development") {
    console.log("Running in development mode");
  }
} catch (error) {
  console.error("Unable to connect to the database:", error);
  process.exit(1);
}

// Routes
app.use('/api', routes);

// Health check endpoint
app.get("/api/health", (_, res) => {
  res.json({ status: "healthy" });
});

// Error handling
app.use(errorHandler);

export default app;
