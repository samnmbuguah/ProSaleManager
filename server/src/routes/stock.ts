import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { 
    receiveStock, 
    receiveStockBulk, 
    getStockValueReport,
    getStockReceipts,
    getStockReceiptById
} from "../controllers/stock.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/receive", requireRole(["admin", "super_admin"]), receiveStock);
router.post("/receive-bulk", requireRole(["admin", "super_admin"]), receiveStockBulk);
router.get("/value-report", requireRole(["admin", "super_admin"]), getStockValueReport);
router.get("/receipts", getStockReceipts);
router.get("/receipts/:id", getStockReceiptById);

export default router;
