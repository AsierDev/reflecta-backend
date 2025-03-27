import tagService from '../tag.service';
import logger from '../../utils/logger';

// Logger mock
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// PrismaClient mock
jest.mock('@prisma/client', () => {
  const mockTagFunctions = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      tag: mockTagFunctions,
      $connect: jest.fn(),
      $disconnect: jest.fn()
    }))
  };
});

// Get the PrismaClient mock
const { PrismaClient } = jest.requireMock('@prisma/client');
const mockPrismaClient = new PrismaClient();

describe('TagService', () => {
  // Test data
  const userId = 'user-id-123';
  const tagId = 'tag-id-123';

  const testTag = {
    id: tagId,
    name: 'Test Tag',
    color: '#FF5733',
    userId: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const testTags = [
    testTag,
    {
      id: 'tag-id-456',
      name: 'Another Tag',
      color: '#33FF57',
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTag', () => {
    test('should create a tag successfully', async () => {
      // Tag creation data
      const tagData = {
        name: 'New Tag',
        color: '#123456',
        userId: userId
      };

      // Configure mock for tag creation
      mockPrismaClient.tag.create.mockResolvedValue({
        ...testTag,
        name: tagData.name,
        color: tagData.color
      });

      // Execute method
      const result = await tagService.createTag(tagData);

      // Verify that create method was called with the correct parameters
      expect(mockPrismaClient.tag.create).toHaveBeenCalledWith({
        data: {
          name: tagData.name,
          color: tagData.color,
          userId: tagData.userId
        }
      });

      // Verify the result
      expect(result).toEqual({
        ...testTag,
        name: tagData.name,
        color: tagData.color
      });
    });

    test('should use a default color if none is provided', async () => {
      // Tag data without color
      const tagData = {
        name: 'Tag Without Color',
        userId: userId
      };

      // Configure mock for tag creation
      mockPrismaClient.tag.create.mockResolvedValue({
        ...testTag,
        name: tagData.name,
        color: '#808080' // Default color
      });

      // Execute method
      const result = await tagService.createTag(tagData);

      // Verify that create was called with the default color
      expect(mockPrismaClient.tag.create).toHaveBeenCalledWith({
        data: {
          name: tagData.name,
          color: '#808080', // Default color
          userId: tagData.userId
        }
      });

      // Verify the result
      expect(result.color).toBe('#808080');
    });

    test('should handle error when creating a tag', async () => {
      // Tag data
      const tagData = {
        name: 'New Tag',
        userId: userId
      };

      // Configure mock to throw error
      mockPrismaClient.tag.create.mockRejectedValue(new Error('Prisma Error'));

      // Execute and verify it throws an error
      await expect(tagService.createTag(tagData)).rejects.toThrow('Error creating tag');

      // Verify the logger was called with the error
      expect(logger.error).toHaveBeenCalledWith(
        'Error creating tag in service',
        expect.objectContaining({
          error: expect.any(Error)
        })
      );
    });
  });

  describe('getTags', () => {
    test('should get all user tags', async () => {
      // Configure mock
      mockPrismaClient.tag.findMany.mockResolvedValue(testTags);

      // Execute method
      const result = await tagService.getTags(userId);

      // Verify prisma call
      expect(mockPrismaClient.tag.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { name: 'asc' }
      });

      // Verify result
      expect(result).toEqual(testTags);
    });

    test('should handle error when getting tags', async () => {
      // Configure mock to throw error
      mockPrismaClient.tag.findMany.mockRejectedValue(new Error('Database error'));

      // Execute and verify it throws error
      await expect(tagService.getTags(userId)).rejects.toThrow('Error getting tags');

      // Verify the logger was called with the error
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting tags in service',
        expect.objectContaining({
          error: expect.any(Error)
        })
      );
    });
  });

  describe('getTagById', () => {
    test('should get a tag by ID successfully', async () => {
      // Configure mock
      mockPrismaClient.tag.findFirst.mockResolvedValue(testTag);

      // Execute method
      const result = await tagService.getTagById(tagId, userId);

      // Verify prisma call
      expect(mockPrismaClient.tag.findFirst).toHaveBeenCalledWith({
        where: {
          id: tagId,
          userId
        }
      });

      // Verify result
      expect(result).toEqual(testTag);
    });

    test('should throw error if tag does not exist', async () => {
      // Configure mock to not find the tag
      mockPrismaClient.tag.findFirst.mockResolvedValue(null);

      // Execute and verify it throws error
      await expect(tagService.getTagById('non-existent-id', userId)).rejects.toThrow(
        'Error getting tag'
      );

      // Verify prisma call
      expect(mockPrismaClient.tag.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'non-existent-id',
          userId
        }
      });
    });

    test('should handle database errors', async () => {
      // Configure mock to throw error
      mockPrismaClient.tag.findFirst.mockRejectedValue(new Error('Database error'));

      // Execute and verify it throws error
      await expect(tagService.getTagById(tagId, userId)).rejects.toThrow('Error getting tag');

      // Verify the logger was called with the error
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting tag by ID in service',
        expect.objectContaining({
          error: expect.any(Error),
          tagId
        })
      );
    });
  });

  describe('updateTag', () => {
    test('should update a tag successfully', async () => {
      // Update data
      const updateData = {
        name: 'Updated Tag',
        color: '#987654'
      };

      // Configure mocks
      // Mock for getTagById used inside updateTag
      const getTagByIdSpy = jest.spyOn(tagService, 'getTagById');
      getTagByIdSpy.mockResolvedValue(testTag);

      // Mock for updating the tag
      mockPrismaClient.tag.update.mockResolvedValue({
        ...testTag,
        ...updateData
      });

      // Execute method
      const result = await tagService.updateTag(tagId, userId, updateData);

      // Verify getTagById was called to check existence
      expect(getTagByIdSpy).toHaveBeenCalledWith(tagId, userId);

      // Verify the tag was updated
      expect(mockPrismaClient.tag.update).toHaveBeenCalledWith({
        where: { id: tagId },
        data: updateData
      });

      // Verify result
      expect(result).toEqual({
        ...testTag,
        name: updateData.name,
        color: updateData.color
      });

      // Restore the spy
      getTagByIdSpy.mockRestore();
    });

    test('should propagate error if tag does not exist', async () => {
      // Update data
      const updateData = {
        name: 'Updated Tag',
        color: '#ABCDEF'
      };

      // Configure mock for getTagById to throw tag not found error
      const getTagByIdSpy = jest.spyOn(tagService, 'getTagById');
      getTagByIdSpy.mockRejectedValue(new Error('Tag not found'));

      // Execute and verify it throws the same error
      await expect(tagService.updateTag('non-existent-id', userId, updateData)).rejects.toThrow(
        'Tag not found'
      );

      // Verify getTagById was called but no update was attempted
      expect(getTagByIdSpy).toHaveBeenCalledWith('non-existent-id', userId);
      expect(mockPrismaClient.tag.update).not.toHaveBeenCalled();

      // Restore the spy
      getTagByIdSpy.mockRestore();
    });

    test('should handle errors when updating', async () => {
      // Update data
      const updateData = {
        name: 'Updated Tag',
        color: '#ABCDEF'
      };

      // Configure mocks
      const getTagByIdSpy = jest.spyOn(tagService, 'getTagById');
      getTagByIdSpy.mockResolvedValue(testTag);

      // Mock for update to fail
      mockPrismaClient.tag.update.mockRejectedValue(new Error('Database error'));

      // Execute and verify it throws error
      await expect(tagService.updateTag(tagId, userId, updateData)).rejects.toThrow(
        'Error updating tag'
      );

      // Verify the logger was called with the error
      expect(logger.error).toHaveBeenCalledWith(
        'Error updating tag in service',
        expect.objectContaining({
          error: expect.any(Error),
          tagId
        })
      );

      // Restore the spy
      getTagByIdSpy.mockRestore();
    });
  });

  describe('deleteTag', () => {
    test('should delete a tag successfully', async () => {
      // Configure mocks
      const getTagByIdSpy = jest.spyOn(tagService, 'getTagById');
      getTagByIdSpy.mockResolvedValue(testTag);

      mockPrismaClient.tag.delete.mockResolvedValue(testTag);

      // Execute method
      const result = await tagService.deleteTag(tagId, userId);

      // Verify tag existence was checked
      expect(getTagByIdSpy).toHaveBeenCalledWith(tagId, userId);

      // Verify tag was deleted
      expect(mockPrismaClient.tag.delete).toHaveBeenCalledWith({
        where: { id: tagId }
      });

      // Verify result
      expect(result).toBe(true);

      // Restore the spy
      getTagByIdSpy.mockRestore();
    });

    test('should propagate error if tag does not exist', async () => {
      // Configure getTagById mock to throw error
      const getTagByIdSpy = jest.spyOn(tagService, 'getTagById');
      getTagByIdSpy.mockRejectedValue(new Error('Tag not found'));

      // Execute and verify it throws the same error
      await expect(tagService.deleteTag('non-existent-id', userId)).rejects.toThrow(
        'Tag not found'
      );

      // Verify getTagById was called but no delete was attempted
      expect(getTagByIdSpy).toHaveBeenCalledWith('non-existent-id', userId);
      expect(mockPrismaClient.tag.delete).not.toHaveBeenCalled();

      // Restore the spy
      getTagByIdSpy.mockRestore();
    });

    test('should handle errors when deleting', async () => {
      // Configure mocks
      const getTagByIdSpy = jest.spyOn(tagService, 'getTagById');
      getTagByIdSpy.mockResolvedValue(testTag);

      // Mock for delete to fail
      mockPrismaClient.tag.delete.mockRejectedValue(new Error('Database error'));

      // Execute and verify it throws error
      await expect(tagService.deleteTag(tagId, userId)).rejects.toThrow('Error deleting tag');

      // Verify the logger was called with the error
      expect(logger.error).toHaveBeenCalledWith(
        'Error deleting tag in service',
        expect.objectContaining({
          error: expect.any(Error),
          tagId
        })
      );

      // Restore the spy
      getTagByIdSpy.mockRestore();
    });
  });
});
