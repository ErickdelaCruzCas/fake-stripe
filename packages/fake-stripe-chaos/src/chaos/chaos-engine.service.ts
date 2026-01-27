import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CHAOS_CONFIG } from './chaos.config';

/**
 * Chaos Engine Service
 *
 * Motor de chaos engineering que simula fallos aleatorios en operaciones
 * para testear resiliencia de sistemas distribuidos.
 *
 * Distribución de probabilidades:
 * - 30% Timeout (5 segundos + error 408)
 * - 20% Error 500 (Internal Server Error)
 * - 10% Error 402 (Payment Required - insufficient funds)
 * - 40% Success (operación exitosa)
 *
 * Basado en patrones reales de fallos en producción:
 * - Timeouts: Redes lentas, servicios sobrecargados
 * - 500: Bugs, excepciones no manejadas
 * - 402: Validaciones de negocio (fondos insuficientes)
 */
@Injectable()
export class ChaosEngineService {
  private readonly logger = new Logger('ChaosEngine');

  // Probabilidades de cada escenario (configurables en chaos.config.ts)
  private readonly scenarios = CHAOS_CONFIG.SCENARIOS;

  /**
   * Ejecuta una operación con chaos engineering
   *
   * @param operation - Función a ejecutar si el chaos permite success
   * @param correlationId - Correlation ID para logging
   * @returns Resultado de la operación
   * @throws HttpException según el escenario de chaos seleccionado
   */
  async executeWithChaos<T>(
    operation: () => T | Promise<T>,
    correlationId?: string
  ): Promise<T> {
    const random = Math.random();
    const scenario = this.selectScenario(random);

    this.logger.log(
      JSON.stringify({
        message: 'Chaos scenario selected',
        correlationId,
        scenario,
        random: random.toFixed(4),
      })
    );

    switch (scenario) {
      case 'timeout':
        return this.simulateTimeout(correlationId);

      case 'error500':
        return this.simulateError500(correlationId);

      case 'error402':
        return this.simulateError402(correlationId);

      case 'success':
        // Ejecutar operación normal
        return await Promise.resolve(operation());
    }
  }

  /**
   * Selecciona escenario basado en random number y probabilidades
   */
  private selectScenario(random: number): keyof typeof this.scenarios {
    if (random < 0.30) return 'timeout';           // 0.00 - 0.30
    if (random < 0.50) return 'error500';          // 0.30 - 0.50
    if (random < 0.60) return 'error402';          // 0.50 - 0.60
    return 'success';                              // 0.60 - 1.00
  }

  /**
   * Simula timeout: espera 5s y lanza error 408
   */
  private async simulateTimeout(correlationId?: string): Promise<never> {
    this.logger.warn(
      JSON.stringify({
        message: 'Simulating timeout (5s delay)',
        correlationId,
        scenario: 'timeout',
      })
    );

    // Simular servicio lento (configurado en CHAOS_CONFIG)
    await this.delay(CHAOS_CONFIG.TIMEOUT_DELAY_MS);

    throw new HttpException(
      {
        success: false,
        error: 'timeout',
        message: 'Payment service timeout - request took too long to process',
      },
      HttpStatus.REQUEST_TIMEOUT
    );
  }

  /**
   * Simula error interno del servidor
   */
  private simulateError500(correlationId?: string): never {
    this.logger.warn(
      JSON.stringify({
        message: 'Simulating internal server error',
        correlationId,
        scenario: 'error500',
      })
    );

    throw new HttpException(
      {
        success: false,
        error: 'internal_error',
        message: 'An internal error occurred while processing payment',
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  /**
   * Simula fondos insuficientes (error de negocio)
   */
  private simulateError402(correlationId?: string): never {
    this.logger.warn(
      JSON.stringify({
        message: 'Simulating insufficient funds',
        correlationId,
        scenario: 'error402',
      })
    );

    throw new HttpException(
      {
        success: false,
        error: 'insufficient_funds',
        message: 'The card has insufficient funds to complete this transaction',
      },
      HttpStatus.PAYMENT_REQUIRED
    );
  }

  /**
   * Utility: delay asíncrono
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna estadísticas de distribución configurada
   */
  getDistribution() {
    return {
      timeout: `${this.scenarios.timeout * 100}%`,
      error500: `${this.scenarios.error500 * 100}%`,
      error402: `${this.scenarios.error402 * 100}%`,
      success: `${this.scenarios.success * 100}%`,
    };
  }
}
