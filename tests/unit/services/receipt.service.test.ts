import { ReceiptService } from "../../../services/receipt.service";
import twilio from "twilio";
import { jest, describe, beforeEach, it, expect } from "@jest/globals";

// Mock dependencies
jest.mock("twilio", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: "test-sid" }),
    },
  }));
});

// Mock all models at once
jest.mock("../../../models/Sale", () => ({
  default: {
    findByPk: jest.fn(),
    update: jest.fn().mockResolvedValue([1]),
  },
}));

jest.mock("../../../models/SaleItem", () => ({ default: {} }));
jest.mock("../../../models/Customer", () => ({ default: {} }));
jest.mock("../../../models/Product", () => ({ default: {} }));

// Import the mocked Sale to use in tests
import Sale from "../../../models/Sale";

describe("ReceiptService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("formatReceiptText", () => {
    it("should format receipt text correctly", async () => {
      // Mock data
      const mockSale = {
        id: 1,
        createdAt: new Date("2023-01-01T12:00:00Z"),
        items: [
          {
            product: { name: "Test Product" },
            quantity: 2,
            unit_price: 100,
            total: 200,
          },
        ],
        total_amount: 200,
        payment_method: "cash",
        amount_paid: 250,
        customer: { name: "Test Customer" },
      };

      // Mock Sale.findByPk to return our mock sale
      (Sale.findByPk as jest.Mock).mockResolvedValue(mockSale);

      const result = await ReceiptService.formatReceiptText(1);

      expect(result).toContain("PROSALE MANAGER");
      expect(result).toContain("Test Customer");
      expect(result).toContain("Test Product");
      expect(result).toContain("Total: KSh 200");
      expect(result).toContain("Change: KSh 50");
    });

    it("should throw an error if sale is not found", async () => {
      // Mock Sale.findByPk to return null (sale not found)
      (Sale.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(ReceiptService.formatReceiptText(999)).rejects.toThrow(
        "Sale not found",
      );
    });
  });

  describe("sendWhatsApp", () => {
    it("should send WhatsApp message and update receipt status", async () => {
      // Mock formatReceiptText implementation
      jest
        .spyOn(ReceiptService, "formatReceiptText")
        .mockResolvedValue("Test receipt");

      const result = await ReceiptService.sendWhatsApp(1, "+1234567890");

      expect(result).toBe(true);
      expect(twilio().messages.create).toHaveBeenCalledWith({
        body: "Test receipt",
        from: expect.stringContaining("whatsapp:"),
        to: expect.stringContaining("whatsapp:+1234567890"),
      });

      expect(Sale.update).toHaveBeenCalledWith(
        expect.objectContaining({
          receipt_status: expect.objectContaining({
            whatsapp: true,
            last_sent_at: expect.any(Date),
          }),
        }),
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it("should return false if sending fails", async () => {
      // Mock formatReceiptText to throw an error
      jest
        .spyOn(ReceiptService, "formatReceiptText")
        .mockRejectedValue(new Error("Test error"));

      const result = await ReceiptService.sendWhatsApp(1, "+1234567890");

      expect(result).toBe(false);
      expect(twilio().messages.create).not.toHaveBeenCalled();
      expect(Sale.update).not.toHaveBeenCalled();
    });
  });

  describe("sendSMS", () => {
    it("should send SMS message and update receipt status", async () => {
      // Mock formatReceiptText implementation
      jest
        .spyOn(ReceiptService, "formatReceiptText")
        .mockResolvedValue("Test receipt");

      const result = await ReceiptService.sendSMS(1, "+1234567890");

      expect(result).toBe(true);
      expect(twilio().messages.create).toHaveBeenCalledWith({
        body: "Test receipt",
        from: expect.any(String),
        to: "+1234567890",
      });

      expect(Sale.update).toHaveBeenCalledWith(
        expect.objectContaining({
          receipt_status: expect.objectContaining({
            sms: true,
            last_sent_at: expect.any(Date),
          }),
        }),
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it("should return false if sending fails", async () => {
      // Mock formatReceiptText to throw an error
      jest
        .spyOn(ReceiptService, "formatReceiptText")
        .mockRejectedValue(new Error("Test error"));

      const result = await ReceiptService.sendSMS(1, "+1234567890");

      expect(result).toBe(false);
      expect(twilio().messages.create).not.toHaveBeenCalled();
      expect(Sale.update).not.toHaveBeenCalled();
    });
  });
});
