import express from "express";
import cookieParser from "cookie-parser";
import { sequelize } from "./config/database.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { ApiError } from "./utils/api-error.js";
import path from "path";
import app from "./app.js";
import env from "./config/env.js";
import { resolveStore, attachStoreIdToUser } from "./middleware/auth.middleware.js";
import cron from "node-cron";
import { backupService } from "./services/backupService.js";

const PORT = env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Add store context middleware before routes
app.use(resolveStore);
app.use(attachStoreIdToUser);

// Routes
app.use("/api", routes);

// 404 handler - must be after all routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// Error handling middleware - must be last
app.use(errorHandler);

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

// Initialize database
async function initializeDatabase() {
  await testConnection();
  // await syncDatabase() // <-- Manual sync only if needed
}

// Initialize backup scheduler
function initializeBackupScheduler() {
  // Only enable cron in production
  if (process.env.NODE_ENV === 'production') {
    // Schedule backup to run daily at midnight (00:00)
    // Cron format: minute hour day month day-of-week
    // '0 0 * * *' means: at 0 minutes, 0 hours, every day of month, every month, every day of week
    const task = cron.schedule('0 0 * * *', async () => {
      console.log('🔄 Scheduled backup starting at midnight...');
      try {
        await backupService.performBackup();
        console.log('✅ Scheduled backup completed successfully');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    }, {
      timezone: process.env.BACKUP_TIMEZONE || 'UTC', // Default to UTC, can be overridden
    });

    console.log('📅 Backup scheduler initialized: Daily backups at midnight (00:00)');
    console.log(`   Timezone: ${process.env.BACKUP_TIMEZONE || 'UTC'}`);
  } else {
    console.log('📅 Backup scheduler: Disabled (not in production mode)');
  }
}

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    // Initialize backup scheduler
    initializeBackupScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();

export default app;
