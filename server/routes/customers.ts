import { Router } from "express";
import { db } from "../../db";
import { customers } from "../../db/schema";
import { eq, or, ilike } from "drizzle-orm";

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

// Get all customers
router.get("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allCustomers = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt));

    res.json(allCustomers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

export default router; 