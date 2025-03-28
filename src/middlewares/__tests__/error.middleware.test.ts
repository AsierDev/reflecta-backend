import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../error.middleware';
import logger from '../../utils/logger';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  error: jest.fn()
}));

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Save original NODE_ENV value
    originalNodeEnv = process.env.NODE_ENV;

    // Setup mocks
    mockRequest = {
      path: '/test-path',
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
    // Restore original NODE_ENV value
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('should handle errors with custom status code', () => {
    // Create an error with custom status code
    const error: AppError = new Error('Custom error') as AppError;
    error.statusCode = 400;

    // Execute middleware
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify that the provided status code was used
    expect(mockResponse.status).toHaveBeenCalledWith(400);

    // Verify error response
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Custom error'
    });

    // Verify that the error was logged
    expect(logger.error).toHaveBeenCalledWith(
      'Error: Custom error',
      expect.objectContaining({
        error,
        path: '/test-path',
        method: 'GET',
        ip: '127.0.0.1',
        statusCode: 400
      })
    );
  });

  test('should use default 500 status code for errors without statusCode', () => {
    // Create an error without status code
    const error: AppError = new Error('Server error') as AppError;

    // Execute middleware
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify that the default status code (500) was used
    expect(mockResponse.status).toHaveBeenCalledWith(500);

    // Verify error response
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server error'
    });
  });

  test('should include details if present in the error', () => {
    // Create an error with details
    const error: AppError = new Error('Validation error') as AppError;
    error.statusCode = 422;
    error.details = {
      field: 'email',
      message: 'Invalid format'
    };

    // Execute middleware
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify error response with details
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation error',
      details: {
        field: 'email',
        message: 'Invalid format'
      }
    });
  });

  test('should include stack trace in development environment', () => {
    // Set NODE_ENV to development
    process.env.NODE_ENV = 'development';

    // Create an error with stack
    const error: AppError = new Error('Development error') as AppError;
    error.stack = 'Simulated stack trace';

    // Execute middleware
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify that stack trace is included in development
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Development error',
      stack: 'Simulated stack trace'
    });
  });

  test('should not include stack trace in production environment', () => {
    // Set NODE_ENV to production
    process.env.NODE_ENV = 'production';

    // Create an error with stack
    const error: AppError = new Error('Production error') as AppError;
    error.stack = 'Simulated stack trace';

    // Execute middleware
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify that stack trace is NOT included in production
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Production error'
    });
  });
});
