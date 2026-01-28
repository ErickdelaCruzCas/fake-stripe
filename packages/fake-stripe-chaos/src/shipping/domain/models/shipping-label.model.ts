/**
 * Shipping Label Domain Model
 */
export class ShippingLabel {
  constructor(
    public readonly labelId: string,
    public readonly trackingNumber: string,
    public readonly carrier: string,
    public readonly status: 'pending' | 'generated' | 'cancelled' | 'failed',
    public readonly shippingAddress: ShippingAddress,
    public readonly createdAt: Date,
    public readonly orderId?: string,
    public readonly labelUrl?: string,
    public readonly cancelledAt?: Date
  ) {}

  canBeCancelled(): boolean {
    return this.status === 'generated' || this.status === 'pending';
  }

  cancel(): ShippingLabel {
    if (!this.canBeCancelled()) {
      throw new Error(`Cannot cancel label in status: ${this.status}`);
    }

    return new ShippingLabel(
      this.labelId,
      this.trackingNumber,
      this.carrier,
      'cancelled',
      this.shippingAddress,
      this.createdAt,
      this.orderId,
      this.labelUrl,
      new Date()
    );
  }
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
