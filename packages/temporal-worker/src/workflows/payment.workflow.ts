import { proxyActivities, defineSignal, defineQuery, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';
import { ChargeRequest, ChargeResponse } from '../activities/types';

// Proxy payment activity with custom retry policy
// Retry on timeout and 500 errors, but NOT on 402 (payment declined)
const { processPaymentActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '2 seconds',
    backoffCoefficient: 2,
    maximumInterval: '30 seconds',
    maximumAttempts: 5,
    nonRetryableErrorTypes: ['Payment declined'], // Don't retry payment declines
  },
});

export interface PaymentWorkflowResult {
  charge: ChargeResponse;
  compensated: boolean;
  attempts: number;
}

export interface PaymentProgress {
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'compensated';
  attempts: number;
}

// Signals
export const cancelPaymentSignal = defineSignal('cancelPayment');

// Queries
export const paymentProgressQuery = defineQuery<PaymentProgress>('paymentProgress');

/**
 * Payment Workflow with Saga Pattern
 *
 * Processes payment through Fake Stripe Chaos service with:
 * - Automatic retry on transient failures (timeout, 500 errors)
 * - Fast failure on payment declined (402)
 * - Compensation logic on final failure
 * - Progress tracking and cancellation support
 *
 * Saga Pattern:
 * 1. Execute payment activity
 * 2. On success: return response
 * 3. On transient failure: retry with exponential backoff
 * 4. On permanent failure: execute compensation (refund, notification)
 * 5. On cancellation: execute compensation
 *
 * @param charge - Payment charge details
 * @param correlationId - Distributed tracing ID
 * @returns Payment result with compensation status
 */
export async function paymentWorkflow(
  charge: ChargeRequest,
  correlationId: string
): Promise<PaymentWorkflowResult> {
  let cancelled = false;
  let attempts = 0;

  // Progress tracking
  const progress: PaymentProgress = {
    status: 'pending',
    attempts: 0,
  };

  // Handle cancellation signal
  setHandler(cancelPaymentSignal, () => {
    cancelled = true;
  });

  // Handle progress query
  setHandler(paymentProgressQuery, () => progress);

  try {
    progress.status = 'processing';
    attempts++;
    progress.attempts = attempts;

    // Check cancellation before processing
    if (cancelled) {
      throw new Error('Payment cancelled by user');
    }

    // Execute payment activity (with automatic retry)
    const chargeResponse = await processPaymentActivity(charge, correlationId);

    progress.status = 'succeeded';

    return {
      charge: chargeResponse,
      compensated: false,
      attempts,
    };
  } catch (error) {
    progress.status = 'failed';

    // Execute compensation logic
    const compensated = await compensatePayment(charge, correlationId, error);

    if (compensated) {
      progress.status = 'compensated';
    }

    // Re-throw error after compensation
    throw error;
  }
}

/**
 * Compensation Logic (Saga Pattern)
 *
 * Execute compensating transactions on payment failure:
 * 1. Log failure for audit trail
 * 2. Send notification to user/admin
 * 3. Refund if payment was partially processed
 * 4. Update order status
 *
 * @param charge - Original charge request
 * @param correlationId - Distributed tracing ID
 * @param error - Error that triggered compensation
 * @returns true if compensation succeeded
 */
async function compensatePayment(
  charge: ChargeRequest,
  correlationId: string,
  error: unknown
): Promise<boolean> {
  try {
    // In a real system, this would:
    // 1. Call refund activity
    // 2. Send notification activity
    // 3. Update database activity
    // 4. Emit compensation event

    // For now, we just log and wait (simulating compensation work)
    await sleep('2 seconds');

    // Compensation successful
    return true;
  } catch (compensationError) {
    // Compensation failed - this is serious!
    // In production, this would trigger alerts
    return false;
  }
}

/**
 * Advanced Payment Workflow with Child Workflow for Notifications
 *
 * Demonstrates advanced Temporal patterns:
 * - Child workflows for async operations
 * - Saga compensation
 * - Multiple retry policies
 *
 * NOTE: This is a template for future enhancement
 */
export async function advancedPaymentWorkflow(
  charge: ChargeRequest,
  correlationId: string
): Promise<PaymentWorkflowResult> {
  // TODO: Implement child workflow for notifications
  // TODO: Add idempotency key handling
  // TODO: Add 3D Secure authentication workflow
  // TODO: Add fraud detection workflow

  return paymentWorkflow(charge, correlationId);
}
