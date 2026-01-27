/**
 * Extended Express Request type definitions
 *
 * This file extends the Express Request interface to add custom properties
 * that we attach in middlewares (like correlationId).
 *
 * TypeScript will automatically pick up this file thanks to tsconfig.json
 * "typeRoots" or "types" configuration.
 */

declare namespace Express {
  export interface Request {
    /**
     * Correlation ID for distributed tracing
     * Set by CorrelationIdMiddleware
     */
    correlationId?: string;
  }
}
