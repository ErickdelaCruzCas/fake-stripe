import axios from 'axios';
import { Context } from '@temporalio/activity';

const FAKE_STRIPE_URL = process.env.FAKE_STRIPE_URL || 'http://localhost:3001';

/**
 * Payment Activities
 *
 * Activities que interactúan con el dominio Payment de fake-stripe-chaos.
 * Incluyen retry policies específicas y correlation ID propagation.
 */

export interface AuthorizePaymentInput {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
}

export interface AuthorizePaymentResult {
  authId: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt: Date;
}

export interface CapturePaymentInput {
  authId: string;
}

export interface CapturePaymentResult {
  authId: string;
  amount: number;
  status: string;
  capturedAt: Date;
}

export interface ReleasePaymentInput {
  authId: string;
}

export interface RefundPaymentInput {
  authId: string;
  amount?: number;
  reason: string;
}

/**
 * Authorize Payment (Hold Funds)
 *
 * Reserva fondos sin capturarlos. Expira en 7 días.
 * Retry policy: 3 retries, exponential backoff 1s/2s/4s
 */
export async function authorizePayment(
  input: AuthorizePaymentInput
): Promise<AuthorizePaymentResult> {
  const correlationId = Context.current().info.workflowExecution.workflowId;

  console.log('Activity: authorizePayment', {
    correlationId,
    amount: input.amount,
    orderId: input.orderId,
  });

  try {
    const response = await axios.post(
      `${FAKE_STRIPE_URL}/payment/authorize`,
      {
        amount: input.amount,
        currency: input.currency,
        orderId: input.orderId,
        customerId: input.customerId,
      },
      {
        headers: {
          'x-correlation-id': correlationId,
        },
        timeout: 10000, // 10s timeout (chaos puede tener 5s delay)
      }
    );

    return {
      authId: response.data.authId,
      amount: response.data.amount,
      currency: response.data.currency,
      status: response.data.status,
      expiresAt: new Date(response.data.expiresAt),
    };
  } catch (error: any) {
    // Log error para debugging
    console.error('Activity: authorizePayment failed', {
      correlationId,
      error: error.response?.data || error.message,
      status: error.response?.status,
    });

    // Propagar error para que Temporal maneje retry
    throw new Error(
      `Payment authorization failed: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Capture Payment (Charge Funds)
 *
 * Captura una autorización previamente creada.
 * Retry policy: 3 retries para errores transitorios
 */
export async function capturePayment(
  input: CapturePaymentInput
): Promise<CapturePaymentResult> {
  const correlationId = Context.current().info.workflowExecution.workflowId;

  console.log('Activity: capturePayment', {
    correlationId,
    authId: input.authId,
  });

  try {
    const response = await axios.post(
      `${FAKE_STRIPE_URL}/payment/capture`,
      {
        authId: input.authId,
      },
      {
        headers: {
          'x-correlation-id': correlationId,
        },
        timeout: 10000,
      }
    );

    return {
      authId: response.data.authId,
      amount: response.data.amount,
      status: response.data.status,
      capturedAt: new Date(response.data.capturedAt),
    };
  } catch (error: any) {
    console.error('Activity: capturePayment failed', {
      correlationId,
      error: error.response?.data || error.message,
    });

    throw new Error(
      `Payment capture failed: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Release Payment (Compensation)
 *
 * Libera una autorización sin capturarla (Saga rollback).
 * Usado cuando: manager rechaza, timeout, o fallo en pasos posteriores.
 */
export async function releasePayment(
  input: ReleasePaymentInput
): Promise<void> {
  const correlationId = Context.current().info.workflowExecution.workflowId;

  console.log('Activity: releasePayment (COMPENSATION)', {
    correlationId,
    authId: input.authId,
  });

  try {
    await axios.post(
      `${FAKE_STRIPE_URL}/payment/release`,
      {
        authId: input.authId,
      },
      {
        headers: {
          'x-correlation-id': correlationId,
        },
        timeout: 10000,
      }
    );

    console.log('Activity: releasePayment completed', { correlationId });
  } catch (error: any) {
    console.error('Activity: releasePayment failed', {
      correlationId,
      error: error.response?.data || error.message,
    });

    // Compensation activities should be idempotent and not fail
    // Si falla, log pero no propagar (already released es OK)
    if (error.response?.status === 409) {
      console.warn('Payment already released - idempotent OK', { correlationId });
      return;
    }

    throw new Error(
      `Payment release failed: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Refund Payment (Compensation)
 *
 * Reembolsa un pago capturado (Saga rollback).
 * Usado cuando: fallo en shipping después de capturar.
 */
export async function refundPayment(input: RefundPaymentInput): Promise<void> {
  const correlationId = Context.current().info.workflowExecution.workflowId;

  console.log('Activity: refundPayment (COMPENSATION)', {
    correlationId,
    authId: input.authId,
    amount: input.amount,
  });

  try {
    await axios.post(
      `${FAKE_STRIPE_URL}/payment/refund`,
      {
        authId: input.authId,
        amount: input.amount,
        reason: input.reason,
      },
      {
        headers: {
          'x-correlation-id': correlationId,
        },
        timeout: 10000,
      }
    );

    console.log('Activity: refundPayment completed', { correlationId });
  } catch (error: any) {
    console.error('Activity: refundPayment failed', {
      correlationId,
      error: error.response?.data || error.message,
    });

    throw new Error(
      `Payment refund failed: ${error.response?.data?.message || error.message}`
    );
  }
}
