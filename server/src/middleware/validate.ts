import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

export type ValidationSource = "body" | "query" | "params";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validatedQuery?: Record<string, unknown>;
      validatedParams?: Record<string, unknown>;
    }
  }
}

export interface ValidationIssue {
  path: string;
  message: string;
}

/**
 * Express middleware that validates a request section against a Zod schema.
 * On failure it short-circuits with 400 and a machine-readable list of issues.
 * On success the parsed (and coerced) value replaces `req.body`, or is exposed
 * as `req.validatedQuery` / `req.validatedParams` (Express 5 defines `query`
 * and `params` as getters, so they cannot be reassigned directly).
 */
export function validate(schema: ZodTypeAny, source: ValidationSource = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors: ValidationIssue[] = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    if (source === "body") {
      req.body = result.data;
    } else if (source === "query") {
      req.validatedQuery = result.data as Record<string, unknown>;
    } else {
      req.validatedParams = result.data as Record<string, unknown>;
    }

    next();
  };
}
