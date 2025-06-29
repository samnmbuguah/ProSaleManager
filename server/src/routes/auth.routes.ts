import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { generateCsrfToken } from '../utils/csrf.js';

const router = Router();

// Public routes
router.get('/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ token });
});

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Public route that handles both authenticated and unauthenticated states
router.get('/me', getMe);

export default router; 