import { Request, Response } from 'express';
import Product from '../models/Product.js';
import { Op } from 'sequelize';
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
  const product = await Product.create(req.body);
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