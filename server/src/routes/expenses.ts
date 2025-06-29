import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenses.controller.js";

const router = express.Router();

// Authenticate all expense routes
router.use(protect);

// Get all expenses with pagination
router.get("/", getExpenses);

// Create a new expense
router.post("/", createExpense);

// Update an expense
router.put("/:id", updateExpense);

// Delete an expense
router.delete("/:id", deleteExpense);

export default router;
