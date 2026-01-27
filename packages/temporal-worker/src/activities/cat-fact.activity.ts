import axios, { AxiosError } from 'axios';
import { Context } from '@temporalio/activity';
import { CatFactData } from './types';

/**
 * Temporal Activity: Get random cat fact
 *
 * Uses catfact.ninja API to fetch random cat trivia
 *
 * @param correlationId - Distributed tracing ID
 * @returns Cat fact data
 * @throws Error on API failure or invalid response
 */
export async function getCatFactActivity(
  correlationId: string
): Promise<CatFactData> {
  const logger = Context.current().log;
  const baseUrl = 'https://catfact.ninja';

  logger.info('Fetching cat fact from catfact.ninja', { correlationId });

  try {
    const response = await axios.get(`${baseUrl}/fact`, {
      headers: {
        'X-Correlation-ID': correlationId,
      },
      timeout: 10000,
    });

    // Validate response structure
    const data = response.data;
    if (!data || typeof data !== 'object') {
      throw new Error('CatFact API response must be an object');
    }

    if (typeof data.fact !== 'string' || !data.fact) {
      throw new Error('CatFact API missing fact field');
    }

    const catFact: CatFactData = {
      catFact: data.fact,
      source: 'catfact.ninja',
    };

    logger.info('Cat fact fetched successfully', {
      correlationId,
      factLength: catFact.catFact.length,
    });

    return catFact;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNABORTED') {
        logger.error('Cat fact service timeout', { correlationId });
        throw new Error('Cat fact service timeout');
      }
      logger.error('Cat fact service error', {
        correlationId,
        message: axiosError.message,
        status: axiosError.response?.status,
      });
      throw new Error(`Cat fact service error: ${axiosError.message}`);
    }
    logger.error('Unexpected error fetching cat fact', { correlationId, error });
    throw error;
  }
}
