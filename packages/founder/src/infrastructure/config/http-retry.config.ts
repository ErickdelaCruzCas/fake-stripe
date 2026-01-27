/**
 * HTTP Retry Configuration
 *
 * Centralizes retry policy constants for better maintainability
 * and configurability.
 */

export const HTTP_RETRY_CONFIG = {
  /**
   * Maximum number of retry attempts for failed HTTP requests
   */
  MAX_RETRIES: 3,

  /**
   * HTTP status codes that should trigger a retry
   * (5xx server errors)
   */
  RETRYABLE_STATUS_CODES: [500, 502, 503, 504] as readonly number[],

  /**
   * Base delay for exponential backoff calculation
   * Formula: Math.pow(BACKOFF_BASE, retryCount - 1) * BACKOFF_MULTIPLIER_MS
   * Result: 1s, 2s, 4s for retries 1, 2, 3
   */
  BACKOFF_BASE: 2,

  /**
   * Multiplier in milliseconds for backoff calculation
   */
  BACKOFF_MULTIPLIER_MS: 1000,
} as const;
