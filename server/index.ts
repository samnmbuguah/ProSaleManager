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
// import { initializeBackupSchedule } from "./db/backup";
// import { handleDeployment } from "./deployment/deploy";

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
    statusCodes: Record<number, number>,
  }>(),
  clientErrors: [] as { timestamp: Date, error: string, component: string }[],
  systemMetrics: {
    lastCheck: Date.now(),
    cpuUsage: process.cpuUsage(),
    memoryUsage: process.memoryUsage(),
    memoryLeakMetrics: {
      lastHeapUsed: 0,
      heapGrowthRate: 0,
      consecutiveIncreases: 0,
    },
    cpuLoadHistory: [] as Array<{timestamp: number, load: number}>,
    uptime: process.uptime(),
  },
  databaseStatus: {
    isConnected: true,
    lastCheck: Date.now(),
    responseTime: 0,
  }
};

// Update system metrics every minute
setInterval(() => {
  const currentMemory = process.memoryUsage();
  const lastHeapUsed = metrics.systemMetrics.memoryLeakMetrics.lastHeapUsed;
  const heapUsed = currentMemory.heapUsed;
  
  // Calculate heap growth rate
  const heapGrowthRate = lastHeapUsed ? ((heapUsed - lastHeapUsed) / lastHeapUsed) * 100 : 0;
  
  // Track consecutive heap increases for memory leak detection
  const consecutiveIncreases = heapGrowthRate > 5 ? 
    metrics.systemMetrics.memoryLeakMetrics.consecutiveIncreases + 1 : 0;

  // CPU load tracking
  const cpuUsage = process.cpuUsage();
  const totalCPUTime = cpuUsage.user + cpuUsage.system;
  const cpuLoad = totalCPUTime / (60 * 1000 * 1000); // Convert to percentage of the last minute

  // Keep last 60 minutes of CPU history
  const cpuLoadHistory = [
    ...metrics.systemMetrics.cpuLoadHistory.slice(-59),
    { timestamp: Date.now(), load: cpuLoad }
  ];

  // Alert on potential memory leak
  if (consecutiveIncreases >= 5) {
    console.warn('[Health Monitor] Potential memory leak detected:', {
      heapGrowthRate: `${heapGrowthRate.toFixed(2)}%`,
      consecutiveIncreases,
      heapUsed: `${(heapUsed / 1024 / 1024).toFixed(2)}MB`
    });
  }

  // Alert on high CPU usage
  if (cpuLoad > 80) {
    console.warn('[Health Monitor] High CPU usage detected:', {
      cpuLoad: `${cpuLoad.toFixed(2)}%`,
      timestamp: new Date().toISOString()
    });
  }

  metrics.systemMetrics = {
    lastCheck: Date.now(),
    cpuUsage,
    memoryUsage: currentMemory,
    memoryLeakMetrics: {
      lastHeapUsed: heapUsed,
      heapGrowthRate,
      consecutiveIncreases,
    },
    cpuLoadHistory,
    uptime: process.uptime(),
  };
}, 60000);

// Check database connection every 30 seconds
setInterval(async () => {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    metrics.databaseStatus = {
      isConnected: true,
      lastCheck: Date.now(),
      responseTime: Date.now() - start,
    };
  } catch (error) {
    metrics.databaseStatus = {
      isConnected: false,
      lastCheck: Date.now(),
      responseTime: Date.now() - start,
    };
    console.error('Database connection check failed:', error);
  }
}, 30000);

// Initialize rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_CALLS = 100; // Max calls per minute

