import { authenticateToken } from "../middleware/auth.middleware.js";

console.log("Starting debug script...");
try {
    console.log("Successfully imported auth.middleware.ts");
} catch (error) {
    console.error("Failed to import auth.middleware:", error);
}
