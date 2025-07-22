import { Request, Response } from "express";
import { Op } from "sequelize";
import { Customer } from "../models/index.js";
import { storeScope } from "../utils/helpers.js";

export const searchCustomers = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin' && !req.user?.store_id) {
      return res.status(400).json({ message: 'Store context missing' });
    }
    const { q } = req.query;
    let where: any = {};
    if (q) {
      const searchQuery = q.toString().toLowerCase();
      where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchQuery}%` } },
          { email: { [Op.iLike]: `%${searchQuery}%` } },
          { phone: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      };
    }
    where = storeScope(req.user!, where);
    const customers = await Customer.findAll({
      where,
      limit: 10,
      order: [["name", "ASC"]],
    });
    return res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ message: "Failed to search customers" });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin' && !req.user?.store_id) {
      return res.status(400).json({ message: 'Store context missing' });
    }
    const { name, email, phone, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }
    const customer = await Customer.create({
      name,
      email,
      phone,
      address,
      store_id: req.user?.role === 'super_admin' ? (req.body.store_id ?? null) : req.user?.store_id,
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ message: "Failed to create customer" });
  }
};
