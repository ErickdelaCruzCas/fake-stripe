import { Injectable } from '@nestjs/common';
import { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';
import { Notification } from '../../domain/models/notification.model';

@Injectable()
export class InMemoryNotificationRepository implements NotificationRepositoryPort {
  private notifications = new Map<string, Notification>();

  async saveNotification(notification: Notification): Promise<void> {
    this.notifications.set(notification.notificationId, notification);
  }

  async findNotificationById(notificationId: string): Promise<Notification | null> {
    return this.notifications.get(notificationId) || null;
  }
}
