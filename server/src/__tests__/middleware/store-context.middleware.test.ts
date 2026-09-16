import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { requireStoreContext } from "../../middleware/store-context.middleware.js";

function createRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response & { status: jest.Mock; json: jest.Mock };
  res.status.mockReturnValue(res);
  return res;
}

describe("requireStoreContext", () => {
  it("allows super_admin without store context", () => {
    const next = jest.fn() as NextFunction;
    requireStoreContext(
      { user: { role: "super_admin" } } as Request,
      createRes(),
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("allows a user with a store_id", () => {
    const next = jest.fn() as NextFunction;
    requireStoreContext(
      { user: { role: "admin", store_id: 4 } } as unknown as Request,
      createRes(),
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("allows a user when store middleware resolved a store", () => {
    const next = jest.fn() as NextFunction;
    requireStoreContext(
      { user: { role: "admin" }, store: { id: 2 } } as unknown as Request,
      createRes(),
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects a user with no store context", () => {
    const res = createRes();
    const next = jest.fn() as NextFunction;
    requireStoreContext({ user: { role: "admin" } } as unknown as Request, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Store context missing" });
  });
});
