import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";
import { generateCsrfToken } from "../utils/csrf.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validation/schemas.js";

const router = Router();

// Public routes
router.get("/csrf-token", (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ token });
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

// Public route that handles both authenticated and unauthenticated states
router.get("/me", optionalAuth, getMe);

export default router;
