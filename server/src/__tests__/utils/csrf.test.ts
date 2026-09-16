import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import {
  generateCsrfToken,
  validateCsrfToken,
  cleanupCsrf,
} from "../../utils/csrf.js";

function createRes() {
  const res = {
    cookie: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response & {
    cookie: jest.Mock;
    status: jest.Mock;
    json: jest.Mock;
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("CSRF utilities", () => {
  beforeEach(() => {
    cleanupCsrf();
  });

  afterAll(() => {
    cleanupCsrf();
  });

  it("generates a token and stores it in a cookie", () => {
    const res = createRes();
    const token = generateCsrfToken({} as Request, res);

    expect(typeof token).toBe("string");
    expect(token).toHaveLength(64);
    expect(res.cookie).toHaveBeenCalledWith("csrf-token", token, expect.any(Object));
  });

  it("generates a unique token each time", () => {
    const res = createRes();
    const first = generateCsrfToken({} as Request, res);
    const second = generateCsrfToken({} as Request, res);
    expect(first).not.toBe(second);
  });

  it("accepts a valid token", () => {
    const res = createRes();
    const token = generateCsrfToken({} as Request, res);
    const next = jest.fn() as NextFunction;

    validateCsrfToken(
      { headers: { "x-csrf-token": token } } as unknown as Request,
      createRes(),
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects a missing token with 403", () => {
    const res = createRes();
    validateCsrfToken({ headers: {} } as unknown as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid CSRF token" });
  });

  it("rejects an unknown token with 403", () => {
    const res = createRes();
    validateCsrfToken(
      { headers: { "x-csrf-token": "not-a-real-token" } } as unknown as Request,
      res,
      jest.fn() as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
