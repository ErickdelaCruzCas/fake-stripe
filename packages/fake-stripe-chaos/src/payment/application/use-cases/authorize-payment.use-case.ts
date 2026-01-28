import { Injectable, Inject, Logger } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/services/payment-domain.service';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { PaymentChaosEngine } from '../../infrastructure/chaos/payment-chaos.engine';
import { AuthorizePaymentDto, AuthorizePaymentResponseDto } from '../dto/authorize-payment.dto';

/**
 * Authorize Payment Use Case
 *
 * Orquesta la autorización de un pago:
 * 1. Valida datos
 * 2. Crea autorización (domain)
 * 3. Ejecuta con chaos engineering
 * 4. Persiste en repositorio
 */
@Injectable()
export class AuthorizePaymentUseCase {
  private readonly logger = new Logger('AuthorizePaymentUseCase');

  constructor(
    private readonly domainService: PaymentDomainService,
    @Inject('PaymentRepositoryPort')
    private readonly repository: PaymentRepositoryPort,
    private readonly chaosEngine: PaymentChaosEngine
  ) {}

  async execute(
    dto: AuthorizePaymentDto,
    correlationId?: string
  ): Promise<AuthorizePaymentResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Authorizing payment',
        correlationId,
        amount: dto.amount,
        currency: dto.currency,
        orderId: dto.orderId,
      })
    );

    // Validar con domain service
    this.domainService.validateAmount(dto.amount);
    this.domainService.validateCurrency(dto.currency);

    // Ejecutar con chaos
    const result = await this.chaosEngine.executeAuthorize(async () => {
      // Crear autorización
      const auth = this.domainService.createAuthorization(
        dto.amount,
        dto.currency,
        dto.orderId,
        dto.customerId
      );

      // Persistir
      await this.repository.saveAuthorization(auth);

      return auth;
    }, correlationId);

    this.logger.log(
      JSON.stringify({
        message: 'Payment authorized successfully',
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
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
      orderId: result.orderId,
      customerId: result.customerId,
    };
  }
}
