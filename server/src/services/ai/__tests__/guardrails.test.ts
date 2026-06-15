import { toolsForRole, isStaff, buildSystemPrompt, STAFF_ROLES } from "../guardrails.js";
import { ANALYTICS_TOOLS } from "../tools/analyticsTools.js";

describe("role gating", () => {
  it("treats staff roles as staff", () => {
    for (const r of STAFF_ROLES) expect(isStaff(r)).toBe(true);
  });

  it("excludes clients and unknown roles", () => {
    expect(isStaff("client")).toBe(false);
    expect(isStaff(undefined)).toBe(false);
    expect(isStaff("guest")).toBe(false);
  });

  it("gives staff the full analytics toolset and clients none", () => {
    expect(toolsForRole("admin")).toHaveLength(Object.keys(ANALYTICS_TOOLS).length);
    expect(toolsForRole("client")).toHaveLength(0);
  });

  it("every analytics tool has a unique, well-formed definition", () => {
    const names = new Set<string>();
    for (const tool of Object.values(ANALYTICS_TOOLS)) {
      expect(tool.definition.type).toBe("function");
      expect(tool.definition.function.name).toMatch(/^[a-z_]+$/);
      expect(tool.definition.function.description.length).toBeGreaterThan(10);
      expect(typeof tool.run).toBe("function");
      names.add(tool.definition.function.name);
    }
    expect(names.size).toBe(Object.keys(ANALYTICS_TOOLS).length);
  });
});

describe("buildSystemPrompt", () => {
  it("scopes a regular admin to their named store", () => {
    const p = buildSystemPrompt({ name: "Jane", role: "admin", storeName: "Eltee" }, "2026-06-17");
    expect(p).toContain("Jane");
    expect(p).toContain("Eltee");
    expect(p).toContain("2026-06-17");
    expect(p).toContain("Kenyan Shillings");
  });

  it("scopes a super_admin without a store to all stores", () => {
    const p = buildSystemPrompt({ name: "Root", role: "super_admin" }, "2026-06-17");
    expect(p).toContain("all stores");
  });

  it("forbids inventing numbers", () => {
    const p = buildSystemPrompt({ name: "X", role: "manager", storeName: "S" }, "2026-06-17");
    expect(p.toLowerCase()).toContain("never invent");
  });
});
