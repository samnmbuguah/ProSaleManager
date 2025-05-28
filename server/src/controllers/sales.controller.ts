import { Request, Response } from "express";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import sequelize from "../config/database.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";

export const createSale = async (req: Request, res: Response) => {
  let t;
  try {
    t = await sequelize.transaction();

    const {
      items,
      total,
      payment_method,
      status,
      payment_status,
      amount_paid,
      customer_id,
    } = req.body;

    // Get the user_id from the authenticated session
    const user_id = req.user?.id;
    if (!user_id) {
      await t.rollback();
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "No items provided for sale" });
    }

    // Create the sale with customer_id (null for walk-in customers)
    // Ensure we use the client's status value or default to 'completed' for paid sales
    const sale = await Sale.create(
      {
        user_id,
        customer_id: customer_id || null,
        total_amount: total,
        payment_method: payment_method || "cash",
        amount_paid: amount_paid || total,
        status: status || "completed", // Default to completed instead of pending
        payment_status: payment_status || "paid", // Explicitly track payment status
      },
      { transaction: t },
    );

    // Define a type for sale item
    interface SaleItemInput {
      product_id: number;
      quantity: number;
      unit_price: number;
      total: number;
      unit_type: string;
    }

    // Create sale items
    await Promise.all(
      (items as SaleItemInput[]).map((item) =>
        SaleItem.create(
          {
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            unit_type: item.unit_type,
          },
          { transaction: t },
        ),
      ),
    );

    // Commit transaction
    await t.commit();
    t = null;

    // Return the created sale with items
    const createdSale = await Sale.findByPk(sale.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
        {
          model: Customer,
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: SaleItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "product_code"],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      message: "Sale created successfully",
      data: createdSale,
    });
  } catch (error) {
    // Only rollback if transaction exists and is not already committed/rolled back
    if (t && !t.finished) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }

    console.error("Error creating sale:", error);
    res.status(500).json({ message: "Failed to create sale" });
  }
};

export const getSales = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    const { count, rows: sales } = await Sale.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
        {
          model: Customer,
          attributes: ["id", "name", "email", "phone"],
          required: false,
        },
        {
          model: SaleItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "product_code"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset,
    });

    res.json({
      sales,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch sales";
    res.status(500).json({ message: errorMessage });
  }
};

export const getSaleItems = async (req: Request, res: Response) => {
  try {
    const saleId = parseInt(req.params.id);
    if (isNaN(saleId)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    const items = await SaleItem.findAll({
      where: { sale_id: saleId },
      include: [
        {
          model: Product,
          attributes: ["id", "name", "product_number"],
        },
      ],
      order: [["id", "ASC"]],
    });

    res.json(items);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch sale items";
    res.status(500).json({ message: errorMessage });
  }
};

export const checkout = async (req: Request, res: Response) => {
  try {
    const { items, total, customer_id } = req.body;

    // Here you can implement the logic to process the checkout,
    // such as creating a sale and associating it with the items.

    // Example: Create a new sale
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const sale = await Sale.create({
      user_id,
      customer_id: customer_id || null,
      total_amount: total,
      payment_method: "Cash", // or whatever method you want to set
      status: "paid", // or whatever status you want to set
    });

    // Create sale items
    await Promise.all(
      items.map((item: any) =>
        SaleItem.create({
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }),
      ),
    );

    res.status(201).json({ message: "Checkout successful", sale });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ message: "Failed to proceed to checkout" });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const saleId = parseInt(req.params.id);
    if (isNaN(saleId)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    const sale = await Sale.findByPk(saleId, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
        {
          model: Customer,
          attributes: ["id", "name", "email", "phone"],
          required: false,
        },
        {
          model: SaleItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "product_code", "selling_price"],
            },
          ],
        },
      ],
    });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(sale);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch sale";
    res.status(500).json({ message: errorMessage });
  }
};
