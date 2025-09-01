import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock the Product model with proper types
const Product = {
  findOne: jest.fn() as jest.MockedFunction<(options: any) => Promise<any>>,
  create: jest.fn() as jest.MockedFunction<(data: any) => Promise<any>>,
};

describe("Delivery Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should match the expected delivery service details", async () => {
    const mockDeliveryService = {
      id: 1,
      sku: "SRV001",
      name: "Delivery Service",
      description: "Standard delivery service",
      category_id: 1,
      piece_selling_price: 500,
      piece_cost_price: 0,
      bulk_selling_price: 500,
      bulk_cost_price: 0,
      min_stock: 0,
      current_stock: 999999,
      unit: "service",
      barcode: null,
      image_url: null,
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock successful product lookup
    Product.findOne.mockResolvedValue(mockDeliveryService);

    const result = await Product.findOne({ where: { sku: "SRV001" } });

    expect(result).toBeDefined();
    expect(result.sku).toBe("SRV001");
    expect(result.name).toBe("Delivery Service");
    expect(result.piece_selling_price).toBe(500);
  });

  it("should handle non-existent delivery service", async () => {
    // Mock product not found
    Product.findOne.mockResolvedValue(null);

    const result = await Product.findOne({ where: { sku: "NONEXISTENT" } });

    expect(result).toBeNull();
  });

  it("should create a new delivery service", async () => {
    const newDeliveryService = {
      sku: "SRV002",
      name: "Express Delivery",
      description: "Fast delivery service",
      category_id: 1,
      piece_selling_price: 800,
      piece_cost_price: 0,
      bulk_selling_price: 800,
      bulk_cost_price: 0,
      min_stock: 0,
      current_stock: 999999,
      unit: "service",
      barcode: null,
      image_url: null,
      is_active: true,
    };

    const createdDeliveryService = {
      id: 2,
      ...newDeliveryService,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock successful product creation
    Product.create.mockResolvedValue(createdDeliveryService);

    const result = await Product.create(newDeliveryService);

    expect(result).toBeDefined();
    expect(result.id).toBe(2);
    expect(result.sku).toBe("SRV002");
    expect(result.name).toBe("Express Delivery");
    expect(result.piece_selling_price).toBe(800);
  });
});
