import { Notification } from '../models/notification.model';

export interface NotificationRepositoryPort {
  saveNotification(notification: Notification): Promise<void>;
  findNotificationById(notificationId: string): Promise<Notification | null>;
}
