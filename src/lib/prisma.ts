import { PrismaClient } from '@prisma/client';

// Add prisma property to global namespace for development
declare global {
  var prisma: PrismaClient | undefined;
}

// Use a single instance of PrismaClient in development to avoid
// multiple connections during hot-reloading
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Only assign to global in development to avoid polluting production
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;