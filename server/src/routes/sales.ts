import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireStoreContext } from "../middleware/store-context.middleware.js";
import {
  createSale,
  getSales,
  getSaleItems,
  getSaleById,
} from "../controllers/sales.controller.js";
import { ReceiptService } from "../services/receipt.service.js";

const router = express.Router();

// Authenticate all other sales routes
router.use(requireAuth);
router.use(requireStoreContext);

// Create a new sale
router.post("/", createSale);

// Get all sales with pagination
router.get("/", getSales);

// Get items for a specific sale
router.get("/:id/items", getSaleItems);

// Get a specific sale by ID
router.get("/:id", getSaleById);

// Protected receipt text endpoint (requires authentication)
router.get("/:id/receipt/text", async (req, res) => {
  try {
    const saleId = parseInt(req.params.id);
    if (isNaN(saleId)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }
    const text = await ReceiptService.formatReceiptText(saleId);
    res.json({ receipt: text });
  } catch (error) {
    console.error("Receipt text generation error:", error);
    res.status(500).json({ message: "Failed to generate receipt text" });
  }
});

// Send receipt routes
// router.post("/:id/receipt/whatsapp", async (req, res) => {
//   try {
//     const saleId = parseInt(req.params.id);
//     const { phoneNumber } = req.body;
//
//     if (!phoneNumber) {
//       return res.status(400).json({ message: "Phone number is required" });
//     }
//
//     const success = await ReceiptService.sendWhatsApp(saleId, phoneNumber);
//
//     if (success) {
//       return res.json({ message: "Receipt sent via WhatsApp" });
//     } else {
//       return res
//         .status(500)
//         .json({ message: "Failed to send WhatsApp receipt" });
//     }
//   } catch (error) {
//     console.error("WhatsApp receipt error:", error);
//     res.status(500).json({ message: "Error sending WhatsApp receipt" });
//   }
// });

// router.post("/:id/receipt/sms", async (req, res) => {
//   try {
//     const saleId = parseInt(req.params.id);
//     const { phoneNumber } = req.body;
//
//     if (!phoneNumber) {
//       return res.status(400).json({ message: "Phone number is required" });
//     }
//
//     const success = await ReceiptService.sendSMS(saleId, phoneNumber);
//
//     if (success) {
//       return res.json({ message: "Receipt sent via SMS" });
//     } else {
//       return res.status(500).json({ message: "Failed to send SMS receipt" });
//     }
//   } catch (error) {
//     console.error("SMS receipt error:", error);
//     res.status(500).json({ message: "Error sending SMS receipt" });
//   }
// });

export default router;
