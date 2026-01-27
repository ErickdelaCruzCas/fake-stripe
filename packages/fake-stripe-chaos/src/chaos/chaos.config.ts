/**
 * Chaos Engineering Configuration
 *
 * Probability distribution for chaos scenarios.
 * Modify these values to change the chaos behavior.
 */

export const CHAOS_CONFIG = {
  /**
   * Probability distribution for chaos scenarios
   * Total must equal 1.0 (100%)
   */
  SCENARIOS: {
    timeout: 0.3, // 30%
    error500: 0.2, // 20%
    error402: 0.1, // 10%
    success: 0.4, // 40%
  } as const,

  /**
   * Timeout delay in milliseconds
   * Simulates slow external services
   */
  TIMEOUT_DELAY_MS: 5000,
} as const;

/**
 * Validate that probabilities sum to 1.0
 */
const totalProbability = Object.values(CHAOS_CONFIG.SCENARIOS).reduce(
  (sum, prob) => sum + prob,
  0
);

if (Math.abs(totalProbability - 1.0) > 0.001) {
  throw new Error(
    `Chaos scenario probabilities must sum to 1.0, got ${totalProbability}`
  );
}
