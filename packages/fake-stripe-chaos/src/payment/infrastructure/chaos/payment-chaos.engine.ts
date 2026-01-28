import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { BaseChaosEngine, ChaosConfig } from '../../../shared/chaos/base-chaos-engine';

/**
 * Payment Chaos Engine
 *
 * Motor de chaos específico para operaciones de pago.
 * Define escenarios realistas para authorize, capture, release, refund.
 */
@Injectable()
export class PaymentChaosEngine extends BaseChaosEngine {
  protected readonly logger = new Logger('PaymentChaosEngine');

  /**
   * Configuración para AUTHORIZE
   * Escenarios: 40% success, 30% insufficient funds, 20% timeout, 10% error500
   */
  private readonly authorizeConfig: ChaosConfig = {
    scenarios: [
      { name: 'success', probability: 0.4 },
      {
        name: 'insufficient_funds',
        probability: 0.3,
        httpStatus: HttpStatus.PAYMENT_REQUIRED,
        errorCode: 'insufficient_funds',
        message: 'The card has insufficient funds to complete this transaction',
      },
      {
        name: 'timeout',
        probability: 0.2,
        httpStatus: HttpStatus.REQUEST_TIMEOUT,
        errorCode: 'timeout',
        message: 'Payment authorization timeout - bank took too long to respond',
        delayMs: 5000,
      },
      {
        name: 'internal_error',
        probability: 0.1,
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'internal_error',
        message: 'An internal error occurred while authorizing payment',
      },
    ],
  };

  /**
   * Configuración para CAPTURE
   * Escenarios: 70% success, 20% already captured, 10% authorization expired
   */
  private readonly captureConfig: ChaosConfig = {
    scenarios: [
      { name: 'success', probability: 0.7 },
      {
        name: 'already_captured',
        probability: 0.2,
        httpStatus: HttpStatus.CONFLICT,
        errorCode: 'already_captured',
        message: 'This authorization has already been captured',
      },
      {
        name: 'authorization_expired',
        probability: 0.1,
        httpStatus: HttpStatus.GONE,
        errorCode: 'authorization_expired',
        message: 'The authorization has expired and cannot be captured',
      },
    ],
  };

  /**
   * Configuración para RELEASE
   * Escenarios: 85% success, 10% already released, 5% internal error
   */
  private readonly releaseConfig: ChaosConfig = {
    scenarios: [
      { name: 'success', probability: 0.85 },
      {
        name: 'already_released',
        probability: 0.1,
        httpStatus: HttpStatus.CONFLICT,
        errorCode: 'already_released',
        message: 'This authorization has already been released',
      },
      {
        name: 'internal_error',
        probability: 0.05,
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'internal_error',
        message: 'An internal error occurred while releasing authorization',
      },
    ],
  };

  /**
   * Configuración para REFUND
   * Escenarios: 75% success, 15% timeout, 10% internal error
   */
  private readonly refundConfig: ChaosConfig = {
    scenarios: [
      { name: 'success', probability: 0.75 },
      {
        name: 'timeout',
        probability: 0.15,
        httpStatus: HttpStatus.REQUEST_TIMEOUT,
        errorCode: 'timeout',
        message: 'Refund processing timeout - bank took too long to respond',
        delayMs: 4000,
      },
      {
        name: 'internal_error',
        probability: 0.1,
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'internal_error',
        message: 'An internal error occurred while processing refund',
      },
    ],
  };

  protected config: ChaosConfig = this.authorizeConfig;

  /**
   * Ejecuta authorize con chaos
   */
  async executeAuthorize<T>(
    operation: () => T | Promise<T>,
    correlationId?: string
  ): Promise<T> {
    this.config = this.authorizeConfig;
    return this.executeWithChaos(operation, correlationId);
  }

  /**
   * Ejecuta capture con chaos
   */
  async executeCapture<T>(
    operation: () => T | Promise<T>,
    correlationId?: string
  ): Promise<T> {
    this.config = this.captureConfig;
    return this.executeWithChaos(operation, correlationId);
  }

  /**
   * Ejecuta release con chaos
   */
  async executeRelease<T>(
    operation: () => T | Promise<T>,
    correlationId?: string
  ): Promise<T> {
    this.config = this.releaseConfig;
    return this.executeWithChaos(operation, correlationId);
  }

  /**
   * Ejecuta refund con chaos
   */
  async executeRefund<T>(
    operation: () => T | Promise<T>,
    correlationId?: string
  ): Promise<T> {
    this.config = this.refundConfig;
    return this.executeWithChaos(operation, correlationId);
  }

  /**
   * Retorna distribución de todos los escenarios
   */
  getAllDistributions() {
    return {
      authorize: this.authorizeConfig.scenarios.reduce((acc, s) => {
        acc[s.name] = `${(s.probability * 100).toFixed(0)}%`;
        return acc;
      }, {} as Record<string, string>),
      capture: this.captureConfig.scenarios.reduce((acc, s) => {
        acc[s.name] = `${(s.probability * 100).toFixed(0)}%`;
        return acc;
      }, {} as Record<string, string>),
      release: this.releaseConfig.scenarios.reduce((acc, s) => {
        acc[s.name] = `${(s.probability * 100).toFixed(0)}%`;
        return acc;
      }, {} as Record<string, string>),
      refund: this.refundConfig.scenarios.reduce((acc, s) => {
        acc[s.name] = `${(s.probability * 100).toFixed(0)}%`;
        return acc;
      }, {} as Record<string, string>),
    };
  }
}
