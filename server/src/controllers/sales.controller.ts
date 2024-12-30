import { Request, Response } from 'express';
import Sale from '../models/Sale.js';
import SaleItem from '../models/SaleItem.js';
import sequelize from '../config/database.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

export const createSale = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { items, total, paymentMethod, paymentStatus, amountPaid, changeAmount, customer_id } = req.body;

    // Get the user_id from the authenticated session
    const user_id = req.user?.id;
    if (!user_id) {
      await t.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'No items provided for sale' });
    }

    // Create the sale with customer_id (null for walk-in customers)
    const sale = await Sale.create({
      user_id,
      customer_id: customer_id || null,
      total_amount: total,
      payment_method: paymentMethod,
      amount_paid: amountPaid,
      status: paymentStatus,
    }, { transaction: t });

    // Create sale items
    try {
      const saleItems = await Promise.all(
        items.map((item: any) =>
          SaleItem.create({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            unit_type: item.unit_type,
          }, { transaction: t })
        )
      );

      await t.commit();

      // Return the created sale with items
      const createdSale = await Sale.findByPk(sale.id, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Customer,
            attributes: ['id', 'name', 'email', 'phone'],
          },
          {
            model: SaleItem,
            include: [{
              model: Product,
              attributes: ['id', 'name', 'sku'],
            }],
          },
        ],
      });

      res.status(201).json({
        message: 'Sale created successfully',
        data: createdSale,
      });
    } catch (error) {
      await t.rollback();
      console.error('Error creating sale items:', error);
      res.status(500).json({ message: 'Failed to create sale items' });
    }
  } catch (error) {
    await t.rollback();
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Failed to create sale' });
  }
};

export const getSales = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    const { count, rows: sales } = await Sale.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Customer,
          attributes: ['id', 'name', 'email', 'phone'],
          required: false,
        },
        {
          model: SaleItem,
          include: [{
            model: Product,
            attributes: ['id', 'name', 'product_number'],
          }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });

    res.json({
      sales,
      total: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sales';
    res.status(500).json({ message: errorMessage });
  }
}; 