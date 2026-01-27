import { Weather } from '../models/weather.model';

export interface WeatherPort {
  /**
   * Get weather data by geographic coordinates
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param correlationId - Request correlation ID for tracing
   */
  getWeatherByCoordinates(
    latitude: number,
    longitude: number,
    correlationId: string
  ): Promise<Weather>;
}

export const WEATHER_PORT = Symbol('WeatherPort');
