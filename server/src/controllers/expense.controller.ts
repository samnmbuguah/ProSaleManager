import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { db } from "../../src/db";
import { expenses, expenseSchema } from "../../src/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const expenseController = {
  // Get all expenses for the logged-in user
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const userExpenses = await db.query.expenses.findMany({
        where: eq(expenses.userId, req.user!.id),
        orderBy: [desc(expenses.date)],
      });

      res.json(userExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  },

  // Create a new expense
  create: async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = expenseSchema.parse(req.body);

      const [expense] = await db.insert(expenses)
        .values({
          ...validatedData,
          userId: req.user!.id,
        })
        .returning();

      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  },

  // Delete an expense
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const [deletedExpense] = await db.delete(expenses)
        .where(eq(expenses.id, parseInt(id)))
        .returning();

      if (!deletedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  },
}; 