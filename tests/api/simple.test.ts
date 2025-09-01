import request from "supertest";
import app from "../../server/src/app.js";
import { sequelize } from "../../server/src/config/database.js";
import User from "../../server/src/models/User.js";
import Category from "../../server/src/models/Category.js";

describe("Simple API Test", () => {
    it("should have a working database connection", async () => {
        const userCount = await User.count();
        const categoryCount = await Category.count();

        expect(userCount).toBeGreaterThan(0);
        expect(categoryCount).toBeGreaterThan(0);
    });

    it("should return 401 for unauthenticated API requests", async () => {
        const response = await request(app).get("/api/users/non-existent-user-id");
        expect(response.status).toBe(401);
    });
});
