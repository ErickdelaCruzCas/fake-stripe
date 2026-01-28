import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { PaymentChaosEngine } from '../../infrastructure/chaos/payment-chaos.engine';
import { CapturePaymentDto, CapturePaymentResponseDto } from '../dto/capture-payment.dto';

/**
 * Capture Payment Use Case
 *
 * Captura una autorización de pago previamente creada:
 * 1. Busca la autorización
 * 2. Valida que puede ser capturada
 * 3. Ejecuta captura con chaos
 * 4. Actualiza en repositorio
 */
@Injectable()
export class CapturePaymentUseCase {
  private readonly logger = new Logger('CapturePaymentUseCase');

  constructor(
    @Inject('PaymentRepositoryPort')
    private readonly repository: PaymentRepositoryPort,
    private readonly chaosEngine: PaymentChaosEngine
  ) {}

  async execute(
    dto: CapturePaymentDto,
    correlationId?: string
  ): Promise<CapturePaymentResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Capturing payment',
        correlationId,
        authId: dto.authId,
      })
    );

    // Buscar autorización
    const auth = await this.repository.findAuthorizationById(dto.authId);
    if (!auth) {
      throw new NotFoundException(`Authorization not found: ${dto.authId}`);
    }

    // Validar que puede ser capturada
    if (!auth.canBeCaptured()) {
      throw new BadRequestException(
        `Cannot capture authorization in status: ${auth.status}. ` +
        `Expired: ${auth.isExpired()}`
      );
    }

    // Ejecutar con chaos
    const result = await this.chaosEngine.executeCapture(async () => {
      // Capturar (domain logic)
      const captured = auth.capture();

      // Actualizar en repositorio
      await this.repository.updateAuthorization(captured);

      return captured;
    }, correlationId);

    this.logger.log(
      JSON.stringify({
        message: 'Payment captured successfully',
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
      capturedAt: result.capturedAt!,
    };
  }
}
