const request = require('supertest');
const app = require('../../app'); // Adjust path as needed
import { jest, describe, it, expect } from '@jest/globals';
import router from "../../routes/sales.js";
import { ReceiptService } from "../../services/receipt.service.js";

// Mock dependencies
jest.mock("../../services/receipt.service", () => ({
  ReceiptService: {
    sendWhatsApp: jest.fn(),
    sendSMS: jest.fn(),
  },
}));

// Mock authentication middleware
jest.mock("../../middleware/auth.middleware", () => ({
  authenticate: (req, res, next) => next(),
}));

// Mock controllers
jest.mock("../../controllers/sales.controller.js", () => ({
  createSale: jest.fn((req, res) => res.status(201).json({ id: 1 })),
  getSales: jest.fn((req, res) => res.json({ sales: [] })),
  getSaleItems: jest.fn((req, res) => res.json({ items: [] })),
}));

// Create test Express app
const testApp = express();
testApp.use(express.json());
testApp.use("/sales", router);

describe("Sales Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /:id/send-receipt", () => {
    it("should send a receipt via WhatsApp and return success", async () => {
      // Mock successful WhatsApp sending
      (ReceiptService.sendWhatsApp as jest.Mock).mockResolvedValue(true);

      const response = await request(testApp).post("/sales/1/send-receipt").send({
        method: "whatsapp",
        phoneNumber: "+254712345678",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Receipt sent via whatsapp successfully",
      });
      expect(ReceiptService.sendWhatsApp).toHaveBeenCalledWith(
        1,
        "+254712345678",
      );
    });

    it("should send a receipt via SMS and return success", async () => {
      // Mock successful SMS sending
      (ReceiptService.sendSMS as jest.Mock).mockResolvedValue(true);

      const response = await request(testApp).post("/sales/1/send-receipt").send({
        method: "sms",
        phoneNumber: "+254712345678",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Receipt sent via sms successfully",
      });
      expect(ReceiptService.sendSMS).toHaveBeenCalledWith(1, "+254712345678");
    });

    it("should return 400 when phone number is missing", async () => {
      const response = await request(testApp).post("/sales/1/send-receipt").send({
        method: "whatsapp",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Phone number is required" });
      expect(ReceiptService.sendWhatsApp).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid method", async () => {
      const response = await request(testApp).post("/sales/1/send-receipt").send({
        method: "invalid",
        phoneNumber: "+254712345678",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Invalid method. Use "whatsapp" or "sms"',
      });
      expect(ReceiptService.sendWhatsApp).not.toHaveBeenCalled();
      expect(ReceiptService.sendSMS).not.toHaveBeenCalled();
    });

    it("should return 500 when sending fails", async () => {
      // Mock failed WhatsApp sending
      (ReceiptService.sendWhatsApp as jest.Mock).mockResolvedValue(false);

      const response = await request(testApp).post("/sales/1/send-receipt").send({
        method: "whatsapp",
        phoneNumber: "+254712345678",
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: "Failed to send receipt via whatsapp",
      });
    });
  });
});
