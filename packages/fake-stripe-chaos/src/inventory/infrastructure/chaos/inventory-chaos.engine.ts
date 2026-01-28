import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { BaseChaosEngine, ChaosConfig } from '../../../shared/chaos/base-chaos-engine';

@Injectable()
export class InventoryChaosEngine extends BaseChaosEngine {
  protected readonly logger = new Logger('InventoryChaosEngine');

  private readonly reserveConfig: ChaosConfig = {
    scenarios: [
      { name: 'success', probability: 0.5 },
      {
        name: 'out_of_stock',
        probability: 0.3,
        httpStatus: HttpStatus.CONFLICT,
        errorCode: 'out_of_stock',
        message: 'One or more items are out of stock',
      },
      {
        name: 'timeout',
        probability: 0.1,
        httpStatus: HttpStatus.REQUEST_TIMEOUT,
        errorCode: 'timeout',
        message: 'Inventory system timeout',
        delayMs: 4000,
      },
      {
        name: 'internal_error',
        probability: 0.1,
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'internal_error',
        message: 'Inventory system error',
      },
    ],
  };

  private readonly releaseConfig: ChaosConfig = {
    scenarios: [
      { name: 'success', probability: 0.9 },
      {
        name: 'internal_error',
        probability: 0.1,
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'internal_error',
        message: 'Error releasing inventory reservation',
      },
    ],
  };

  protected config: ChaosConfig = this.reserveConfig;

  async executeReserve<T>(
    operation: () => T | Promise<T>,
    correlationId?: string
  ): Promise<T> {
    this.config = this.reserveConfig;
    return this.executeWithChaos(operation, correlationId);
  }

  async executeRelease<T>(
    operation: () => T | Promise<T>,
    correlationId?: string
  ): Promise<T> {
    this.config = this.releaseConfig;
    return this.executeWithChaos(operation, correlationId);
  }
}
