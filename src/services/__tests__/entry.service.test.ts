import entryService from '../entry.service';
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
  const mockEntryFunctions = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      entry: mockEntryFunctions,
      $connect: jest.fn(),
      $disconnect: jest.fn()
    }))
  };
});

// Get PrismaClient mock
const { PrismaClient } = jest.requireMock('@prisma/client');
const mockPrismaClient = new PrismaClient();

describe('EntryService', () => {
  // Test data
  const userId = 'user-id-123';
  const entryId = 'entry-id-123';

  const testEntry = {
    id: entryId,
    title: 'Test Entry',
    content: 'This is a test entry content',
    userId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: []
  };

  const testEntries = [
    testEntry,
    {
      id: 'entry-id-456',
      title: 'Another Entry',
      content: 'This is another test entry',
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEntry', () => {
    test('should create an entry successfully', async () => {
      // Data for creating entry
      const entryData = {
        title: 'New Entry',
        content: 'Content of the new entry',
        userId: userId,
        tags: ['tag-1', 'tag-2']
      };

      // Configure mock for entry creation
      mockPrismaClient.entry.create.mockResolvedValue({
        ...testEntry,
        title: entryData.title,
        content: entryData.content,
        tags: [{ id: 'tag-1' }, { id: 'tag-2' }]
      });

      // Execute method
      const result = await entryService.createEntry(entryData);

      // Verify that entry was created with the correct data
      expect(mockPrismaClient.entry.create).toHaveBeenCalledWith({
        data: {
          title: entryData.title,
          content: entryData.content,
          userId: entryData.userId,
          tags: {
            connect: entryData.tags.map(tagId => ({ id: tagId }))
          }
        },
        include: {
          tags: true
        }
      });

      // Verify result
      expect(result).toEqual({
        ...testEntry,
        title: entryData.title,
        content: entryData.content,
        tags: [{ id: 'tag-1' }, { id: 'tag-2' }]
      });
    });

    test('should handle error when creating an entry', async () => {
      // Data to create entry
      const entryData = {
        title: 'New Entry',
        content: 'Content of the new entry',
        userId: userId
      };

      // Configure mock to throw error
      const errorMsg = 'Prisma error when creating entry';
      mockPrismaClient.entry.create.mockRejectedValue(new Error(errorMsg));

      // Execute and verify it throws error
      await expect(entryService.createEntry(entryData)).rejects.toThrow(
        'Error creating entry'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error creating entry in service',
        expect.objectContaining({
          error: errorMsg,
          userId: userId
        })
      );
    });
  });

  describe('getEntries', () => {
    test('should get entries with default pagination', async () => {
      // Configure mocks
      mockPrismaClient.entry.count.mockResolvedValue(10);
      mockPrismaClient.entry.findMany.mockResolvedValue(testEntries);

      // Execute method
      const result = await entryService.getEntries({ userId });

      // Verify Prisma calls
      expect(mockPrismaClient.entry.count).toHaveBeenCalledWith({
        where: { userId }
      });

      expect(mockPrismaClient.entry.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { tags: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });

      // Verify result
      expect(result).toEqual({
        entries: testEntries,
        pagination: {
          total: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    });

    test('should apply search filters correctly', async () => {
      // Search parameters
      const searchParams = {
        userId,
        search: 'test',
        page: 2,
        limit: 5,
        sort: 'asc' as const
      };

      // Configure mocks
      mockPrismaClient.entry.count.mockResolvedValue(15);
      mockPrismaClient.entry.findMany.mockResolvedValue([testEntries[1]]);

      // Execute method
      const result = await entryService.getEntries(searchParams);

      // Verify Prisma calls with correct filters
      expect(mockPrismaClient.entry.count).toHaveBeenCalledWith({
        where: {
          userId,
          OR: [{ title: { contains: 'test' } }, { content: { contains: 'test' } }]
        }
      });

      expect(mockPrismaClient.entry.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          OR: [{ title: { contains: 'test' } }, { content: { contains: 'test' } }]
        },
        include: { tags: true },
        orderBy: { createdAt: 'asc' },
        skip: 5, // (page 2 - 1) * limit 5
        take: 5
      });

      // Verify result (updated to match implementation calculated values)
      expect(result).toEqual({
        entries: [testEntries[1]],
        pagination: {
          total: 15,
          page: 2,
          limit: 5,
          totalPages: 3,
          hasNextPage: true, // Corrected from false to true (page 2 of 3 has next page)
          hasPrevPage: true
        }
      });
    });

    test('should filter by tagId correctly', async () => {
      // Parameters with tag filter
      const tagParams = {
        userId,
        tagId: 'tag-1'
      };

      // Configure mocks
      mockPrismaClient.entry.count.mockResolvedValue(2);
      mockPrismaClient.entry.findMany.mockResolvedValue(testEntries);

      // Execute method
      const result = await entryService.getEntries(tagParams);

      // Verify Prisma calls with tag filter
      expect(mockPrismaClient.entry.count).toHaveBeenCalledWith({
        where: {
          userId,
          tags: {
            some: {
              id: 'tag-1'
            }
          }
        }
      });

      expect(mockPrismaClient.entry.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          tags: {
            some: {
              id: 'tag-1'
            }
          }
        },
        include: { tags: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });

      expect(result.entries).toEqual(testEntries);
    });

    test('should handle error when getting entries', async () => {
      // Configure mock to throw error
      mockPrismaClient.entry.count.mockRejectedValue(new Error('Database error'));

      // Execute and verify it throws error
      await expect(entryService.getEntries({ userId })).rejects.toThrow(
        'Error getting entries'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting entries in service',
        expect.objectContaining({
          error: 'Database error',
          userId
        })
      );
    });
  });

  describe('getEntryById', () => {
    test('should get an entry by ID successfully', async () => {
      // Configure mock
      mockPrismaClient.entry.findFirst.mockResolvedValue(testEntry);

      // Execute method
      const result = await entryService.getEntryById(entryId, userId);

      // Verify Prisma call
      expect(mockPrismaClient.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: entryId,
          userId
        },
        include: {
          tags: true
        }
      });

      // Verify result
      expect(result).toEqual(testEntry);
    });

    test('should throw error if entry does not exist', async () => {
      // Configure mock for no entry found
      mockPrismaClient.entry.findFirst.mockResolvedValue(null);

      // Execute and verify it throws error
      await expect(entryService.getEntryById('non-existent-id', userId)).rejects.toThrow(
        'Error getting entry'
      );

      // Verify Prisma call
      expect(mockPrismaClient.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'non-existent-id',
          userId
        },
        include: {
          tags: true
        }
      });
    });

    test('should handle database errors', async () => {
      // Configure mock to throw error
      mockPrismaClient.entry.findFirst.mockRejectedValue(new Error('Database error'));

      // Execute and verify it throws error
      await expect(entryService.getEntryById(entryId, userId)).rejects.toThrow(
        'Error getting entry'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting entry by ID in service',
        expect.objectContaining({
          error: 'Database error',
          entryId,
          userId
        })
      );
    });
  });

  describe('updateEntry', () => {
    test('should update an entry successfully', async () => {
      // Data to update
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['tag-3', 'tag-4']
      };

      // Configure mocks
      mockPrismaClient.entry.findFirst.mockResolvedValue(testEntry);
      mockPrismaClient.entry.update.mockResolvedValue({
        ...testEntry,
        ...updateData,
        tags: [{ id: 'tag-3' }, { id: 'tag-4' }]
      });

      // Execute method
      const result = await entryService.updateEntry(entryId, userId, updateData);

      // Verify entry is first searched
      expect(mockPrismaClient.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: entryId,
          userId
        }
      });

      // Verify entry is updated
      expect(mockPrismaClient.entry.update).toHaveBeenCalledWith({
        where: { id: entryId },
        data: {
          title: updateData.title,
          content: updateData.content,
          tags: {
            set: [],
            connect: updateData.tags.map(tagId => ({ id: tagId }))
          }
        },
        include: {
          tags: true
        }
      });

      // Verify result
      expect(result).toEqual({
        ...testEntry,
        title: updateData.title,
        content: updateData.content,
        tags: [{ id: 'tag-3' }, { id: 'tag-4' }]
      });
    });

    test('should throw error if entry does not exist', async () => {
      // Configure mock to not find entry
      mockPrismaClient.entry.findFirst.mockResolvedValue(null);

      // Data to update
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      // Execute and verify it throws error
      await expect(entryService.updateEntry('non-existent-id', userId, updateData)).rejects.toThrow(
        'Error updating entry'
      );

      // Verify entry was searched
      expect(mockPrismaClient.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'non-existent-id',
          userId
        }
      });

      // Verify update was not attempted
      expect(mockPrismaClient.entry.update).not.toHaveBeenCalled();
    });

    test('should handle errors when updating', async () => {
      // Configure mocks
      mockPrismaClient.entry.findFirst.mockResolvedValue(testEntry);
      mockPrismaClient.entry.update.mockRejectedValue(new Error('Database error'));

      // Data to update
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      // Execute and verify it throws error
      await expect(entryService.updateEntry(entryId, userId, updateData)).rejects.toThrow(
        'Error updating entry'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error updating entry in service',
        expect.objectContaining({
          error: 'Database error',
          entryId,
          userId
        })
      );
    });
  });

  describe('deleteEntry', () => {
    test('should delete an entry successfully', async () => {
      // Configure mocks
      mockPrismaClient.entry.findFirst.mockResolvedValue(testEntry);
      mockPrismaClient.entry.delete.mockResolvedValue(testEntry);

      // Execute method
      const result = await entryService.deleteEntry(entryId, userId);

      // Verify entry is first searched
      expect(mockPrismaClient.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: entryId,
          userId
        }
      });

      // Verify entry is deleted
      expect(mockPrismaClient.entry.delete).toHaveBeenCalledWith({
        where: { id: entryId }
      });

      // Verify result
      expect(result).toBe(true);
    });

    test('should throw error if entry does not exist', async () => {
      // Configure mock to not find entry
      mockPrismaClient.entry.findFirst.mockResolvedValue(null);

      // Execute and verify it throws error
      await expect(entryService.deleteEntry('non-existent-id', userId)).rejects.toThrow(
        'Error deleting entry'
      );

      // Verify entry was searched
      expect(mockPrismaClient.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'non-existent-id',
          userId
        }
      });

      // Verify delete was not attempted
      expect(mockPrismaClient.entry.delete).not.toHaveBeenCalled();
    });

    test('should handle errors when deleting', async () => {
      // Configure mocks
      mockPrismaClient.entry.findFirst.mockResolvedValue(testEntry);
      mockPrismaClient.entry.delete.mockRejectedValue(new Error('Database error'));

      // Execute and verify it throws error
      await expect(entryService.deleteEntry(entryId, userId)).rejects.toThrow(
        'Error deleting entry'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error deleting entry in service',
        expect.objectContaining({
          error: 'Database error',
          entryId,
          userId
        })
      );
    });
  });

  describe('getEntryForExport', () => {
    test('should export an entry successfully', async () => {
      // Create spy for getEntryById
      const getEntryByIdSpy = jest.spyOn(entryService, 'getEntryById');
      getEntryByIdSpy.mockResolvedValue(testEntry);

      // Execute method
      const result = await entryService.getEntryForExport(entryId, userId);

      // Verify getEntryById was called
      expect(getEntryByIdSpy).toHaveBeenCalledWith(entryId, userId);

      // Verify result
      expect(result).toEqual(testEntry);

      // Restore spy
      getEntryByIdSpy.mockRestore();
    });

    test('should handle errors when exporting', async () => {
      // Create spy for getEntryById
      const getEntryByIdSpy = jest.spyOn(entryService, 'getEntryById');
      getEntryByIdSpy.mockRejectedValue(new Error('Database error'));

      // Execute and verify it throws error
      await expect(entryService.getEntryForExport(entryId, userId)).rejects.toThrow(
        'Error exporting entry'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error exporting entry in service',
        expect.objectContaining({
          error: 'Database error',
          entryId,
          userId
        })
      );

      // Restore spy
      getEntryByIdSpy.mockRestore();
    });
  });
});
