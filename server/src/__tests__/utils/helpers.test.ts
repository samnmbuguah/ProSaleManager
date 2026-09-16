import {
  generateOrderNumber,
  storeScope,
} from "../../utils/helpers.js";

describe("generateOrderNumber", () => {
  it("uses the PO prefix", () => {
    expect(generateOrderNumber()).toMatch(/^PO\d+$/);
  });

  it("generates different values on successive calls", () => {
    const first = generateOrderNumber();
    const second = generateOrderNumber();
    expect(first).not.toBe(second);
  });
});

describe("storeScope", () => {
  it("returns an impossible filter when there is no user", () => {
    expect(storeScope(undefined, { status: "active" })).toEqual({
      status: "active",
      store_id: -1,
    });
  });

  it("adds store_id for a regular user", () => {
    const where = storeScope({ role: "admin", store_id: 7 }, { status: "active" });
    expect(where).toEqual({ status: "active", store_id: 7 });
  });

  it("adds store_id when a super_admin is impersonating a store", () => {
    const where = storeScope({ role: "super_admin", store_id: 3 }, {});
    expect(where).toEqual({ store_id: 3 });
  });

  it("does not filter for a super_admin without a store context", () => {
    const where = storeScope({ role: "super_admin", store_id: null }, { status: "active" });
    expect(where).toEqual({ status: "active" });
  });

  it("does not mutate the original where clause", () => {
    const original: Record<string, unknown> = { status: "active" };
    storeScope({ role: "admin", store_id: 1 }, original);
    expect(original).toEqual({ status: "active" });
  });
});
