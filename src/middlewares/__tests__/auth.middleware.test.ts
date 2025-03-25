import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, STATUS_CODES, ERROR_MESSAGES } from '../auth.middleware';
import logger from '../../utils/logger';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  TokenExpiredError: class TokenExpiredError extends Error {
    expiredAt: Date;
    constructor(message: string, expiredAt: Date) {
      super(message);
      this.name = 'TokenExpiredError';
      this.expiredAt = expiredAt;
    }
  }
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let originalJwtSecret: string | undefined;

  beforeEach(() => {
    // Save original JWT_SECRET
    originalJwtSecret = process.env.JWT_SECRET;

    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret-key';

    // Setup mocks
    mockRequest = {
      headers: {},
      path: '/test/path',
      method: 'GET',
      ip: '127.0.0.1'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    nextFunction = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original JWT_SECRET
    process.env.JWT_SECRET = originalJwtSecret;
  });

  test('should reject requests without authorization header', () => {
    // No authorization header
    mockRequest.headers = {};

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODES.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: ERROR_MESSAGES.NO_TOKEN
    });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('Access attempt without authorization token', {
      path: '/test/path',
      method: 'GET',
      ip: '127.0.0.1'
    });
  });

  test('should reject requests with incorrect authorization format', () => {
    // Authorization header without Bearer format
    mockRequest.headers = { authorization: 'InvalidFormat token123' };

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODES.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: ERROR_MESSAGES.NO_TOKEN
    });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  test('should respond with 500 error if JWT_SECRET is not defined', () => {
    // Remove JWT_SECRET
    delete process.env.JWT_SECRET;

    // Valid authorization header
    mockRequest.headers = { authorization: 'Bearer validToken' };

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODES.SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: ERROR_MESSAGES.SERVER_CONFIG
    });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  test('should reject invalid token', () => {
    // Authorization header with token
    mockRequest.headers = { authorization: 'Bearer invalidToken' };

    // Simulate token verification error
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODES.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: ERROR_MESSAGES.INVALID_TOKEN
    });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Authentication error', {
      error: expect.any(Error),
      path: '/test/path',
      method: 'GET',
      ip: '127.0.0.1'
    });
  });

  test('should reject expired token', () => {
    // Authorization header with token
    mockRequest.headers = { authorization: 'Bearer expiredToken' };

    // Simulate expired token error
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new jwt.TokenExpiredError('Token expired', new Date());
    });

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODES.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: ERROR_MESSAGES.EXPIRED_TOKEN
    });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  test('should accept valid token with userId', () => {
    // Authorization header with token
    mockRequest.headers = { authorization: 'Bearer validToken' };

    // Simulate successful token verification
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify next was called and user was added to request
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual({ userId: 'user123' });
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  test('should accept valid token with userId and email', () => {
    // Authorization header with token
    mockRequest.headers = { authorization: 'Bearer validToken' };

    // Simulate successful token verification with email
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', email: 'user@example.com' });

    // Call middleware
    authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify next was called and user with email was added to request
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual({ userId: 'user123', email: 'user@example.com' });
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});
