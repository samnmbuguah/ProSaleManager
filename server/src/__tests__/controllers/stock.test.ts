import { jest } from "@jest/globals";
import type { Request, Response } from "express";

type StockHandler = (req: Request, res: Response) => Promise<unknown>;
let receiveStock: StockHandler;
let receiveStockBulk: StockHandler;

beforeAll(async () => {
  // Import lazily so the jest.mock factories above run after the mocks
  // below are initialized (the factories execute on first import).
  const controller = await import("../../controllers/stock.controller.js");
  receiveStock = controller.receiveStock;
  receiveStockBulk = controller.receiveStockBulk;
});

const mockTransaction = {
  commit: jest.fn(async (): Promise<void> => {}),
  rollback: jest.fn(async (): Promise<void> => {}),
};
const mockSequelize = {
  transaction: jest.fn(async (): Promise<unknown> => mockTransaction),
};
const mockProductFindByPk = jest.fn(async (): Promise<unknown> => ({}));
const mockStockLogCreate = jest.fn(async (): Promise<unknown> => ({}));
const mockStockReceiptCreate = jest.fn(async (): Promise<unknown> => ({}));

jest.mock("../../models/index.js", () => ({
  __esModule: true,
  sequelize: mockSequelize,
  Product: { findByPk: mockProductFindByPk },
  User: {},
  StockReceipt: { create: mockStockReceiptCreate },
}));

jest.mock("../../models/StockLog.js", () => ({
  __esModule: true,
  default: { create: mockStockLogCreate },
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
    quantity: 10,
    piece_buying_price: 10,
    updatePrices: jest.fn(),
    save: jest.fn(async () => {}),
    ...overrides,
  };
}

const adminUser = { id: 2, email: "a@b.c", name: "Ann", role: "admin", store_id: 1 };

describe("receiveStock", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockProductFindByPk.mockResolvedValue(makeProduct());
    mockStockLogCreate.mockResolvedValue({ id: 31 });
  });

  it("returns 400 when required fields are missing", async () => {
    const res = makeRes();

    await receiveStock(makeReq({ product_id: 1, quantity: 2 }, adminUser), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Missing required fields" });
    expect(mockSequelize.transaction).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = makeRes();

    await receiveStock(
      makeReq(
        { product_id: 1, quantity: 2, unit_type: "piece", buying_price: 12, selling_price: 15 },
      ),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 when store context is missing", async () => {
    const res = makeRes();

    await receiveStock(
      makeReq(
        { product_id: 1, quantity: 2, unit_type: "piece", buying_price: 12, selling_price: 15 },
        { ...adminUser, store_id: null },
      ),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Store context missing" });
  });

  it("returns 404 and rolls back when the product is missing", async () => {
    mockProductFindByPk.mockResolvedValue(null);
    const res = makeRes();

    await receiveStock(
      makeReq(
        { product_id: 9, quantity: 2, unit_type: "piece", buying_price: 12, selling_price: 15 },
        adminUser,
      ),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });

  it("applies weighted-average pricing and logs the receipt", async () => {
    const product = makeProduct();
    mockProductFindByPk.mockResolvedValue(product);
    const res = makeRes();

    await receiveStock(
      makeReq(
        { product_id: 1, quantity: 2, unit_type: "pack", buying_price: 66, selling_price: 90 },
        adminUser,
      ),
      res,
    );

    // (10 * 10 + 6 * 22) / 16 = 14.5 per piece
    expect(product.updatePrices).toHaveBeenCalledWith("pack", 14.5, 90);
    expect(product.quantity).toBe(16);
    expect(product.save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(mockStockLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 1,
        quantity_added: 6,
        unit_cost: 22,
        total_cost: 132,
        user_id: 2,
        store_id: 1,
        type: "manual_receive",
      }),
      { transaction: mockTransaction },
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Stock received successfully" }),
    );
  });
});

describe("receiveStockBulk", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockProductFindByPk.mockResolvedValue(makeProduct());
    mockStockReceiptCreate.mockResolvedValue({ id: 5 });
    mockStockLogCreate.mockResolvedValue({ id: 31 });
  });

  it("returns 400 when no items are provided", async () => {
    const res = makeRes();

    await receiveStockBulk(makeReq({ items: [] }, adminUser), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "No items provided" });
  });

  it("returns 401 when unauthenticated", async () => {
    const res = makeRes();

    await receiveStockBulk(makeReq({ items: [{ product_id: 1 }] }), res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("creates one receipt and blends batched lines", async () => {
    const product = makeProduct();
    mockProductFindByPk.mockResolvedValue(product);
    const res = makeRes();

    await receiveStockBulk(
      makeReq(
        {
          items: [
            { product_id: 1, quantity: 2, unit_type: "piece", buying_price: 20, selling_price: 30 },
            { product_id: 1, quantity: 1, unit_type: "pack", buying_price: 66, selling_price: 90 },
          ],
        },
        adminUser,
      ),
      res,
    );

    // Receipt header: total cost 2*20 + 1*66 = 106 across 2 lines
    expect(mockStockReceiptCreate).toHaveBeenCalledWith(
      expect.objectContaining({ total_cost: 106, items_count: 2, user_id: 2, store_id: 1 }),
      { transaction: mockTransaction },
    );
    // Batch math: 5 pieces for 106 → (100 + 106) / 15 = 13.73333
    expect(product.quantity).toBe(15);
    expect(product.updatePrices).toHaveBeenCalledWith("pack", 13.73333, 90);
    expect(mockStockLogCreate).toHaveBeenCalledTimes(2);
    expect(mockStockLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ receipt_id: 5, quantity_added: 2 }),
      expect.anything(),
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Stock received successfully", count: 1 }),
    );
  });

  it("rolls back with 500 when a product is missing", async () => {
    mockProductFindByPk.mockResolvedValue(null);
    const res = makeRes();

    await receiveStockBulk(
      makeReq(
        {
          items: [{ product_id: 9, quantity: 1, unit_type: "piece", buying_price: 10, selling_price: 12 }],
        },
        adminUser,
      ),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Product with ID 9 not found" }),
    );
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});
