import { Request, Response } from 'express';
import { Product } from '../models/index.js';
import { catchAsync } from '../utils/catch-async.js';
import { ApiError } from '../utils/api-error.js';

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