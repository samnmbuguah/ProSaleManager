import { Request, Response } from 'express';
import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  res.json(categories);
};

export const getCategory = (req: Request, res: Response) => {
  res.json({ message: 'getCategory stub' });
};

export const createCategory = (req: Request, res: Response) => {
  res.json({ message: 'createCategory stub' });
};

export const updateCategory = (req: Request, res: Response) => {
  res.json({ message: 'updateCategory stub' });
};

export const deleteCategory = (req: Request, res: Response) => {
  res.json({ message: 'deleteCategory stub' });
}; 