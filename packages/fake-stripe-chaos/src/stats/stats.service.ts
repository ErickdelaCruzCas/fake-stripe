import { Injectable, Logger } from '@nestjs/common';

/**
 * Interface para resultado de request
 */
interface RequestResult {
  success: boolean;
  scenario: 'timeout' | 'error500' | 'error402' | 'success';
  timestamp: Date;
}

/**
 * Stats Service
 *
 * Trackea estadísticas de todos los payment requests para validar
 * que la distribución de chaos engine es correcta.
 *
 * Útil para:
 * - Verificar que los porcentajes coinciden con la configuración
 * - Debugging de problemas de resiliencia
 * - Demos y presentaciones
 */
@Injectable()
export class StatsService {
  private readonly logger = new Logger('Stats');
  // Mutable by design - needs push/reset operations
  private requests: RequestResult[] = [];

  /**
   * Registra resultado de un request
   */
  recordRequest(scenario: RequestResult['scenario'], success: boolean) {
    this.requests.push({
      success,
      scenario,
      timestamp: new Date(),
    });

    this.logger.log(
      JSON.stringify({
        message: 'Request recorded',
        scenario,
        success,
        totalRequests: this.requests.length,
      })
    );
  }

  /**
   * Retorna estadísticas agregadas
   */
  getStats() {
    const total = this.requests.length;

    if (total === 0) {
      return {
        totalRequests: 0,
        successful: 0,
        timeouts: 0,
        errors500: 0,
        errors402: 0,
        successRate: 0,
        distribution: {
          timeout: '0%',
          error500: '0%',
          error402: '0%',
          success: '0%',
        },
      };
    }

    const successful = this.requests.filter((r) => r.success).length;
    const timeouts = this.requests.filter((r) => r.scenario === 'timeout').length;
    const errors500 = this.requests.filter((r) => r.scenario === 'error500').length;
    const errors402 = this.requests.filter((r) => r.scenario === 'error402').length;

    return {
      totalRequests: total,
      successful,
      timeouts,
      errors500,
      errors402,
      successRate: (successful / total).toFixed(2),
      distribution: {
        timeout: `${((timeouts / total) * 100).toFixed(1)}%`,
        error500: `${((errors500 / total) * 100).toFixed(1)}%`,
        error402: `${((errors402 / total) * 100).toFixed(1)}%`,
        success: `${((successful / total) * 100).toFixed(1)}%`,
      },
    };
  }

  /**
   * Resetea estadísticas (útil para testing)
   */
  reset() {
    const previousTotal = this.requests.length;
    this.requests = [];

    this.logger.log(
      JSON.stringify({
        message: 'Stats reset',
        previousTotal,
      })
    );
  }

  /**
   * Retorna últimos N requests
   */
  getRecentRequests(limit: number = 10) {
    return this.requests
      .slice(-limit)
      .reverse()
      .map((r) => ({
        scenario: r.scenario,
        success: r.success,
        timestamp: r.timestamp,
      }));
  }
}
