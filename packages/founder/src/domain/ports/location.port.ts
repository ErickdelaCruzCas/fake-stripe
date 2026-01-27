import { Location } from '../models/location.model';

export interface LocationPort {
  /**
   * Get current location based on IP address
   * @param correlationId - Request correlation ID for tracing
   */
  getCurrentLocation(correlationId: string): Promise<Location>;
}

export const LOCATION_PORT = Symbol('LocationPort');
