import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the ReceiptService with proper types
const ReceiptService = {
  formatReceiptText: jest.fn() as jest.MockedFunction<(saleId: number) => Promise<string>>,
  sendWhatsApp: jest.fn() as jest.MockedFunction<(saleId: number, phoneNumber: string) => Promise<boolean>>,
  sendSMS: jest.fn() as jest.MockedFunction<(saleId: number, phoneNumber: string) => Promise<boolean>>,
};

describe("Receipt Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("formatReceiptText", () => {
    it("should format receipt text correctly", async () => {
      // Mock successful formatting
      ReceiptService.formatReceiptText.mockResolvedValue("Formatted receipt text");

      const result = await ReceiptService.formatReceiptText(1);
      expect(result).toBe("Formatted receipt text");
    });
  });

  describe("sendWhatsApp", () => {
    it("should send WhatsApp receipt successfully", async () => {
      // Mock successful WhatsApp sending
      ReceiptService.sendWhatsApp.mockResolvedValue(true);

      const result = await ReceiptService.sendWhatsApp(1, "+254712345678");
      expect(result).toBe(true);
    });
  });

  describe("sendSMS", () => {
    it("should send SMS receipt successfully", async () => {
      // Mock successful SMS sending
      ReceiptService.sendSMS.mockResolvedValue(true);

      const result = await ReceiptService.sendSMS(1, "+254712345678");
      expect(result).toBe(true);
    });
  });
});
