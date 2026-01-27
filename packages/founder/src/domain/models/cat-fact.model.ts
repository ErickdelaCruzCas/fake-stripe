/**
 * CatFact domain model
 *
 * Represents entertainment data (cat fact) from CatFact API
 */
export class CatFact {
  constructor(
    public readonly catFact: string,
    public readonly source: string = 'catfact.ninja'
  ) {}

  /**
   * Create CatFact from external API response with validation
   * @throws Error if required fields are missing or invalid
   */
  static fromApiResponse(data: unknown): CatFact {
    // Validate data shape
    if (!data || typeof data !== 'object') {
      throw new Error('CatFact API response must be an object');
    }

    const response = data as Record<string, unknown>;

    // Validate fact field exists and is a string
    if (typeof response.fact !== 'string' || !response.fact) {
      throw new Error('CatFact API missing fact field');
    }

    return new CatFact(response.fact);
  }
}
