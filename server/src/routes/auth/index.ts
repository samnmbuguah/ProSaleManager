import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { UserService } from '../../services/user.service';

const router = Router();
const userService = new UserService();
const authController = new AuthController(userService);

// Auth routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.get('/me', authController.checkSession.bind(authController));

export default router; 