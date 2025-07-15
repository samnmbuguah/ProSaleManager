import { Request, Response } from 'express';
import { Product } from '../models/index.js';
import { catchAsync } from '../utils/catch-async.js';
import { ApiError } from '../utils/api-error.js';
import { parse } from 'csv-parse/sync';

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const products = await Product.findAll({
    order: [['name', 'ASC']],
  });
  res.json({
    success: true,
    data: products
  });
});

export const getProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await Product.findByPk(id);
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  
  res.json({
    success: true,
    data: product
  });
});

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  // Coerce and sanitize input
  const productData = {
    name: req.body.name,
    description: req.body.description || null,
    sku: req.body.sku || null,
    barcode: req.body.barcode || null,
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
    is_active: req.body.is_active === 'true' || req.body.is_active === true,
  };

  // Remove any undefined or NaN values for required fields
  for (const key in productData) {
    if (productData[key] === undefined || (typeof productData[key] === 'number' && isNaN(productData[key]))) {
      return res.status(400).json({ success: false, message: `Invalid or missing value for field: ${key}` });
    }
  }

  const product = await Product.create(productData);
  res.status(201).json({
    success: true,
    data: product
  });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await Product.findByPk(id);
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  
  await product.update(req.body);
  res.json({
    success: true,
    data: product
  });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await Product.findByPk(id);
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  
  await product.destroy();
  res.json({ 
    success: true,
    message: 'Product deleted successfully' 
  });
}); 

export const bulkUploadProducts = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  try {
    const csvString = req.file.buffer.toString('utf-8');
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV file is empty or invalid' });
    }
    let successCount = 0;
    let errorCount = 0;
    let errors: any[] = [];
    for (const [i, row] of records.entries()) {
      try {
        // Map and sanitize fields as in createProduct
        const productData = {
          name: row.name,
          description: row.description || null,
          sku: row.sku || null,
          barcode: row.barcode || null,
          category_id: Number(row.category_id),
          piece_buying_price: Number(row.piece_buying_price),
          piece_selling_price: Number(row.piece_selling_price),
          pack_buying_price: Number(row.pack_buying_price),
          pack_selling_price: Number(row.pack_selling_price),
          dozen_buying_price: Number(row.dozen_buying_price),
          dozen_selling_price: Number(row.dozen_selling_price),
          quantity: Number(row.quantity),
          min_quantity: Number(row.min_quantity),
          image_url: row.image_url || null,
          is_active: row.is_active === 'true' || row.is_active === true,
        };
        // Validate required fields
        for (const key in productData) {
          if (productData[key] === undefined || (typeof productData[key] === 'number' && isNaN(productData[key]))) {
            throw new Error(`Invalid or missing value for field: ${key}`);
          }
        }
        await Product.create(productData);
        successCount++;
      } catch (err: any) {
        errorCount++;
        errors.push({ row: i + 2, error: err.message }); // +2 for header and 0-index
      }
    }
    res.json({
      success: true,
      message: `Bulk upload complete: ${successCount} products added, ${errorCount} errors`,
      successCount,
      errorCount,
      errors,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}); 