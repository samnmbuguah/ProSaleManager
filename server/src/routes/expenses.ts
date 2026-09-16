import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireStoreContext } from "../middleware/store-context.middleware.js";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
} from "../controllers/expenses.controller.js";
import { validate } from "../middleware/validate.js";
import { createExpenseSchema, updateExpenseSchema } from "../validation/schemas.js";

const router = express.Router();

// Authenticate all expense routes
router.use(requireAuth);
router.use(requireStoreContext);

// Get all expenses with pagination
router.get("/", getExpenses);

// Get unique categories
router.get("/categories", getExpenseCategories);

// Create a new expense
router.post("/", validate(createExpenseSchema), createExpense);

// Update an expense
router.put("/:id", validate(updateExpenseSchema), updateExpense);

// Delete an expense
router.delete("/:id", deleteExpense);

export default router;
