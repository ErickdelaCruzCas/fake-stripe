import { Injectable } from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { PaymentAuthorization } from '../../domain/models/payment-authorization.model';
import { PaymentRefund } from '../../domain/models/payment-refund.model';

/**
 * In-Memory Payment Repository
 *
 * Implementación en memoria del PaymentRepositoryPort.
 * En producción, esto sería reemplazado por PostgreSQL, MongoDB, etc.
 */
@Injectable()
export class InMemoryPaymentRepository implements PaymentRepositoryPort {
  private authorizations = new Map<string, PaymentAuthorization>();
  private refunds = new Map<string, PaymentRefund>();

  async saveAuthorization(auth: PaymentAuthorization): Promise<void> {
    this.authorizations.set(auth.authId, auth);
  }

  async findAuthorizationById(authId: string): Promise<PaymentAuthorization | null> {
    return this.authorizations.get(authId) || null;
  }

  async updateAuthorization(auth: PaymentAuthorization): Promise<void> {
    if (!this.authorizations.has(auth.authId)) {
      throw new Error(`Authorization not found: ${auth.authId}`);
    }
    this.authorizations.set(auth.authId, auth);
  }

  async saveRefund(refund: PaymentRefund): Promise<void> {
    this.refunds.set(refund.refundId, refund);
  }

  async findRefundById(refundId: string): Promise<PaymentRefund | null> {
    return this.refunds.get(refundId) || null;
  }

  async findRefundsByAuthId(authId: string): Promise<PaymentRefund[]> {
    return Array.from(this.refunds.values()).filter((r) => r.authId === authId);
  }
}
