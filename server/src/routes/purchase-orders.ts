import { Router } from "express";
import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseOrderItem from "../models/PurchaseOrderItem.js";
import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";
import { generateOrderNumber } from "../utils/helpers.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { requireStoreContext } from "../middleware/store-context.middleware.js";
import { calculateWeightedAveragePricesForAllUnits } from "../utils/priceCalculations.js";
import { notifyUsersOfPurchaseOrder } from "../services/notification.service.js";

const router = Router();

router.use(requireAuth);
router.use(requireStoreContext);

// Get all purchase orders
router.get("/", async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({
      include: [
        {
          model: Supplier,
          as: "supplier",
          attributes: ["name"],
        },
        {
          model: PurchaseOrderItem,
          include: [Product],
          as: "items",
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
    if (!req.user) return res.status(401).json({ error: "User context missing" });
    const { supplier_id, expected_delivery_date, notes, items } = req.body;

    // Calculate total amount
    const total_amount = items.reduce(
      (sum: number, item: { quantity: number; unit_price?: number; buying_price?: number }) =>
        sum + (Number(item.quantity) || 0) * (Number(item.unit_price ?? item.buying_price) || 0),
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
      store_id: req.user.store_id,
    });

    await Promise.all(
      items.map((item: { product_id: string; quantity: number; unit_price?: number; unit_type?: string; selling_price?: number }) =>
        PurchaseOrderItem.create({
          purchase_order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          selling_price: item.selling_price, // <-- Save selling_price
          total_price: item.quantity * (item.unit_price ?? 0),
          unit_type: item.unit_type, // <-- FIX: include unit_type
          store_id: req.user!.store_id,
        }),
      ),
    );

    // Fetch the created order with supplier details
    const createdOrder = await PurchaseOrder.findByPk(order.id, {
      include: [
        {
          model: Supplier,
          as: "supplier",
          attributes: ["name"],
        },
      ],
    });

    // Notify Admins
    await notifyUsersOfPurchaseOrder(req.user.store_id, {
      title: "New Purchase Order",
      message: `New Purchase Order #${createdOrder?.order_number || createdOrder?.id} created by ${req.user.name || 'User'}.`,
      data: { link: "/inventory?tab=purchase-orders", orderId: createdOrder?.id }
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
          as: "supplier",
          attributes: ["name"],
        },
        {
          model: PurchaseOrderItem,
          include: [Product],
          as: "items", // Ensure this alias matches your association
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

// Update purchase order details (items, dates, etc.)
router.put("/:id", requireAuth, requireRole(["admin", "manager", "super_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_id, expected_delivery_date, notes, items } = req.body;

    const order = await PurchaseOrder.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    if (order.status !== "pending" && order.status !== "approved") {
      // Allow editing if pending or approved (before receiving)
      // You might restrict 'approved' editing if strict workflow is needed
      // For now, let's assume we can edit details as long as it's not received/cancelled
    }

    // Prevent editing if already received or cancelled
    if (["received", "cancelled"].includes(order.status)) {
      return res.status(400).json({ error: "Cannot edit a purchase order that is already received or cancelled." });
    }

    // Update Order fields
    if (supplier_id) order.supplier_id = supplier_id;
    if (expected_delivery_date) order.expected_delivery_date = expected_delivery_date;
    if (notes !== undefined) order.notes = notes;

    // Recalculate total amount from items
    let newTotal = 0;

    if (items && Array.isArray(items)) {
      // Destroy existing items and recreate them to ensure sync
      // Alternatively, we could diff them, but full replace is safer/easier for now
      await PurchaseOrderItem.destroy({
        where: { purchase_order_id: id }
      });

      // Create new items
      await Promise.all(
        items.map((item: { product_id: string; quantity: number; unit_price?: number; unit_type?: string; selling_price?: number }) => {
          const qty = Number(item.quantity) || 0;
          const price = Number(item.unit_price) || 0; // Buying price
          const total = qty * price;
          newTotal += total;

          return PurchaseOrderItem.create({
            purchase_order_id: order.id,
            product_id: item.product_id,
            quantity: qty,
            unit_price: price,
            selling_price: item.selling_price,
            total_price: total,
            unit_type: item.unit_type || 'piece',
            store_id: req.user!.store_id,
          });
        })
      );
    } else {
      // If items not provided in update, keep old total (or recalculate if needed? 
      // usually update includes everything. Let's assume frontend sends full object)
      // For safety, if items IS NOT provided, we don't change items.
      // But if items IS provided as empty array, it clears items.
      // So checking if items is undefined:
      // Actually, let's assume if items is passed, we replace.
      // If we didn't update items, we should keep order.total_amount as is.
      // But here we only calculated newTotal if items were processed.

      // Let's refine:
      // If items are NOT passed, we just update fields. 
      // If items ARE passed, we replace items and update total.
    }

    if (items && Array.isArray(items)) {
      order.total_amount = newTotal;
    }

    await order.save();

    // Refetch with associations
    const updatedOrder = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Supplier, as: "supplier", attributes: ["name"] },
        { model: PurchaseOrderItem, as: "items", include: [Product] }
      ]
    });

    res.json(updatedOrder);

  } catch (error) {
    console.error("Error updating purchase order:", error);
    res.status(500).json({ error: "Failed to update purchase order" });
  }
});

// Update purchase order status
router.put(
  "/:id/status",
  requireAuth,
  requireRole(["admin", "manager", "sales", "super_admin"]),
  async (req, res) => {
    try {
      const { status } = req.body;
      const order = await PurchaseOrder.findByPk(req.params.id);

      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      // Enforce allowed status transitions
      const currentStatus = order.status;
      const transitions: Record<string, string[]> = {
        pending: ["approved", "rejected"],
        approved: ["received"],
        ordered: [],
        received: [],
        cancelled: [],
      };
      const allowed = transitions[currentStatus] || [];
      if (!allowed || !allowed.includes(status)) {
        return res.status(400).json({
          error: `Cannot change status from ${currentStatus} to ${status}`,
        });
      }

      // If marking as received, increment product quantities and update buying prices
      if (status === "received") {
        const items = await PurchaseOrderItem.findAll({
          where: { purchase_order_id: order.id },
        });
        for (const item of items) {
          const product = await Product.findByPk(item.product_id);
          if (product) {
            // Convert purchase quantity to base units (pieces) based on unit_type
            let quantityToAdd = item.quantity;

            if (item.unit_type === "pack") {
              // 1 pack = 3 pieces
              quantityToAdd = item.quantity * 3;
            } else if (item.unit_type === "dozen") {
              // 1 dozen = 12 pieces
              quantityToAdd = item.quantity * 12;
            }
            // For "piece" unit_type, quantityToAdd remains as item.quantity

            // Calculate weighted average buying prices for all unit types
            if (item.unit_type && item.unit_price !== undefined) {
              const newPrices = calculateWeightedAveragePricesForAllUnits(
                product,
                item.quantity,
                Number(item.unit_price),
                item.unit_type as 'piece' | 'pack' | 'dozen'
              );

              // Update all buying prices with weighted averages
              product.piece_buying_price = newPrices.piece_buying_price;
              product.pack_buying_price = newPrices.pack_buying_price;
              product.dozen_buying_price = newPrices.dozen_buying_price;
            }

            // Update quantity
            product.quantity += quantityToAdd;

            // Only update selling price if present on the item
            if (item.unit_type && item.selling_price !== undefined) {
              (product as unknown as Record<string, unknown>)[`${item.unit_type}_selling_price`] = Number(item.selling_price);
            }
            await product.save();
          }
        }
      }

      order.status = status;
      await order.save();

      // Notify relevant users about status change
      // If approved/rejected, notify creator (if we tracked creator_id, but we assume sales created it).
      // For now, let's notify "sales" role users or everyone? 
      // User requested "The notification should link to the relevant page".
      // Let's notify "sales" and "manager" about updates.

      let message = `Purchase Order #${order.order_number || order.id} status updated to ${status}.`;
      if (status === 'received') message = `Purchase Order #${order.order_number || order.id} has been received and stock updated.`;

      await notifyUsersOfPurchaseOrder(req.user?.store_id, {
        title: `PO ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message,
        data: { link: "/inventory?tab=purchase-orders", orderId: order.id }
      }, ["sales", "manager", "admin"]); // Notify broad group for now so creator likely sees it


      res.json(order);
    } catch (error) {
      console.error("Error updating purchase order status:", error);
      res.status(500).json({ error: "Failed to update purchase order status" });
    }
  },
);

// Delete purchase order
router.delete("/:id", requireAuth, requireRole(["admin", "super_admin"]), async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    await order.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    res.status(500).json({ error: "Failed to delete purchase order" });
  }
});

export default router;
