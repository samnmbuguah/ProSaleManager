import { jest } from "@jest/globals";

// Mock the models and database
jest.mock("./src/config/database");
jest.mock("./src/models/Sale");
jest.mock("./src/models/SaleItem");

// Mock authentication middleware
jest.mock("./src/middleware/auth.middleware", () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1 };
    next();
  },
}));

// Mock other models
jest.mock("./src/models/User", () => ({}));
jest.mock("./src/models/Customer", () => ({}));
jest.mock("./src/models/Product", () => ({}));
