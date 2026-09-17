// Runs before any test module loads. Several app modules (e.g.
// config/env.ts via the notification service) validate required
// environment variables at import time, so seed test-safe defaults here.
// Real environment values always win (`??=` never overwrites).
process.env.SQLITE_PATH ??= ":memory:";
process.env.JWT_SECRET ??= "test-secret-for-jest-only";
process.env.NODE_ENV ??= "test";
