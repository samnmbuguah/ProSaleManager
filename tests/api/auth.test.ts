import request from "supertest";
import app from "../../server/src/app.js";

// Use only seeded users and do not create/destroy users in the test file

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("should return 400 if email already exists", async () => {
      // eltee.admin@prosale.com is already seeded
      const response = await request(app).post("/api/auth/register").send({
        name: "Admin User",
        email: "eltee.admin@prosale.com",
        password: "elteeadmin123",
        role: "admin",
      });
      console.log("Register existing user response:", response.body);
      expect(response.status).toBe(400);
      // Flexible error assertion
      if (response.body.success !== undefined) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      } else {
        // Fallback for alternate error structure
        expect(response.body.error || response.body.message).toBeDefined();
      }
    });

    it("should create a new user successfully", async () => {
      // Use a unique email for each run
      const uniqueEmail = `newuser_${Date.now()}@prosale.com`;
      const response = await request(app).post("/api/auth/register").send({
        name: "New User",
        email: uniqueEmail,
        password: "newuser123",
        role: "sales",
      });
      if (response.status !== 201) {
        // Log for debugging
        console.error("Register response:", response.body);
      }
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("email", uniqueEmail);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return 401 for invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "eltee.admin@prosale.com",
        password: "wrongpassword",
      });
      console.log("Login invalid credentials response:", response.body);
      expect(response.status).toBe(401);
      // Flexible error assertion
      if (response.body.success !== undefined) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      } else {
        expect(response.body.error || response.body.message).toBeDefined();
      }
    });

    it("should return token for valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "eltee.admin@prosale.com",
        password: "elteeadmin123",
      });
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("email", "eltee.admin@prosale.com");
      // Optionally, check for set-cookie header
      expect(response.headers["set-cookie"]).toBeDefined();
    });
  });

  describe("GET /api/auth/me", () => {
    let cookie: string;

    beforeAll(async () => {
      // Login as seeded user and get cookie
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "eltee.admin@prosale.com",
        password: "elteeadmin123",
      });
      cookie = loginResponse.headers["set-cookie"][0].split(";")[0];
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/api/auth/me");
      expect(response.status).toBe(401);
    });

    it("should return user data with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", [cookie]);
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("email", "eltee.admin@prosale.com");
    });
  });

  describe("POST /api/auth/logout", () => {
    let cookie: string;

    beforeAll(async () => {
      // Login as seeded user and get cookie
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "eltee.admin@prosale.com",
        password: "elteeadmin123",
      });
      cookie = loginResponse.headers["set-cookie"][0].split(";")[0];
    });

    it("should logout successfully", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", [cookie]);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toContain("token=;");
    });
  });
});

describe("Error Handler", () => {
  it("should return a 418 error and message from /api/test-error", async () => {
    const response = await request(app).get("/api/test-error");
    console.log("Test error handler response:", response.body);
    expect(response.status).toBe(418);
    expect(response.body.error).toBe("Test error handler");
    expect(response.body.success).toBe(false);
  });
});
