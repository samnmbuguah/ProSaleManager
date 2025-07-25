import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, ".env") });

// Set default test configuration
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
process.env.TEST_USERNAME = process.env.TEST_USERNAME || "test@example.com";
process.env.TEST_PASSWORD = process.env.TEST_PASSWORD || "password123";
process.env.HEADLESS = process.env.HEADLESS || "false";
