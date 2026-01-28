import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { BaseChaosEngine, ChaosConfig } from '../../../shared/chaos/base-chaos-engine';

@Injectable()
export class ShippingChaosEngine extends BaseChaosEngine {
  protected readonly logger = new Logger('ShippingChaosEngine');

  private readonly createConfig: ChaosConfig = {
    scenarios: [
      { name: 'success', probability: 0.6 },
      {
        name: 'address_validation_failed',
        probability: 0.2,
        httpStatus: HttpStatus.BAD_REQUEST,
        errorCode: 'address_validation_failed',
        message: 'Shipping address validation failed - invalid or undeliverable address',
      },
      {
        name: 'timeout',
        probability: 0.1,
        httpStatus: HttpStatus.REQUEST_TIMEOUT,
        errorCode: 'timeout',
        message: 'Shipping label generation timeout',
        delayMs: 20000, // 20s para simular operación larga
      },
      {
        name: 'carrier_error',
        probability: 0.1,
        httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
        errorCode: 'carrier_error',
        message: 'Carrier service unavailable - please try again later',
      },
    ],
  };

  private readonly cancelConfig: ChaosConfig = {
    scenarios: [
      { name: 'success', probability: 0.95 },
      {
        name: 'internal_error',
        probability: 0.05,
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'internal_error',
        message: 'Error cancelling shipping label',
      },
    ],
  };

  protected config: ChaosConfig = this.createConfig;

  async executeCreate<T>(
    operation: () => T | Promise<T>,
    correlationId?: string,
    onProgress?: (percent: number) => void
  ): Promise<T> {
    this.config = this.createConfig;

    // Si hay callback de progreso, simular operación larga con heartbeat
    if (onProgress) {
      // Progreso incremental (0% → 100% en ~20s)
      for (let i = 0; i <= 100; i += 10) {
        await this.delay(2000); // 2s entre heartbeats
        onProgress(i);
        this.logger.log(
          JSON.stringify({
            message: 'Shipping label generation progress',
            correlationId,
            progress: i,
          })
        );
      }
    }

    return this.executeWithChaos(operation, correlationId);
  }

  async executeCancel<T>(
    operation: () => T | Promise<T>,
    correlationId?: string
  ): Promise<T> {
    this.config = this.cancelConfig;
    return this.executeWithChaos(operation, correlationId);
  }
}
