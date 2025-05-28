import { Router } from "express";
import Supplier from "../models/Supplier";
import { Op } from "sequelize";

const router = Router();

// Get all suppliers
router.get("/", async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      order: [["name", "ASC"]],
    });
    res.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

// Search suppliers
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const suppliers = await Supplier.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { phone: { [Op.iLike]: `%${q}%` } },
        ],
      },
      order: [["name", "ASC"]],
    });
    res.json(suppliers);
  } catch (error) {
    console.error("Error searching suppliers:", error);
    res.status(500).json({ error: "Failed to search suppliers" });
  }
});

// Get a single supplier
router.get("/:id", async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

// Create a new supplier
router.post("/", async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(400).json({ error: "Failed to create supplier" });
  }
});

// Update a supplier
router.put("/:id", async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    await supplier.update(req.body);
    res.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(400).json({ error: "Failed to update supplier" });
  }
});

// Delete a supplier
router.delete("/:id", async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    await supplier.destroy();
    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

export default router;
