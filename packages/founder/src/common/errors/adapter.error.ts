/**
 * Custom error types for better type safety
 * Replaces unsafe `catch (error: any)` patterns
 */

/**
 * Base error for external API adapter failures
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly source: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AdapterError';
    Object.setPrototypeOf(this, AdapterError.prototype);
  }

  /**
   * Extract error message from unknown error type
   */
  static extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }
}

/**
 * Location API specific error
 */
export class LocationAdapterError extends AdapterError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'LocationAdapter', originalError);
    this.name = 'LocationAdapterError';
  }
}

/**
 * Weather API specific error
 */
export class WeatherAdapterError extends AdapterError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'WeatherAdapter', originalError);
    this.name = 'WeatherAdapterError';
  }
}

/**
 * CatFact API specific error
 */
export class CatFactAdapterError extends AdapterError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'CatFactAdapter', originalError);
    this.name = 'CatFactAdapterError';
  }
}
