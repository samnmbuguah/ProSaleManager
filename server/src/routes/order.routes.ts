import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { requireStoreContext } from "../middleware/store-context.middleware.js";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/order.controller.js";

const router = Router();

// Require authentication for all order routes (fixes req.user issue)
router.use(requireAuth);
router.use(requireStoreContext);

// All authenticated users can view their own orders
router.get("/", getOrders);
router.get("/:id", getOrder);
router.post("/", createOrder);

// Only admin, manager, and sales can modify orders
router.use(requireRole(["admin", "manager", "sales"]));
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;
