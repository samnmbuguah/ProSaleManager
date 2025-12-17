import { Store } from "../models/index.js";
import { sequelize } from "../config/database.js";

async function createSecondStore() {
    try {
        await sequelize.authenticate();
        const existing = await Store.findOne({ where: { name: "Test Store" } });
        if (existing) {
            console.log("Test Store already exists.");
        } else {
            await Store.create({
                name: "Test Store",
                subdomain: "test",
                address: "123 Test St",
                phone: "1234567890",
                email: "test@example.com"
            });
            console.log("Created 'Test Store'.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

createSecondStore();
