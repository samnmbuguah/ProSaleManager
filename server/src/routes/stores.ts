import { Router } from 'express';
import { Store, User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/stores - super admin: all stores, others: only their store
router.get('/', requireAuth, async (req, res) => {
  try {
    if (req.user?.role === 'super_admin') {
      const stores = await Store.findAll({ order: [['name', 'ASC']] });
      res.json({ success: true, data: stores });
    } else if (req.user?.store_id) {
      const store = await Store.findByPk(req.user.store_id);
      res.json({ success: true, data: store ? [store] : [] });
    } else {
      res.json({ success: true, data: [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stores' });
  }
});

export default router; 