import Sale from "../../../server/src/models/Sale.js";

describe("Sale Model", () => {
  it("should be defined properly", () => {
    // Check if Sale model has expected properties
    expect(Sale).toBeDefined();
    expect(Sale.tableName).toBe("sales");
  });
});
