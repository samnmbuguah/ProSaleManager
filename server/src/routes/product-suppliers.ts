import { Router } from "express";
import ProductSupplier from "../models/ProductSupplier.js";

const router = Router();

// Get all product-suppliers
router.get("/", async (req, res) => {
  try {
    const productSuppliers = await ProductSupplier.findAll();
    res.json(productSuppliers);
  } catch (error) {
    console.error("Error fetching product-suppliers:", error);
    res.status(500).json({ error: "Failed to fetch product-suppliers" });
  }
});

// Get a single product-supplier by id
router.get("/:id", async (req, res) => {
  try {
    const productSupplier = await ProductSupplier.findByPk(req.params.id);
    if (!productSupplier) {
      return res.status(404).json({ error: "ProductSupplier not found" });
    }
    res.json(productSupplier);
  } catch (error) {
    console.error("Error fetching product-supplier:", error);
    res.status(500).json({ error: "Failed to fetch product-supplier" });
  }
});

// Create a new product-supplier
router.post("/", async (req, res) => {
  try {
    const productSupplier = await ProductSupplier.create(req.body);
    res.status(201).json(productSupplier);
  } catch (error) {
    console.error("Error creating product-supplier:", error);
    res.status(400).json({ error: "Failed to create product-supplier" });
  }
});

// Update a product-supplier
router.put("/:id", async (req, res) => {
  try {
    const productSupplier = await ProductSupplier.findByPk(req.params.id);
    if (!productSupplier) {
      return res.status(404).json({ error: "ProductSupplier not found" });
    }
    await productSupplier.update(req.body);
    res.json(productSupplier);
  } catch (error) {
    console.error("Error updating product-supplier:", error);
    res.status(400).json({ error: "Failed to update product-supplier" });
  }
});

// Delete a product-supplier
router.delete("/:id", async (req, res) => {
  try {
    const productSupplier = await ProductSupplier.findByPk(req.params.id);
    if (!productSupplier) {
      return res.status(404).json({ error: "ProductSupplier not found" });
    }
    await productSupplier.destroy();
    res.json({ message: "ProductSupplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting product-supplier:", error);
    res.status(500).json({ error: "Failed to delete product-supplier" });
  }
});

export default router;
