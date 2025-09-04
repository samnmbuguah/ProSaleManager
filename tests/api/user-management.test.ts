import supertest from "supertest";
import app from "../../server/src/app.js";
import { sequelize } from "../../server/src/config/database.js";
import User from "../../server/src/models/User.js";
import UserPreference from "../../server/src/models/UserPreference.js";
import { authenticateAllUsers, TestAuthContext, createAuthenticatedRequest, testUnauthorizedAccess, testForbiddenAccess } from "../utils/auth-helpers.js";
import { createTestUser, createTestUserPreferences } from "../fixtures/users.js";

describe("User Management API", () => {
  let authTokens: TestAuthContext;
  let testUserId: number;

  beforeAll(async () => {
    // Authenticate all seeded users (database already seeded in global setup)
    authTokens = await authenticateAllUsers();

    // Create test user preferences for seeded users if they don't exist
    const existingPreferences = await UserPreference.findAll({
      where: { user_id: [authTokens.superAdmin.user.id, authTokens.admin.user.id, authTokens.sales.user.id] }
    });

    if (existingPreferences.length === 0) {
      await UserPreference.bulkCreate([
        {
          user_id: authTokens.superAdmin.user.id,
          ...createTestUserPreferences()
        },
        {
          user_id: authTokens.admin.user.id,
          ...createTestUserPreferences({ dark_mode: true, notifications: false })
        },
        {
          user_id: authTokens.sales.user.id,
          ...createTestUserPreferences()
        }
      ]);
    }
  });

  afterAll(async () => {
    // Clean up test data if needed
    // Database cleanup is handled globally
  });

  describe("GET /api/users/roles", () => {
    it("should return all available user roles", async () => {
      const response = await request(app).get("/api/users/roles");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(4);

      const roles = response.body.data.map((role: any) => role.value);
      expect(roles).toContain("super_admin");
      expect(roles).toContain("admin");
      expect(roles).toContain("manager");
      expect(roles).toContain("sales");
    });
  });

  describe("GET /api/users", () => {
    it("should return 401 without authentication", async () => {
      await testUnauthorizedAccess("/api/users", "get");
    });

    it("should return 403 for non-admin users", async () => {
      await testForbiddenAccess("/api/users", "get", authTokens.sales.token);
    });

    it("should return all users for super admin", async () => {
      const response = await createAuthenticatedRequest(authTokens.superAdmin.token)
        .get("/api/users");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it("should return users for admin", async () => {
      const response = await createAuthenticatedRequest(authTokens.admin.token)
        .get("/api/users");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });
  });

  describe("POST /api/users", () => {
    it("should create a new user for super admin", async () => {
      const newUser = createTestUser({
        email: "newuser@prosale.com",
        role: "sales"
      });

      const response = await createAuthenticatedRequest(authTokens.superAdmin.token)
        .post("/api/users")
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.role).toBe(newUser.role);
      expect(response.body.data.password).toBeUndefined();

      testUserId = response.body.data.id;
    });

    it("should return 400 for duplicate email", async () => {
      const duplicateUser = createTestUser({
        email: "newuser@prosale.com",
        role: "sales"
      });

      const response = await createAuthenticatedRequest(authTokens.superAdmin.token)
        .post("/api/users")
        .send(duplicateUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 403 for non-super admin", async () => {
      const newUser = createTestUser({
        email: "another@prosale.com",
        role: "sales"
      });

      const response = await createAuthenticatedRequest(authTokens.admin.token)
        .post("/api/users")
        .send(newUser);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return user details for super admin", async () => {
      const response = await createAuthenticatedRequest(authTokens.superAdmin.token)
        .get(`/api/users/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUserId);
      expect(response.body.data.password).toBeUndefined();
    });

    it("should return 404 for non-existent user", async () => {
      const response = await createAuthenticatedRequest(authTokens.superAdmin.token)
        .get("/api/users/99999");

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user for super admin", async () => {
      const updateData = {
        name: "Updated Test User",
        role: "manager",
        is_active: false
      };

      const response = await createAuthenticatedRequest(authTokens.superAdmin.token)
        .put(`/api/users/${testUserId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.role).toBe(updateData.role);
      expect(response.body.data.is_active).toBe(updateData.is_active);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete user for super admin", async () => {
      const response = await createAuthenticatedRequest(authTokens.superAdmin.token)
        .delete(`/api/users/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 when trying to access deleted user", async () => {
      const response = await createAuthenticatedRequest(authTokens.superAdmin.token)
        .get(`/api/users/${testUserId}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/users/profile", () => {
    it("should update user's own profile", async () => {
      const updateData = {
        name: "Updated Admin Name",
        email: "updatedadmin@prosale.com"
      };

      const response = await createAuthenticatedRequest(authTokens.admin.token)
        .put("/api/users/profile")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
    });

    it("should return 400 for duplicate email", async () => {
      const updateData = {
        email: authTokens.superAdmin.user.email
      };

      const response = await createAuthenticatedRequest(authTokens.admin.token)
        .put("/api/users/profile")
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/users/change-password", () => {
    it("should change user's password", async () => {
      const passwordData = {
        currentPassword: "elteeadmin123",
        newPassword: "newpassword123"
      };

      const response = await createAuthenticatedRequest(authTokens.admin.token)
        .post("/api/users/change-password")
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 for incorrect current password", async () => {
      const passwordData = {
        currentPassword: "wrongpassword",
        newPassword: "newpassword123"
      };

      const response = await createAuthenticatedRequest(authTokens.admin.token)
        .post("/api/users/change-password")
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/users/preferences", () => {
    it("should return user's preferences", async () => {
      const response = await createAuthenticatedRequest(authTokens.admin.token)
        .get("/api/users/preferences");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.dark_mode).toBe(true);
      expect(response.body.data.notifications).toBe(false);
      expect(response.body.data.language).toBe("english");
    });
  });

  describe("PUT /api/users/preferences", () => {
    it("should update user's preferences", async () => {
      const updateData = createTestUserPreferences({
        dark_mode: false,
        notifications: true,
        language: "spanish",
        theme: "light",
        timezone: "America/New_York"
      });

      const response = await createAuthenticatedRequest(authTokens.admin.token)
        .put("/api/users/preferences")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.dark_mode).toBe(updateData.dark_mode);
      expect(response.body.data.notifications).toBe(updateData.notifications);
      expect(response.body.data.language).toBe(updateData.language);
      expect(response.body.data.theme).toBe(updateData.theme);
      expect(response.body.data.timezone).toBe(updateData.timezone);
    });
  });
});
