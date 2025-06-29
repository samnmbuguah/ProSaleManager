import { Request, Response } from "express";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { getSaleById } from "../../../controllers/sales.controller";
import Sale from "../../../models/Sale";

// Manually mock the Sale model methods
jest.mock("../../../models/Sale", () => ({
  findByPk: jest.fn(),
}));

describe("Sales Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  const mockSaleData = {
    id: 1,
    user_id: 1,
    customer_id: null,
    total_amount: 100,
    payment_method: "cash",
    amount_paid: 100,
    status: "completed",
    payment_status: "paid",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };

  beforeEach(() => {
    req = {
      params: { id: "1" },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("getSaleById", () => {
    it("should return a sale when it exists", async () => {
      (Sale.findByPk as jest.Mock).mockResolvedValue(mockSaleData);

      await getSaleById(req as Request, res as Response);

      expect(Sale.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(mockSaleData);
    });

    it("should return 404 when sale does not exist", async () => {
      (Sale.findByPk as jest.Mock).mockResolvedValue(null);

      await getSaleById(req as Request, res as Response);

      expect(Sale.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Sale not found" });
    });

    it("should return 400 for invalid sale ID", async () => {
      req.params = { id: "not-a-number" };

      await getSaleById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid sale ID" });
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");
      (Sale.findByPk as jest.Mock).mockRejectedValue(error);

      await getSaleById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Database error" });
    });
  });
});
