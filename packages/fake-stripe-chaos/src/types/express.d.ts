/**
 * Extended Express Request type definitions
 */

declare namespace Express {
  export interface Request {
    /**
     * Correlation ID for distributed tracing
     */
    correlationId?: string;
  }
}
