import { Router } from 'express';
import Sale from '../models/Sale';

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

export default router; 