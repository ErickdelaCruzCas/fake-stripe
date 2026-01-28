import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { PaymentChaosEngine } from '../../infrastructure/chaos/payment-chaos.engine';
import { RefundPaymentDto, RefundPaymentResponseDto } from '../dto/refund-payment.dto';

/**
 * Refund Payment Use Case
 *
 * Reembolsa un pago capturado (compensation action en Saga):
 * 1. Busca la autorización
 * 2. Valida que está capturada
 * 3. Crea refund (domain)
 * 4. Ejecuta con chaos
 * 5. Persiste refund
 */
@Injectable()
export class RefundPaymentUseCase {
  private readonly logger = new Logger('RefundPaymentUseCase');

  constructor(
    private readonly domainService: PaymentDomainService,
    @Inject('PaymentRepositoryPort')
    private readonly repository: PaymentRepositoryPort,
    private readonly chaosEngine: PaymentChaosEngine
  ) {}

  async execute(
    dto: RefundPaymentDto,
    correlationId?: string
  ): Promise<RefundPaymentResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Refunding payment',
        correlationId,
        authId: dto.authId,
        amount: dto.amount,
      })
    );

    // Buscar autorización
    const auth = await this.repository.findAuthorizationById(dto.authId);
    if (!auth) {
      throw new NotFoundException(`Authorization not found: ${dto.authId}`);
    }

    // Validar que está capturada
    if (auth.status !== 'captured') {
      throw new BadRequestException(
        `Cannot refund authorization in status: ${auth.status}. Must be captured first.`
      );
    }

    // Determinar monto (full o partial refund)
    const refundAmount = dto.amount || auth.amount;
    if (refundAmount > auth.amount) {
      throw new BadRequestException(
        `Refund amount (${refundAmount}) cannot exceed captured amount (${auth.amount})`
      );
    }

    // Ejecutar con chaos
    const result = await this.chaosEngine.executeRefund(async () => {
      // Crear refund
      const refund = this.domainService.createRefund(
        dto.authId,
        refundAmount,
        auth.currency,
        dto.reason || 'Customer requested refund'
      );

      // Marcar como exitoso
      const succeeded = refund.markSucceeded();

      // Persistir
      await this.repository.saveRefund(succeeded);

      return succeeded;
    }, correlationId);

    this.logger.log(
      JSON.stringify({
        message: 'Payment refunded successfully',
        correlationId,
        refundId: result.refundId,
        authId: result.authId,
      })
    );

    // Mapear a DTO de respuesta
    return {
      success: true,
      refundId: result.refundId,
      authId: result.authId,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      reason: result.reason,
      createdAt: result.createdAt,
    };
  }
}
