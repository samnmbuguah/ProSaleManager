import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import customersRouter from "./routes/customers";
import salesRouter from "./routes/sales";
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from "../db";
import { sql } from 'drizzle-orm';
import { setupAuth } from "./auth";

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

const app = express();

// Initialize database tables
(async () => {
  try {
    await migrate(db, {
      migrationsFolder: './migrations',
    });
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
})();

// Setup middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup authentication before routes
setupAuth(app);

// Health monitoring endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);
    
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        auth: "operational",
        api: "operational"
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
    
    res.json(health);
  } catch (error) {
    const unhealthy = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(503).json(unhealthy);
  }
});

// Monitoring metrics
const metrics = {
  requestCount: 0,
  responseTimeTotal: 0,
  errors: 0
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  metrics.requestCount++;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    metrics.responseTimeTotal += duration;
    
    if (res.statusCode >= 400) {
      metrics.errors++;
    }

    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Metrics endpoint
app.get("/api/metrics", (req, res) => {
  const averageResponseTime = metrics.requestCount > 0 
    ? metrics.responseTimeTotal / metrics.requestCount 
    : 0;

  res.json({
    requestCount: metrics.requestCount,
    averageResponseTime: Math.round(averageResponseTime),
    errorCount: metrics.errors,
    timestamp: new Date().toISOString()
  });
});

// Register API routes
app.use("/api/customers", customersRouter);
app.use("/api/sales", salesRouter);
registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

(async () => {
  const server = createServer(app);

  // Setup Vite in development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const PORT = process.env.PORT || 5000;
  server.listen(Number(PORT), "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  }).on('error', (error) => {
    console.error('Error starting server:', error);
    process.exit(1);
  });
})();
