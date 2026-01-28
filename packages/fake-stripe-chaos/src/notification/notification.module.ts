import { Module } from '@nestjs/common';
import { NotificationDomainService } from './domain/services/notification-domain.service';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { InMemoryNotificationRepository } from './infrastructure/adapters/in-memory-notification.repository';
import { NotificationChaosEngine } from './infrastructure/chaos/notification-chaos.engine';
import { NotificationController } from './presentation/notification.controller';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationDomainService,
    SendNotificationUseCase,
    {
      provide: 'NotificationRepositoryPort',
      useClass: InMemoryNotificationRepository,
    },
    NotificationChaosEngine,
  ],
  exports: [SendNotificationUseCase],
})
export class NotificationModule {}
