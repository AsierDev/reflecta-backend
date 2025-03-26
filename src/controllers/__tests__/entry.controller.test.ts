import { Request, Response } from 'express';
import * as entryController from '../entry.controller';
import entryService from '../../services/entry.service';

// Mock of the entries service
jest.mock('../../services/entry.service');

// Mock of logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('EntryController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Response mock
    mockJson = jest.fn().mockReturnValue({});
    mockStatus = jest.fn().mockReturnThis();
    mockSend = jest.fn().mockReturnThis();
    mockSetHeader = jest.fn().mockReturnThis();

    mockResponse = {
      json: mockJson,
      status: mockStatus,
      send: mockSend,
      setHeader: mockSetHeader
    };

    // Basic request
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { userId: 'user-123' }
    };
  });

  describe('createEntry', () => {
    test('should create an entry successfully', async () => {
      // Test data
      const entryData = {
        title: 'Test title',
        content: 'Test content',
        tags: ['tag-1', 'tag-2']
      };

      mockRequest.body = entryData;

      // Service response mock
      const mockCreatedEntry = {
        id: 'mock-entry-id',
        title: 'Test title',
        content: 'Test content',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [
          { id: 'tag-1', name: 'Tag 1', userId: 'user-123' },
          { id: 'tag-2', name: 'Tag 2', userId: 'user-123' }
        ]
      };

      (entryService.createEntry as jest.Mock).mockResolvedValue(mockCreatedEntry);

      // Execute the controller
      await entryController.createEntry(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(entryService.createEntry).toHaveBeenCalledWith({
        title: entryData.title,
        content: entryData.content,
        userId: mockRequest.user!.userId,
        tags: entryData.tags
      });

      // Verify response
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedEntry
      });
    });

    test('should handle error when no user is authenticated', async () => {
      // Request without authenticated user
      mockRequest.user = undefined;

      // Execute the controller
      await entryController.createEntry(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });

      // Verify service was not called
      expect(entryService.createEntry).not.toHaveBeenCalled();
    });

    test('should handle errors when creating an entry', async () => {
      // Test data
      mockRequest.body = {
        title: 'Test title',
        content: 'Test content'
      };

      // Service error mock
      const mockError = new Error('Error creating entry');
      (entryService.createEntry as jest.Mock).mockRejectedValue(mockError);

      // Execute the controller
      await entryController.createEntry(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Error creating entry'
      });
    });
  });

  describe('getEntries', () => {
    test('should get entries successfully', async () => {
      // Test query data
      mockRequest.query = {
        page: '2',
        limit: '5',
        search: 'test',
        tagId: 'tag-1',
        sort: 'asc'
      };

      // Service response mock
      const mockEntries = [
        {
          id: 'entry-1',
          title: 'Entry 1',
          content: 'Content 1',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: []
        },
        {
          id: 'entry-2',
          title: 'Entry 2',
          content: 'Content 2',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: []
        }
      ];

      const mockPagination = {
        total: 10,
        page: 2,
        limit: 5,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true
      };

      (entryService.getEntries as jest.Mock).mockResolvedValue({
        entries: mockEntries,
        pagination: mockPagination
      });

      // Execute the controller
      await entryController.getEntries(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(entryService.getEntries).toHaveBeenCalledWith({
        userId: mockRequest.user!.userId,
        search: 'test',
        tagId: 'tag-1',
        sort: 'asc',
        page: 2,
        limit: 5
      });

      // Verify response
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockEntries,
        pagination: mockPagination
      });
    });

    test('should handle error when no user is authenticated', async () => {
      // Request without authenticated user
      mockRequest.user = undefined;

      // Execute the controller
      await entryController.getEntries(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });

      // Verify service was not called
      expect(entryService.getEntries).not.toHaveBeenCalled();
    });

    test('should handle errors when getting entries', async () => {
      // Service error mock
      const mockError = new Error('Error getting entries');
      (entryService.getEntries as jest.Mock).mockRejectedValue(mockError);

      // Execute the controller
      await entryController.getEntries(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Error getting entries'
      });
    });
  });

  describe('getEntryById', () => {
    test('should get an entry by ID successfully', async () => {
      // Test data
      mockRequest.params = { id: 'entry-123' };

      // Service response mock
      const mockEntry = {
        id: 'entry-123',
        title: 'Test title',
        content: 'Test content',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: []
      };

      (entryService.getEntryById as jest.Mock).mockResolvedValue(mockEntry);

      // Execute the controller
      await entryController.getEntryById(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(entryService.getEntryById).toHaveBeenCalledWith('entry-123', mockRequest.user!.userId);

      // Verify response
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockEntry
      });
    });

    test('should handle error when entry does not exist', async () => {
      // Test data
      mockRequest.params = { id: 'non-existent' };

      // Service error mock
      const mockError = new Error('Entry not found');
      (entryService.getEntryById as jest.Mock).mockRejectedValue(mockError);

      // Execute the controller
      await entryController.getEntryById(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Entry not found'
      });
    });
  });

  describe('updateEntry', () => {
    test('should update an entry successfully', async () => {
      // Test data
      mockRequest.params = { id: 'entry-123' };
      mockRequest.body = {
        title: 'Updated title',
        content: 'Updated content',
        tags: ['tag-1', 'tag-3']
      };

      // Service response mock
      const mockUpdatedEntry = {
        id: 'entry-123',
        title: 'Updated title',
        content: 'Updated content',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [
          { id: 'tag-1', name: 'Tag 1', userId: 'user-123' },
          { id: 'tag-3', name: 'Tag 3', userId: 'user-123' }
        ]
      };

      (entryService.updateEntry as jest.Mock).mockResolvedValue(mockUpdatedEntry);

      // Execute the controller
      await entryController.updateEntry(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(entryService.updateEntry).toHaveBeenCalledWith('entry-123', mockRequest.user!.userId, {
        title: mockRequest.body.title,
        content: mockRequest.body.content,
        tags: mockRequest.body.tags
      });

      // Verify response
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedEntry
      });
    });

    test('should handle error when entry does not exist', async () => {
      // Test data
      mockRequest.params = { id: 'non-existent' };
      mockRequest.body = {
        title: 'Updated title',
        content: 'Updated content'
      };

      // Service error mock
      const mockError = new Error('Entry not found');
      (entryService.updateEntry as jest.Mock).mockRejectedValue(mockError);

      // Execute the controller
      await entryController.updateEntry(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Entry not found'
      });
    });
  });

  describe('deleteEntry', () => {
    test('should delete an entry successfully', async () => {
      // Test data
      mockRequest.params = { id: 'entry-123' };

      // Service mock
      (entryService.deleteEntry as jest.Mock).mockResolvedValue(undefined);

      // Execute the controller
      await entryController.deleteEntry(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(entryService.deleteEntry).toHaveBeenCalledWith('entry-123', mockRequest.user!.userId);

      // Verify response
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: null
      });
    });

    test('should handle error when entry does not exist', async () => {
      // Test data
      mockRequest.params = { id: 'non-existent' };

      // Service error mock
      const mockError = new Error('Entry not found');
      (entryService.deleteEntry as jest.Mock).mockRejectedValue(mockError);

      // Execute the controller
      await entryController.deleteEntry(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Entry not found'
      });
    });
  });

  describe('exportEntry', () => {
    test('should export an entry in text format', async () => {
      // Test data
      mockRequest.params = {
        id: 'entry-123',
        format: 'txt'
      };

      // Service response mock
      const mockEntry = {
        id: 'entry-123',
        title: 'Export title',
        content: 'Export content',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: []
      };

      (entryService.getEntryForExport as jest.Mock).mockResolvedValue(mockEntry);

      // Execute the controller
      await entryController.exportEntry(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(entryService.getEntryForExport).toHaveBeenCalledWith(
        'entry-123',
        mockRequest.user!.userId
      );

      // Verify headers
      expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockSetHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="entry-entry-123.txt"'
      );

      // Verify content
      expect(mockSend).toHaveBeenCalledWith('Export title\n\nExport content');
    });

    test('should export an entry in JSON format', async () => {
      // Test data
      mockRequest.params = {
        id: 'entry-123',
        format: 'json'
      };

      // Service response mock
      const mockEntry = {
        id: 'entry-123',
        title: 'Export title',
        content: 'Export content',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: []
      };

      (entryService.getEntryForExport as jest.Mock).mockResolvedValue(mockEntry);

      // Execute the controller
      await entryController.exportEntry(mockRequest as Request, mockResponse as Response);

      // Verify service was called correctly
      expect(entryService.getEntryForExport).toHaveBeenCalledWith(
        'entry-123',
        mockRequest.user!.userId
      );

      // Verify headers
      expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockSetHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="entry-entry-123.json"'
      );

      // Verify content
      expect(mockSend).toHaveBeenCalledWith(JSON.stringify(mockEntry, null, 2));
    });

    test('should handle invalid export format', async () => {
      // Test data
      mockRequest.params = {
        id: 'entry-123',
        format: 'invalid'
      };

      // Execute the controller
      await entryController.exportEntry(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid export format'
      });
    });

    test('should handle error when entry does not exist', async () => {
      // Test data
      mockRequest.params = {
        id: 'non-existent',
        format: 'txt'
      };

      // Service error mock
      const mockError = new Error('Entry not found');
      (entryService.getEntryForExport as jest.Mock).mockRejectedValue(mockError);

      // Execute the controller
      await entryController.exportEntry(mockRequest as Request, mockResponse as Response);

      // Verify error response
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Entry not found'
      });
    });
  });
});
