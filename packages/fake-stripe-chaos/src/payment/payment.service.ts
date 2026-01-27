import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChaosEngineService } from '../chaos/chaos-engine.service';
import { StatsService } from '../stats/stats.service';
import { ChargeDto } from './dto/charge.dto';
import { ChargeResponseDto } from './dto/charge-response.dto';

/**
 * Payment Service
 *
 * Simula procesamiento de pagos con Chaos Engineering.
 *
 * En un sistema real, este servicio:
 * - Llamaría a un payment processor (Stripe, PayPal, etc.)
 * - Validaría tarjetas de crédito
 * - Guardaría transacciones en base de datos
 * - Enviaría webhooks
 *
 * Aquí simulamos el procesamiento con chaos engineering para
 * testear resiliencia del sistema.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger('PaymentService');

  constructor(
    private readonly chaosEngine: ChaosEngineService,
    private readonly statsService: StatsService
  ) {}

  /**
   * Procesa un cargo con chaos engineering
   *
   * @param chargeDto - Datos del cargo a procesar
   * @param correlationId - Correlation ID para tracing
   * @returns ChargeResponseDto si exitoso
   * @throws HttpException si falla (timeout, 500, 402)
   */
  async charge(
    chargeDto: ChargeDto,
    correlationId?: string
  ): Promise<ChargeResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Processing payment charge',
        correlationId,
        amount: chargeDto.amount,
        currency: chargeDto.currency,
      })
    );

    try {
      // Ejecutar con chaos engineering
      const result = await this.chaosEngine.executeWithChaos(
        () => this.processCharge(chargeDto),
        correlationId
      );

      // Registrar success en stats
      this.statsService.recordRequest('success', true);

      this.logger.log(
        JSON.stringify({
          message: 'Payment charge succeeded',
          correlationId,
          chargeId: result.chargeId,
        })
      );

      return result;
    } catch (error: any) {
      // Determinar tipo de error para stats
      const scenario =
        error?.status === 408
          ? 'timeout'
          : error?.status === 500
          ? 'error500'
          : error?.status === 402
          ? 'error402'
          : 'error500';

      this.statsService.recordRequest(scenario, false);

      this.logger.error(
        JSON.stringify({
          message: 'Payment charge failed',
          correlationId,
          error: error?.message || 'Unknown error',
          status: error?.status || 500,
        })
      );

      throw error;
    }
  }

  /**
   * Procesa el cargo (simulado)
   *
   * En producción, aquí llamaríamos a Stripe/PayPal/etc.
   */
  private processCharge(chargeDto: ChargeDto): ChargeResponseDto {
    const chargeId = `ch_${uuidv4().replace(/-/g, '').substring(0, 24)}`;

    return {
      success: true,
      chargeId,
      amount: chargeDto.amount,
      currency: chargeDto.currency,
      status: 'succeeded',
      createdAt: new Date(),
      description: chargeDto.description,
    };
  }
}
