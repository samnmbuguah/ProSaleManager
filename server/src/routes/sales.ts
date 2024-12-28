import { Router } from 'express';
import Sale from '../models/Sale.js';
import { SaleItem } from '../models/SaleItem.js';
import sequelize from '../config/database.js';

const router = Router();

// Get all sales with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    const { count, rows: sales } = await Sale.findAndCountAll({
      limit: pageSize,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      sales,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      totalItems: count,
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Create a new sale
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { items, total, customerId, paymentMethod, amountPaid } = req.body;

    console.log('Creating sale with data:', { items, total, customerId, paymentMethod, amountPaid });

    // Create the sale
    const sale = await Sale.create({
      customer_id: customerId,
      total_amount: total,
      payment_method: paymentMethod,
      amount_paid: amountPaid,
      status: 'completed'
    }, { transaction: t });

    console.log('Sale created:', sale.toJSON());

    // Create sale items
    const saleItems = await Promise.all(
      items.map((item: any) => {
        console.log('Processing item:', item);
        return SaleItem.create({
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          unit_type: item.unit_type
        }, { transaction: t });
      })
    );

    console.log('Sale items created:', saleItems.map(item => item.toJSON()));

    await t.commit();

    res.status(201).json({
      success: true,
      data: {
        ...sale.toJSON(),
        items: saleItems
      },
      message: 'Sale created successfully'
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating sale:', error);
    res.status(500).json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create sale'
    });
  }
});

export default router; 