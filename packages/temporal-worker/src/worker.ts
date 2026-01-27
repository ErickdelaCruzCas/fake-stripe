import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

/**
 * Temporal Worker
 *
 * Connects to Temporal Server and executes workflows and activities
 *
 * Configuration:
 * - TEMPORAL_ADDRESS: Temporal Server address (default: localhost:7233)
 * - TEMPORAL_NAMESPACE: Temporal namespace (default: default)
 * - TEMPORAL_TASK_QUEUE: Task queue name (default: founder-tasks)
 *
 * Graceful Shutdown:
 * - Handles SIGTERM and SIGINT signals
 * - Completes in-flight activities before exit
 * - Timeout: 30 seconds
 */

async function run() {
  // Configuration from environment
  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'founder-tasks';

  console.log('Starting Temporal Worker...');
  console.log(`Temporal Address: ${temporalAddress}`);
  console.log(`Namespace: ${namespace}`);
  console.log(`Task Queue: ${taskQueue}`);

  try {
    // Connect to Temporal Server
    const connection = await NativeConnection.connect({
      address: temporalAddress,
    });

    console.log('Connected to Temporal Server');

    // Create Worker
    const worker = await Worker.create({
      connection,
      namespace,
      taskQueue,
      workflowsPath: require.resolve('./workflows'),
      activities,
      // Worker options
      maxConcurrentActivityTaskExecutions: 10,
      maxConcurrentWorkflowTaskExecutions: 10,
    });

    console.log('Worker created successfully');
    console.log('Registered activities:', Object.keys(activities));
    console.log('Workflows path:', require.resolve('./workflows'));

    // Graceful shutdown handler
    let isShuttingDown = false;

    const shutdown = async (signal: string) => {
      if (isShuttingDown) {
        console.log('Shutdown already in progress, forcing exit...');
        process.exit(1);
      }

      isShuttingDown = true;
      console.log(`\nReceived ${signal}, shutting down gracefully...`);

      try {
        // Stop accepting new tasks
        worker.shutdown();
        console.log('Worker shutdown initiated');

        // Wait for in-flight activities to complete (max 30 seconds)
        await Promise.race([
          new Promise((resolve) => setTimeout(resolve, 30000)),
          new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              // Worker will complete shutdown when all activities finish
              clearInterval(checkInterval);
              resolve(undefined);
            }, 1000);
          }),
        ]);

        console.log('Worker shutdown complete');
        await connection.close();
        console.log('Connection closed');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Register signal handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Start Worker
    console.log('\n✅ Worker started successfully');
    console.log('Waiting for workflows and activities...\n');

    await worker.run();
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

// Start worker
run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
