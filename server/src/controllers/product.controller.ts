import { Request, Response } from 'express';
import { Product } from '../models/index.js';
import type { ProductAttributes } from '../models/Product.js';
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
  const productData: ProductAttributes = {
    name: req.body.name,
    description: req.body.description || null,
    sku: req.body.sku || '',
    barcode: req.body.barcode || '',
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

  // Validate required fields explicitly
  if (!productData.name) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: name' });
    return;
  }
  if (!productData.sku) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: sku' });
    return;
  }
  if (!productData.category_id || isNaN(productData.category_id)) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: category_id' });
    return;
  }
  if (isNaN(productData.piece_buying_price)) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: piece_buying_price' });
    return;
  }
  if (isNaN(productData.piece_selling_price)) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: piece_selling_price' });
    return;
  }
  if (isNaN(productData.pack_buying_price)) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: pack_buying_price' });
    return;
  }
  if (isNaN(productData.pack_selling_price)) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: pack_selling_price' });
    return;
  }
  if (isNaN(productData.dozen_buying_price)) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: dozen_buying_price' });
    return;
  }
  if (isNaN(productData.dozen_selling_price)) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: dozen_selling_price' });
    return;
  }
  if (isNaN(productData.quantity)) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: quantity' });
    return;
  }
  if (isNaN(productData.min_quantity)) {
    res.status(400).json({ success: false, message: 'Invalid or missing value for field: min_quantity' });
    return;
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
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }
  try {
    const csvString = req.file.buffer.toString('utf-8');
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({ success: false, message: 'CSV file is empty or invalid' });
      return;
    }
    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; error: string }[] = [];
    for (const [i, row] of records.entries()) {
      const typedRow = row as Record<string, string>;
      try {
        const productData: ProductAttributes = {
          name: String(typedRow.name || ''),
          description: typedRow.description ? String(typedRow.description) : undefined,
          sku: String(typedRow.sku || ''),
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
          is_active: typedRow.is_active === 'true',
        };
        // Validate required fields explicitly
        if (!productData.name) throw new Error('Invalid or missing value for field: name');
        if (!productData.sku) throw new Error('Invalid or missing value for field: sku');
        if (!productData.category_id || isNaN(productData.category_id)) throw new Error('Invalid or missing value for field: category_id');
        if (isNaN(productData.piece_buying_price)) throw new Error('Invalid or missing value for field: piece_buying_price');
        if (isNaN(productData.piece_selling_price)) throw new Error('Invalid or missing value for field: piece_selling_price');
        if (isNaN(productData.pack_buying_price)) throw new Error('Invalid or missing value for field: pack_buying_price');
        if (isNaN(productData.pack_selling_price)) throw new Error('Invalid or missing value for field: pack_selling_price');
        if (isNaN(productData.dozen_buying_price)) throw new Error('Invalid or missing value for field: dozen_buying_price');
        if (isNaN(productData.dozen_selling_price)) throw new Error('Invalid or missing value for field: dozen_selling_price');
        if (isNaN(productData.quantity)) throw new Error('Invalid or missing value for field: quantity');
        if (isNaN(productData.min_quantity)) throw new Error('Invalid or missing value for field: min_quantity');
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
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : String(err) });
  }
}); 