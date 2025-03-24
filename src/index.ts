import 'dotenv/config';
import http from 'http';
import app from './app';
import logger from './utils/logger';
import prisma from './lib/prisma';

// Critical environment variables validation
export function validateEnv() {
  const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET'];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

  if (missingEnvs.length > 0) {
    throw new Error(`Missing environment variables: ${missingEnvs.join(', ')}`);
  }
}

const PORT = process.env.PORT || 5000;
export let server: http.Server;

export async function startServer() {
  try {
    // Validate environment variables
    validateEnv();

    // Connect to the database
    await prisma.$connect();
    logger.info('Database connection established');

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Signal handlers for graceful shutdown
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    logger.error('Error starting server', { error });
    process.exit(1);
  }
}

// Function for graceful server shutdown with timeout
export async function gracefulShutdown() {
  logger.info('Shutting down application...');

  // Timeout to force exit after 10 seconds
  const forceExit = setTimeout(() => {
    logger.warn('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);

  try {
    // Close HTTP server first
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      logger.info('HTTP server closed');
    }

    // Disconnect from database
    await prisma.$disconnect();
    logger.info('Database connection closed');

    clearTimeout(forceExit);
    process.exit(0);
  } catch (error) {
    logger.error('Error during application shutdown', { error });
    clearTimeout(forceExit);
    process.exit(1);
  }
}

// Start the server only if this file is ejecutado directamente y no importado
if (require.main === module) {
  startServer();
}