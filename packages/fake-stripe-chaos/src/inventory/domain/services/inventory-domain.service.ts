import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InventoryReservation, InventoryItem } from '../models/inventory-reservation.model';

@Injectable()
export class InventoryDomainService {
  createReservation(items: InventoryItem[], orderId?: string): InventoryReservation {
    const reservationId = `res_${uuidv4().replace(/-/g, '').substring(0, 24)}`;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000); // 30 minutos

    return new InventoryReservation(
      reservationId,
      items,
      'reserved',
      createdAt,
      expiresAt,
      orderId
    );
  }

  validateItems(items: InventoryItem[]): void {
    if (!items || items.length === 0) {
      throw new Error('Items list cannot be empty');
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error(`Invalid quantity for SKU ${item.sku}: ${item.quantity}`);
      }
    }
  }
}
