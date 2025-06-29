import { Request, Response } from 'express';

export const getCategories = (req: Request, res: Response) => {
  res.json({ message: 'getCategories stub' });
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