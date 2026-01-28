import { InventoryReservation } from '../models/inventory-reservation.model';

export interface InventoryRepositoryPort {
  saveReservation(reservation: InventoryReservation): Promise<void>;
  findReservationById(reservationId: string): Promise<InventoryReservation | null>;
  updateReservation(reservation: InventoryReservation): Promise<void>;
  checkAvailability(sku: string, quantity: number): Promise<boolean>;
}
