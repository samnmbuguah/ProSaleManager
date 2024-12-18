import { Router } from "express";
import { expenseController } from "../controllers/expense.controller";
import { validateRequest } from "../middleware/validateRequest";
import { z } from "zod";

const router = Router();

const createExpenseSchema = z.object({
  body: z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.number().positive("Amount must be positive"),
    category: z.enum(["Food", "Transportation", "Housing", "Utilities", "Entertainment", "Other"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  }),
});

// Get all expenses
router.get("/", expenseController.getAll);

// Create a new expense
router.post("/", validateRequest(createExpenseSchema), expenseController.create);

// Delete an expense
router.delete("/:id", expenseController.delete);

export default router; 