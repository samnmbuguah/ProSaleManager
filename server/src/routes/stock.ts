import { Router } from "express";
import { receiveStock, receiveStockBulk, getStockValueReport } from "../controllers/stock.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/receive", requireAuth, requireRole(["admin", "super_admin"]), receiveStock);
router.post("/receive-bulk", requireAuth, requireRole(["admin", "super_admin"]), receiveStockBulk);
router.get("/value-report", requireAuth, requireRole(["admin", "super_admin"]), getStockValueReport);

export default router;
