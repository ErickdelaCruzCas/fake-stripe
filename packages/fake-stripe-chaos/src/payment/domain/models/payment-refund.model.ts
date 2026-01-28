/**
 * Payment Refund Domain Model
 *
 * Representa un reembolso de un pago capturado.
 */
export class PaymentRefund {
  constructor(
    public readonly refundId: string,
    public readonly authId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: 'pending' | 'succeeded' | 'failed',
    public readonly reason: string,
    public readonly createdAt: Date,
    public readonly processedAt?: Date
  ) {}

  /**
   * Marca el reembolso como exitoso
   */
  markSucceeded(): PaymentRefund {
    return new PaymentRefund(
      this.refundId,
      this.authId,
      this.amount,
      this.currency,
      'succeeded',
      this.reason,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Marca el reembolso como fallido
   */
  markFailed(): PaymentRefund {
    return new PaymentRefund(
      this.refundId,
      this.authId,
      this.amount,
      this.currency,
      'failed',
      this.reason,
      this.createdAt,
      new Date()
    );
  }
}
