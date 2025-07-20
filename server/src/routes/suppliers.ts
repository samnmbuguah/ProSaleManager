import { Router } from "express";
import Supplier from "../models/Supplier.js";
import { Op } from "sequelize";
import { storeScope } from "../utils/helpers.js";

const router = Router();

// Get all suppliers
router.get("/", async (req, res) => {
  try {
    const where = storeScope(req.user!, {});
    const suppliers = await Supplier.findAll({
      where,
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ success: false, error: "Failed to fetch suppliers" });
  }
});

// Search suppliers
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    let where: any = {};
    if (q) {
      where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { phone: { [Op.iLike]: `%${q}%` } },
        ],
      };
    }
    where = storeScope(req.user!, where);
    const suppliers = await Supplier.findAll({
      where,
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error("Error searching suppliers:", error);
    res.status(500).json({ success: false, error: "Failed to search suppliers" });
  }
});

// Get a single supplier
router.get("/:id", async (req, res) => {
  try {
    const where = storeScope(req.user!, { id: req.params.id });
    const supplier = await Supplier.findOne({ where });
    if (!supplier) {
      return res.status(404).json({ success: false, error: "Supplier not found" });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({ success: false, error: "Failed to fetch supplier" });
  }
});

// Create a new supplier
router.post("/", async (req, res) => {
  try {
    const supplier = await Supplier.create({
      ...req.body,
      store_id: req.user?.role === 'super_admin' ? (req.body.store_id ?? null) : req.user?.store_id,
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    if (error instanceof Error && typeof error.name === 'string' && error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ success: false, error: "A supplier with this email already exists." });
    }
    console.error("Error creating supplier:", error);
    res.status(400).json({ success: false, error: "Failed to create supplier" });
  }
});

// Update a supplier
router.put("/:id", async (req, res) => {
  try {
    const where = storeScope(req.user!, { id: req.params.id });
    const supplier = await Supplier.findOne({ where });
    if (!supplier) {
      return res.status(404).json({ success: false, error: "Supplier not found" });
    }
    await supplier.update(req.body);
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(400).json({ success: false, error: "Failed to update supplier" });
  }
});

// Delete a supplier
router.delete("/:id", async (req, res) => {
  try {
    const where = storeScope(req.user!, { id: req.params.id });
    const supplier = await Supplier.findOne({ where });
    if (!supplier) {
      return res.status(404).json({ success: false, error: "Supplier not found" });
    }
    await supplier.destroy();
    res.json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ success: false, error: "Failed to delete supplier" });
  }
});

export default router;
