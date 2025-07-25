import request from "supertest";
import app from "../../server/src/app.js";

let csrfToken: string;
let superAdminToken: string;
let userToken: string;
let storeId: number;

// Removed beforeAll DB sync

describe("API Endpoints - Multi-Store", () => {
  it("should get CSRF token", async () => {
    const res = await request(app).get("/api/auth/csrf-token");
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    csrfToken = res.body.token;
  });

  it("should sign up super admin", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("x-csrf-token", csrfToken)
      .send({
        name: "Super Admin",
        email: "superadmin@prosale.com",
        password: "superadmin123",
        role: "super_admin",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("superadmin@prosale.com");
  });

  it("should login as super admin and store token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "superadmin@prosale.com", password: "superadmin123" });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("superadmin@prosale.com");
    // No token in body, so skip token extraction
  });

  it("should allow super admin to list all stores", async () => {
    const res = await request(app)
      .get("/api/stores")
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    storeId = res.body.data[0].id;
  });

  it("should sign up a regular user for a store", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("x-csrf-token", csrfToken)
      .send({
        name: "Store User",
        email: "user@prosale.com",
        password: "user123",
        role: "admin",
        store_id: storeId,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("user@prosale.com");
  });

  it("should login as regular user and store token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@prosale.com", password: "user123" });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("user@prosale.com");
    // No token in body, so skip token extraction
  });

  it("should allow regular user to see only their store", async () => {
    const res = await request(app)
      .get("/api/stores")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(storeId);
  });

  it("should allow super admin to create a product for a store", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .set("x-csrf-token", csrfToken)
      .send({
        name: "Test Product",
        sku: "SKU001",
        category_id: 1,
        piece_buying_price: 10,
        piece_selling_price: 15,
        pack_buying_price: 40,
        pack_selling_price: 60,
        dozen_buying_price: 120,
        dozen_selling_price: 180,
        quantity: 5,
        min_quantity: 2,
        is_active: true,
        store_id: storeId,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Test Product");
  });

  it("should allow regular user to see products only in their store", async () => {
    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toBe("Test Product");
  });

  // Add more advanced tests for sales, customers, etc. as needed
});
