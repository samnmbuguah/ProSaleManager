import { Request, Response } from "express";
import { Op } from "sequelize";
import Category from "../models/Category.js";
import { param } from "../utils/params.js";
import { catchAsync } from "../utils/catch-async.js";
import { ApiError } from "../utils/api-error.js";

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const { is_active } = req.query;

  const where: Record<string, unknown> = {};
  if (is_active !== undefined) {
    where.is_active = is_active === "true";
  }

  const categories = await Category.findAll({
    where,
    order: [["name", "ASC"]],
  });

  res.json({
    success: true,
    data: categories,
  });
});

export const getCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findByPk(param(req.params.id));

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  res.json({
    success: true,
    data: category,
  });
});

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new ApiError(400, "Category name is required.");
  }

  const existing = await Category.findOne({ where: { name: name.trim() } });
  if (existing) {
    throw new ApiError(400, "Category name must be unique.");
  }

  const category = await Category.create({ name: name.trim(), description });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const category = await Category.findByPk(param(req.params.id));

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (name && typeof name === "string" && name.trim() !== "") {
    const existing = await Category.findOne({
      where: {
        name: name.trim(),
        id: { [Op.ne]: param(req.params.id) },
      },
    });
    if (existing) {
      throw new ApiError(400, "Category name must be unique.");
    }
    category.name = name.trim();
  }

  if (description !== undefined) {
    category.description = description;
  }

  await category.save();

  res.json({
    success: true,
    data: category,
  });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findByPk(param(req.params.id));

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  await category.destroy();

  res.json({
    success: true,
    message: "Category deleted successfully",
  });
});
