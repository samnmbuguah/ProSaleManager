import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";

function createRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response & { status: jest.Mock; json: jest.Mock };
  res.status.mockReturnValue(res);
  return res;
}

const schema = z.object({
  name: z.string().trim().min(1),
  age: z.coerce.number().int().positive(),
});

describe("validate middleware", () => {
  it("calls next and coerces/trims the body on success", () => {
    const req = { body: { name: "  Ada  ", age: "30" } } as unknown as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ name: "Ada", age: 30 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 with field errors on failure", () => {
    const req = { body: { name: "", age: -1 } } as unknown as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = (res.json as jest.Mock).mock.calls[0][0] as {
      success: boolean;
      errors: Array<{ path: string }>;
    };
    expect(payload.success).toBe(false);
    expect(payload.errors.map((e) => e.path)).toEqual(
      expect.arrayContaining(["name", "age"]),
    );
  });

  it("validates query params and exposes them as validatedQuery", () => {
    const req = { query: { page: "2" } } as unknown as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validate(z.object({ page: z.coerce.number().int().positive() }), "query")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validatedQuery).toEqual({ page: 2 });
  });

  it("validates route params and exposes them as validatedParams", () => {
    const req = { params: { id: "7" } } as unknown as Request;
    const res = createRes();
    const next = jest.fn() as NextFunction;

    validate(z.object({ id: z.coerce.number().int().positive() }), "params")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validatedParams).toEqual({ id: 7 });
  });
});
