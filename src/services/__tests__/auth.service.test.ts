import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authService from '../auth.service';
import prisma from '../../lib/prisma';

// Mock bcrypt and jwt
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

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
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(testUser);

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
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'salt');

      expect(prisma.user.create).toHaveBeenCalledWith({
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
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);

      // Registration data
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      // Execute and verify error
      await expect(authService.registerUser(userData)).rejects.toThrow('User already exists');

      // Verify user existence was checked
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });

      // Verify user creation wasn't attempted
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    test('should login successfully with valid credentials', async () => {
      // Mock prisma.user.findUnique
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);

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
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
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
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Login data
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Execute and verify error
      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid credentials');

      // Verify user search
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });

      // Verify password comparison wasn't attempted
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('should throw error if password is incorrect', async () => {
      // Mock prisma.user.findUnique to return user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);

      // Mock bcrypt.compare to return false (incorrect password)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Login data
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Execute and verify error
      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid credentials');

      // Verify user search
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });

      // Verify password was compared
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, testUser.passwordHash);

      // Verify token wasn't generated
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    test('should get user profile successfully', async () => {
      // Mock prisma.user.findUnique
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);

      // Execute method
      const result = await authService.getUserProfile(testUser.id);

      // Verify user search
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: testUser.id }
      });

      // Verify result
      expect(result).toEqual({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name
      });
    });

    test('should throw error if user does not exist', async () => {
      // Mock prisma.user.findUnique to not find user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Execute and verify error
      await expect(authService.getUserProfile('nonexistent-id')).rejects.toThrow('User not found');

      // Verify user search
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' }
      });
    });
  });
});
