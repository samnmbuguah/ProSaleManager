import { type Express, Request, Response } from "express";
import { db } from "../db";

// Basic system metrics
interface SystemMetrics {
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  responseTime: {
    avg: number;
    count: number;
    total: number;
  };
}

let metrics: SystemMetrics = {
  uptime: 0,
  memory: {
    total: 0,
    free: 0,
    used: 0,
  },
  responseTime: {
    avg: 0,
    count: 0,
    total: 0,
  },
};

// Update metrics every minute
setInterval(() => {
  const memUsage = process.memoryUsage();
  metrics.uptime = process.uptime();
  metrics.memory = {
    total: memUsage.heapTotal,
    free: memUsage.heapTotal - memUsage.heapUsed,
    used: memUsage.heapUsed,
  };
}, 60000);

// Middleware to track response times
export const responseTimeMiddleware = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.responseTime.total += duration;
    metrics.responseTime.count++;
    metrics.responseTime.avg = metrics.responseTime.total / metrics.responseTime.count;
  });
  next();
};

// Health check endpoints
export function setupHealthMonitoring(app: Express) {
  // Basic health check
  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Detailed health check including DB connection
  app.get("/health/detailed", async (req: Request, res: Response) => {
    try {
      // Test database connection
      await db.execute(sql`SELECT 1`);
      
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        metrics: {
          uptime: metrics.uptime,
          memory: metrics.memory,
          avgResponseTime: Math.round(metrics.responseTime.avg),
        },
      };
      
      res.json(health);
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
