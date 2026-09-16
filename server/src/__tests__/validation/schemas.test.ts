import {
  loginSchema,
  registerSchema,
  createCustomerSchema,
  createExpenseSchema,
  updateExpenseSchema,
  createCategorySchema,
} from "../../validation/schemas.js";

describe("loginSchema", () => {
  it("accepts a valid payload and trims the email", () => {
    const result = loginSchema.safeParse({ email: "  user@example.com ", password: "secret" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });

  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "secret" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("requires a password of at least 6 characters", () => {
    expect(
      registerSchema.safeParse({ name: "Ada", email: "a@b.com", password: "12345" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ name: "Ada", email: "a@b.com", password: "123456" }).success,
    ).toBe(true);
  });

  it("requires a name of at least 2 characters", () => {
    expect(
      registerSchema.safeParse({ name: "A", email: "a@b.com", password: "123456" }).success,
    ).toBe(false);
  });
});

describe("createCustomerSchema", () => {
  it("requires a name and phone", () => {
    expect(createCustomerSchema.safeParse({ email: "a@b.com" }).success).toBe(false);
    expect(createCustomerSchema.safeParse({ name: "Ada", phone: "0712345678" }).success).toBe(true);
  });

  it("allows an empty or missing email", () => {
    expect(createCustomerSchema.safeParse({ name: "Ada", phone: "07", email: "" }).success).toBe(true);
    expect(createCustomerSchema.safeParse({ name: "Ada", phone: "07" }).success).toBe(true);
  });

  it("coerces a string store_id", () => {
    const result = createCustomerSchema.safeParse({ name: "Ada", phone: "07", store_id: "3" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.store_id).toBe(3);
  });
});

describe("createExpenseSchema", () => {
  it("coerces amount from a string and rejects non-positive values", () => {
    const ok = createExpenseSchema.safeParse({
      description: "Stock",
      amount: "1500.50",
      category: "Inventory",
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.amount).toBe(1500.5);

    expect(
      createExpenseSchema.safeParse({ description: "x", amount: 0, category: "y" }).success,
    ).toBe(false);
  });

  it("parses an ISO date string into a Date", () => {
    const result = createExpenseSchema.safeParse({
      description: "Rent",
      amount: 100,
      category: "Rent",
      date: "2026-09-16",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.date).toBeInstanceOf(Date);
  });
});

describe("updateExpenseSchema", () => {
  it("allows partial payloads but still validates fields that are present", () => {
    expect(updateExpenseSchema.safeParse({ description: "Updated" }).success).toBe(true);
    expect(updateExpenseSchema.safeParse({ amount: -5 }).success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("requires a name", () => {
    expect(createCategorySchema.safeParse({ name: "" }).success).toBe(false);
    expect(createCategorySchema.safeParse({ name: "Beverages" }).success).toBe(true);
  });
});
