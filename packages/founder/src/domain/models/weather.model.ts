/**
 * Weather domain model
 *
 * Represents weather data from OpenWeatherMap API
 */
export class Weather {
  constructor(
    public readonly description: string,
    public readonly temperature: number,
    public readonly feelsLike: number,
    public readonly humidity: number,
    public readonly windSpeed: number
  ) {}

  /**
   * Create Weather from external API response with validation
   * @throws Error if required fields are missing or invalid
   */
  static fromApiResponse(data: unknown): Weather {
    // Validate data shape
    if (!data || typeof data !== 'object') {
      throw new Error('Weather API response must be an object');
    }

    const response = data as Record<string, unknown>;

    // Validate weather array exists
    if (!Array.isArray(response.weather) || response.weather.length === 0) {
      throw new Error('Weather API missing weather array');
    }

    // Validate main object exists
    if (!response.main || typeof response.main !== 'object') {
      throw new Error('Weather API missing main object');
    }

    // Validate wind object exists
    if (!response.wind || typeof response.wind !== 'object') {
      throw new Error('Weather API missing wind object');
    }

    const main = response.main as Record<string, unknown>;
    const wind = response.wind as Record<string, unknown>;
    const weatherData = response.weather[0] as Record<string, unknown>;

    // Validate required numeric fields
    if (typeof main.temp !== 'number') {
      throw new Error('Weather API missing temperature');
    }
    if (typeof main.feels_like !== 'number') {
      throw new Error('Weather API missing feels_like');
    }
    if (typeof main.humidity !== 'number') {
      throw new Error('Weather API missing humidity');
    }
    if (typeof wind.speed !== 'number') {
      throw new Error('Weather API missing wind speed');
    }

    return new Weather(
      (weatherData?.description as string) || 'Unknown',
      main.temp as number,
      main.feels_like as number,
      main.humidity as number,
      wind.speed as number
    );
  }
}
