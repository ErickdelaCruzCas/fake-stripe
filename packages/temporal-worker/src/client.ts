import { Connection, Client } from '@temporalio/client';

/**
 * Temporal Client Factory
 *
 * Creates a Temporal Client for starting workflows and querying status
 * Used by the Temporal API service
 *
 * @returns Temporal Client instance
 */
export async function createTemporalClient(): Promise<Client> {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';

  const connection = await Connection.connect({
    address: temporalAddress,
  });

  const client = new Client({
    connection,
    namespace,
  });

  return client;
}
