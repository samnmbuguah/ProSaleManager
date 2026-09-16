import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../middleware/error.middleware.js";
import { ApiError } from "../../utils/api-error.js";

function createRes() {
  const res = {
    headersSent: false,
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response & { status: jest.Mock; json: jest.Mock };
  res.status.mockReturnValue(res);
  return res;
}

describe("errorHandler", () => {
  let errSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errSpy.mockRestore();
  });

  it("uses the status code from an ApiError", () => {
    const res = createRes();
    errorHandler(new ApiError(404, "Not here") as never, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: "Not here", message: "Not here" }),
    );
  });

  it("returns 500 for a generic error", () => {
    const res = createRes();
    errorHandler(new Error("boom") as never, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "boom" }),
    );
  });

  it("maps SequelizeValidationError to 400 and joins messages", () => {
    const res = createRes();
    const err = {
      name: "SequelizeValidationError",
      message: "validation failed",
      errors: [{ message: "name required" }, { message: "email invalid" }],
    };
    errorHandler(err as never, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "name required, email invalid" }),
    );
  });

  it("maps SequelizeUniqueConstraintError to 400", () => {
    const res = createRes();
    const err = {
      name: "SequelizeUniqueConstraintError",
      message: "duplicate",
      errors: [{ message: "sku must be unique" }],
    };
    errorHandler(err as never, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("maps expired tokens to 401", () => {
    const res = createRes();
    errorHandler(
      { name: "TokenExpiredError", message: "jwt expired" } as never,
      {} as Request,
      res,
      jest.fn() as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Token expired" }),
    );
  });

  it("delegates when headers were already sent", () => {
    const res = createRes();
    (res as { headersSent: boolean }).headersSent = true;
    const next = jest.fn() as NextFunction;
    const err = new Error("late");

    errorHandler(err as never, {} as Request, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});
