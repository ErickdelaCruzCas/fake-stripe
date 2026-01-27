import axios, { AxiosError } from 'axios';
import { Context } from '@temporalio/activity';
import { LocationData } from './types';

/**
 * Temporal Activity: Get current location from IP address
 *
 * Uses ipapi.co to determine geographic location based on IP
 *
 * @param correlationId - Distributed tracing ID
 * @returns Location data including coordinates, city, country, timezone
 * @throws Error on API failure or invalid response
 */
export async function getCurrentLocationActivity(
  correlationId: string
): Promise<LocationData> {
  const logger = Context.current().log;
  const baseUrl = 'https://ipapi.co';

  logger.info('Fetching location from ipapi.co', { correlationId });

  try {
    const response = await axios.get(`${baseUrl}/json`, {
      headers: {
        'User-Agent': 'Fake-Stripe-Temporal-Worker/1.0',
        'X-Correlation-ID': correlationId,
      },
      timeout: 10000,
    });

    // Validate response structure
    const data = response.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Location API response must be an object');
    }

    // Validate required fields
    const requiredStringFields = ['ip', 'city', 'region', 'country', 'timezone'];
    for (const field of requiredStringFields) {
      if (typeof data[field] !== 'string') {
        throw new Error(`Location API missing required field: ${field}`);
      }
    }

    if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      throw new Error('Location API coordinates must be numbers');
    }

    const location: LocationData = {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
    };

    logger.info('Location fetched successfully', {
      correlationId,
      city: location.city,
      country: location.country,
    });

    return location;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNABORTED') {
        logger.error('Location service timeout', { correlationId });
        throw new Error('Location service timeout');
      }
      logger.error('Location service error', {
        correlationId,
        message: axiosError.message,
        status: axiosError.response?.status,
      });
      throw new Error(`Location service error: ${axiosError.message}`);
    }
    logger.error('Unexpected error fetching location', { correlationId, error });
    throw error;
  }
}
