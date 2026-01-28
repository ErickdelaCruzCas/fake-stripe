import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Connection, Client } from '@temporalio/client';
import { CreateOrderDto, CreateOrderResponseDto } from './dto/create-order.dto';

// Import workflow and signal/query definitions
// En producción, estos estarían en un package compartido o generados
const WORKFLOW_TYPE = 'orderFulfillmentWorkflow';
const APPROVE_SIGNAL = 'approveOrder';
const REJECT_SIGNAL = 'rejectOrder';
const CANCEL_SIGNAL = 'cancelOrder';
const STATUS_QUERY = 'getOrderStatus';
const PROGRESS_QUERY = 'getProgress';

/**
 * Order Controller
 *
 * Endpoints para iniciar y controlar Order Fulfillment Workflows.
 * Demuestra todas las features de Temporal: signals, queries, search attributes.
 */
@ApiTags('order-fulfillment')
@Controller('api/v1/order')
export class OrderController {
  private client: Client;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      });

      this.client = new Client({
        connection,
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      });

      console.log('Temporal client initialized for OrderController');
    } catch (error) {
      console.error('Failed to initialize Temporal client:', error);
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Start Order Fulfillment Workflow',
    description: `
      Inicia un workflow completo de fulfillment de pedido.

      Flujo del Workflow:
      1. Authorize Payment (hold funds)
      2. Wait for Manager Approval (if requiresApproval=true, timeout 2 min)
      3. Reserve Inventory
      4. Capture Payment (charge funds)
      5. Create Shipping Label (long-running ~20s with heartbeat)
      6. Send Notification (non-critical)

      Features demostradas:
      - Signals: approve/reject/cancel
      - Queries: status, progress
      - Search Attributes: orderId, customerId, status, amount
      - Activity Heartbeats: shipping label progress
      - Timeouts: approval timeout 2 min
      - Retry Policies: diferentes por dominio
      - Saga Pattern: compensaciones automáticas
      - Cancellation: cleanup graceful

      Usa Temporal UI (http://localhost:8080) para ver ejecución completa.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Order workflow started successfully',
    type: CreateOrderResponseDto,
  })
  async createOrder(@Body() dto: CreateOrderDto): Promise<CreateOrderResponseDto> {
    if (!this.client) {
      throw new HttpException(
        'Temporal client not initialized',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    const workflowId = `order-fulfillment-${dto.orderId}`;

    try {
      const handle = await this.client.workflow.start(WORKFLOW_TYPE, {
        taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'founder-tasks',
        workflowId,
        args: [
          {
            orderId: dto.orderId,
            customerId: dto.customerId,
            items: dto.items,
            totalAmount: dto.totalAmount,
            shippingAddress: dto.shippingAddress,
            customerEmail: dto.customerEmail,
            requiresApproval: dto.requiresApproval || false,
          },
        ],
        // TODO: Search Attributes need to be registered in Temporal first
        // searchAttributes: {
        //   orderId: [dto.orderId],
        //   customerId: [dto.customerId],
        //   orderStatus: [dto.requiresApproval ? 'pending_approval' : 'processing'],
        //   totalAmount: [dto.totalAmount],
        // },
      });

      console.log('Order workflow started', {
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
        orderId: dto.orderId,
      });

      return {
        success: true,
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
        orderId: dto.orderId,
        status: dto.requiresApproval ? 'pending_approval' : 'processing',
      };
    } catch (error: any) {
      console.error('Failed to start order workflow:', error);
      throw new HttpException(
        `Failed to start order workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':workflowId/approve')
  @ApiOperation({
    summary: 'Approve Order (Signal)',
    description: `
      Envía signal de aprobación al workflow.
      Solo aplicable si el pedido requiere aprobación (requiresApproval=true).

      El workflow continuará con inventory reservation → payment capture → shipping.
    `,
  })
  @ApiParam({ name: 'workflowId', example: 'order-fulfillment-ORD-12345' })
  @ApiResponse({
    status: 200,
    description: 'Approval signal sent successfully',
  })
  async approveOrder(@Param('workflowId') workflowId: string) {
    if (!this.client) {
      throw new HttpException(
        'Temporal client not initialized',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    try {
      const handle = this.client.workflow.getHandle(workflowId);
      await handle.signal(APPROVE_SIGNAL);

      console.log('Approval signal sent', { workflowId });

      return {
        success: true,
        message: 'Order approved successfully',
        workflowId,
      };
    } catch (error: any) {
      console.error('Failed to approve order:', error);
      throw new HttpException(
        `Failed to approve order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':workflowId/reject')
  @ApiOperation({
    summary: 'Reject Order (Signal)',
    description: `
      Envía signal de rechazo al workflow.

      Efectos:
      - Workflow termina con error ORDER_REJECTED
      - Se ejecuta compensation: release payment authorization
      - Inventory NO se reserva (rechazo antes de ese paso)
    `,
  })
  @ApiParam({ name: 'workflowId', example: 'order-fulfillment-ORD-12345' })
  @ApiResponse({
    status: 200,
    description: 'Rejection signal sent successfully',
  })
  async rejectOrder(@Param('workflowId') workflowId: string) {
    if (!this.client) {
      throw new HttpException(
        'Temporal client not initialized',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    try {
      const handle = this.client.workflow.getHandle(workflowId);
      await handle.signal(REJECT_SIGNAL);

      console.log('Rejection signal sent', { workflowId });

      return {
        success: true,
        message: 'Order rejected successfully',
        workflowId,
      };
    } catch (error: any) {
      console.error('Failed to reject order:', error);
      throw new HttpException(
        `Failed to reject order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':workflowId/cancel')
  @ApiOperation({
    summary: 'Cancel Order (Signal)',
    description: `
      Envía signal de cancelación al workflow en cualquier momento.

      Efectos:
      - Workflow termina con error ORDER_CANCELLED
      - Se ejecutan compensations de TODOS los pasos completados:
        - Cancel shipping label (si fue creado)
        - Refund payment (si fue capturado)
        - Release inventory (si fue reservado)
        - Release payment (si fue autorizado pero no capturado)

      Demuestra Saga pattern completo.
    `,
  })
  @ApiParam({ name: 'workflowId', example: 'order-fulfillment-ORD-12345' })
  @ApiResponse({
    status: 200,
    description: 'Cancellation signal sent successfully',
  })
  async cancelOrder(@Param('workflowId') workflowId: string) {
    if (!this.client) {
      throw new HttpException(
        'Temporal client not initialized',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    try {
      const handle = this.client.workflow.getHandle(workflowId);
      await handle.signal(CANCEL_SIGNAL);

      console.log('Cancellation signal sent', { workflowId });

      return {
        success: true,
        message: 'Order cancellation initiated',
        workflowId,
      };
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      throw new HttpException(
        `Failed to cancel order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':workflowId/status')
  @ApiOperation({
    summary: 'Get Order Status (Query)',
    description: `
      Obtiene el estado completo del pedido en tiempo real via Query.

      Retorna:
      - status: pending_approval, processing, shipped, failed, cancelled
      - progress: 0-100%
      - currentStep: paso actual en ejecución
      - completedSteps: pasos completados con timestamps
      - compensations: compensaciones ejecutadas (si hubo fallo)
      - error: mensaje de error (si falló)
      - authId, reservationId, labelId, trackingNumber: IDs de recursos

      Queries NO afectan el estado del workflow (read-only).
    `,
  })
  @ApiParam({ name: 'workflowId', example: 'order-fulfillment-ORD-12345' })
  @ApiResponse({
    status: 200,
    description: 'Order status retrieved successfully',
  })
  async getOrderStatus(@Param('workflowId') workflowId: string) {
    if (!this.client) {
      throw new HttpException(
        'Temporal client not initialized',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    try {
      const handle = this.client.workflow.getHandle(workflowId);
      const status: any = await handle.query(STATUS_QUERY);

      return {
        success: true,
        workflowId,
        status: status.status,
        progress: status.progress,
        currentStep: status.currentStep,
        completedSteps: status.completedSteps,
        compensations: status.compensations,
        error: status.error,
        authId: status.authId,
        reservationId: status.reservationId,
        labelId: status.labelId,
        trackingNumber: status.trackingNumber,
      };
    } catch (error: any) {
      console.error('Failed to get order status:', error);
      throw new HttpException(
        `Failed to get order status: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':workflowId/progress')
  @ApiOperation({
    summary: 'Get Order Progress (Query)',
    description: `
      Obtiene el progreso del pedido (0-100%) via Query.

      Útil para progress bars en UI.
    `,
  })
  @ApiParam({ name: 'workflowId', example: 'order-fulfillment-ORD-12345' })
  @ApiResponse({
    status: 200,
    description: 'Progress retrieved successfully',
  })
  async getOrderProgress(@Param('workflowId') workflowId: string) {
    if (!this.client) {
      throw new HttpException(
        'Temporal client not initialized',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    try {
      const handle = this.client.workflow.getHandle(workflowId);
      const progress = await handle.query(PROGRESS_QUERY);

      return {
        success: true,
        workflowId,
        progress,
      };
    } catch (error: any) {
      console.error('Failed to get progress:', error);
      throw new HttpException(
        `Failed to get progress: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get(':workflowId/result')
  @ApiOperation({
    summary: 'Get Order Result (waits for completion)',
    description: `
      Espera a que el workflow termine y retorna el resultado final.

      BLOQUEANTE: Esta llamada esperará hasta que el workflow complete.

      Casos de uso:
      - Tests automatizados
      - Procesos síncronos que necesitan resultado
      - Scripts de admin

      Para tracking en tiempo real, usar /status con polling.
    `,
  })
  @ApiParam({ name: 'workflowId', example: 'order-fulfillment-ORD-12345' })
  @ApiResponse({
    status: 200,
    description: 'Workflow completed successfully',
  })
  async getOrderResult(@Param('workflowId') workflowId: string) {
    if (!this.client) {
      throw new HttpException(
        'Temporal client not initialized',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    try {
      const handle = this.client.workflow.getHandle(workflowId);
      const result = await handle.result();

      return {
        success: true,
        workflowId,
        result,
      };
    } catch (error: any) {
      console.error('Workflow failed:', error);
      throw new HttpException(
        `Workflow failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
