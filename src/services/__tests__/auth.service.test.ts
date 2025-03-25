import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authService from '../auth.service';

// Mock bcrypt and jwt
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockUserFunctions = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  const mockLoginAttemptFunctions = {
    create: jest.fn(),
    count: jest.fn()
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: mockUserFunctions,
      loginAttempt: mockLoginAttemptFunctions,
      $connect: jest.fn(),
      $disconnect: jest.fn()
    }))
  };
});

// Get PrismaClient mock
const { PrismaClient } = jest.requireMock('@prisma/client');
const mockPrismaClient = new PrismaClient();

describe('AuthService', () => {
  // Test data
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Configure default values for process.env
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  describe('registerUser', () => {
    test('should register a new user successfully', async () => {
      // Mock bcrypt.genSalt and bcrypt.hash
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      // Mock prisma.user.findUnique and prisma.user.create
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.user.create.mockResolvedValue(testUser);

      // Mock jwt.sign
      (jwt.sign as jest.Mock).mockReturnValue('test-token');

      // Registration data
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      // Execute method
      const result = await authService.registerUser(userData, '127.0.0.1');

      // Verify expected functions were called
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'salt');

      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          name: userData.name,
          passwordHash: 'hashed-password'
        }
      });

      expect(jwt.sign).toHaveBeenCalledWith({ userId: testUser.id }, 'test-secret', {
        expiresIn: '1h'
      });

      // Verify result
      expect(result).toEqual({
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name
        },
        token: 'test-token'
      });
    });

    test('should throw error if user already exists', async () => {
      // Mock prisma.user.findUnique to return existing user
      mockPrismaClient.user.findUnique.mockResolvedValue(testUser);

      // Registration data
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      // Execute and verify error
      await expect(authService.registerUser(userData)).rejects.toThrow('User already exists');

      // Verify user existence was checked
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });

      // Verify user creation wasn't attempted
      expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    test('should login successfully with valid credentials', async () => {
      // Mock prisma.user.findUnique
      mockPrismaClient.user.findUnique.mockResolvedValue(testUser);

      // Mock bcrypt.compare
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock jwt.sign
      (jwt.sign as jest.Mock).mockReturnValue('test-token');

      // Login data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Execute method
      const result = await authService.loginUser(loginData, '127.0.0.1');

      // Verify expected functions were called
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, testUser.passwordHash);

      expect(jwt.sign).toHaveBeenCalledWith({ userId: testUser.id }, 'test-secret', {
        expiresIn: '1h'
      });

      // Verify result
      expect(result).toEqual({
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name
        },
        token: 'test-token'
      });
    });

    test('should throw error if user does not exist', async () => {
      // Mock prisma.user.findUnique to not find user
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Login data
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Execute and verify error
      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid credentials');

      // Verify user search
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });

      // Verify password wasn't compared
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('should throw error if password is incorrect', async () => {
      // Mock prisma.user.findUnique
      mockPrismaClient.user.findUnique.mockResolvedValue(testUser);

      // Mock bcrypt.compare for incorrect password
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Login data
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      // Execute and verify error
      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid credentials');

      // Verify user search
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });

      // Verify password was compared
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, testUser.passwordHash);
    });
  });

  describe('getUserProfile', () => {
    test('should get user profile successfully', async () => {
      // Mock prisma.user.findUnique
      mockPrismaClient.user.findUnique.mockResolvedValue(testUser);

      // Execute method
      const result = await authService.getUserProfile(testUser.id);

      // Verify expected function was called
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: testUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });

      // Verify result (mock will return the full user though select is partial)
      expect(result).toEqual(testUser);
    });

    test('should throw error if user does not exist', async () => {
      // Mock prisma.user.findUnique to not find user
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Execute and verify error
      await expect(authService.getUserProfile('nonexistent-id')).rejects.toThrow('User not found');

      // Verify user search
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
        select: expect.any(Object)
      });
    });
  });
});
