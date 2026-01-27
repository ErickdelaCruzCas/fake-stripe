import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Connection, Client, WorkflowHandle } from '@temporalio/client';

@Injectable()
export class WorkflowService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkflowService.name);
  private connection!: Connection;
  private client!: Client;
  private readonly taskQueue: string;

  constructor() {
    this.taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'founder-tasks';
  }

  async onModuleInit() {
    const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
    const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

    this.logger.log(`Connecting to Temporal at ${temporalAddress}`);

    this.connection = await Connection.connect({
      address: temporalAddress,
    });

    this.client = new Client({
      connection: this.connection,
      namespace,
    });

    this.logger.log('Connected to Temporal Server');
  }

  async onModuleDestroy() {
    await this.connection.close();
    this.logger.log('Closed Temporal connection');
  }

  /**
   * Start User Context Workflow
   */
  async startUserContextWorkflow(
    correlationId: string,
    strategy: 'parallel' | 'sequential' = 'parallel'
  ): Promise<string> {
    const workflowId = `user-context-${correlationId}`;

    const handle = await this.client.workflow.start('userContextWorkflow', {
      taskQueue: this.taskQueue,
      args: [correlationId, strategy],
      workflowId,
      workflowExecutionTimeout: '5 minutes',
    });

    this.logger.log(`Started workflow: ${workflowId}`);
    return handle.workflowId;
  }

  /**
   * Start Payment Workflow
   */
  async startPaymentWorkflow(
    charge: {
      amount: number;
      currency: string;
      source: string;
      description?: string;
    },
    correlationId: string
  ): Promise<string> {
    const workflowId = `payment-${correlationId}`;

    const handle = await this.client.workflow.start('paymentWorkflow', {
      taskQueue: this.taskQueue,
      args: [charge, correlationId],
      workflowId,
      workflowExecutionTimeout: '10 minutes',
    });

    this.logger.log(`Started payment workflow: ${workflowId}`);
    return handle.workflowId;
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<any> {
    const handle = this.client.workflow.getHandle(workflowId);
    const description = await handle.describe();

    return {
      workflowId,
      runId: description.runId,
      status: description.status.name,
      startTime: description.startTime,
      closeTime: description.closeTime,
      executionTime: description.closeTime
        ? new Date(description.closeTime).getTime() -
          new Date(description.startTime).getTime()
        : null,
    };
  }

  /**
   * Query workflow progress
   */
  async getWorkflowProgress(workflowId: string, queryName: string = 'progress'): Promise<any> {
    const handle = this.client.workflow.getHandle(workflowId);
    const progress = await handle.query(queryName);
    return progress;
  }

  /**
   * Get workflow result
   */
  async getWorkflowResult(workflowId: string): Promise<any> {
    const handle = this.client.workflow.getHandle(workflowId);
    try {
      const result = await handle.result();
      return result;
    } catch (error) {
      // Workflow might still be running or failed
      throw error;
    }
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(workflowId: string, signalName: string = 'cancel'): Promise<void> {
    const handle = this.client.workflow.getHandle(workflowId);
    await handle.signal(signalName);
    this.logger.log(`Sent cancel signal to workflow: ${workflowId}`);
  }

  /**
   * Get workflow history (for debugging)
   */
  async getWorkflowHistory(workflowId: string): Promise<any[]> {
    const handle = this.client.workflow.getHandle(workflowId);
    const historyResult = await handle.fetchHistory();
    const history = [];

    if (historyResult && historyResult.events) {
      for (const event of historyResult.events) {
        history.push({
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.eventTime,
        });
      }
    }

    return history;
  }
}
