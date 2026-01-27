import axios, { AxiosError } from 'axios';
import { Context } from '@temporalio/activity';
import { WeatherData } from './types';

/**
 * Temporal Activity: Get weather by geographic coordinates
 *
 * Uses OpenWeatherMap API to fetch current weather conditions
 *
 * @param latitude - Geographic latitude
 * @param longitude - Geographic longitude
 * @param correlationId - Distributed tracing ID
 * @returns Weather data including temperature, humidity, wind speed
 * @throws Error on API failure or invalid response
 */
export async function getWeatherActivity(
  latitude: number,
  longitude: number,
  correlationId: string
): Promise<WeatherData> {
  const logger = Context.current().log;
  const baseUrl = 'https://api.openweathermap.org/data/2.5';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY environment variable not set');
  }

  logger.info('Fetching weather from OpenWeatherMap', {
    correlationId,
    latitude,
    longitude,
  });

  try {
    const response = await axios.get(`${baseUrl}/weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: apiKey,
        units: 'metric',
      },
      headers: {
        'X-Correlation-ID': correlationId,
      },
      timeout: 10000,
    });

    // Validate response structure
    const data = response.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Weather API response must be an object');
    }

    if (!Array.isArray(data.weather) || data.weather.length === 0) {
      throw new Error('Weather API missing weather array');
    }

    if (!data.main || typeof data.main !== 'object') {
      throw new Error('Weather API missing main object');
    }

    if (!data.wind || typeof data.wind !== 'object') {
      throw new Error('Weather API missing wind object');
    }

    const main = data.main;
    const wind = data.wind;
    const weatherData = data.weather[0];

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

    const weather: WeatherData = {
      description: (weatherData?.description as string) || 'Unknown',
      temperature: main.temp,
      feelsLike: main.feels_like,
      humidity: main.humidity,
      windSpeed: wind.speed,
    };

    logger.info('Weather fetched successfully', {
      correlationId,
      temperature: weather.temperature,
      description: weather.description,
    });

    return weather;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNABORTED') {
        logger.error('Weather service timeout', { correlationId });
        throw new Error('Weather service timeout');
      }
      logger.error('Weather service error', {
        correlationId,
        message: axiosError.message,
        status: axiosError.response?.status,
      });
      throw new Error(`Weather service error: ${axiosError.message}`);
    }
    logger.error('Unexpected error fetching weather', { correlationId, error });
    throw error;
  }
}
