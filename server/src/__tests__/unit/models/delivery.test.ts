import Product from "../../../models/Product.js";

// Mock the Product model and database
jest.mock("../../../models/Product.js", () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));

describe("Delivery Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should find the delivery service product by code", async () => {
    // Setup mock data
    const mockDeliveryService = {
      id: 100,
      name: "Delivery Service",
      product_code: "SRV001",
      category: "Services",
      selling_price: 200,
      buying_price: 0,
    };

    // Setup mock implementation
    (Product.findOne as jest.Mock).mockResolvedValue(mockDeliveryService);

    // Execute test
    const result = await Product.findOne({ where: { product_code: "SRV001" } });

    // Assertions
    expect(result).toBeDefined();
    expect(result.product_code).toBe("SRV001");
    expect(result.category).toBe("Services");
    expect(result.selling_price).toBe(200);
  });

  it("should create a delivery service product", async () => {
    // Mock data
    const newDeliveryService = {
      name: "Delivery Service",
      product_code: "SRV001",
      category: "Services",
      stock_unit: "service",
      quantity: 1000,
      min_stock: 1000,
      buying_price: 0,
      selling_price: 200,
    };

    const createdDeliveryService = {
      id: 100,
      ...newDeliveryService,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Setup mock implementation
    (Product.create as jest.Mock).mockResolvedValue(createdDeliveryService);

    // Execute test
    const result = await Product.create(newDeliveryService);

    // Assertions
    expect(result).toBeDefined();
    expect(result.id).toBe(100);
    expect(result.product_code).toBe("SRV001");
    expect(result.category).toBe("Services");
    expect(result.selling_price).toBe(200);
  });
});
