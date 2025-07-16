import { Request, Response } from "express";
import type { Transaction } from "sequelize";
import { Sale, SaleItem, User, Customer, Product, sequelize } from "../models/index.js";

export const createSale = async (req: Request, res: Response) => {
  let t: Transaction | undefined;
  try {
    console.log("=== CREATE SALE START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User:", req.user);
    
    t = await sequelize.transaction();

    const {
      items,
      total,
      payment_method,
      status,
      payment_status,
      amount_paid,
      customer_id,
      delivery_fee,
    } = req.body;

    // Get the user_id from the authenticated session
    const user_id = req.user?.id;
    if (!user_id) {
      console.log("ERROR: No user_id found in request");
      await t.rollback();
      return res.status(401).json({ message: "User not authenticated" });
    }

    console.log("User ID:", user_id);
    console.log("Customer ID:", customer_id);

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log("ERROR: No items provided");
      await t.rollback();
      return res.status(400).json({ message: "No items provided for sale" });
    }

    console.log("Creating sale record...");
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
        delivery_fee: delivery_fee || 0,
      },
      { transaction: t },
    );

    console.log("Sale created with ID:", sale.id);

    // Define a type for sale item
    interface SaleItemInput {
      product_id: number;
      quantity: number;
      unit_price: number;
      total: number;
      unit_type: string;
    }

    console.log("Creating sale items...");
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

    console.log("Sale items created successfully");

    // Commit transaction
    await t.commit();
    t = undefined;

    console.log("Transaction committed successfully");

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
          as: "items",
          include: [
            {
              model: Product,
              attributes: ["id", "name", "sku"],
            },
          ],
        },
      ],
    });

    console.log("=== CREATE SALE SUCCESS ===");
    res.status(201).json({
      message: "Sale created successfully",
      data: createdSale,
    });
  } catch (error: unknown) {
    console.error("=== CREATE SALE ERROR ===");
    if (error instanceof Error) {
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      if (error.name) {
        console.error("Error name:", error.name);
      }
      
      if (typeof (error as { parent?: { message?: string; code?: string } }).parent !== 'undefined') {
        const parent = (error as { parent?: { message?: string; code?: string } }).parent;
        if (parent) {
          console.error("Parent error:", parent.message);
          console.error("Parent code:", parent.code);
        }
      }
    } else {
      console.error("Unknown error type:", error);
    }
    
    // Only rollback if transaction exists and is not already committed/rolled back
    // if (t && !(t as any).finished) {
    //   try {
    //     await t.rollback();
    //     console.log("Transaction rolled back");
    //   } catch (rollbackError) {
    //     console.error("Error rolling back transaction:", rollbackError);
    //   }
    // }

    // Return more specific error messages based on error type
    let errorMessage = "Failed to create sale";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === "SequelizeValidationError") {
        errorMessage = `Validation error: ${error.message}`;
        statusCode = 400;
      } else if (error.name === "SequelizeForeignKeyConstraintError") {
        errorMessage = `Foreign key constraint error: ${error.message}`;
        statusCode = 400;
      } else if (error.name === "SequelizeUniqueConstraintError") {
        errorMessage = `Duplicate entry error: ${error.message}`;
        statusCode = 400;
      } else if (error.name === "SequelizeDatabaseError") {
        errorMessage = `Database error: ${error.message}`;
        statusCode = 500;
      }
    }

    res.status(statusCode).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
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
          required: false,
        },
        {
          model: Customer,
          attributes: ["id", "name", "email", "phone"],
          required: false,
        },
        {
          model: SaleItem,
          as: "items",
          include: [
            {
              model: Product,
              attributes: ["id", "name", "sku"],
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errorMessage =
        error.message;
      res.status(500).json({ message: errorMessage });
    } else {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
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
          attributes: ["id", "name", "sku"],
        },
      ],
      order: [["id", "ASC"]],
    });

    res.json(items);
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errorMessage =
        error.message;
    res.status(500).json({ message: errorMessage });
    } else {
      res.status(500).json({ message: "Failed to fetch sale items" });
    }
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
      items.map((item: {
        product_id: number;
        quantity: number;
        unit_price: number;
        total: number;
      }) =>
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error during checkout:", error.message);
    } else {
      console.error("Unknown error during checkout:", error);
    }
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
          as: "items",
          include: [
            {
              model: Product,
              attributes: ["id", "name", "sku"],
            },
          ],
        },
      ],
    });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(sale);
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errorMessage =
        error.message;
    res.status(500).json({ message: errorMessage });
    } else {
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  }
};
