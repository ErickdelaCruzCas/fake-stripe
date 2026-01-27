import axios, { AxiosError } from 'axios';
import { Context } from '@temporalio/activity';
import { ChargeRequest, ChargeResponse } from './types';

/**
 * Temporal Activity: Process payment through Fake Stripe Chaos service
 *
 * Uses fake-stripe-chaos service which includes chaos engineering
 * (40% success, 30% timeout, 20% 500 error, 10% 402 payment error)
 *
 * @param charge - Payment charge details
 * @param correlationId - Distributed tracing ID
 * @returns Payment charge response
 * @throws Error on payment failure or service error
 */
export async function processPaymentActivity(
  charge: ChargeRequest,
  correlationId: string
): Promise<ChargeResponse> {
  const logger = Context.current().log;
  const fakeStripeUrl = process.env.FAKE_STRIPE_URL || 'http://localhost:3001';

  logger.info('Processing payment through Fake Stripe', {
    correlationId,
    amount: charge.amount,
    currency: charge.currency,
  });

  try {
    const response = await axios.post(
      `${fakeStripeUrl}/payment/charge`,
      charge,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
        timeout: 15000, // Longer timeout for payment operations
      }
    );

    const data = response.data as ChargeResponse;

    logger.info('Payment processed successfully', {
      correlationId,
      chargeId: data.id,
      status: data.status,
    });

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Handle timeout
      if (axiosError.code === 'ECONNABORTED') {
        logger.error('Payment service timeout', { correlationId });
        throw new Error('Payment service timeout - transaction may be pending');
      }

      // Handle HTTP errors
      if (axiosError.response) {
        const status = axiosError.response.status;
        const responseData = axiosError.response.data as any;

        logger.error('Payment service error', {
          correlationId,
          status,
          message: responseData?.message || axiosError.message,
        });

        // Payment declined (402)
        if (status === 402) {
          throw new Error(
            `Payment declined: ${responseData?.message || 'Insufficient funds'}`
          );
        }

        // Server error (500)
        if (status >= 500) {
          throw new Error(
            `Payment service error: ${responseData?.message || 'Internal server error'}`
          );
        }

        // Other errors
        throw new Error(
          `Payment failed: ${responseData?.message || axiosError.message}`
        );
      }

      // Network errors
      logger.error('Payment service network error', {
        correlationId,
        message: axiosError.message,
      });
      throw new Error(`Payment service unavailable: ${axiosError.message}`);
    }

    logger.error('Unexpected error processing payment', { correlationId, error });
    throw error;
  }
}
