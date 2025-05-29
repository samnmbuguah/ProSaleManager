const request = require('supertest');
const app = require('../../app'); // Adjust path as needed
import { jest, describe, it, expect } from '@jest/globals';
import express from "express";
import { ReceiptService } from "../../services/receipt.service";
import salesRoutes from "../../routes/sales";
import type { Request, Response, NextFunction } from "express";

// Mock the receipt service
jest.mock("../../services/receipt.service", () => ({
  ReceiptService: {
    sendWhatsApp: jest.fn(),
    sendSMS: jest.fn(),
  },
}));

// Mock authentication middleware
jest.mock("../../middleware/auth.middleware.js", () => ({
  authenticate: (req: Request, res: Response, next: NextFunction) => {
    req.user = { id: 1 };
    next();
  },
}));

describe("Receipt Endpoints", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/sales", salesRoutes);
    jest.clearAllMocks();
  });

  describe("POST /sales/:id/receipt/whatsapp", () => {
    it("should send a WhatsApp receipt when phone number is provided", async () => {
      // Setup mock
      (ReceiptService.sendWhatsApp as jest.Mock).mockResolvedValue(true);

      // Make request
      const response = await request(app)
        .post("/sales/1/receipt/whatsapp")
        .send({ phoneNumber: "+1234567890" });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Receipt sent via WhatsApp" });
      expect(ReceiptService.sendWhatsApp).toHaveBeenCalledWith(
        1,
        "+1234567890",
      );
    });

    it("should return 400 when phone number is missing", async () => {
      const response = await request(app)
        .post("/sales/1/receipt/whatsapp")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Phone number is required" });
      expect(ReceiptService.sendWhatsApp).not.toHaveBeenCalled();
    });

    it("should return 500 when sending fails", async () => {
      (ReceiptService.sendWhatsApp as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post("/sales/1/receipt/whatsapp")
        .send({ phoneNumber: "+1234567890" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: "Failed to send WhatsApp receipt",
      });
    });
  });

  describe("POST /sales/:id/receipt/sms", () => {
    it("should send an SMS receipt when phone number is provided", async () => {
      // Setup mock
      (ReceiptService.sendSMS as jest.Mock).mockResolvedValue(true);

      // Make request
      const response = await request(app)
        .post("/sales/1/receipt/sms")
        .send({ phoneNumber: "+1234567890" });

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Receipt sent via SMS" });
      expect(ReceiptService.sendSMS).toHaveBeenCalledWith(1, "+1234567890");
    });

    it("should return 400 when phone number is missing", async () => {
      const response = await request(app).post("/sales/1/receipt/sms").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Phone number is required" });
      expect(ReceiptService.sendSMS).not.toHaveBeenCalled();
    });

    it("should return 500 when sending fails", async () => {
      (ReceiptService.sendSMS as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post("/sales/1/receipt/sms")
        .send({ phoneNumber: "+1234567890" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Failed to send SMS receipt" });
    });
  });
});
