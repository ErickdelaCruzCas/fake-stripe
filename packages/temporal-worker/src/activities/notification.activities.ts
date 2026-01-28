import axios from 'axios';
import { Context } from '@temporalio/activity';

const FAKE_STRIPE_URL = process.env.FAKE_STRIPE_URL || 'http://localhost:3001';

/**
 * Notification Activities
 *
 * Activities para enviar notificaciones (email, SMS, push).
 * NON-CRITICAL: fallos no disparan Saga rollback.
 */

export interface SendNotificationInput {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject: string;
  message: string;
  orderId: string;
}

export interface SendNotificationResult {
  notificationId: string;
  type: string;
  status: string;
}

/**
 * Send Notification (Non-Critical)
 *
 * Envía una notificación al cliente.
 *
 * IMPORTANTE: Esta activity es NON-CRITICAL
 * - Si falla, se registra el error pero NO se hace rollback del pedido
 * - El pedido continúa como exitoso
 * - Retry policy: 2 retries cortos, luego continuar
 *
 * Casos de uso:
 * - Email de confirmación de pedido
 * - SMS de envío
 * - Push notification de entrega
 */
export async function sendNotification(
  input: SendNotificationInput
): Promise<SendNotificationResult> {
  const correlationId = Context.current().info.workflowExecution.workflowId;

  console.log('Activity: sendNotification (NON-CRITICAL)', {
    correlationId,
    type: input.type,
    recipient: input.recipient,
    orderId: input.orderId,
  });

  try {
    const response = await axios.post(
      `${FAKE_STRIPE_URL}/notification/send`,
      {
        type: input.type,
        recipient: input.recipient,
        subject: input.subject,
        message: input.message,
        orderId: input.orderId,
      },
      {
        headers: {
          'x-correlation-id': correlationId,
        },
        timeout: 8000,
      }
    );

    console.log('Activity: sendNotification completed', {
      correlationId,
      notificationId: response.data.notificationId,
    });

    return {
      notificationId: response.data.notificationId,
      type: response.data.type,
      status: response.data.status,
    };
  } catch (error: any) {
    console.error('Activity: sendNotification failed (NON-CRITICAL)', {
      correlationId,
      error: error.response?.data || error.message,
      status: error.response?.status,
    });

    // Para notification, NO propagamos el error como crítico
    // El workflow puede continuar aunque la notificación falle
    // Retornamos resultado con status failed
    return {
      notificationId: 'failed',
      type: input.type,
      status: 'failed',
    };
  }
}
