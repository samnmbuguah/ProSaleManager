import { Request, Response } from "express";
import Category from "../models/Category.js";

export const getCategories = async (req: Request, res: Response) => {
  const categories = await Category.findAll({ order: [["name", "ASC"]] });
  res.json(categories);
};

export const getCategory = (req: Request, res: Response) => {
  res.json({ message: "getCategory stub" });
};

export const createCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ success: false, message: "Category name is required." });
  }
  try {
    // Check for uniqueness
    const existing = await Category.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category name must be unique." });
    }
    const category = await Category.create({ name: name.trim(), description });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create category.", error });
  }
};

export const updateCategory = (req: Request, res: Response) => {
  res.json({ message: "updateCategory stub" });
};

export const deleteCategory = (req: Request, res: Response) => {
  res.json({ message: "deleteCategory stub" });
};
