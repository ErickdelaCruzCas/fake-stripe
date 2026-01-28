/**
 * Inventory Reservation Domain Model
 *
 * Representa una reserva de inventario para un pedido.
 */
export class InventoryReservation {
  constructor(
    public readonly reservationId: string,
    public readonly items: InventoryItem[],
    public readonly status: 'reserved' | 'released' | 'expired',
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly orderId?: string,
    public readonly releasedAt?: Date
  ) {}

  isExpired(): boolean {
    return new Date() > this.expiresAt && this.status === 'reserved';
  }

  canBeReleased(): boolean {
    return this.status === 'reserved';
  }

  release(): InventoryReservation {
    if (!this.canBeReleased()) {
      throw new Error(`Cannot release reservation in status: ${this.status}`);
    }

    return new InventoryReservation(
      this.reservationId,
      this.items,
      'released',
      this.createdAt,
      this.expiresAt,
      this.orderId,
      new Date()
    );
  }

  getTotalQuantity(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

export interface InventoryItem {
  sku: string;
  quantity: number;
  warehouseId?: string;
}
