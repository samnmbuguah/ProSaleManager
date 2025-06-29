import { Request, Response } from "express";
import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { createSale } from "../../../src/controllers/sales.controller";
import Sale from "../../../models/Sale.js";
import SaleItem from "../../../models/SaleItem.js";
import sequelize from "../../../config/database.js";

// Manually mock the models and database
jest.mock("../../../models/Sale", () => ({
  create: jest.fn(),
  findByPk: jest.fn(),
}));

jest.mock("../../../models/SaleItem", () => ({
  create: jest.fn(),
}));

jest.mock("../../../config/database.js", () => ({
  transaction: jest.fn(),
}));

type MockTransaction = {
  commit: jest.Mock;
  rollback: jest.Mock;
  finished: boolean;
};

describe("Create Sale Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockTransaction: MockTransaction;

  beforeEach(() => {
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
      finished: false,
    };

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
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
    (Sale.create as jest.Mock).mockResolvedValue({
      id: 1,
      ...req.body,
      user_id: 1,
    });
    (SaleItem.create as jest.Mock).mockResolvedValue({});
    (Sale.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      user_id: 1,
      ...req.body,
      items: [{ product_id: 1, quantity: 2, unit_price: 10, total: 20 }],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a sale with payment_status field", async () => {
    await createSale(req as Request, res as Response);

    expect(sequelize.transaction).toHaveBeenCalled();
    expect(Sale.create).toHaveBeenCalledWith(
      {
        user_id: 1,
        customer_id: null,
        total_amount: 20,
        payment_method: "cash",
        amount_paid: 20,
        status: "completed",
        payment_status: "paid",
      },
      { transaction: mockTransaction },
    );

    expect(SaleItem.create).toHaveBeenCalledWith(
      {
        sale_id: 1,
        product_id: 1,
        quantity: 2,
        unit_price: 10,
        total: 20,
        unit_type: "piece",
      },
      { transaction: mockTransaction },
    );

    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Sale created successfully",
      data: expect.any(Object),
    });
  });

  it("should default to completed status if not provided", async () => {
    req.body.status = undefined;

    await createSale(req as Request, res as Response);

    expect(Sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
      }),
      expect.any(Object),
    );
  });

  it("should default payment_status to paid if not provided", async () => {
    req.body.payment_status = undefined;

    await createSale(req as Request, res as Response);

    expect(Sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_status: "paid",
      }),
      expect.any(Object),
    );
  });

  it("should return 401 if user is not authenticated", async () => {
    req.user = undefined;

    await createSale(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not authenticated",
    });
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it("should return 400 if no items are provided", async () => {
    req.body.items = [];

    await createSale(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "No items provided for sale",
    });
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it("should handle database errors and rollback transaction", async () => {
    const error = new Error("Database error");
    (Sale.create as jest.Mock).mockRejectedValue(error);

    await createSale(req as Request, res as Response);

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to create sale" });
  });
});
