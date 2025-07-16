import { Request, Response } from 'express';
import { Product } from '../models/index.js';
import { Op } from 'sequelize';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.findAll({
      include: ['price_units'],
      order: [['name', 'ASC']],
      where: {
        quantity: {
          [Op.gt]: 0 // Only return products with quantity > 0
        }
      }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching POS products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const products = await Product.findAll({
      include: ['price_units'],
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { sku: { [Op.iLike]: `%${q}%` } },
          { barcode: { [Op.iLike]: `%${q}%` } }
        ],
        quantity: {
          [Op.gt]: 0 // Only return products with quantity > 0
        }
      },
      order: [['name', 'ASC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Error searching POS products:', error);
    res.status(500).json({ message: 'Failed to search products' });
  }
}; 