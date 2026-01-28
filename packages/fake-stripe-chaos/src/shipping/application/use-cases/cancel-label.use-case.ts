import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ShippingRepositoryPort } from '../../domain/ports/shipping-repository.port';
import { ShippingChaosEngine } from '../../infrastructure/chaos/shipping-chaos.engine';
import { CancelLabelDto, CancelLabelResponseDto } from '../dto/cancel-label.dto';

@Injectable()
export class CancelLabelUseCase {
  private readonly logger = new Logger('CancelLabelUseCase');

  constructor(
    @Inject('ShippingRepositoryPort')
    private readonly repository: ShippingRepositoryPort,
    private readonly chaosEngine: ShippingChaosEngine
  ) {}

  async execute(
    dto: CancelLabelDto,
    correlationId?: string
  ): Promise<CancelLabelResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Cancelling shipping label',
        correlationId,
        labelId: dto.labelId,
      })
    );

    const label = await this.repository.findLabelById(dto.labelId);
    if (!label) {
      throw new NotFoundException(`Label not found: ${dto.labelId}`);
    }

    if (!label.canBeCancelled()) {
      throw new BadRequestException(`Cannot cancel label in status: ${label.status}`);
    }

    const result = await this.chaosEngine.executeCancel(async () => {
      const cancelled = label.cancel();
      await this.repository.updateLabel(cancelled);
      return cancelled;
    }, correlationId);

    this.logger.log(
      JSON.stringify({
        message: 'Shipping label cancelled successfully',
        correlationId,
        labelId: result.labelId,
      })
    );

    return {
      success: true,
      labelId: result.labelId,
      status: result.status,
      cancelledAt: result.cancelledAt!,
    };
  }
}
