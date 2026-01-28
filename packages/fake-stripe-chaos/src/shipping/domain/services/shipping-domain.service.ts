import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ShippingLabel, ShippingAddress } from '../models/shipping-label.model';

@Injectable()
export class ShippingDomainService {
  createLabel(
    address: ShippingAddress,
    carrier: string = 'UPS',
    orderId?: string
  ): ShippingLabel {
    const labelId = `lbl_${uuidv4().replace(/-/g, '').substring(0, 24)}`;
    const trackingNumber = `1Z${Math.random().toString(36).substring(2, 18).toUpperCase()}`;

    return new ShippingLabel(
      labelId,
      trackingNumber,
      carrier,
      'pending',
      address,
      new Date(),
      orderId
    );
  }

  validateAddress(address: ShippingAddress): void {
    const required = ['street', 'city', 'state', 'zip', 'country'];
    for (const field of required) {
      if (!address[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }
}
