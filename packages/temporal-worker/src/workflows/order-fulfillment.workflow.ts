import {
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  proxyActivities,
  sleep,
  ApplicationFailure,
} from '@temporalio/workflow';
import type * as activities from '../activities';

// Proxy activities con retry policies específicas
const {
  authorizePayment,
  capturePayment,
  releasePayment,
  refundPayment,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30s',
  retry: {
    initialInterval: '1s',
    maximumInterval: '10s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

const { reserveInventory, releaseInventory } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '20s',
  retry: {
    initialInterval: '1s',
    maximumInterval: '8s',
    backoffCoefficient: 2,
    maximumAttempts: 2, // Menos retries porque out-of-stock es permanente
  },
});

const { createShippingLabel, cancelShippingLabel } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '60s', // Operación larga
  heartbeatTimeout: '10s', // Esperamos heartbeat cada 10s
  retry: {
    initialInterval: '2s',
    maximumInterval: '30s',
    backoffCoefficient: 2,
    maximumAttempts: 5, // Más retries porque shipping es crítico
  },
});

const { sendNotification } = proxyActivities<typeof activities>({
  startToCloseTimeout: '15s',
  retry: {
    initialInterval: '1s',
    maximumInterval: '5s',
    backoffCoefficient: 2,
    maximumAttempts: 2, // Pocos retries porque es non-critical
  },
});

/**
 * Order Fulfillment Workflow Input
 */
export interface OrderItem {
  sku: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderFulfillmentInput {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  customerEmail: string;
  requiresApproval?: boolean; // Si true, espera aprobación del manager
}

/**
 * Workflow State (para Queries)
 */
export type OrderStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'shipped'
  | 'failed'
  | 'cancelled';

export interface WorkflowStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'compensated';
  timestamp?: Date;
  data?: any;
  error?: string;
}

export interface OrderState {
  status: OrderStatus;
  progress: number; // 0-100
  currentStep: string;
  completedSteps: WorkflowStep[];
  compensations: WorkflowStep[];
  error?: string;

  // IDs de recursos creados
  authId?: string;
  reservationId?: string;
  labelId?: string;
  trackingNumber?: string;
}

/**
 * Signals
 */
export const approveOrderSignal = defineSignal('approveOrder');
export const rejectOrderSignal = defineSignal('rejectOrder');
export const cancelOrderSignal = defineSignal('cancelOrder');

/**
 * Queries
 */
export const getOrderStatusQuery = defineQuery<OrderState>('getOrderStatus');
export const getProgressQuery = defineQuery<number>('getProgress');

/**
 * Order Fulfillment Workflow
 *
 * Flujo completo de fulfillment con Saga pattern:
 * 1. Authorize Payment (hold funds)
 * 2. Wait for Manager Approval (Signal + Timeout)
 * 3. Reserve Inventory
 * 4. Capture Payment (charge funds)
 * 5. Create Shipping Label (long-running con heartbeat)
 * 6. Send Notification (non-critical)
 *
 * Compensations (Saga rollback):
 * - Si falla en cualquier paso → compensation automático
 * - Manager rechaza → release payment
 * - Timeout (2 min) → release payment
 * - Cancel signal → compensation de todos los pasos completados
 */
