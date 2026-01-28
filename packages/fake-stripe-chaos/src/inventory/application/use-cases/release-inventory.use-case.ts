import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryRepositoryPort } from '../../domain/ports/inventory-repository.port';
import { InventoryChaosEngine } from '../../infrastructure/chaos/inventory-chaos.engine';
import { ReleaseInventoryDto, ReleaseInventoryResponseDto } from '../dto/release-inventory.dto';

@Injectable()
export class ReleaseInventoryUseCase {
  private readonly logger = new Logger('ReleaseInventoryUseCase');

  constructor(
    @Inject('InventoryRepositoryPort')
    private readonly repository: InventoryRepositoryPort,
    private readonly chaosEngine: InventoryChaosEngine
  ) {}

  async execute(
    dto: ReleaseInventoryDto,
    correlationId?: string
  ): Promise<ReleaseInventoryResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Releasing inventory reservation',
        correlationId,
        reservationId: dto.reservationId,
      })
    );

    const reservation = await this.repository.findReservationById(dto.reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation not found: ${dto.reservationId}`);
    }

    if (!reservation.canBeReleased()) {
      throw new BadRequestException(`Cannot release reservation in status: ${reservation.status}`);
    }

    const result = await this.chaosEngine.executeRelease(async () => {
      const released = reservation.release();
      await this.repository.updateReservation(released);
      return released;
    }, correlationId);

    this.logger.log(
      JSON.stringify({
        message: 'Inventory reservation released successfully',
        correlationId,
        reservationId: result.reservationId,
      })
    );

    return {
      success: true,
      reservationId: result.reservationId,
      status: result.status,
      releasedAt: result.releasedAt!,
    };
  }
}
