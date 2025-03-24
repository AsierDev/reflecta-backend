import { jest } from '@jest/globals';

// Mocks for modules
jest.mock('../app', () => ({
  __esModule: true,
  default: {
    listen: jest.fn().mockImplementation(function(port, callback) {
      if (typeof callback === 'function') callback();
      return { close: jest.fn() };
    })
  }
}));

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    $connect: jest.fn().mockImplementation(() => Promise.resolve()),
    $disconnect: jest.fn().mockImplementation(() => Promise.resolve())
  }
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  http: jest.fn(),
  debug: jest.fn()
}));

// Imports after mocks
import app from '../app';
import prisma from '../lib/prisma';
import logger from '../utils/logger';
// Import functions directly from the module
import { validateEnv, startServer, gracefulShutdown } from '../index';

describe('index.ts file', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalExit: typeof process.exit;
  let originalProcessOn: typeof process.on;
  
  beforeEach(() => {
    // Save original variables and functions
    originalEnv = { ...process.env };
    originalExit = process.exit;
    originalProcessOn = process.on;
    
    // Mock process.exit and process.on
    process.exit = jest.fn() as any;
    process.on = jest.fn() as any;
    
    // Clear mocks
    jest.clearAllMocks();
    
    // Test environment values
    process.env.DATABASE_URL = 'file:./test.db';
    process.env.JWT_SECRET = 'test-secret';
  });
  
  afterEach(() => {
    // Restore original values
    process.env = originalEnv;
    process.exit = originalExit;
    process.on = originalProcessOn;
  });

  // Basic import test
  test('index.ts module can be imported without errors', () => {
    expect(() => {
      jest.isolateModules(() => {
        require('../index');
      });
    }).not.toThrow();
  });

  // Tests for validateEnv
  describe('validateEnv', () => {
    test('should run without errors when all variables are defined', () => {
      expect(() => validateEnv()).not.toThrow();
    });

    test('should throw error when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      
      expect(() => validateEnv()).toThrow(/Missing environment variables/);
      expect(() => validateEnv()).toThrow(/DATABASE_URL/);
    });

    test('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      
      expect(() => validateEnv()).toThrow(/Missing environment variables/);
      expect(() => validateEnv()).toThrow(/JWT_SECRET/);
    });
  });

  // Test for server configuration and database connection
  test('startServer configures listeners and handles errors', async () => {
    await startServer();
    
    // Verify that expected functions were called
    expect(prisma.$connect).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalledWith(
      "5000",
      expect.any(Function)
    );
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith('Database connection established');
  });

  test('startServer handles database connection errors', async () => {
    // Simulate database connection error
    (prisma.$connect as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Database connection error');
    });
    
    await startServer();
    
    expect(logger.error).toHaveBeenCalledWith(
      'Error starting server', 
      expect.objectContaining({
        error: expect.any(Error)
      })
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('startServer handles HTTP server startup errors', async () => {
    // Simulate HTTP server startup error
    (app.listen as jest.Mock).mockImplementationOnce(() => {
      throw new Error('HTTP server startup error');
    });
    
    await startServer();
    
    expect(logger.error).toHaveBeenCalledWith(
      'Error starting server', 
      expect.objectContaining({
        error: expect.any(Error)
      })
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  // Test for gracefulShutdown
  test('gracefulShutdown closes server and disconnects DB', async () => {
    // Mock for server
    const mockServer = {
      close: jest.fn((cb: () => void) => cb())
    };
    
    // Assign mock server to exported variable in index module
    const indexModule = require('../index');
    indexModule.server = mockServer;
    
    // Execute shutdown
    await gracefulShutdown();
    
    // Verify connections were closed
    expect(mockServer.close).toHaveBeenCalled();
    expect(prisma.$disconnect).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('HTTP server closed');
    expect(logger.info).toHaveBeenCalledWith('Database connection closed');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  test('gracefulShutdown handles errors', async () => {
    // Mock to simulate disconnect error
    (prisma.$disconnect as jest.Mock).mockImplementationOnce(() => {
      return Promise.reject(new Error('Test error'));
    });
    
    // Mock for server
    const mockServer = {
      close: jest.fn((cb: () => void) => cb())
    };
    
    // Assign mock server
    const indexModule = require('../index');
    indexModule.server = mockServer;
    
    // Execute shutdown
    await gracefulShutdown();
    
    // Verify error handling
    expect(logger.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  test('gracefulShutdown works when server is undefined', async () => {
    // Ensure server is undefined
    const indexModule = require('../index');
    indexModule.server = undefined;
    
    // Execute shutdown
    await gracefulShutdown();

    // Should not try to close server but should disconnect database
    expect(prisma.$disconnect).toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalledWith('HTTP server closed');
    expect(logger.info).toHaveBeenCalledWith('Database connection closed');
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});


