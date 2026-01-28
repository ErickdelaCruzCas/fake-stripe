import { Injectable, Inject, Logger } from '@nestjs/common';
import { ShippingDomainService } from '../../domain/services/shipping-domain.service';
import { ShippingRepositoryPort } from '../../domain/ports/shipping-repository.port';
import { ShippingChaosEngine } from '../../infrastructure/chaos/shipping-chaos.engine';
import { ShippingLabel } from '../../domain/models/shipping-label.model';
import { CreateLabelDto, CreateLabelResponseDto } from '../dto/create-label.dto';

@Injectable()
export class CreateLabelUseCase {
  private readonly logger = new Logger('CreateLabelUseCase');

  constructor(
    private readonly domainService: ShippingDomainService,
    @Inject('ShippingRepositoryPort')
    private readonly repository: ShippingRepositoryPort,
    private readonly chaosEngine: ShippingChaosEngine
  ) {}

  async execute(
    dto: CreateLabelDto,
    correlationId?: string,
    onProgress?: (percent: number) => void
  ): Promise<CreateLabelResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Creating shipping label (long-running with heartbeat)',
        correlationId,
        carrier: dto.carrier,
        orderId: dto.orderId,
      })
    );

    // Validar dirección
    this.domainService.validateAddress(dto.shippingAddress);

    // Ejecutar con chaos (con progreso si hay callback)
    const result = await this.chaosEngine.executeCreate(async () => {
      const label = this.domainService.createLabel(
        dto.shippingAddress,
        dto.carrier,
        dto.orderId
      );

      // Simular generación de label URL
      const labelUrl = `https://shipping.example.com/label/${label.labelId}.pdf`;
      const labelWithUrl = new ShippingLabel(
        label.labelId,
        label.trackingNumber,
        label.carrier,
        'generated',
        label.shippingAddress,
        label.createdAt,
        label.orderId,
        labelUrl
      );

      await this.repository.saveLabel(labelWithUrl);
      return labelWithUrl;
    }, correlationId, onProgress);

    this.logger.log(
      JSON.stringify({
        message: 'Shipping label created successfully',
        correlationId,
        labelId: result.labelId,
        trackingNumber: result.trackingNumber,
      })
    );

    return {
      success: true,
      labelId: result.labelId,
      trackingNumber: result.trackingNumber,
      carrier: result.carrier,
      status: result.status,
      labelUrl: result.labelUrl!,
      createdAt: result.createdAt,
      orderId: result.orderId,
    };
  }
}
