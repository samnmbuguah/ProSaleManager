import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getUserPreferences,
  updateUserPreferences,
  getUserRoles,
} from "../controllers/user.controller.js";

const router = Router();

// Public routes (no auth required)
router.get("/roles", getUserRoles);

// Protected routes (auth required)
router.use(requireAuth);

// User profile routes (for authenticated users)
router.put("/profile", updateProfile);
router.post("/change-password", changePassword);
router.get("/preferences", getUserPreferences);
router.put("/preferences", updateUserPreferences);

// Admin only routes
router.use(requireRole(["super_admin", "admin"]));

// User management routes
router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
