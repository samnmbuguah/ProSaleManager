import { Request, Response } from "express";
import Category from "../models/Category.js";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { is_active } = req.query;

    const where: any = {};
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const categories = await Category.findAll({
      where,
      order: [["name", "ASC"]]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching category",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
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

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    if (name && typeof name === "string" && name.trim() !== "") {
      // Check for uniqueness if name is being changed
      const existing = await Category.findOne({
        where: {
          name: name.trim(),
          id: { [require('sequelize').Op.ne]: req.params.id }
        }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Category name must be unique."
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description;
    }

    await category.save();

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
