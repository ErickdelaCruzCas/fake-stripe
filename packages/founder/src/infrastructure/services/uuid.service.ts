import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * UUID Generation Service
 *
 * Wraps UUID generation in a service for:
 * - Dependency injection
 * - Testability (can be mocked)
 * - Consistency across application
 */
@Injectable()
export class UuidService {
  /**
   * Generate a new UUID v4
   */
  generate(): string {
    return uuidv4();
  }

  /**
   * Validate if string is a valid UUID
   */
  isValid(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
