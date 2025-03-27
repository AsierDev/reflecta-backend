import { Request, Response } from 'express';
import { createTag, getTags, updateTag, deleteTag } from '../tag.controller';
import tagService from '../../services/tag.service';
import logger from '../../utils/logger';

// Mock of services and logger
jest.mock('../../services/tag.service');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('TagController', () => {
  // Setup mocks for req and res
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup response mock
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
  });

  describe('createTag', () => {
    test('should create a tag successfully', async () => {
      // Test data
      const tagData = {
        name: 'New Tag',
        color: '#123456'
      };

      const createdTag = {
        id: 'tag-id-123',
        name: tagData.name,
        color: tagData.color,
        userId: 'user-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Configure request
      mockRequest = {
        body: tagData,
        user: { userId: 'user-id-123' }
      };

      // Configure service mock
      (tagService.createTag as jest.Mock).mockResolvedValue(createdTag);

      // Execute controller
      await createTag(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.createTag).toHaveBeenCalledWith({
        name: tagData.name,
        color: tagData.color,
        userId: 'user-id-123'
      });

      expect(logger.info).toHaveBeenCalledWith(
        `Tag created: ${createdTag.id}`,
        expect.objectContaining({ userId: 'user-id-123' })
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: createdTag
      });
    });

    test('should handle error when there is no authenticated user', async () => {
      // Configure request without user
      mockRequest = {
        body: { name: 'Test Tag' },
        user: undefined
      };

      // Execute controller
      await createTag(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.createTag).not.toHaveBeenCalled();

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    });

    test('should handle errors when creating a tag', async () => {
      // Test data
      const tagData = {
        name: 'New Tag',
        color: '#123456'
      };

      // Configure request
      mockRequest = {
        body: tagData,
        user: { userId: 'user-id-123' }
      };

      // Configure service mock to throw error
      const errorMsg = 'Error creating tag';
      (tagService.createTag as jest.Mock).mockRejectedValue(new Error(errorMsg));

      // Execute controller
      await createTag(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.createTag).toHaveBeenCalled();

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating tag',
        expect.objectContaining({ error: expect.any(Error) })
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: errorMsg
      });
    });
  });

  describe('getTags', () => {
    test('should get tags successfully', async () => {
      // Test data
      const tags = [
        {
          id: 'tag-id-123',
          name: 'Tag 1',
          color: '#FF5733',
          userId: 'user-id-123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'tag-id-456',
          name: 'Tag 2',
          color: '#33FF57',
          userId: 'user-id-123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Configure request
      mockRequest = {
        user: { userId: 'user-id-123' }
      };

      // Configure service mock
      (tagService.getTags as jest.Mock).mockResolvedValue(tags);

      // Execute controller
      await getTags(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.getTags).toHaveBeenCalledWith('user-id-123');

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: tags
      });
    });

    test('should handle error when there is no authenticated user', async () => {
      // Configure request without user
      mockRequest = {
        user: undefined
      };

      // Execute controller
      await getTags(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.getTags).not.toHaveBeenCalled();

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    });

    test('should handle errors when getting tags', async () => {
      // Configure request
      mockRequest = {
        user: { userId: 'user-id-123' }
      };

      // Configure service mock to throw error
      const errorMsg = 'Error getting tags';
      (tagService.getTags as jest.Mock).mockRejectedValue(new Error(errorMsg));

      // Execute controller
      await getTags(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.getTags).toHaveBeenCalled();

      expect(logger.error).toHaveBeenCalledWith(
        'Error getting tags',
        expect.objectContaining({ error: expect.any(Error) })
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: errorMsg
      });
    });
  });

  describe('updateTag', () => {
    test('should update a tag successfully', async () => {
      // Test data
      const tagId = 'tag-id-123';
      const tagData = {
        name: 'Updated Tag',
        color: '#987654'
      };

      const updatedTag = {
        id: tagId,
        name: tagData.name,
        color: tagData.color,
        userId: 'user-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Configure request
      mockRequest = {
        params: { id: tagId },
        body: tagData,
        user: { userId: 'user-id-123' }
      };

      // Configure service mock
      (tagService.updateTag as jest.Mock).mockResolvedValue(updatedTag);

      // Execute controller
      await updateTag(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.updateTag).toHaveBeenCalledWith(tagId, 'user-id-123', tagData);

      expect(logger.info).toHaveBeenCalledWith(
        `Tag updated: ${tagId}`,
        expect.objectContaining({ userId: 'user-id-123' })
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: updatedTag
      });
    });

    test('should handle error when there is no authenticated user', async () => {
      // Configure request without user
      mockRequest = {
        params: { id: 'tag-id-123' },
        body: { name: 'Test Tag' },
        user: undefined
      };

      // Execute controller
      await updateTag(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.updateTag).not.toHaveBeenCalled();

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    });

    test('should handle error when the tag does not exist', async () => {
      // Test data
      const tagId = 'non-existent-id';
      const tagData = {
        name: 'Updated Tag',
        color: '#987654'
      };

      // Configure request
      mockRequest = {
        params: { id: tagId },
        body: tagData,
        user: { userId: 'user-id-123' }
      };

      // Configure service mock to throw tag not found error
      const errorMsg = 'Tag not found';
      (tagService.updateTag as jest.Mock).mockRejectedValue(new Error(errorMsg));

      // Execute controller
      await updateTag(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.updateTag).toHaveBeenCalled();

      expect(logger.error).toHaveBeenCalledWith(
        'Error updating tag',
        expect.objectContaining({
          error: expect.any(Error),
          tagId
        })
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: errorMsg
      });
    });
  });

  describe('deleteTag', () => {
    test('should delete a tag successfully', async () => {
      // Test data
      const tagId = 'tag-id-123';

      // Configure request
      mockRequest = {
        params: { id: tagId },
        user: { userId: 'user-id-123' }
      };

      // Configure service mock
      (tagService.deleteTag as jest.Mock).mockResolvedValue(true);

      // Execute controller
      await deleteTag(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.deleteTag).toHaveBeenCalledWith(tagId, 'user-id-123');

      expect(logger.info).toHaveBeenCalledWith(
        `Tag deleted: ${tagId}`,
        expect.objectContaining({ userId: 'user-id-123' })
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: null
      });
    });

    test('should handle error when there is no authenticated user', async () => {
      // Configure request without user
      mockRequest = {
        params: { id: 'tag-id-123' },
        user: undefined
      };

      // Execute controller
      await deleteTag(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.deleteTag).not.toHaveBeenCalled();

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    });

    test('should handle error when the tag does not exist', async () => {
      // Test data
      const tagId = 'non-existent-id';

      // Configure request
      mockRequest = {
        params: { id: tagId },
        user: { userId: 'user-id-123' }
      };

      // Configure service mock to throw tag not found error
      const errorMsg = 'Tag not found';
      (tagService.deleteTag as jest.Mock).mockRejectedValue(new Error(errorMsg));

      // Execute controller
      await deleteTag(mockRequest as Request, mockResponse as Response);

      // Verifications
      expect(tagService.deleteTag).toHaveBeenCalled();

      expect(logger.error).toHaveBeenCalledWith(
        'Error deleting tag',
        expect.objectContaining({
          error: expect.any(Error),
          tagId
        })
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: errorMsg
      });
    });
  });
});
