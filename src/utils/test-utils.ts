import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';

/**
 * Generates a JWT token for testing
 */
export const generateTestToken = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET || 'reflecta-secret-key';
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
};

/**
 * Creates a supertest agent with an authentication token
 */
export const authenticatedRequest = (userId: string) => {
  const token = generateTestToken(userId);
  return request(app).set('Authorization', `Bearer ${token}`);
};

/**
 * Cleans up the database after tests
 */
export const cleanupDatabase = async () => {
  // For SQLite, we directly delete the records from each table
  try {
    // We do not attempt to clean the tables as they are not fully implemented
    // await prisma.tag.deleteMany({});
    // await prisma.entry.deleteMany({});
    // await prisma.user.deleteMany({});
    // Note: When the database is fully implemented, uncomment the above lines
  } catch (error) {
    console.error('Error cleaning up the database:', error);
  }
};

/**
 * Initializes the database for tests
 */
export const setupTestDatabase = async () => {
  // Clean existing data
  await cleanupDatabase();

  // Here you can create test data if needed
};

// Timeout settings for longer tests
export const longerTimeout = 10000; // 10 seconds
