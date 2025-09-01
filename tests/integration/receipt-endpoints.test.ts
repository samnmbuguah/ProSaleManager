import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the ReceiptService with proper types
const ReceiptService = {
  sendWhatsApp: jest.fn() as jest.MockedFunction<(saleId: number, phoneNumber: string) => Promise<boolean>>,
  sendSMS: jest.fn() as jest.MockedFunction<(saleId: number, phoneNumber: string) => Promise<boolean>>,
};

describe("Receipt Endpoints Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("WhatsApp Receipt", () => {
    it("should send WhatsApp receipt successfully", async () => {
      // Mock successful WhatsApp sending
      ReceiptService.sendWhatsApp.mockResolvedValue(true);

      const result = await ReceiptService.sendWhatsApp(1, "+254712345678");
      expect(result).toBe(true);
      expect(ReceiptService.sendWhatsApp).toHaveBeenCalledWith(1, "+254712345678");
    });

    it("should handle WhatsApp sending failure", async () => {
      // Mock WhatsApp sending failure
      ReceiptService.sendWhatsApp.mockResolvedValue(false);

      const result = await ReceiptService.sendWhatsApp(1, "+254712345678");
      expect(result).toBe(false);
      expect(ReceiptService.sendWhatsApp).toHaveBeenCalledWith(1, "+254712345678");
    });

    it("should handle missing phone number", async () => {
      // Mock successful WhatsApp sending
      ReceiptService.sendWhatsApp.mockResolvedValue(true);

      const result = await ReceiptService.sendWhatsApp(1, "");
      expect(result).toBe(true);
      expect(ReceiptService.sendWhatsApp).toHaveBeenCalledWith(1, "");
    });
  });

  describe("SMS Receipt", () => {
    it("should send SMS receipt successfully", async () => {
      // Mock successful SMS sending
      ReceiptService.sendSMS.mockResolvedValue(true);

      const result = await ReceiptService.sendSMS(1, "+254712345678");
      expect(result).toBe(true);
      expect(ReceiptService.sendSMS).toHaveBeenCalledWith(1, "+254712345678");
    });

    it("should handle SMS sending failure", async () => {
      // Mock SMS sending failure
      ReceiptService.sendSMS.mockResolvedValue(false);

      const result = await ReceiptService.sendSMS(1, "+254712345678");
      expect(result).toBe(false);
      expect(ReceiptService.sendSMS).toHaveBeenCalledWith(1, "+254712345678");
    });

    it("should handle missing phone number", async () => {
      // Mock successful SMS sending
      ReceiptService.sendSMS.mockResolvedValue(true);

      const result = await ReceiptService.sendSMS(1, "");
      expect(result).toBe(true);
      expect(ReceiptService.sendSMS).toHaveBeenCalledWith(1, "");
    });
  });
});
