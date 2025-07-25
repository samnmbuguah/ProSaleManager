import { Request, Response } from "express";
import { Sale, SaleItem, Product, Customer } from "../models/index.js";
import { sequelize } from "../config/database.js";
import { storeScope } from "../utils/helpers.js";

export const getOrders = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "super_admin" && !req.user?.store_id) {
      return res.status(400).json({ message: "Store context missing" });
    }
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const where = storeScope(req.user!, { user_id: userId });
    const orders = await Sale.findAll({
      where,
      include: [
        { model: SaleItem, as: "items", include: [Product] },
        { model: Customer, attributes: ["id", "name", "email", "phone"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ orders });
  } catch {
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
        { model: Customer, attributes: ["id", "name", "email", "phone"] },
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
    const sale = await Sale.create(
      {
        user_id: userId,
        customer_id: null,
        total_amount: total,
        payment_method: "pending",
        amount_paid: 0,
        status: "pending",
        payment_status: "pending",
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
    await t.commit();
    res.status(201).json({ message: "Order created", orderId: sale.id });
  } catch {
    await t.rollback();
    res.status(500).json({ message: "Failed to create order" });
  }
};

export const updateOrder = (req: Request, res: Response) => {
  res.json({ message: "updateOrder stub" });
};

export const deleteOrder = (req: Request, res: Response) => {
  res.json({ message: "deleteOrder stub" });
};
