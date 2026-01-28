import { PaymentAuthorization } from '../models/payment-authorization.model';
import { PaymentRefund } from '../models/payment-refund.model';

/**
 * Payment Repository Port
 *
 * Interface para persistencia de pagos.
 * Permite cambiar implementación (in-memory, DB, etc.) sin afectar lógica de negocio.
 */
export interface PaymentRepositoryPort {
  /**
   * Guarda una autorización de pago
   */
  saveAuthorization(auth: PaymentAuthorization): Promise<void>;

  /**
   * Busca una autorización por ID
   */
  findAuthorizationById(authId: string): Promise<PaymentAuthorization | null>;

  /**
   * Actualiza una autorización existente
   */
  updateAuthorization(auth: PaymentAuthorization): Promise<void>;

  /**
   * Guarda un reembolso
   */
  saveRefund(refund: PaymentRefund): Promise<void>;

  /**
   * Busca un reembolso por ID
   */
  findRefundById(refundId: string): Promise<PaymentRefund | null>;

  /**
   * Busca reembolsos por authorization ID
   */
  findRefundsByAuthId(authId: string): Promise<PaymentRefund[]>;
}
