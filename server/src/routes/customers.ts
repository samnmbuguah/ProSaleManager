import express from "express";
import { Op } from "sequelize";
import Customer from "../models/Customer.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireStoreContext } from '../middleware/store-context.middleware.js';
import { storeScope } from '../utils/helpers.js';

const router = express.Router();

// Apply authentication middleware to all customer routes
router.use(requireAuth);
router.use(requireStoreContext);

// Get all customers
router.get("/", async (req, res) => {
  try {
    const where = storeScope(req.user, {});
    const customers = await Customer.findAll({
      where,
      order: [["name", "ASC"]],
    });
    res.json({ data: customers });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Error fetching customers', error: errorMsg });
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
    const customers = await Customer.findAll({
      where,
      limit: 10,
      order: [["name", "ASC"]],
    });
    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Failed to search customers" });
  }
});

// Create a new customer
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }
    const customer = await Customer.create({
      name,
      email,
      phone,
      address,
      store_id: req.user?.role === 'super_admin' ? (req.body.store_id ?? null) : req.user?.store_id,
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
    const { name, email, phone, address } = req.body;
    const where = storeScope(req.user, { id });
    const customer = await Customer.findOne({ where });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await customer.update({
      name,
      email,
      phone,
      address,
    });
    res.json(customer);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Error updating customer', error: errorMsg });
  }
});

// Delete a customer
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const where = storeScope(req.user, { id });
    const customer = await Customer.findOne({ where });
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
