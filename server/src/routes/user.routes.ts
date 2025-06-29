import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { 
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';

const router = Router();

// Admin only routes
router.use(protect);
router.use(restrictTo('admin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router; 