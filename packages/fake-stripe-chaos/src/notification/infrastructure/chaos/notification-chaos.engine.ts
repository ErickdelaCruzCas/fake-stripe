import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { BaseChaosEngine, ChaosConfig } from '../../../shared/chaos/base-chaos-engine';

@Injectable()
export class NotificationChaosEngine extends BaseChaosEngine {
  protected readonly logger = new Logger('NotificationChaosEngine');

  protected readonly config: ChaosConfig = {
    scenarios: [
      { name: 'success', probability: 0.8 },
      {
        name: 'delivery_failed',
        probability: 0.15,
        httpStatus: HttpStatus.BAD_GATEWAY,
        errorCode: 'delivery_failed',
        message: 'Notification delivery failed - temporary email/SMS service issue',
      },
      {
        name: 'invalid_recipient',
        probability: 0.05,
        httpStatus: HttpStatus.BAD_REQUEST,
        errorCode: 'invalid_recipient',
        message: 'Invalid recipient address',
      },
    ],
  };

  async executeSend<T>(
    operation: () => T | Promise<T>,
    correlationId?: string
  ): Promise<T> {
    return this.executeWithChaos(operation, correlationId);
  }
}
