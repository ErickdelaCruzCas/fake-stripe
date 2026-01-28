import { ShippingLabel } from '../models/shipping-label.model';

export interface ShippingRepositoryPort {
  saveLabel(label: ShippingLabel): Promise<void>;
  findLabelById(labelId: string): Promise<ShippingLabel | null>;
  updateLabel(label: ShippingLabel): Promise<void>;
}
