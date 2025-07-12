import { Request, Response } from "express";
import { Op } from "sequelize";
import { Customer } from "../models/index.js";

export const searchCustomers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      const customers = await Customer.findAll({
        limit: 10,
        order: [["name", "ASC"]],
      });
      return res.json(customers);
    }

    const searchQuery = q.toString().toLowerCase();
    const customers = await Customer.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchQuery}%` } },
          { email: { [Op.iLike]: `%${searchQuery}%` } },
          { phone: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      },
      limit: 10,
      order: [["name", "ASC"]],
    });

    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Failed to search customers" });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
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
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ message: "Failed to create customer" });
  }
};
