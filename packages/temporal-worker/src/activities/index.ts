/**
 * Temporal Activities Index
 *
 * Export all activities for Worker registration
 */

// Phase 3 Activities (User Context)
export { getCurrentLocationActivity } from './location.activity';
export { getWeatherActivity } from './weather.activity';
export { getCatFactActivity } from './cat-fact.activity';
export { processPaymentActivity } from './payment.activity';

// Phase 4 Activities (Order Fulfillment)
export * from './payment.activities';
export * from './inventory.activities';
export * from './shipping.activities';
export * from './notification.activities';

export * from './types';
