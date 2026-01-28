import { Injectable } from '@nestjs/common';
import { ShippingRepositoryPort } from '../../domain/ports/shipping-repository.port';
import { ShippingLabel } from '../../domain/models/shipping-label.model';

@Injectable()
export class InMemoryShippingRepository implements ShippingRepositoryPort {
  private labels = new Map<string, ShippingLabel>();

  async saveLabel(label: ShippingLabel): Promise<void> {
    this.labels.set(label.labelId, label);
  }

  async findLabelById(labelId: string): Promise<ShippingLabel | null> {
    return this.labels.get(labelId) || null;
  }

  async updateLabel(label: ShippingLabel): Promise<void> {
    if (!this.labels.has(label.labelId)) {
      throw new Error(`Label not found: ${label.labelId}`);
    }
    this.labels.set(label.labelId, label);
  }
}
