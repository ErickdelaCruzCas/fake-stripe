import { Injectable } from '@nestjs/common';

/**
 * Time Service
 *
 * Wraps time/date operations in a service for:
 * - Dependency injection
 * - Testability (can be mocked for deterministic tests)
 * - Consistency across application
 */
@Injectable()
export class TimeService {
  /**
   * Get current timestamp in milliseconds (Date.now())
   */
  now(): number {
    return Date.now();
  }

  /**
   * Get current date object
   */
  currentDate(): Date {
    return new Date();
  }

  /**
   * Calculate duration in milliseconds
   */
  duration(startTime: number): number {
    return this.now() - startTime;
  }
}
