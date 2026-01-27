import { CatFact } from '../models/cat-fact.model';

export interface CatFactPort {
  /**
   * Get a random cat fact
   * @param correlationId - Request correlation ID for tracing
   */
  getRandomFact(correlationId: string): Promise<CatFact>;
}

export const CAT_FACT_PORT = Symbol('CatFactPort');
