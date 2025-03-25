import { Request, Response } from 'express';
import * as authController from '../auth.controller';
import authService from '../../services/auth.service';

// Auth service mock
jest.mock('../../services/auth.service');

// Logger mock
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Response mock
    mockJson = jest.fn().mockReturnValue({});
    mockStatus = jest.fn().mockReturnThis();
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    // Test IP
    mockRequest = {
      ip: '127.0.0.1',
      body: {},
      params: {}
    };
  });

  describe('register', () => {
    test('should register the user successfully', async () => {
      // Test data
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      mockRequest.body = userData;

      // Service response mock
      const mockServiceResponse = {
        user: {
          id: 'test-id',
          email: userData.email,
          name: userData.name
        },
        token: 'test-token'
      };

      (authService.registerUser as jest.Mock).mockResolvedValue(mockServiceResponse);

      // Execute controller
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(authService.registerUser).toHaveBeenCalledWith(userData, mockRequest.ip);

      // Verify response
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockServiceResponse
      });
    });

    test('should handle errors during registration', async () => {
      // Test data
      mockRequest.body = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password123'
      };

      // Service error mock
      const mockError = Object.assign(new Error('User already exists'), { statusCode: 400 });

      (authService.registerUser as jest.Mock).mockRejectedValue(mockError);

      // Execute controller
      await authController.register(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User already exists'
      });
    });
  });

  describe('login', () => {
    test('should log in successfully', async () => {
      // Test data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockRequest.body = loginData;

      // Service response mock
      const mockServiceResponse = {
        user: {
          id: 'test-id',
          email: loginData.email,
          name: 'Test User'
        },
        token: 'test-token'
      };

      (authService.loginUser as jest.Mock).mockResolvedValue(mockServiceResponse);

      // Execute controller
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(authService.loginUser).toHaveBeenCalledWith(loginData, mockRequest.ip);

      // Verify response - status is implicitly 200 in the controller
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockServiceResponse
      });
    });

    test('should handle invalid credentials', async () => {
      // Test data
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      // Service error mock
      const mockError = Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

      (authService.loginUser as jest.Mock).mockRejectedValue(mockError);

      // Execute controller
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });
    });
  });

  describe('getProfile', () => {
    test('should get user profile successfully', async () => {
      // Test data
      const userId = 'user-id';
      mockRequest.user = { userId };

      // Service response mock
      const mockProfile = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date()
      };

      (authService.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

      // Execute controller
      await authController.getProfile(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(authService.getUserProfile).toHaveBeenCalledWith(userId);

      // Verify response - status is implicitly 200 in the controller
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
    });

    test('should handle user not found', async () => {
      // Test data
      const userId = 'non-existent-id';
      mockRequest.user = { userId };

      // Service error mock
      const mockError = Object.assign(new Error('User not found'), { statusCode: 404 });

      (authService.getUserProfile as jest.Mock).mockRejectedValue(mockError);

      // Execute controller
      await authController.getProfile(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });
});
