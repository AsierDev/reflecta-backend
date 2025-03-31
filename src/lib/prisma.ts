import { PrismaClient } from '@prisma/client';

// Add prisma property to global namespace for development
declare global {
  var prisma: PrismaClient | undefined;
}

// Use mock in test environment, otherwise use real PrismaClient
const prisma = process.env.NODE_ENV === 'test' 
  ? require('../__mocks__/prisma').default
  : global.prisma || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

// Only assign to global in development to avoid polluting production
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;