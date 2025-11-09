import { Request, Response } from "express";
import { Sale, SaleItem, Product, User } from "../models/index.js";
import { sequelize } from "../config/database.js";
import { storeScope } from "../utils/helpers.js";
import { Op } from "sequelize";

export const getOrders = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "super_admin" && !req.user?.store_id) {
      return res.status(400).json({ message: "Store context missing" });
    }
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    // For admins/managers/sales, show all orders with status "unprocessed" or "pending"
    // For clients, show only their own orders
    const isAdmin = ["admin", "manager", "super_admin", "sales"].includes(req.user.role);
    let baseWhere: any = storeScope(req.user!, {});
    
    if (isAdmin) {
      // Admins see all unprocessed/pending orders in their store
      baseWhere.status = {
        [Op.in]: ["unprocessed", "pending"]
      };
    } else {
      // Clients see only their own orders
      baseWhere.user_id = userId;
    }
    
    const orders = await Sale.findAll({
      where: baseWhere,
      include: [
        { model: SaleItem, as: "items", include: [Product] },
        { model: User, as: "Customer", attributes: ["id", "name", "email", "phone"] },
        { model: User, as: "User", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "super_admin" && !req.user?.store_id) {
      return res.status(400).json({ message: "Store context missing" });
    }
    const userId = req.user?.id;
    const where = storeScope(req.user!, { id: req.params.id, user_id: userId });
    const order = await Sale.findOne({
      where,
      include: [
        { model: SaleItem, as: "items", include: [Product] },
        { model: User, as: "Customer", attributes: ["id", "name", "email", "phone"] },
      ],
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch {
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.id;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "No items provided" });
    }
    const total = items.reduce((sum: number, item: { unit_price: number; quantity: number }) => sum + item.unit_price * item.quantity, 0);
    const store_id =
      req.user?.role === "super_admin" ? (req.body.store_id ?? null) : req.user?.store_id;
    if (req.user?.role !== "super_admin" && !store_id) {
      await t.rollback();
      return res.status(400).json({ message: "Store context missing" });
    }
    // Set status based on user role - clients get "unprocessed" status
    const orderStatus = req.user?.role === "client" ? "unprocessed" : "pending";
    const paymentStatus = req.user?.role === "client" ? "pending" : "pending";

    const sale = await Sale.create(
      {
        user_id: userId,
        customer_id: null,
        total_amount: total,
        payment_method: "pending",
        amount_paid: 0,
        status: orderStatus,
        payment_status: paymentStatus,
        delivery_fee: 0,
        store_id,
      },
      { transaction: t },
    );
    await Promise.all(
      items.map((item: { product_id: number; quantity: number; unit_price: number; unit_type: string }) =>
        SaleItem.create(
          {
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.unit_price * item.quantity,
            unit_type: item.unit_type,
          },
          { transaction: t },
        ),
      ),
    );

    // Note: Inventory is not reduced for new orders - only when they are marked as completed via updateOrder

    await t.commit();
    res.status(201).json({ message: "Order created", orderId: sale.id });
  } catch {
    await t.rollback();
    res.status(500).json({ message: "Failed to create order" });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const order = await Sale.findByPk(id, {
      include: [{ model: SaleItem, as: "items" }],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const oldStatus = order.status;

    // Update order status
    if (status) order.status = status;
    if (payment_status) order.payment_status = payment_status;

    // If order is being marked as completed, reduce inventory
    if (status === "completed" && oldStatus !== "completed") {
      for (const item of (order as any).items) {
        const product = await Product.findByPk(item.product_id, { transaction: t });
        if (product) {
          // Convert sale quantity to base units (pieces) based on unit_type
          let quantityToReduce = item.quantity;

          if (item.unit_type === "pack") {
            // 1 pack = 3 pieces
            quantityToReduce = item.quantity * 3;
          } else if (item.unit_type === "dozen") {
            // Assuming 1 dozen = 12 pieces
            quantityToReduce = item.quantity * 12;
          }
          // For "piece" unit_type, quantityToReduce remains as item.quantity

          // Check if there's enough stock
          if (product.quantity < quantityToReduce) {
            await t.rollback();
            return res.status(400).json({
              message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Required: ${quantityToReduce}`
            });
          }

          // Reduce the quantity
          product.quantity -= quantityToReduce;
          await product.save({ transaction: t });
        } else {
          await t.rollback();
          return res.status(404).json({ message: `Product with ID ${item.product_id} not found` });
        }
      }
    }

    // If order is being cancelled or rejected, restore inventory (if it was previously completed)
    if ((status === "cancelled" || status === "rejected") && oldStatus === "completed") {
      for (const item of (order as any).items) {
        const product = await Product.findByPk(item.product_id, { transaction: t });
        if (product) {
          // Convert sale quantity to base units (pieces) based on unit_type
          let quantityToRestore = item.quantity;

          if (item.unit_type === "pack") {
            // 1 pack = 3 pieces
            quantityToRestore = item.quantity * 3;
          } else if (item.unit_type === "dozen") {
            // Assuming 1 dozen = 12 pieces
            quantityToRestore = item.quantity * 12;
          }
          // For "piece" unit_type, quantityToRestore remains as item.quantity

          // Restore the quantity
          product.quantity += quantityToRestore;
          await product.save({ transaction: t });
        }
      }
    }

    await order.save({ transaction: t });
    await t.commit();

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    await t.rollback();
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
};

export const deleteOrder = (req: Request, res: Response) => {
  res.json({ message: "deleteOrder stub" });
};