export async function orderFulfillmentWorkflow(
  input: OrderFulfillmentInput
): Promise<OrderState> {
  // Estado del workflow (mutable en workflow code)
  const state: OrderState = {
    status: input.requiresApproval ? 'pending_approval' : 'processing',
    progress: 0,
    currentStep: 'initializing',
    completedSteps: [],
    compensations: [],
  };

  // Flags para signals
  let approved = !input.requiresApproval; // Auto-approve si no requiere
  let rejected = false;
  let cancelled = false;

  // Setup signal handlers
  setHandler(approveOrderSignal, () => {
    console.log('Signal received: approveOrder');
    approved = true;
    state.status = 'approved';
  });

  setHandler(rejectOrderSignal, () => {
    console.log('Signal received: rejectOrder');
    rejected = true;
    state.status = 'rejected';
  });

  setHandler(cancelOrderSignal, () => {
    console.log('Signal received: cancelOrder');
    cancelled = true;
    state.status = 'cancelled';
  });

  // Setup query handlers
  setHandler(getOrderStatusQuery, () => state);
  setHandler(getProgressQuery, () => state.progress);

  try {
    // ========================================
    // STEP 1: Authorize Payment (Hold Funds)
    // ========================================
    state.currentStep = 'authorizing_payment';
    state.progress = 10;

    console.log('Workflow: Step 1 - Authorizing payment', {
      orderId: input.orderId,
      amount: input.totalAmount,
    });

    const authResult = await authorizePayment({
      amount: input.totalAmount,
      currency: 'usd',
      orderId: input.orderId,
      customerId: input.customerId,
    });

    state.authId = authResult.authId;
    state.completedSteps.push({
      name: 'payment_authorization',
      status: 'completed',
      timestamp: new Date(),
      data: { authId: authResult.authId, amount: authResult.amount },
    });
    state.progress = 20;

    console.log('Workflow: Payment authorized', { authId: authResult.authId });

    // Check if cancelled
    if (cancelled) {
      throw ApplicationFailure.create({
        message: 'Order cancelled by user',
        type: 'ORDER_CANCELLED',
        nonRetryable: true,
      });
    }

    // ========================================
    // STEP 2: Wait for Manager Approval (if required)
    // ========================================
    if (input.requiresApproval) {
      state.currentStep = 'awaiting_approval';
      state.status = 'pending_approval';
      state.progress = 25;

      console.log('Workflow: Waiting for manager approval (2 min timeout)');

      // Esperar approval signal o timeout (2 minutos)
      const approvalReceived = await condition(
        () => approved || rejected || cancelled,
        '2m'
      );

      if (!approvalReceived) {
        // Timeout - auto-reject
        console.log('Workflow: Approval timeout - auto-rejecting');
        rejected = true;
        state.status = 'rejected';
      }

      if (rejected) {
        console.log('Workflow: Order rejected by manager');
        throw ApplicationFailure.create({
          message: 'Order rejected by manager',
          type: 'ORDER_REJECTED',
          nonRetryable: true,
        });
      }

      if (cancelled) {
        throw ApplicationFailure.create({
          message: 'Order cancelled during approval',
          type: 'ORDER_CANCELLED',
          nonRetryable: true,
        });
      }

      state.completedSteps.push({
        name: 'manager_approval',
        status: 'completed',
        timestamp: new Date(),
        data: { approved: true },
      });
      state.progress = 30;

      console.log('Workflow: Order approved by manager');
    }

    // ========================================
    // STEP 3: Reserve Inventory
    // ========================================
    state.currentStep = 'reserving_inventory';
    state.status = 'processing';
    state.progress = 40;

    console.log('Workflow: Step 3 - Reserving inventory', {
      items: input.items,
    });

    const inventoryResult = await reserveInventory({
      items: input.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
      })),
      orderId: input.orderId,
    });

    state.reservationId = inventoryResult.reservationId;
    state.completedSteps.push({
      name: 'inventory_reservation',
      status: 'completed',
      timestamp: new Date(),
      data: { reservationId: inventoryResult.reservationId },
    });
    state.progress = 50;

    console.log('Workflow: Inventory reserved', {
      reservationId: inventoryResult.reservationId,
    });

    // Check if cancelled
    if (cancelled) {
      throw ApplicationFailure.create({
        message: 'Order cancelled after inventory reservation',
        type: 'ORDER_CANCELLED',
        nonRetryable: true,
      });
    }

    // ========================================
    // STEP 4: Capture Payment (Charge Funds)
    // ========================================
    state.currentStep = 'capturing_payment';
    state.progress = 60;

    console.log('Workflow: Step 4 - Capturing payment');

    const captureResult = await capturePayment({
      authId: authResult.authId,
    });

    state.completedSteps.push({
      name: 'payment_capture',
      status: 'completed',
      timestamp: new Date(),
      data: { authId: captureResult.authId, amount: captureResult.amount },
    });
    state.progress = 70;

    console.log('Workflow: Payment captured', { authId: captureResult.authId });

    // Check if cancelled
    if (cancelled) {
      throw ApplicationFailure.create({
        message: 'Order cancelled after payment capture',
        type: 'ORDER_CANCELLED',
        nonRetryable: true,
      });
    }

    // ========================================
    // STEP 5: Create Shipping Label (Long-Running)
    // ========================================
    state.currentStep = 'creating_shipping_label';
    state.progress = 75;

    console.log('Workflow: Step 5 - Creating shipping label (long-running)');

    const shippingResult = await createShippingLabel({
      shippingAddress: input.shippingAddress,
      carrier: 'UPS',
      orderId: input.orderId,
    });

    state.labelId = shippingResult.labelId;
    state.trackingNumber = shippingResult.trackingNumber;
    state.completedSteps.push({
      name: 'shipping_label',
      status: 'completed',
      timestamp: new Date(),
      data: {
        labelId: shippingResult.labelId,
        trackingNumber: shippingResult.trackingNumber,
      },
    });
    state.progress = 90;

    console.log('Workflow: Shipping label created', {
      labelId: shippingResult.labelId,
      trackingNumber: shippingResult.trackingNumber,
    });

    // ========================================
    // STEP 6: Send Notification (Non-Critical)
    // ========================================
    state.currentStep = 'sending_notification';
    state.progress = 95;

    console.log('Workflow: Step 6 - Sending notification (non-critical)');

    const notificationResult = await sendNotification({
      type: 'email',
      recipient: input.customerEmail,
      subject: `Order ${input.orderId} Shipped!`,
      message: `Your order has shipped! Tracking: ${shippingResult.trackingNumber}`,
      orderId: input.orderId,
    });

    state.completedSteps.push({
      name: 'customer_notification',
      status: notificationResult.status === 'failed' ? 'failed' : 'completed',
      timestamp: new Date(),
      data: { notificationId: notificationResult.notificationId },
    });

    // ========================================
    // SUCCESS - Order Complete
    // ========================================
    state.status = 'shipped';
    state.progress = 100;
    state.currentStep = 'completed';

    console.log('Workflow: Order fulfillment completed successfully', {
      orderId: input.orderId,
      trackingNumber: shippingResult.trackingNumber,
    });

    return state;
  } catch (error: any) {
    // ========================================
    // ERROR HANDLER - Saga Compensation
    // ========================================
    console.error('Workflow: Error occurred, starting compensation', {
      error: error.message,
      type: error.type,
    });

    state.status = 'failed';
    state.error = error.message;

    // Compensar en orden inverso (Saga pattern)
    await compensateOrder(state);

    // Re-throw error después de compensation
    throw error;
  }
}

