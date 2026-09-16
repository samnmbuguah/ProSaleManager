import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import {
  requireRole,
  attachStoreIdToUser,
} from "../../middleware/auth.middleware.js";

function createRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response & { status: jest.Mock; json: jest.Mock };
  res.status.mockReturnValue(res);
  return res;
}

describe("requireRole", () => {
  it("rejects unauthenticated requests with 401", () => {
    const res = createRes();
    const next = jest.fn() as NextFunction;
    requireRole(["admin"])({} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects users whose role is not allowed with 403", () => {
    const res = createRes();
    const next = jest.fn() as NextFunction;
    requireRole(["super_admin"])({ user: { role: "sales" } } as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows users whose role is allowed", () => {
    const next = jest.fn() as NextFunction;
    requireRole(["admin", "manager"])({ user: { role: "manager" } } as Request, createRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("attachStoreIdToUser", () => {
  it("syncs store_id for non-super_admins", () => {
    const req = {
      user: { role: "admin", store_id: 1 as number | null },
      store: { id: 9 },
    } as unknown as Request;
    const next = jest.fn() as NextFunction;

    attachStoreIdToUser(req, createRes(), next);

    expect(req.user?.store_id).toBe(9);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("does not override a super_admin's store scope", () => {
    const req = {
      user: { role: "super_admin", store_id: 5 as number | null },
      store: { id: 9 },
    } as unknown as Request;

    attachStoreIdToUser(req, createRes(), jest.fn() as NextFunction);

    expect(req.user?.store_id).toBe(5);
  });

  it("does nothing when there is no authenticated user", () => {
    const req = { store: { id: 9 } } as Request;
    const next = jest.fn() as NextFunction;

    attachStoreIdToUser(req, createRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
