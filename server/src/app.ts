import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authenticate } from "./middleware/auth";
import expenseRoutes from "./routes/expense.routes";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// Routes
app.use("/api/expenses", authenticate, expenseRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!" });
});

export default app; 