/**
 * Compensation Logic (Saga Rollback)
 *
 * Ejecuta compensaciones en orden inverso según qué pasos se completaron.
 */
async function compensateOrder(state: OrderState): Promise<void> {
  console.log('Compensation: Starting Saga rollback', {
    completedSteps: state.completedSteps.map((s) => s.name),
  });

  // Determinar qué compensaciones ejecutar basado en pasos completados
  const hasShipping = state.labelId;
  const hasPaymentCapture = state.completedSteps.some(
    (s) => s.name === 'payment_capture'
  );
  const hasInventory = state.reservationId;
  const hasPaymentAuth = state.authId;

  // COMPENSATION 1: Cancel Shipping Label (si fue creado)
  if (hasShipping && state.labelId) {
    try {
      console.log('Compensation: Cancelling shipping label');
      await cancelShippingLabel({ labelId: state.labelId });
      state.compensations.push({
        name: 'cancel_shipping',
        status: 'completed',
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error('Compensation: Failed to cancel shipping', { error });
      state.compensations.push({
        name: 'cancel_shipping',
        status: 'failed',
        error: error.message,
      });
    }
  }

  // COMPENSATION 2: Refund Payment (si fue capturado)
  if (hasPaymentCapture && state.authId) {
    try {
      console.log('Compensation: Refunding payment');
      await refundPayment({
        authId: state.authId,
        reason: `Order fulfillment failed: ${state.error}`,
      });
      state.compensations.push({
        name: 'refund_payment',
        status: 'completed',
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error('Compensation: Failed to refund payment', { error });
      state.compensations.push({
        name: 'refund_payment',
        status: 'failed',
        error: error.message,
      });
    }
  }

  // COMPENSATION 3: Release Inventory (si fue reservado)
  if (hasInventory && state.reservationId) {
    try {
      console.log('Compensation: Releasing inventory');
      await releaseInventory({ reservationId: state.reservationId });
      state.compensations.push({
        name: 'release_inventory',
        status: 'completed',
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error('Compensation: Failed to release inventory', { error });
      state.compensations.push({
        name: 'release_inventory',
        status: 'failed',
        error: error.message,
      });
    }
  }

  // COMPENSATION 4: Release Payment (si fue autorizado pero NO capturado)
  if (hasPaymentAuth && !hasPaymentCapture && state.authId) {
    try {
      console.log('Compensation: Releasing payment authorization');
      await releasePayment({ authId: state.authId });
      state.compensations.push({
        name: 'release_payment',
        status: 'completed',
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error('Compensation: Failed to release payment', { error });
      state.compensations.push({
        name: 'release_payment',
        status: 'failed',
        error: error.message,
      });
    }
  }

  console.log('Compensation: Saga rollback completed', {
    compensations: state.compensations.map((c) => ({
      name: c.name,
      status: c.status,
    })),
  });
}
