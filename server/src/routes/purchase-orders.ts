import { Router } from "express";
import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseOrderItem from "../models/PurchaseOrderItem.js";
import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";
import { generateOrderNumber } from "../utils/helpers.js";

const router = Router();

// Get all purchase orders
router.get("/", async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({
      include: [
        {
          model: Supplier,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

// Create a new purchase order
router.post("/", async (req, res) => {
  try {
    const { supplier_id, expected_delivery_date, notes, items } = req.body;

    // Calculate total amount
    const total_amount = items.reduce(
      (sum: number, item: { quantity: number; unit_price?: number; buying_price?: number }) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price ?? item.buying_price) || 0),
      0,
    );

    // Create purchase order
    const order = await PurchaseOrder.create({
      supplier_id,
      order_number: generateOrderNumber(),
      order_date: new Date(),
      expected_delivery_date,
      notes,
      total_amount,
      status: "pending",
    });

    // Create purchase order items
    await Promise.all(
      items.map((item: { product_id: number; quantity: number; unit_price: number; total: number }) =>
        PurchaseOrderItem.create({
          purchase_order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        }),
      ),
    );

    // Fetch the created order with supplier details
    const createdOrder = await PurchaseOrder.findByPk(order.id, {
      include: [
        {
          model: Supplier,
          attributes: ["name"],
        },
      ],
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({ error: "Failed to create purchase order" });
  }
});

// Get purchase order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          attributes: ["name"],
        },
        {
          model: PurchaseOrderItem,
          include: ["product"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    res.status(500).json({ error: "Failed to fetch purchase order" });
  }
});

// Update purchase order status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    await order.update({ status });

    // If status is 'received', update product quantity
    if (status === "received") {
      const items = await PurchaseOrderItem.findAll({
        where: { purchase_order_id: order.id },
        include: [Product],
      });

      await Promise.all(
        items.map(async (item) => {
          const product = (item as { product?: any }).product;
          if (!product || typeof product !== 'object' || !('name' in product) || !('id' in product)) {
            throw new Error(`Product with id ${item.product_id} not found for order item ${item.id}`);
          }
          console.log(`Product found: ${product.name}, ID: ${product.id}`);
        }),
      );
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating purchase order status:", error);
    res.status(500).json({ error: "Failed to update purchase order status" });
  }
});

export default router;