function updateEndpointMetrics(path: string, duration: number, isError: boolean, statusCode: number) {
  const now = Date.now();
  const metric = metrics.endpointMetrics.get(path) || {
    count: 0,
    totalTime: 0,
    errors: 0,
    lastMinuteCalls: [],
    statusCodes: {},
  };

  metric.count++;
  metric.totalTime += duration;
  if (isError) metric.errors++;

  // Update status code counts
  metric.statusCodes[statusCode] = (metric.statusCodes[statusCode] || 0) + 1;

  // Update rate limiting data
  metric.lastMinuteCalls = [
    ...metric.lastMinuteCalls.filter(time => now - time < RATE_LIMIT_WINDOW),
    now
  ];

  // Enhanced response time monitoring
  const avgResponseTime = metric.totalTime / metric.count;
  const responseTimeThreshold = Math.max(avgResponseTime * 2, 1000); // At least 1 second
  
  if (duration > responseTimeThreshold) {
    console.warn('[Health Monitor] Slow response detected:', {
      path,
      duration: `${duration}ms`,
      average: `${avgResponseTime.toFixed(2)}ms`,
      threshold: `${responseTimeThreshold}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Add extra monitoring for very slow responses
    if (duration > responseTimeThreshold * 2) {
      console.error('[Health Monitor] Critical response time:', {
        path,
        duration: `${duration}ms`,
        average: `${avgResponseTime.toFixed(2)}ms`,
        impact: `${((duration - avgResponseTime) / avgResponseTime * 100).toFixed(2)}% slower than average`,
        timestamp: new Date().toISOString()
      });
    }
  }

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

// Initialize database tables and start server
async function initializeApp() {
  const port = Number(process.env.PORT) || 5000;
  let server: ReturnType<typeof createServer>;

  try {
    log('Starting database initialization...');
    
    // Step 1: Initialize database
    try {
      await migrate(db, {
        migrationsFolder: './migrations',
      });
      log('Database migrations completed successfully');
      
      // Verify database connection
      await db.execute(sql`SELECT 1`);
      log('Database connection verified successfully');
    } catch (dbError) {
      console.error('Database initialization failed:', dbError);
      throw new Error(`Database initialization failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // Step 2: Create HTTP server
    server = createServer(app);
    
    // Set timeout for server operations
    server.timeout = 30000;
    
    // Handle server shutdown gracefully
    const shutdown = () => {
      log('Shutting down server...');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    // Step 3: Setup environment-specific middleware
    try {
      if (app.get("env") === "development") {
        await setupVite(app, server);
        log('Development middleware configured');
      } else {
        serveStatic(app);
        log('Production static serving configured');
      }
    } catch (middlewareError) {
      console.error('Middleware setup failed:', middlewareError);
      throw new Error(`Middleware setup failed: ${middlewareError instanceof Error ? middlewareError.message : 'Unknown error'}`);
    }

    // Step 4: Start server with retry logic
    return new Promise<typeof server>((resolve, reject) => {
      const maxRetries = 3;
      let retryCount = 0;
      let currentPort = port;
      
      function attemptListen() {
        // Clear any existing listeners
        server.removeAllListeners();
        
        server
          .listen(currentPort, "0.0.0.0")
          .once('listening', () => {
            log(`Server started successfully on port ${currentPort}`);
            resolve(server);
          })
          .once('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE' && retryCount < maxRetries) {
              retryCount++;
              currentPort++;
              log(`Port ${currentPort - 1} in use, trying port ${currentPort}...`);
              server.close();
              setTimeout(attemptListen, 1000);
            } else {
              const errorMessage = `Server startup failed: ${error.message}`;
              console.error(errorMessage);
              reject(new Error(errorMessage));
            }
          });
      }

      attemptListen();
    });
  } catch (error) {
    console.error('Critical initialization error:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp().catch((error) => {
  console.error('Critical error during startup:', error);
  process.exit(1);
});

// Setup core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Ensure JSON responses for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Catch errors in JSON responses
  const originalJson = res.json;
  res.json = function(body) {
    if (body && body.error) {
      console.error('API Error:', body.error);
    }
    return originalJson.call(this, body);
  };
  
  next();
});

// Global error handler for API routes
app.use('/api', (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Setup authentication before routes
setupAuth(app);

// Health monitoring endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Quick database connection check
    const dbCheckStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbCheckDuration = Date.now() - dbCheckStart;
    
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
          errorRate: metric.count > 0 ? (metric.errors / metric.count * 100).toFixed(2) + '%' : '0%',
          statusCodes: metric.statusCodes,
          rateLimit: {
            currentRate: metric.lastMinuteCalls.length,
            limit: RATE_LIMIT_MAX_CALLS,
            window: `${RATE_LIMIT_WINDOW/1000}s`
          }
        }
      ])
    );

    // Calculate memory usage percentages
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: metrics.databaseStatus.isConnected ? "connected" : "error",
          responseTime: `${metrics.databaseStatus.responseTime}ms`,
          lastCheck: new Date(metrics.databaseStatus.lastCheck).toISOString(),
          currentCheckTime: `${dbCheckDuration}ms`
        },
        auth: "operational",
        api: "operational"
      },
      metrics: {
        requestCount: metrics.requestCount,
        averageResponseTime: Math.round(averageResponseTime),
        errorCount: metrics.errors,
        errorRate: metrics.requestCount > 0 ? 
          (metrics.errors / metrics.requestCount * 100).toFixed(2) + '%' : '0%',
        endpoints: endpointStats
      },
      system: {
        memory: {
          used: Math.round(usedMemory / 1024 / 1024) + 'MB',
          total: Math.round(totalMemory / 1024 / 1024) + 'MB',
          usagePercentage: memoryUsagePercent + '%',
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
        },
        cpu: {
          user: metrics.systemMetrics.cpuUsage.user,
          system: metrics.systemMetrics.cpuUsage.system
        },
        uptime: {
          seconds: Math.floor(metrics.systemMetrics.uptime),
          formatted: `${Math.floor(metrics.systemMetrics.uptime / 3600)}h ${Math.floor((metrics.systemMetrics.uptime % 3600) / 60)}m ${Math.floor(metrics.systemMetrics.uptime % 60)}s`
        },
        lastUpdate: new Date(metrics.systemMetrics.lastCheck).toISOString()
      },
      clientErrors: metrics.clientErrors.slice(-10) // Keep last 10 errors
    };

    // Set response headers for monitoring
    res.set({
      'X-Health-Check-Time': dbCheckDuration.toString(),
      'X-Memory-Usage': memoryUsagePercent,
      'X-Uptime': metrics.systemMetrics.uptime.toString()
    });
    
    res.json(health);
  } catch (error) {
    metrics.errors++;
    const unhealthy = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      metrics: {
        requestCount: metrics.requestCount,
        errorCount: metrics.errors,
        errorRate: (metrics.errors / metrics.requestCount * 100).toFixed(2) + '%'
      },
      lastKnownStatus: {
        database: metrics.databaseStatus,
        system: metrics.systemMetrics
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
      updateEndpointMetrics(path, duration, isError, res.statusCode);
      
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

// Application initialization is handled at the top level
// No need for duplicate initialization here
