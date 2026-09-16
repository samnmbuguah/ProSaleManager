import { param } from "../../utils/params.js";

describe("param", () => {
  it("returns a string unchanged", () => {
    expect(param("42")).toBe("42");
  });

  it("returns the first value of an array param", () => {
    expect(param(["a", "b"])).toBe("a");
  });

  it("returns an empty string for undefined", () => {
    expect(param(undefined)).toBe("");
  });
});
