/**
 * Location domain model
 *
 * Represents geographic location data from IPApi service
 */
export class Location {
  constructor(
    public readonly ip: string,
    public readonly city: string,
    public readonly region: string,
    public readonly country: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly timezone: string
  ) {}

  /**
   * Create Location from external API response with validation
   * @throws Error if required fields are missing or invalid
   */
  static fromApiResponse(data: unknown): Location {
    // Simple validation - check that data is an object
    if (!data || typeof data !== 'object') {
      throw new Error('Location API response must be an object');
    }

    const response = data as Record<string, unknown>;

    // Validate required string fields
    const requiredStringFields = ['ip', 'city', 'region', 'country', 'timezone'];
    for (const field of requiredStringFields) {
      if (typeof response[field] !== 'string') {
        throw new Error(`Location API missing required field: ${field}`);
      }
    }

    // Validate coordinates are numbers
    if (typeof response.latitude !== 'number' || typeof response.longitude !== 'number') {
      throw new Error('Location API coordinates must be numbers');
    }

    return new Location(
      response.ip as string,
      response.city as string,
      response.region as string,
      response.country as string,
      response.latitude as number,
      response.longitude as number,
      response.timezone as string
    );
  }
}
