import { jest } from "@jest/globals";
import type { Request, Response } from "express";

type CreateSaleFn = (req: Request, res: Response) => Promise<unknown>;
let createSale: CreateSaleFn;

beforeAll(async () => {
  // Import lazily so the jest.mock factories above run after the mocks
  // below are initialized (the factories execute on first import).
  ({ createSale } = await import("../../controllers/sales.controller.js"));
});

const mockTransaction = {
  commit: jest.fn(async (): Promise<void> => {}),
  rollback: jest.fn(async (): Promise<void> => {}),
};
const mockSequelize = {
  transaction: jest.fn(async (): Promise<unknown> => mockTransaction),
};
const mockSaleCreate = jest.fn(async (): Promise<unknown> => ({}));
const mockSaleFindByPk = jest.fn(async (): Promise<unknown> => ({}));
const mockProductFindByPk = jest.fn(async (): Promise<unknown> => ({}));
const mockSaleItemCreate = jest.fn(async (): Promise<unknown> => ({}));
const mockExpenseCreate = jest.fn(async (): Promise<unknown> => ({}));

jest.mock("../../models/index.js", () => ({
  __esModule: true,
  Sale: { create: mockSaleCreate, findByPk: mockSaleFindByPk },
  SaleItem: { create: mockSaleItemCreate },
  User: {},
  Product: { findByPk: mockProductFindByPk },
  sequelize: mockSequelize,
}));

jest.mock("../../models/Expense.js", () => ({
  __esModule: true,
  default: { create: mockExpenseCreate },
}));

type MockRes = Response & { status: jest.Mock; json: jest.Mock };

function makeReq(body: unknown, user?: unknown): Request {
  return { body, user, params: {}, query: {}, cookies: {} } as unknown as Request;
}

function makeRes(): MockRes {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as MockRes;
  res.status.mockReturnValue(res);
  return res;
}

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Sugar",
    quantity: 50,
    piece_buying_price: 80,
    pack_buying_price: 240,
    dozen_buying_price: 960,
    save: jest.fn(async () => {}),
    ...overrides,
  };
}

const staffUser = { id: 2, email: "a@b.c", name: "Ann", role: "admin", store_id: 1 };

function saleBody(overrides: Record<string, unknown> = {}) {
  return {
    items: [{ product_id: 1, quantity: 2, unit_price: 150, total: 300, unit_type: "piece" }],
    total: 300,
    payment_method: "cash",
    ...overrides,
  };
}

describe("createSale", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockSaleCreate.mockResolvedValue({ id: 7 });
    mockSaleFindByPk.mockResolvedValue({ id: 7, items: [] });
    mockProductFindByPk.mockResolvedValue(makeProduct());
    mockSaleItemCreate.mockResolvedValue({ id: 11 });
    mockExpenseCreate.mockResolvedValue({ id: 21 });
  });

  it("returns 401 and rolls back when unauthenticated", async () => {
    const res = makeRes();

    await createSale(makeReq(saleBody()), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "User not authenticated" });
    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });

  it("returns 400 and rolls back when items are missing", async () => {
    const res = makeRes();

    await createSale(makeReq({ ...saleBody(), items: [] }, staffUser), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "No items provided for sale" });
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  it("returns 404 and rolls back when the product is missing", async () => {
    mockProductFindByPk.mockResolvedValue(null);
    const res = makeRes();

    await createSale(makeReq(saleBody(), staffUser), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Product with ID 1 not found" });
    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockSaleItemCreate).not.toHaveBeenCalled();
  });

  it("returns 400 with stock details when inventory is insufficient", async () => {
    mockProductFindByPk.mockResolvedValue(makeProduct({ quantity: 1 }));
    const res = makeRes();

    await createSale(makeReq(saleBody(), staffUser), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Insufficient stock for Sugar. Available: 1, Required: 2",
    });
    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });

  it("creates a sale with defaults and snapshots the piece buying price", async () => {
    const product = makeProduct();
    mockProductFindByPk.mockResolvedValue(product);
    const res = makeRes();

    await createSale(makeReq(saleBody(), staffUser), res);

    expect(mockSaleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 2,
        customer_id: null,
        total_amount: 300,
        payment_method: "cash",
        status: "completed",
        payment_status: "paid",
        delivery_fee: 0,
        store_id: 1,
      }),
      { transaction: mockTransaction },
    );
    expect(mockSaleItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        sale_id: 7,
        product_id: 1,
        quantity: 2,
        buying_price: 80,
        unit_type: "piece",
      }),
      { transaction: mockTransaction },
    );
    expect(product.quantity).toBe(48);
    expect(product.save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(mockExpenseCreate).not.toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Sale created successfully" }),
    );
  });

  it("snapshots pack pricing and reduces by 3x quantity", async () => {
    const product = makeProduct();
    mockProductFindByPk.mockResolvedValue(product);
    const res = makeRes();

    await createSale(
      makeReq(
        saleBody({
          items: [{ product_id: 1, quantity: 2, unit_price: 450, total: 900, unit_type: "pack" }],
        }),
        staffUser,
      ),
      res,
    );

    expect(mockSaleItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({ buying_price: 240, unit_type: "pack" }),
      expect.anything(),
    );
    expect(product.quantity).toBe(44);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("snapshots dozen pricing and reduces by 12x quantity", async () => {
    const product = makeProduct();
    mockProductFindByPk.mockResolvedValue(product);
    const res = makeRes();

    await createSale(
      makeReq(
        saleBody({
          items: [{ product_id: 1, quantity: 1, unit_price: 1800, total: 1800, unit_type: "dozen" }],
        }),
        staffUser,
      ),
      res,
    );

    expect(mockSaleItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({ buying_price: 960, unit_type: "dozen" }),
      expect.anything(),
    );
    expect(product.quantity).toBe(38);
  });

  it("creates a delivery expense when a delivery fee is present", async () => {
    const res = makeRes();

    await createSale(makeReq(saleBody({ delivery_fee: 150 }), staffUser), res);

    expect(mockExpenseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Delivery fee for Sale #7",
        amount: 150,
        category: "Delivery",
        user_id: 2,
        store_id: 1,
      }),
      { transaction: mockTransaction },
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 500 when the database fails", async () => {
    mockSaleCreate.mockRejectedValue(new Error("connection lost"));
    const res = makeRes();

    await createSale(makeReq(saleBody(), staffUser), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Failed to create sale" }),
    );
  });
});
