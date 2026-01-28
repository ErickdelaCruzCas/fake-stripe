import { Injectable, Inject, Logger } from '@nestjs/common';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';
import { NotificationChaosEngine } from '../../infrastructure/chaos/notification-chaos.engine';
import { SendNotificationDto, SendNotificationResponseDto } from '../dto/send-notification.dto';

@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger('SendNotificationUseCase');

  constructor(
    private readonly domainService: NotificationDomainService,
    @Inject('NotificationRepositoryPort')
    private readonly repository: NotificationRepositoryPort,
    private readonly chaosEngine: NotificationChaosEngine
  ) {}

  async execute(
    dto: SendNotificationDto,
    correlationId?: string
  ): Promise<SendNotificationResponseDto> {
    this.logger.log(
      JSON.stringify({
        message: 'Sending notification',
        correlationId,
        type: dto.type,
        recipient: dto.recipient,
        orderId: dto.orderId,
      })
    );

    // Validar recipient
    this.domainService.validateRecipient(dto.type, dto.recipient);

    // Ejecutar con chaos
    const result = await this.chaosEngine.executeSend(async () => {
      const notification = this.domainService.createNotification(
        dto.type,
        dto.recipient,
        dto.subject,
        dto.message,
        dto.orderId
      );

      const sent = notification.markSent();
      await this.repository.saveNotification(sent);
      return sent;
    }, correlationId);

    this.logger.log(
      JSON.stringify({
        message: 'Notification sent successfully',
        correlationId,
        notificationId: result.notificationId,
      })
    );

    return {
      success: true,
      notificationId: result.notificationId,
      type: result.type,
      recipient: result.recipient,
      status: result.status,
      sentAt: result.sentAt!,
      orderId: result.orderId,
    };
  }
}
