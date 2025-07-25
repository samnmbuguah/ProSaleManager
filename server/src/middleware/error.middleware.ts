import { Request, Response } from "express";

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (err: ApiError, req: Request, res: Response) => {
  console.error("Error:", err);
  if (err && err.stack) {
    console.error("Stack:", err.stack);
  }
  if (res.headersSent) {
    console.error("Error handler called after headers sent!");
    return;
  }

  // Default error
  const error = { ...err };
  error.message = err.message;

  // Sequelize validation error
  if (err.name === "SequelizeValidationError" && Array.isArray((err as any).errors)) {
    const message = (err as any).errors.map((val: { message: string }) => val.message);
    error.message = message.join(", ");
    error.statusCode = 400;
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError" && Array.isArray((err as any).errors)) {
    const message = (err as any).errors.map((val: { message: string }) => val.message);
    error.message = message.join(", ");
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.statusCode = 401;
  }

  // Cast error (MongoDB)
  if (err.name === "CastError") {
    error.message = "Resource not found";
    error.statusCode = 404;
  }

  // Use statusCode from ApiError if present, otherwise default to 500
  const statusCode =
    typeof error.statusCode === "number" && !isNaN(error.statusCode) ? error.statusCode : 500;
  const message = error.message || "Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
