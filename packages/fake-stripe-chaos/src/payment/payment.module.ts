import { Module } from '@nestjs/common';

// Domain
import { PaymentDomainService } from './domain/services/payment-domain.service';

// Application - Use Cases
import { AuthorizePaymentUseCase } from './application/use-cases/authorize-payment.use-case';
import { CapturePaymentUseCase } from './application/use-cases/capture-payment.use-case';
import { ReleasePaymentUseCase } from './application/use-cases/release-payment.use-case';
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.use-case';

// Infrastructure
import { InMemoryPaymentRepository } from './infrastructure/adapters/in-memory-payment.repository';
import { PaymentChaosEngine } from './infrastructure/chaos/payment-chaos.engine';

// Presentation
import { PaymentController } from './presentation/payment.controller';

/**
 * Payment Module
 *
 * Módulo completo de Payment con Hexagonal Architecture:
 * - Domain: Models, Ports, Services (lógica de negocio pura)
 * - Application: Use Cases, DTOs (orquestación)
 * - Infrastructure: Adapters, Chaos (detalles técnicos)
 * - Presentation: Controllers (API REST)
 */
@Module({
  controllers: [PaymentController],
  providers: [
    // Domain Services
    PaymentDomainService,

    // Application Use Cases
    AuthorizePaymentUseCase,
    CapturePaymentUseCase,
    ReleasePaymentUseCase,
    RefundPaymentUseCase,

    // Infrastructure - Repository (DI con interface)
    {
      provide: 'PaymentRepositoryPort',
      useClass: InMemoryPaymentRepository,
    },

    // Infrastructure - Chaos
    PaymentChaosEngine,
  ],
  exports: [
    // Exportar use cases para que otros módulos puedan usarlos si es necesario
    AuthorizePaymentUseCase,
    CapturePaymentUseCase,
    ReleasePaymentUseCase,
    RefundPaymentUseCase,
  ],
})
export class PaymentModule {}
