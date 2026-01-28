import axios from 'axios';
import { Context } from '@temporalio/activity';

const FAKE_STRIPE_URL = process.env.FAKE_STRIPE_URL || 'http://localhost:3001';

/**
 * Inventory Activities
 *
 * Activities para reservar y liberar inventario.
 * Reservas expiran en 30 minutos.
 */

export interface InventoryItem {
  sku: string;
  quantity: number;
  warehouseId?: string;
}

export interface ReserveInventoryInput {
  items: InventoryItem[];
  orderId: string;
}

export interface ReserveInventoryResult {
  reservationId: string;
  items: InventoryItem[];
  status: string;
  expiresAt: Date;
}

export interface ReleaseInventoryInput {
  reservationId: string;
}

/**
 * Reserve Inventory
 *
 * Reserva items en inventario. Expira en 30 minutos.
 * Retry policy: 2 retries (menos que payment porque out-of-stock es permanente)
 */
export async function reserveInventory(
  input: ReserveInventoryInput
): Promise<ReserveInventoryResult> {
  const correlationId = Context.current().info.workflowExecution.workflowId;

  console.log('Activity: reserveInventory', {
    correlationId,
    items: input.items,
    orderId: input.orderId,
  });

  try {
    const response = await axios.post(
      `${FAKE_STRIPE_URL}/inventory/reserve`,
      {
        items: input.items,
        orderId: input.orderId,
      },
      {
        headers: {
          'x-correlation-id': correlationId,
        },
        timeout: 8000, // 8s timeout (chaos puede tener 4s delay)
      }
    );

    return {
      reservationId: response.data.reservationId,
      items: response.data.items,
      status: response.data.status,
      expiresAt: new Date(response.data.expiresAt),
    };
  } catch (error: any) {
    console.error('Activity: reserveInventory failed', {
      correlationId,
      error: error.response?.data || error.message,
      status: error.response?.status,
    });

    // Out of stock (409) no debe hacer retry
    if (error.response?.status === 409) {
      throw new Error('OUT_OF_STOCK: ' + error.response.data.message);
    }

    throw new Error(
      `Inventory reservation failed: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Release Inventory (Compensation)
 *
 * Libera una reserva de inventario (Saga rollback).
 * Los items vuelven al stock disponible.
 */
export async function releaseInventory(
  input: ReleaseInventoryInput
): Promise<void> {
  const correlationId = Context.current().info.workflowExecution.workflowId;

  console.log('Activity: releaseInventory (COMPENSATION)', {
    correlationId,
    reservationId: input.reservationId,
  });

  try {
    await axios.post(
      `${FAKE_STRIPE_URL}/inventory/release`,
      {
        reservationId: input.reservationId,
      },
      {
        headers: {
          'x-correlation-id': correlationId,
        },
        timeout: 8000,
      }
    );

    console.log('Activity: releaseInventory completed', { correlationId });
  } catch (error: any) {
    console.error('Activity: releaseInventory failed', {
      correlationId,
      error: error.response?.data || error.message,
    });

    // Idempotent - if already released, OK
    if (error.response?.status === 409) {
      console.warn('Inventory already released - idempotent OK', {
        correlationId,
      });
      return;
    }

    throw new Error(
      `Inventory release failed: ${error.response?.data?.message || error.message}`
    );
  }
}
