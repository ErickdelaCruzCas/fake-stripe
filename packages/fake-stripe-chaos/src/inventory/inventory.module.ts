import { Module } from '@nestjs/common';
import { InventoryDomainService } from './domain/services/inventory-domain.service';
import { ReserveInventoryUseCase } from './application/use-cases/reserve-inventory.use-case';
import { ReleaseInventoryUseCase } from './application/use-cases/release-inventory.use-case';
import { InMemoryInventoryRepository } from './infrastructure/adapters/in-memory-inventory.repository';
import { InventoryChaosEngine } from './infrastructure/chaos/inventory-chaos.engine';
import { InventoryController } from './presentation/inventory.controller';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryDomainService,
    ReserveInventoryUseCase,
    ReleaseInventoryUseCase,
    {
      provide: 'InventoryRepositoryPort',
      useClass: InMemoryInventoryRepository,
    },
    InventoryChaosEngine,
  ],
  exports: [ReserveInventoryUseCase, ReleaseInventoryUseCase],
})
export class InventoryModule {}
