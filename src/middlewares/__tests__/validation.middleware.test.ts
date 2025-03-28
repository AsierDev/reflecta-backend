import { Request, Response, NextFunction } from 'express';
import { validate } from '../validation.middleware';
import { z } from 'zod';
import logger from '../../utils/logger';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  error: jest.fn()
}));

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockRequest = {
      body: {},
      query: {},
      params: {},
      path: '/test-path'
    };

    nextFunction = jest.fn();
  });

  test('should validate correct data and proceed', async () => {
    // Create a simple schema
    const testSchema = z.object({
      body: z.object({
        name: z.string(),
        age: z.number()
      })
    });

    // Setup request with valid data
    mockRequest.body = {
      name: 'John Doe',
      age: 30
    };

    // Create the middleware
    const middleware = validate(testSchema);

    // Execute middleware
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify that next() was called without errors
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  test('should reject invalid data and return 400 error', async () => {
    // Create a simple schema
    const testSchema = z.object({
      body: z.object({
        name: z.string(),
        age: z.number()
      })
    });

    // Setup request with invalid data
    mockRequest.body = {
      name: 'John Doe',
      age: 'thirty' // should be a number
    };

    // Create the middleware
    const middleware = validate(testSchema);

    // Execute middleware
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify that a 400 error was returned
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation error',
        details: expect.any(Array)
      })
    );

    // Verify that the error was logged
    expect(logger.error).toHaveBeenCalledWith(
      'Validation error',
      expect.objectContaining({
        path: '/test-path',
        errors: expect.any(Array)
      })
    );
  });

  test('should validate route parameters correctly', async () => {
    // Create a schema that validates params
    const testSchema = z.object({
      params: z.object({
        id: z.string().uuid()
      }),
      body: z.object({}).optional(),
      query: z.object({}).optional()
    });

    // Setup valid params
    mockRequest.params = {
      id: '123e4567-e89b-12d3-a456-426614174000' // valid UUID
    };

    // Create the middleware
    const middleware = validate(testSchema);

    // Execute middleware
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify that next() was called without errors
    expect(nextFunction).toHaveBeenCalled();
  });

  test('should validate query parameters correctly', async () => {
    // Create a schema that validates query
    const testSchema = z.object({
      query: z.object({
        page: z.string().transform(val => parseInt(val)),
        limit: z.string().transform(val => parseInt(val))
      }),
      body: z.object({}).optional(),
      params: z.object({}).optional()
    });

    // Setup valid query
    mockRequest.query = {
      page: '1',
      limit: '10'
    };

    // Create the middleware
    const middleware = validate(testSchema);

    // Execute middleware
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Verify that next() was called without errors
    expect(nextFunction).toHaveBeenCalled();
  });
});
