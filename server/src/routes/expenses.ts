import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireStoreContext } from "../middleware/store-context.middleware.js";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenses.controller.js";

const router = express.Router();

// Authenticate all expense routes
router.use(requireAuth);
router.use(requireStoreContext);

// Get all expenses with pagination
router.get("/", getExpenses);

// Create a new expense
router.post("/", createExpense);

// Update an expense
router.put("/:id", updateExpense);

// Delete an expense
router.delete("/:id", deleteExpense);

export default router;
