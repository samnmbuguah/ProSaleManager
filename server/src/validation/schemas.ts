import { z } from "zod";

/**
 * Centralised request schemas shared across routes.
 *
 * These intentionally mirror the validation the controllers used to perform
 * inline. They coerce common transport types (strings from form data / query
 * strings) so callers behave exactly as before, but reject clearly invalid
 * payloads before they reach the database.
 */

const nonEmpty = (min = 1, max = 255) => z.string().trim().min(min).max(max);

const optionalEmail = z
  .union([z.string().trim().email("Invalid email address"), z.literal("")])
  .nullish();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: nonEmpty(2, 120),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().trim().max(40).nullish(),
});

export const createCustomerSchema = z.object({
  name: nonEmpty(1, 120),
  phone: nonEmpty(1, 40),
  email: optionalEmail,
  store_id: z.coerce.number().int().positive().nullish(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createCategorySchema = z.object({
  name: nonEmpty(1, 100),
  description: z.string().trim().max(500).nullish(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createExpenseSchema = z.object({
  description: nonEmpty(1, 500),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.coerce.date().optional(),
  category: nonEmpty(1, 100),
  payment_method: z.string().trim().max(50).nullish(),
  store_id: z.coerce.number().int().positive().nullish(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const agentMessageSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000),
  threadId: z.string().trim().min(1).max(100).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type AgentMessageInput = z.infer<typeof agentMessageSchema>;
