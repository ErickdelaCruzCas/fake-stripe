import { Injectable, Inject, Logger, ConflictException } from '@nestjs/common';
import { InventoryDomainService } from '../../domain/services/inventory-domain.service';
import { InventoryRepositoryPort } from '../../domain/ports/inventory-repository.port';
import { InventoryChaosEngine } from '../../infrastructure/chaos/inventory-chaos.engine';
import { ReserveInventoryDto, ReserveInventoryResponseDto } from '../dto/reserve-inventory.dto';

@Injectable()
export class ReserveInventoryUseCase {
  private readonly logger = new Logger('ReserveInventoryUseCase');

  constructor(
    private readonly domainService: InventoryDomainService,
    @Inject('InventoryRepositoryPort')
    private readonly repository: InventoryRepositoryPort,
    private readonly chaosEngine: InventoryChaosEngine
  ) {}

  async execute(
    dto: ReserveInventoryDto,
    correlationId?: string
  ): Promise<ReserveInventoryResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Reserving inventory',
        correlationId,
        items: dto.items,
        orderId: dto.orderId,
      })
    );

    // Validar items
    this.domainService.validateItems(dto.items);

    // Verificar disponibilidad (antes de chaos)
    for (const item of dto.items) {
      const available = await this.repository.checkAvailability(item.sku, item.quantity);
      if (!available) {
        throw new ConflictException(`Item ${item.sku} is out of stock or insufficient quantity`);
      }
    }

    // Ejecutar con chaos
    const result = await this.chaosEngine.executeReserve(async () => {
      const reservation = this.domainService.createReservation(dto.items, dto.orderId);
      await this.repository.saveReservation(reservation);
      return reservation;
    }, correlationId);

    this.logger.log(
      JSON.stringify({
        message: 'Inventory reserved successfully',
        correlationId,
        reservationId: result.reservationId,
      })
    );

    return {
      success: true,
      reservationId: result.reservationId,
      items: result.items,
      status: result.status,
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
      orderId: result.orderId,
    };
  }
}
