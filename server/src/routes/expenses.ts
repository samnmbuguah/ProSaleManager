import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenses.controller.js";

const router = express.Router();

// Apply authentication middleware to all expense routes
router.use(authenticate);

// Get all expenses with pagination
router.get("/", getExpenses);

// Create a new expense
router.post("/", createExpense);

// Update an expense
router.put("/:id", updateExpense);

// Delete an expense
router.delete("/:id", deleteExpense);

export default router;
