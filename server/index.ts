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

// Monitoring metrics
const metrics = {
  requestCount: 0,
  responseTimeTotal: 0,
  errors: 0,
  endpointMetrics: new Map<string, {
    count: number,
    totalTime: number,
    errors: number,
    lastMinuteCalls: number[],
  }>(),
  clientErrors: [] as { timestamp: Date, error: string, component: string }[]
};

// Initialize rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_CALLS = 100; // Max calls per minute

function updateEndpointMetrics(path: string, duration: number, isError: boolean) {
  const now = Date.now();
  const metric = metrics.endpointMetrics.get(path) || {
    count: 0,
    totalTime: 0,
    errors: 0,
    lastMinuteCalls: [],
  };

  metric.count++;
  metric.totalTime += duration;
  if (isError) metric.errors++;

  // Update rate limiting data
  metric.lastMinuteCalls = [
    ...metric.lastMinuteCalls.filter(time => now - time < RATE_LIMIT_WINDOW),
    now
  ];

  metrics.endpointMetrics.set(path, metric);
}

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
    
    const averageResponseTime = metrics.requestCount > 0 
      ? metrics.responseTimeTotal / metrics.requestCount 
      : 0;

    // Process endpoint metrics
    const endpointStats = Object.fromEntries(
      Array.from(metrics.endpointMetrics.entries()).map(([path, metric]) => [
        path,
        {
          requests: metric.count,
          averageResponseTime: metric.count > 0 ? metric.totalTime / metric.count : 0,
          errors: metric.errors,
          rateLimit: {
            currentRate: metric.lastMinuteCalls.length,
            limit: RATE_LIMIT_MAX_CALLS,
            window: `${RATE_LIMIT_WINDOW/1000}s`
          }
        }
      ])
    );

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        auth: "operational",
        api: "operational"
      },
      metrics: {
        requestCount: metrics.requestCount,
        averageResponseTime: Math.round(averageResponseTime),
        errorCount: metrics.errors,
        endpoints: endpointStats
      },
      performance: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        heap: process.memoryUsage().heapUsed / 1024 / 1024
      },
      clientErrors: metrics.clientErrors.slice(-10) // Keep last 10 errors
    };
    
    res.json(health);
  } catch (error) {
    const unhealthy = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      metrics: {
        requestCount: metrics.requestCount,
        errorCount: metrics.errors,
      }
    };
    res.status(503).json(unhealthy);
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Rate limiting check
  if (path.startsWith("/api")) {
    const metric = metrics.endpointMetrics.get(path) || {
      count: 0,
      totalTime: 0,
      errors: 0,
      lastMinuteCalls: [],
    };

    if (metric.lastMinuteCalls.length >= RATE_LIMIT_MAX_CALLS) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: RATE_LIMIT_WINDOW / 1000
      });
    }
  }

  metrics.requestCount++;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    metrics.responseTimeTotal += duration;
    
    const isError = res.statusCode >= 400;
    if (isError) {
      metrics.errors++;
    }

    if (path.startsWith("/api")) {
      updateEndpointMetrics(path, duration, isError);
      
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

// Client error reporting endpoint
app.post("/api/client-error", (req, res) => {
  const { error, component } = req.body;
  metrics.clientErrors.push({
    timestamp: new Date(),
    error,
    component
  });
  res.status(201).json({ message: "Error logged" });
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
