import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Notification } from '../models/notification.model';

@Injectable()
export class NotificationDomainService {
  createNotification(
    type: 'email' | 'sms' | 'push',
    recipient: string,
    subject: string,
    message: string,
    orderId?: string
  ): Notification {
    const notificationId = `ntf_${uuidv4().replace(/-/g, '').substring(0, 24)}`;

    return new Notification(
      notificationId,
      type,
      recipient,
      subject,
      message,
      'pending',
      new Date(),
      orderId
    );
  }

  validateRecipient(type: 'email' | 'sms' | 'push', recipient: string): void {
    if (!recipient) {
      throw new Error('Recipient is required');
    }

    if (type === 'email' && !recipient.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (type === 'sms' && recipient.length < 10) {
      throw new Error('Invalid phone number');
    }
  }
}
