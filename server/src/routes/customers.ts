import express from "express";
import { Op } from "sequelize";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireStoreContext } from "../middleware/store-context.middleware.js";
import { storeScope } from "../utils/helpers.js";

const router = express.Router();

// Apply authentication middleware to all customer routes
router.use(requireAuth);
router.use(requireStoreContext);

// Get all customers
router.get("/", async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized: user not found in request." });
  }
  let storeId = req.user?.store_id;
  if (req.user?.role === "super_admin" && req.query.store_id) {
    storeId = parseInt(req.query.store_id as string);
  }
  try {
    const where = storeScope({ ...req.user, store_id: storeId }, {});
    let customers = await User.findAll({
      where: { ...where, role: "client" },
      order: [["name", "ASC"]],
      attributes: ["id", "name", "email", "phone", "store_id"],
    });
    // If no customers, create or fetch Walk-in Customer for this store
    if (customers.length === 0 && storeId) {
      let walkIn = await User.findOne({
        where: { store_id: storeId, name: "Walk-in Customer", role: "client" },
      });
      if (!walkIn) {
        try {
          walkIn = await User.create({
            name: "Walk-in Customer",
            email: `walkin.${storeId}@example.com`,
            phone: "N/A",
            role: "client",
            password: Math.random().toString(36).slice(2),
            is_active: true,
            store_id: storeId,
          });
        } catch (error: unknown) {
          // If unique constraint error, try to fetch again
          walkIn = await User.findOne({
            where: { store_id: storeId, name: "Walk-in Customer", role: "client" },
          });
        }
      }
      customers = walkIn ? [walkIn] : [];
    }
    res.json({ data: customers });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Error fetching customers", error: errorMsg });
  }
});

// Search customers
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    let where: any = {};
    if (q) {
      const searchQuery = q.toString().toLowerCase();
      where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchQuery}%` } },
          { email: { [Op.iLike]: `%${searchQuery}%` } },
          { phone: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      };
    }
    where = storeScope(req.user, where);
    const customers = await User.findAll({
      where: { ...where, role: "client" },
      limit: 10,
      order: [["name", "ASC"]],
      attributes: ["id", "name", "email", "phone", "store_id"],
    });
    res.json(customers);
  } catch {
    console.error("Error searching customers:");
    res.status(500).json({ message: "Failed to search customers" });
  }
});

// Create a new customer
router.post("/", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }
    const customer = await User.create({
      name,
      email,
      phone,
      role: "client",
      password: Math.random().toString(36).slice(2),
      is_active: true,
      store_id: req.user?.role === "super_admin" ? (req.body.store_id ?? null) : req.user?.store_id,
    });
    res.status(201).json(customer);
  } catch (error: unknown) {
    console.error("Error creating customer:", error);
    if (error instanceof Error && error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "A customer with this email or phone already exists",
      });
    }
    res.status(500).json({ message: "Failed to create customer" });
  }
});

// Update a customer
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    const where = storeScope(req.user, { id });
    const customer = await User.findOne({ where: { ...where, role: "client" } });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await customer.update({
      name,
      email,
      phone,
    });
    res.json(customer);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Error updating customer", error: errorMsg });
  }
});

// Delete a customer
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const where = storeScope(req.user, { id });
    const customer = await User.findOne({ where: { ...where, role: "client" } });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await customer.destroy();
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Failed to delete customer" });
  }
});

export default router;
