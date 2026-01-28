import { Injectable } from '@nestjs/common';
import { InventoryRepositoryPort } from '../../domain/ports/inventory-repository.port';
import { InventoryReservation } from '../../domain/models/inventory-reservation.model';

@Injectable()
export class InMemoryInventoryRepository implements InventoryRepositoryPort {
  private reservations = new Map<string, InventoryReservation>();
  private inventory = new Map<string, number>(); // SKU -> available quantity

  constructor() {
    // Mock inventory inicial
    this.inventory.set('ITEM-001', 100);
    this.inventory.set('ITEM-002', 50);
    this.inventory.set('ITEM-003', 200);
  }

  async saveReservation(reservation: InventoryReservation): Promise<void> {
    this.reservations.set(reservation.reservationId, reservation);

    // Reducir stock disponible
    for (const item of reservation.items) {
      const current = this.inventory.get(item.sku) || 0;
      this.inventory.set(item.sku, current - item.quantity);
    }
  }

  async findReservationById(reservationId: string): Promise<InventoryReservation | null> {
    return this.reservations.get(reservationId) || null;
  }

  async updateReservation(reservation: InventoryReservation): Promise<void> {
    const old = this.reservations.get(reservation.reservationId);
    if (!old) {
      throw new Error(`Reservation not found: ${reservation.reservationId}`);
    }

    this.reservations.set(reservation.reservationId, reservation);

    // Si se libera, devolver stock
    if (reservation.status === 'released' && old.status === 'reserved') {
      for (const item of reservation.items) {
        const current = this.inventory.get(item.sku) || 0;
        this.inventory.set(item.sku, current + item.quantity);
      }
    }
  }

  async checkAvailability(sku: string, quantity: number): Promise<boolean> {
    const available = this.inventory.get(sku) || 0;
    return available >= quantity;
  }
}
