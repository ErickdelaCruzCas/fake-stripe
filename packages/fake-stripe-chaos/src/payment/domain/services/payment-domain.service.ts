import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PaymentAuthorization } from '../models/payment-authorization.model';
import { PaymentRefund } from '../models/payment-refund.model';

/**
 * Payment Domain Service
 *
 * Lógica de negocio pura (sin dependencias de framework).
 * Factory methods para crear entidades de dominio.
 */
@Injectable()
export class PaymentDomainService {
  /**
   * Crea una nueva autorización de pago
   */
  createAuthorization(
    amount: number,
    currency: string,
    orderId?: string,
    customerId?: string
  ): PaymentAuthorization {
    const authId = `auth_${uuidv4().replace(/-/g, '').substring(0, 24)}`;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días

    return new PaymentAuthorization(
      authId,
      amount,
      currency,
      'authorized',
      createdAt,
      expiresAt,
      orderId,
      customerId
    );
  }

  /**
   * Crea un nuevo reembolso
   */
  createRefund(
    authId: string,
    amount: number,
    currency: string,
    reason: string
  ): PaymentRefund {
    const refundId = `re_${uuidv4().replace(/-/g, '').substring(0, 24)}`;

    return new PaymentRefund(
      refundId,
      authId,
      amount,
      currency,
      'pending',
      reason,
      new Date()
    );
  }

  /**
   * Valida que el monto sea válido
   */
  validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a valid number');
    }
  }

  /**
   * Valida que la moneda sea válida
   */
  validateCurrency(currency: string): void {
    const validCurrencies = ['usd', 'eur', 'gbp', 'mxn'];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      throw new Error(`Invalid currency: ${currency}. Valid currencies: ${validCurrencies.join(', ')}`);
    }
  }
}
