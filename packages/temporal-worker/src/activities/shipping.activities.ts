import axios from 'axios';
import { Context } from '@temporalio/activity';

const FAKE_STRIPE_URL = process.env.FAKE_STRIPE_URL || 'http://localhost:3001';

/**
 * Shipping Activities
 *
 * Activities para generar shipping labels (long-running con heartbeat).
 * Create label puede tardar ~20s con progreso incremental.
 */

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface CreateLabelInput {
  shippingAddress: ShippingAddress;
  carrier?: string;
  orderId: string;
}

export interface CreateLabelResult {
  labelId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  labelUrl: string;
}

export interface CancelLabelInput {
  labelId: string;
}

/**
 * Create Shipping Label (Long-Running with Heartbeat)
 *
 * Genera una etiqueta de envío. Operación larga (~20s) con heartbeats cada 5s.
 * Demuestra:
 * - Activity heartbeats para operaciones largas
 * - Progress tracking
 * - Detección de worker crashes
 * - Graceful cancellation
 *
 * Retry policy: 5 retries (shipping es crítico para el negocio)
 */
export async function createShippingLabel(
  input: CreateLabelInput
): Promise<CreateLabelResult> {
  const context = Context.current();
  const correlationId = context.info.workflowExecution.workflowId;

  console.log('Activity: createShippingLabel (LONG-RUNNING)', {
    correlationId,
    orderId: input.orderId,
    carrier: input.carrier,
  });

  // Simular operación larga con heartbeats
  // En producción real, el shipping provider API podría tardar minutos
  const totalSteps = 5;
  for (let step = 1; step <= totalSteps; step++) {
    // Heartbeat con progreso
    // Si el worker crashea, Temporal detectará falta de heartbeat y reintentará
    context.heartbeat({ progress: (step / totalSteps) * 100 });

    console.log('Activity: createShippingLabel progress', {
      correlationId,
      step,
      totalSteps,
      progress: `${((step / totalSteps) * 100).toFixed(0)}%`,
    });

    // Esperar 4s entre heartbeats (en producción sería el tiempo real del proceso)
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  // Después de ~20s de progreso, hacer la llamada real
  try {
    const response = await axios.post(
      `${FAKE_STRIPE_URL}/shipping/create-label`,
      {
        shippingAddress: input.shippingAddress,
        carrier: input.carrier || 'UPS',
        orderId: input.orderId,
      },
      {
        headers: {
          'x-correlation-id': correlationId,
        },
        timeout: 25000, // 25s timeout (operación puede tardar 20s)
      }
    );

    console.log('Activity: createShippingLabel completed', {
      correlationId,
      labelId: response.data.labelId,
      trackingNumber: response.data.trackingNumber,
    });

    return {
      labelId: response.data.labelId,
      trackingNumber: response.data.trackingNumber,
      carrier: response.data.carrier,
      status: response.data.status,
      labelUrl: response.data.labelUrl,
    };
  } catch (error: any) {
    console.error('Activity: createShippingLabel failed', {
      correlationId,
      error: error.response?.data || error.message,
      status: error.response?.status,
    });

    // Address validation failed (400) no debe hacer retry
    if (error.response?.status === 400) {
      throw new Error('ADDRESS_VALIDATION_FAILED: ' + error.response.data.message);
    }

    throw new Error(
      `Shipping label creation failed: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Cancel Shipping Label (Compensation)
 *
 * Cancela una etiqueta de envío (Saga rollback).
 * Usado cuando: fallo en notification o usuario cancela.
 */
export async function cancelShippingLabel(
  input: CancelLabelInput
): Promise<void> {
  const correlationId = Context.current().info.workflowExecution.workflowId;

  console.log('Activity: cancelShippingLabel (COMPENSATION)', {
    correlationId,
    labelId: input.labelId,
  });

  try {
    await axios.post(
      `${FAKE_STRIPE_URL}/shipping/cancel`,
      {
        labelId: input.labelId,
      },
      {
        headers: {
          'x-correlation-id': correlationId,
        },
        timeout: 8000,
      }
    );

    console.log('Activity: cancelShippingLabel completed', { correlationId });
  } catch (error: any) {
    console.error('Activity: cancelShippingLabel failed', {
      correlationId,
      error: error.response?.data || error.message,
    });

    // Idempotent - if already cancelled, OK
    if (error.response?.status === 404 || error.response?.status === 409) {
      console.warn('Shipping label already cancelled - idempotent OK', {
        correlationId,
      });
      return;
    }

    throw new Error(
      `Shipping label cancellation failed: ${error.response?.data?.message || error.message}`
    );
  }
}
