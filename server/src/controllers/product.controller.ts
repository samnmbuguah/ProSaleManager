import { Request, Response } from "express";
import { Product } from "../models/index.js";
import type { ProductAttributes } from "../models/Product.js";
import { catchAsync } from "../utils/catch-async.js";
import { ApiError } from "../utils/api-error.js";
import { parse } from "csv-parse/sync";
import Category from "../models/Category.js";
import SaleItem from "../models/SaleItem.js";
import PurchaseOrderItem from "../models/PurchaseOrderItem.js";
import ProductSupplier from "../models/ProductSupplier.js";

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const where: any = {};
  if (req.user?.role !== "super_admin") {
    if (!req.user?.store_id) {
      res.status(400).json({ success: false, message: "Store context missing" });
      return;
    }
    where.store_id = req.user.store_id;
  }
  const products = await Product.findAll({
    where,
    order: [["name", "ASC"]],
  });
  res.json({
    success: true,
    data: products,
  });
});

export const getProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const where: any = { id };
  if (req.user?.role !== "super_admin") {
    if (!req.user?.store_id) {
      res.status(400).json({ success: false, message: "Store context missing" });
      return;
    }
    where.store_id = req.user.store_id;
  }
  const product = await Product.findOne({ where });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.json({
    success: true,
    data: product,
  });
});

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  // Log the incoming payload for debugging
  console.log("Incoming product payload:", JSON.stringify(req.body, null, 2));
  if (req.files) {
    console.log("Incoming files:", req.files);
  }
  // Guard: Ensure req.body is defined
  if (!req.body) {
    res.status(400).json({
      success: false,
      message:
        "Missing or invalid request body. Ensure you are sending data as JSON or multipart/form-data.",
    });
    return;
  }
  // Coerce and sanitize input
  const sku = (req.body.sku || "").trim();
  const images = Array.isArray(req.body.images)
    ? req.body.images
    : req.body.images
      ? [req.body.images]
      : [];

  // If files are uploaded (e.g., via multipart), add their URLs
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      if (file.path) {
        images.push(file.path);
      }
    }
  }

  const productData: ProductAttributes = {
    name: req.body.name,
    description: req.body.description || null,
    sku,
    barcode: req.body.barcode || "",
    category_id: Number(req.body.category_id),
    piece_buying_price: Number(req.body.piece_buying_price),
    piece_selling_price: Number(req.body.piece_selling_price),
    pack_buying_price: Number(req.body.pack_buying_price),
    pack_selling_price: Number(req.body.pack_selling_price),
    dozen_buying_price: Number(req.body.dozen_buying_price),
    dozen_selling_price: Number(req.body.dozen_selling_price),
    quantity: Number(req.body.quantity),
    min_quantity: Number(req.body.min_quantity),
    image_url: req.body.image_url || null,
    is_active: req.body.is_active === "true" || req.body.is_active === true,
    images,
    store_id: req.user?.role === "super_admin" ? (req.body.store_id ?? null) : req.user?.store_id,
    stock_unit: req.body.stock_unit || "piece",
  };
  if (req.user?.role !== "super_admin" && !productData.store_id) {
    res.status(400).json({ success: false, message: "Store context missing" });
    return;
  }

  // Validate required fields explicitly
  if (!productData.name) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: name",
    });
    return;
  }
  if (!productData.sku || productData.sku.trim() === "") {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: sku",
    });
    return;
  }
  if (!productData.category_id || isNaN(productData.category_id)) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: category_id",
    });
    return;
  }
  // Check if category exists
  const categoryExists = await Category.findByPk(productData.category_id);
  if (!categoryExists) {
    res.status(400).json({
      success: false,
      message: `Category with id ${productData.category_id} does not exist.`,
    });
    return;
  }
  if (isNaN(productData.piece_buying_price)) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: piece_buying_price",
    });
    return;
  }
  if (isNaN(productData.piece_selling_price)) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: piece_selling_price",
    });
    return;
  }
  if (isNaN(productData.pack_buying_price)) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: pack_buying_price",
    });
    return;
  }
  if (isNaN(productData.pack_selling_price)) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: pack_selling_price",
    });
    return;
  }
  if (isNaN(productData.dozen_buying_price)) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: dozen_buying_price",
    });
    return;
  }
  if (isNaN(productData.dozen_selling_price)) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: dozen_selling_price",
    });
    return;
  }
  if (isNaN(productData.quantity)) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: quantity",
    });
    return;
  }
  if (isNaN(productData.min_quantity)) {
    res.status(400).json({
      success: false,
      message: "Invalid or missing value for field: min_quantity",
    });
    return;
  }

  // Check for SKU uniqueness before creating
  const existing = await Product.findOne({
    where: { sku: productData.sku, store_id: productData.store_id },
  });
  if (existing) {
    res.status(400).json({
      success: false,
      message: "SKU already exists in this store. Please use a unique SKU.",
    });
    return;
  }

  try {
    const product = await Product.create(productData);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err: any) {
    // Handle Sequelize unique/foreign key constraint errors
    if (err.name === "SequelizeUniqueConstraintError" && err.errors?.[0]?.path === "sku") {
      res.status(400).json({
        success: false,
        message: "SKU already exists. Please use a unique SKU.",
      });
      return;
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      res.status(400).json({
        success: false,
        message: "Foreign key constraint error: " + err.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create product.",
    });
  }
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await Product.findByPk(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Only allow fields that are in the model
  const allowedFields = [
    "name",
    "description",
    "sku",
    "barcode",
    "category_id",
    "piece_buying_price",
    "piece_selling_price",
    "pack_buying_price",
    "pack_selling_price",
    "dozen_buying_price",
    "dozen_selling_price",
    "quantity",
    "min_quantity",
    "image_url",
    "is_active",
    "images",
    "stock_unit", // <-- Added to allow updating stock_unit
  ];
  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      let value = req.body[field];
      // Coerce types and handle nullables
      if (
        [
          "piece_buying_price",
          "piece_selling_price",
          "pack_buying_price",
          "pack_selling_price",
          "dozen_buying_price",
          "dozen_selling_price",
          "quantity",
          "min_quantity",
          "category_id",
        ].includes(field)
      ) {
        value = Number(value);
      }
      if (["is_active"].includes(field)) {
        value = value === "true" || value === true;
      }
      if (["image_url", "description", "barcode"].includes(field)) {
        value = value === "" ? null : value;
      }
      if (field === "images" && typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch {
          /* ignore */
        }
      }
      updateData[field] = value;
    }
  }

  await product.update(updateData);
  res.json({
    success: true,
    data: product,
  });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await Product.findByPk(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Directly count related records
  const [saleItemCount, poItemCount, supplierCount] = await Promise.all([
    SaleItem.count({ where: { product_id: product.id } }),
    PurchaseOrderItem.count({ where: { product_id: product.id } }),
    ProductSupplier.count({ where: { product_id: product.id } }),
  ]);

  if (saleItemCount > 0 || poItemCount > 0 || supplierCount > 0) {
    res.status(400).json({
      success: false,
      message:
        "Cannot delete product: it is referenced in sales, purchase orders, or supplier records.",
    });
    return;
  }

  await product.destroy();
  res.json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const bulkUploadProducts = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "No file uploaded" });
    return;
  }
  try {
    const csvString = req.file.buffer.toString("utf-8");
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({ success: false, message: "CSV file is empty or invalid" });
      return;
    }
    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; error: string }[] = [];
    for (const [i, row] of records.entries()) {
      const typedRow = row as Record<string, string>;
      try {
        const productData: ProductAttributes = {
          name: String(typedRow.name || ""),
          description: typedRow.description ? String(typedRow.description) : undefined,
          sku: String(typedRow.sku || ""),
          barcode: typedRow.barcode ? String(typedRow.barcode) : undefined,
          category_id: Number(typedRow.category_id),
          piece_buying_price: Number(typedRow.piece_buying_price),
          piece_selling_price: Number(typedRow.piece_selling_price),
          pack_buying_price: Number(typedRow.pack_buying_price),
          pack_selling_price: Number(typedRow.pack_selling_price),
          dozen_buying_price: Number(typedRow.dozen_buying_price),
          dozen_selling_price: Number(typedRow.dozen_selling_price),
          quantity: Number(typedRow.quantity),
          min_quantity: Number(typedRow.min_quantity),
          image_url: typedRow.image_url ? String(typedRow.image_url) : null,
          is_active: typedRow.is_active === "true",
          stock_unit: typedRow.stock_unit || "piece",
        };
        // Validate required fields explicitly
        if (!productData.name) throw new Error("Invalid or missing value for field: name");
        if (!productData.sku) throw new Error("Invalid or missing value for field: sku");
        if (!productData.category_id || isNaN(productData.category_id))
          throw new Error("Invalid or missing value for field: category_id");
        if (isNaN(productData.piece_buying_price))
          throw new Error("Invalid or missing value for field: piece_buying_price");
        if (isNaN(productData.piece_selling_price))
          throw new Error("Invalid or missing value for field: piece_selling_price");
        if (isNaN(productData.pack_buying_price))
          throw new Error("Invalid or missing value for field: pack_buying_price");
        if (isNaN(productData.pack_selling_price))
          throw new Error("Invalid or missing value for field: pack_selling_price");
        if (isNaN(productData.dozen_buying_price))
          throw new Error("Invalid or missing value for field: dozen_buying_price");
        if (isNaN(productData.dozen_selling_price))
          throw new Error("Invalid or missing value for field: dozen_selling_price");
        if (isNaN(productData.quantity))
          throw new Error("Invalid or missing value for field: quantity");
        if (isNaN(productData.min_quantity))
          throw new Error("Invalid or missing value for field: min_quantity");
        await Product.create(productData);
        successCount++;
      } catch (err) {
        errorCount++;
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push({ row: i + 2, error: errorMsg }); // +2 for header and 0-index
      }
    }
    res.json({
      success: true,
      message: `Bulk upload complete: ${successCount} products added, ${errorCount} errors`,
      successCount,
      errorCount,
      errors,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
});
