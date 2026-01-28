import { Logger, HttpException, HttpStatus } from '@nestjs/common';

export interface ChaosScenario {
  name: string;
  probability: number;
  httpStatus?: number;
  errorCode?: string;
  message?: string;
  delayMs?: number;
}

export interface ChaosConfig {
  scenarios: ChaosScenario[];
}

/**
 * Base Chaos Engine
 *
 * Motor de chaos engineering configurable que puede ser extendido
 * por cada dominio con sus propios escenarios específicos.
 */
export abstract class BaseChaosEngine {
  protected abstract readonly logger: Logger;
  protected abstract readonly config: ChaosConfig;

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
        scenario: scenario.name,
        random: random.toFixed(4),
      })
    );

    // Si es success, ejecutar operación
    if (scenario.name === 'success') {
      return await Promise.resolve(operation());
    }

    // Aplicar delay si existe
    if (scenario.delayMs) {
      await this.delay(scenario.delayMs);
    }

    // Lanzar error
    this.logger.warn(
      JSON.stringify({
        message: `Simulating ${scenario.name}`,
        correlationId,
        scenario: scenario.name,
      })
    );

    throw new HttpException(
      {
        success: false,
        error: scenario.errorCode || scenario.name,
        message: scenario.message || `Simulated ${scenario.name}`,
      },
      scenario.httpStatus || HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  /**
   * Selecciona escenario basado en random number y probabilidades
   */
  private selectScenario(random: number): ChaosScenario {
    let cumulativeProbability = 0;

    for (const scenario of this.config.scenarios) {
      cumulativeProbability += scenario.probability;
      if (random < cumulativeProbability) {
        return scenario;
      }
    }

    // Fallback a success
    return this.config.scenarios.find((s) => s.name === 'success') || this.config.scenarios[0];
  }

  /**
   * Utility: delay asíncrono
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna estadísticas de distribución configurada
   */
  getDistribution() {
    return this.config.scenarios.reduce((acc, scenario) => {
      acc[scenario.name] = `${(scenario.probability * 100).toFixed(0)}%`;
      return acc;
    }, {} as Record<string, string>);
  }
}
