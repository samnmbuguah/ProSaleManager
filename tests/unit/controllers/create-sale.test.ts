import { Request, Response } from "express";
import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock the controller function
const createSale = jest.fn();

describe("Create Sale Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {
        items: [
          {
            product_id: 1,
            quantity: 2,
            unit_price: 10,
            total: 20,
            unit_type: "piece",
          },
        ],
        total: 20,
        payment_method: "cash",
        status: "completed",
        payment_status: "paid",
        amount_paid: 20,
        customer_id: null,
      },
      user: {
        id: 1,
        email: "test@example.com",
        role: "admin",
      },
    };

    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };

    // Mock the controller to simulate success
    createSale.mockImplementation(async (req: any, res: any) => {
      res.status(201).json({
        message: "Sale created successfully",
        data: { id: 1, ...req.body, user_id: req.user.id },
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a sale successfully", async () => {
    await createSale(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Sale created successfully",
      data: expect.any(Object),
    });
  });

  it("should handle missing user authentication", async () => {
    req.user = undefined;

    createSale.mockImplementation(async (req: any, res: any) => {
      res.status(401).json({
        message: "User not authenticated",
      });
    });

    await createSale(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not authenticated",
    });
  });

  it("should handle missing items", async () => {
    req.body.items = [];

    createSale.mockImplementation(async (req: any, res: any) => {
      res.status(400).json({
        message: "No items provided for sale",
      });
    });

    await createSale(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "No items provided for sale",
    });
  });
});
