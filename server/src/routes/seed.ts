import { Router } from "express";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/", async (req, res) => {
  try {
    // Clear existing data
    await Product.destroy({ where: {} });
    await Supplier.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    await User.create({
      email: "admin@example.com",
      name: "Admin User",
      password: hashedPassword,
      role: "admin",
    });

    // Create sample products
    const products = [
      // Shoes
      {
        name: "Nike Air Max",
        product_code: "SHOE001",
        category: "Shoes",
        stock_unit: "piece",
        quantity: 20,
        min_stock: 5,
        buying_price: 4500,
        selling_price: 6000,
      },
      {
        name: "Adidas Ultraboost",
        product_code: "SHOE002",
        category: "Shoes",
        stock_unit: "piece",
        quantity: 15,
        min_stock: 5,
        buying_price: 5000,
        selling_price: 7000,
      },
      // Panties
      {
        name: "Victoria Secret Pink Panty",
        product_code: "PAN001",
        category: "Panties",
        stock_unit: "dozen",
        quantity: 10,
        min_stock: 3,
        buying_price: 3600,
        selling_price: 4800,
      },
      {
        name: "Cotton Hipster Panty",
        product_code: "PAN002",
        category: "Panties",
        stock_unit: "pack",
        quantity: 20,
        min_stock: 5,
        buying_price: 1500,
        selling_price: 2100,
      },
      // Boxers
      {
        name: "Calvin Klein Boxer Brief",
        product_code: "BOX001",
        category: "Boxers",
        stock_unit: "pack",
        quantity: 15,
        min_stock: 5,
        buying_price: 2400,
        selling_price: 3000,
      },
      {
        name: "Nike Dri-FIT Boxer",
        product_code: "BOX002",
        category: "Boxers",
        stock_unit: "dozen",
        quantity: 8,
        min_stock: 2,
        buying_price: 4800,
        selling_price: 6000,
      },
      // Bras
      {
        name: "Victoria Secret Push-Up Bra",
        product_code: "BRA001",
        category: "Bras",
        stock_unit: "piece",
        quantity: 30,
        min_stock: 10,
        buying_price: 1500,
        selling_price: 2500,
      },
      {
        name: "Sports Bra",
        product_code: "BRA002",
        category: "Bras",
        stock_unit: "pack",
        quantity: 12,
        min_stock: 4,
        buying_price: 1800,
        selling_price: 2400,
      },
      // Oil
      {
        name: "Coconut Oil",
        product_code: "OIL001",
        category: "Oil",
        stock_unit: "dozen",
        quantity: 5,
        min_stock: 2,
        buying_price: 3600,
        selling_price: 4800,
      },
      {
        name: "Olive Oil",
        product_code: "OIL002",
        category: "Oil",
        stock_unit: "piece",
        quantity: 25,
        min_stock: 8,
        buying_price: 350,
        selling_price: 450,
      },
      // Add delivery service
      {
        name: "Delivery Service",
        product_code: "SRV001",
        category: "Services",
        stock_unit: "piece",
        quantity: 999999, // Large number since this is a service
        min_stock: 0, // No minimum stock needed for service
        buying_price: 0, // No buying price for service
        selling_price: 200,
      },
    ];

    await Product.bulkCreate(products);

    // Create sample suppliers
    const suppliers = [
      {
        name: "Nike Kenya",
        email: "info@nike.co.ke",
        phone: "+254700000001",
        address: "Westlands, Nairobi",
      },
      {
        name: "Victoria Secret Kenya",
        email: "info@vs.co.ke",
        phone: "+254700000002",
        address: "Kilimani, Nairobi",
      },
      {
        name: "Oil Distributors Ltd",
        email: "info@oildist.co.ke",
        phone: "+254700000003",
        address: "Industrial Area, Nairobi",
      },
    ];

    await Supplier.bulkCreate(suppliers);

    // Create sample customers
    const customers = [
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "+254700000003",
        loyalty_points: 100,
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+254700000004",
        loyalty_points: 50,
      },
    ];

    await Customer.bulkCreate(customers);

    res.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Error seeding database:", error);
    res.status(500).json({ message: "Error seeding database", error });
  }
});

export default router;
