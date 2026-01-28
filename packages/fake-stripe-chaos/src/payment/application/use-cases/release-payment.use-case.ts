import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { PaymentChaosEngine } from '../../infrastructure/chaos/payment-chaos.engine';
import { ReleasePaymentDto, ReleasePaymentResponseDto } from '../dto/release-payment.dto';

/**
 * Release Payment Use Case
 *
 * Libera una autorización de pago (compensation action en Saga):
 * 1. Busca la autorización
 * 2. Valida que puede ser liberada
 * 3. Ejecuta release con chaos
 * 4. Actualiza en repositorio
 */
@Injectable()
export class ReleasePaymentUseCase {
  private readonly logger = new Logger('ReleasePaymentUseCase');

  constructor(
    @Inject('PaymentRepositoryPort')
    private readonly repository: PaymentRepositoryPort,
    private readonly chaosEngine: PaymentChaosEngine
  ) {}

  async execute(
    dto: ReleasePaymentDto,
    correlationId?: string
  ): Promise<ReleasePaymentResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Releasing payment authorization',
        correlationId,
        authId: dto.authId,
      })
    );

    // Buscar autorización
    const auth = await this.repository.findAuthorizationById(dto.authId);
    if (!auth) {
      throw new NotFoundException(`Authorization not found: ${dto.authId}`);
    }

    // Validar que puede ser liberada
    if (!auth.canBeReleased()) {
      throw new BadRequestException(
        `Cannot release authorization in status: ${auth.status}`
      );
    }

    // Ejecutar con chaos
    const result = await this.chaosEngine.executeRelease(async () => {
      // Release (domain logic)
      const released = auth.release();

      // Actualizar en repositorio
      await this.repository.updateAuthorization(released);

      return released;
    }, correlationId);

    this.logger.log(
      JSON.stringify({
        message: 'Payment authorization released successfully',
        correlationId,
        authId: result.authId,
      })
    );

    // Mapear a DTO de respuesta
    return {
      success: true,
      authId: result.authId,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      releasedAt: result.releasedAt!,
    };
  }
}
