import { Router } from "express";
import { db } from "../../db";
import { customers } from "../../db/schema";
import { eq, or, ilike, desc } from "drizzle-orm";

const router = Router();

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
router.post("/", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const [customer] = await db
      .insert(customers)
      .values({
        name,
        email: email || null,
        phone: phone || null,
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
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Get all customers
router.get("/", requireAuth, (req, res) => {
  db.select()
    .from(customers)
    .orderBy(desc(customers.createdAt))
    .then(allCustomers => {
      res.json(allCustomers || []);
    })
    .catch(next);
});

// Apply error handling middleware
router.use(handleErrors);

export default router; 