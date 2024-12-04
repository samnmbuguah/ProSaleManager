import { Router } from "express";
import { db } from "../../db";
import { customers } from "../../db/schema";
import { eq, or, ilike, desc, sql } from "drizzle-orm";

const router = Router();

// Types for metrics
interface RequestMetrics {
  totalRequests: number;
  totalTime: number;
  errors: number;
  rateLimit: {
    requests: Map<string, number[]>;
    window: number;
    limit: number;
  };
}

// Request timing metrics
const metrics: RequestMetrics = {
  totalRequests: 0,
  totalTime: 0,
  errors: 0,
  rateLimit: {
    requests: new Map<string, number[]>(),
    window: 60000, // 1 minute
    limit: 100 // requests per window
  }
};

// Middleware to track request timing and errors
router.use((req, res, next) => {
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  metrics.totalRequests++;

  // Rate limiting
  const now = Date.now();
  const userRequests = metrics.rateLimit.requests.get(ip as string) || [];
  const recentRequests = userRequests.filter(time => now - time < metrics.rateLimit.window);
  
  if (recentRequests.length >= metrics.rateLimit.limit) {
    metrics.errors++;
    const error = {
      status: 429,
      message: 'Too many requests',
      retryAfter: Math.ceil((metrics.rateLimit.window - (now - recentRequests[0])) / 1000),
      rateLimitInfo: {
        limit: metrics.rateLimit.limit,
        remaining: metrics.rateLimit.limit - recentRequests.length,
        reset: now + (metrics.rateLimit.window - (now - recentRequests[0]))
      }
    };
    console.error('[Customers API] Rate limit exceeded:', {
      ip,
      requestCount: recentRequests.length,
      error
    });
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': metrics.rateLimit.limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': Math.ceil(error.rateLimitInfo.reset / 1000).toString(),
      'Retry-After': error.retryAfter.toString()
    });
    
    return res.status(429).json(error);
  }

  metrics.rateLimit.requests.set(ip as string, [...recentRequests, now]);

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.totalTime += duration;
    
    if (res.statusCode >= 400) {
      metrics.errors++;
    }

    // Send metrics to health monitoring
    const requestMetrics = {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };

    console.log(`[Customers API] ${JSON.stringify(requestMetrics)}`);
  });

  next();
});

// Search customers
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const searchQuery = `%${q}%`;

    const results = await db
      .select()
      .from(customers)
      .where(
        or(
          ilike(customers.name, searchQuery),
          ilike(customers.email, searchQuery),
          ilike(customers.phone, searchQuery)
        )
      )
      .limit(10);

    res.json(results);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ error: "Failed to search customers" });
  }
});

// Create new customer
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const [customer] = await db
      .insert(customers)
      .values({
        name,
        email: email || null,
        phone: phone || null,
        createdAt: new Date(),
      })
      .returning();

    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Get customer by ID
router.get("/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (!customer.length) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer[0]);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Error handling middleware
const handleErrors = (err: any, req: any, res: any, next: any) => {
  console.error("Error in customers route:", err);
  res.status(500).json({ error: "Internal server error" });
};

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Get all customers
router.get("/", requireAuth, async (req, res) => {
  try {
    const allCustomers = await db.select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
    })
      .from(customers)
      .orderBy(desc(customers.createdAt));
    
    // Log success to health monitoring
    console.log('[Customers API] Successfully fetched customers:', {
      count: allCustomers.length,
      timestamp: new Date().toISOString()
    });
    
    // Ensure we always return an array
    res.json(allCustomers || []);
  } catch (error) {
    metrics.errors++;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error to health monitoring
    console.error('[Customers API] Error fetching customers:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: "Failed to fetch customers",
      details: app.get('env') === 'development' ? errorMessage : undefined
    });
  }
});

// Apply error handling middleware
router.use(handleErrors);

export default router; 