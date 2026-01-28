import { Module } from '@nestjs/common';
import { ShippingDomainService } from './domain/services/shipping-domain.service';
import { CreateLabelUseCase } from './application/use-cases/create-label.use-case';
import { CancelLabelUseCase } from './application/use-cases/cancel-label.use-case';
import { InMemoryShippingRepository } from './infrastructure/adapters/in-memory-shipping.repository';
import { ShippingChaosEngine } from './infrastructure/chaos/shipping-chaos.engine';
import { ShippingController } from './presentation/shipping.controller';

@Module({
  controllers: [ShippingController],
  providers: [
    ShippingDomainService,
    CreateLabelUseCase,
    CancelLabelUseCase,
    {
      provide: 'ShippingRepositoryPort',
      useClass: InMemoryShippingRepository,
    },
    ShippingChaosEngine,
  ],
  exports: [CreateLabelUseCase, CancelLabelUseCase],
})
export class ShippingModule {}
