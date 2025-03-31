import { PrismaClient } from '@prisma/client';

// Mock PrismaClient class
class MockPrismaClient {
  $connect = jest.fn().mockImplementation(() => Promise.resolve());
  $disconnect = jest.fn().mockImplementation(() => Promise.resolve());
  
  user = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  
  entry = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  
  tag = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

// Export a singleton instance
const mockPrismaClient = new MockPrismaClient();
export default mockPrismaClient; 