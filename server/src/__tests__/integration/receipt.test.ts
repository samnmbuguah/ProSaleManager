import { ReceiptService } from "../../services/receipt.service.js";

// Mock the twilio and Sale model
jest.mock("twilio", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: "test-sid" }),
    },
  }));
});

jest.mock("../../models/Sale.js", () => ({
  default: {
    findByPk: jest.fn().mockResolvedValue({
      id: 1,
      items: [
        {
          product: { name: "Test Product" },
          quantity: 1,
          unit_price: 100,
          total: 100,
        },
      ],
      total_amount: 100,
      payment_method: "cash",
      createdAt: new Date(),
      customer: { name: "Test Customer" },
    }),
    update: jest.fn().mockResolvedValue([1]),
  },
}));

// Mock additional dependencies
jest.mock("../../models/Customer.js", () => ({
  default: {},
}));

jest.mock("../../models/Product.js", () => ({
  default: {},
}));

jest.mock("../../models/SaleItem.js", () => ({
  default: {},
}));

describe("Receipt Integration", () => {
  it("should successfully format receipt text", async () => {
    const text = await ReceiptService.formatReceiptText(1);
    expect(text).toContain("PROSALE MANAGER");
    expect(text).toContain("Test Customer");
    expect(text).toContain("Test Product");
  });

  it("should send receipt via WhatsApp", async () => {
    const result = await ReceiptService.sendWhatsApp(1, "+254712345678");
    expect(result).toBe(true);
  });

  it("should send receipt via SMS", async () => {
    const result = await ReceiptService.sendSMS(1, "+254712345678");
    expect(result).toBe(true);
  });
});
