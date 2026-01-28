/**
 * Payment Authorization Domain Model
 *
 * Representa una autorización de pago (hold de fondos).
 * En sistemas reales (Stripe, PayPal), esto reserva fondos
 * sin capturarlos inmediatamente.
 */
export class PaymentAuthorization {
  constructor(
    public readonly authId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: 'authorized' | 'captured' | 'released' | 'expired',
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly orderId?: string,
    public readonly customerId?: string,
    public readonly capturedAt?: Date,
    public readonly releasedAt?: Date
  ) {}

  /**
   * Verifica si la autorización está expirada
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt && this.status === 'authorized';
  }

  /**
   * Verifica si la autorización puede ser capturada
   */
  canBeCaptured(): boolean {
    return this.status === 'authorized' && !this.isExpired();
  }

  /**
   * Verifica si la autorización puede ser liberada
   */
  canBeReleased(): boolean {
    return this.status === 'authorized';
  }

  /**
   * Marca la autorización como capturada
   */
  capture(): PaymentAuthorization {
    if (!this.canBeCaptured()) {
      throw new Error(`Cannot capture authorization in status: ${this.status}`);
    }

    return new PaymentAuthorization(
      this.authId,
      this.amount,
      this.currency,
      'captured',
      this.createdAt,
      this.expiresAt,
      this.orderId,
      this.customerId,
      new Date()
    );
  }

  /**
   * Marca la autorización como liberada
   */
  release(): PaymentAuthorization {
    if (!this.canBeReleased()) {
      throw new Error(`Cannot release authorization in status: ${this.status}`);
    }

    return new PaymentAuthorization(
      this.authId,
      this.amount,
      this.currency,
      'released',
      this.createdAt,
      this.expiresAt,
      this.orderId,
      this.customerId,
      this.capturedAt,
      new Date()
    );
  }
}
