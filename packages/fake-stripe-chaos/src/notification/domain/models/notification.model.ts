/**
 * Notification Domain Model
 */
export class Notification {
  constructor(
    public readonly notificationId: string,
    public readonly type: 'email' | 'sms' | 'push',
    public readonly recipient: string,
    public readonly subject: string,
    public readonly message: string,
    public readonly status: 'pending' | 'sent' | 'failed',
    public readonly createdAt: Date,
    public readonly orderId?: string,
    public readonly sentAt?: Date,
    public readonly failureReason?: string
  ) {}

  markSent(): Notification {
    return new Notification(
      this.notificationId,
      this.type,
      this.recipient,
      this.subject,
      this.message,
      'sent',
      this.createdAt,
      this.orderId,
      new Date()
    );
  }

  markFailed(reason: string): Notification {
    return new Notification(
      this.notificationId,
      this.type,
      this.recipient,
      this.subject,
      this.message,
      'failed',
      this.createdAt,
      this.orderId,
      undefined,
      reason
    );
  }
}
