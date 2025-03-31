import entryService from '../entry.service';
import logger from '../../utils/logger';
import prisma from '../../lib/prisma';

// Logger mock
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Initialize Prisma mock functions
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    entry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

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
      (prisma.entry.create as jest.Mock).mockResolvedValue({
        ...testEntry,
        title: entryData.title,
        content: entryData.content,
        tags: [{ id: 'tag-1' }, { id: 'tag-2' }]
      });

      // Execute method
      const result = await entryService.createEntry(entryData);

      // Verify that entry was created with the correct data
      expect(prisma.entry.create).toHaveBeenCalledWith({
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
      (prisma.entry.create as jest.Mock).mockRejectedValue(new Error(errorMsg));

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
      (prisma.entry.count as jest.Mock).mockResolvedValue(10);
      (prisma.entry.findMany as jest.Mock).mockResolvedValue(testEntries);

      // Execute method
      const result = await entryService.getEntries({ userId });

      // Verify Prisma calls
      expect(prisma.entry.count).toHaveBeenCalledWith({
        where: { userId }
      });

      expect(prisma.entry.findMany).toHaveBeenCalledWith({
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
      (prisma.entry.count as jest.Mock).mockResolvedValue(15);
      (prisma.entry.findMany as jest.Mock).mockResolvedValue([testEntries[1]]);

      // Execute method
      const result = await entryService.getEntries(searchParams);

      // Verify Prisma calls with correct filters
      expect(prisma.entry.count).toHaveBeenCalledWith({
        where: {
          userId,
          OR: [{ title: { contains: 'test' } }, { content: { contains: 'test' } }]
        }
      });

      expect(prisma.entry.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          OR: [{ title: { contains: 'test' } }, { content: { contains: 'test' } }]
        },
        include: { tags: true },
        orderBy: { createdAt: 'asc' },
        skip: 5,
        take: 5
      });

      // Verify result
      expect(result).toEqual({
        entries: [testEntries[1]],
        pagination: {
          total: 15,
          page: 2,
          limit: 5,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: true
        }
      });
    });

    test('should filter by tagId correctly', async () => {
      // Search parameters with tagId
      const searchParams = {
        userId,
        tagId: 'tag-1'
      };

      // Configure mocks
      (prisma.entry.count as jest.Mock).mockResolvedValue(1);
      (prisma.entry.findMany as jest.Mock).mockResolvedValue([testEntry]);

      // Execute method
      const result = await entryService.getEntries(searchParams);

      // Verify Prisma calls with tag filter
      expect(prisma.entry.count).toHaveBeenCalledWith({
        where: {
          userId,
          tags: { some: { id: 'tag-1' } }
        }
      });

      expect(prisma.entry.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          tags: { some: { id: 'tag-1' } }
        },
        include: { tags: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });

      // Verify result
      expect(result.entries).toEqual([testEntry]);
    });

    test('should handle error when getting entries', async () => {
      // Configure mock to throw error
      const errorMsg = 'Database error';
      (prisma.entry.count as jest.Mock).mockRejectedValue(new Error(errorMsg));

      // Execute and verify it throws error
      await expect(entryService.getEntries({ userId })).rejects.toThrow(
        'Error getting entries'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting entries in service',
        expect.objectContaining({
          error: errorMsg,
          userId: userId
        })
      );
    });
  });

  describe('getEntryById', () => {
    test('should get an entry by ID successfully', async () => {
      // Configure mock
      (prisma.entry.findFirst as jest.Mock).mockResolvedValue(testEntry);

      // Execute method
      const result = await entryService.getEntryById(entryId, userId);

      // Verify Prisma call
      expect(prisma.entry.findFirst).toHaveBeenCalledWith({
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
      // Configure mock to return null
      (prisma.entry.findFirst as jest.Mock).mockResolvedValue(null);

      // Execute and verify error
      await expect(entryService.getEntryById('non-existent-id', userId)).rejects.toThrow(
        'Entry not found'
      );

      // Verify Prisma call
      expect(prisma.entry.findFirst).toHaveBeenCalledWith({
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
      const errorMsg = 'Database error';
      (prisma.entry.findFirst as jest.Mock).mockRejectedValue(new Error(errorMsg));

      // Execute and verify error
      await expect(entryService.getEntryById(entryId, userId)).rejects.toThrow(
        'Error getting entry'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting entry by ID in service',
        expect.objectContaining({
          error: errorMsg,
          entryId,
          userId
        })
      );
    });
  });

  describe('updateEntry', () => {
    test('should update an entry successfully', async () => {
      // Update data
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['tag-3', 'tag-4']
      };

      // Configure mocks
      (prisma.entry.findFirst as jest.Mock).mockResolvedValue(testEntry);
      (prisma.entry.update as jest.Mock).mockResolvedValue({
        ...testEntry,
        ...updateData,
        tags: [{ id: 'tag-3' }, { id: 'tag-4' }]
      });

      // Execute method
      const result = await entryService.updateEntry(entryId, userId, updateData);

      // Verify Prisma calls
      expect(prisma.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: entryId,
          userId
        }
      });

      expect(prisma.entry.update).toHaveBeenCalledWith({
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
        ...updateData,
        tags: [{ id: 'tag-3' }, { id: 'tag-4' }]
      });
    });

    test('should throw error if entry does not exist', async () => {
      // Configure mock to return null
      (prisma.entry.findFirst as jest.Mock).mockResolvedValue(null);

      // Execute and verify error
      await expect(
        entryService.updateEntry('non-existent-id', userId, { 
          title: 'New Title',
          content: 'New Content'
        })
      ).rejects.toThrow('Entry not found');

      // Verify entry was searched
      expect(prisma.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'non-existent-id',
          userId
        }
      });

      // Verify update wasn't attempted
      expect(prisma.entry.update).not.toHaveBeenCalled();
    });

    test('should handle errors when updating', async () => {
      // Configure mocks
      (prisma.entry.findFirst as jest.Mock).mockResolvedValue(testEntry);
      const errorMsg = 'Database error';
      (prisma.entry.update as jest.Mock).mockRejectedValue(new Error(errorMsg));

      // Execute and verify error
      await expect(
        entryService.updateEntry(entryId, userId, { 
          title: 'New Title',
          content: 'New Content'
        })
      ).rejects.toThrow('Error updating entry');

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error updating entry in service',
        expect.objectContaining({
          error: errorMsg,
          entryId,
          userId
        })
      );
    });
  });

  describe('deleteEntry', () => {
    test('should delete an entry successfully', async () => {
      // Configure mocks
      (prisma.entry.findFirst as jest.Mock).mockResolvedValue(testEntry);
      (prisma.entry.delete as jest.Mock).mockResolvedValue(testEntry);

      // Execute method
      const result = await entryService.deleteEntry(entryId, userId);

      // Verify Prisma calls
      expect(prisma.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: entryId,
          userId
        }
      });

      expect(prisma.entry.delete).toHaveBeenCalledWith({
        where: { id: entryId }
      });

      // Verify result
      expect(result).toBe(true);
    });

    test('should throw error if entry does not exist', async () => {
      // Configure mock to return null
      (prisma.entry.findFirst as jest.Mock).mockResolvedValue(null);

      // Execute and verify error
      await expect(
        entryService.deleteEntry('non-existent-id', userId)
      ).rejects.toThrow('Entry not found');

      // Verify entry was searched
      expect(prisma.entry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'non-existent-id',
          userId
        }
      });

      // Verify delete wasn't attempted
      expect(prisma.entry.delete).not.toHaveBeenCalled();
    });

    test('should handle errors when deleting', async () => {
      // Configure mocks
      (prisma.entry.findFirst as jest.Mock).mockResolvedValue(testEntry);
      const errorMsg = 'Database error';
      (prisma.entry.delete as jest.Mock).mockRejectedValue(new Error(errorMsg));

      // Execute and verify error
      await expect(entryService.deleteEntry(entryId, userId)).rejects.toThrow(
        'Error deleting entry'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error deleting entry in service',
        expect.objectContaining({
          error: errorMsg,
          entryId,
          userId
        })
      );
    });
  });

  describe('getEntryForExport', () => {
    test('should export an entry successfully', async () => {
      // Configure mock
      (prisma.entry.findFirst as jest.Mock).mockResolvedValue(testEntry);

      // Execute method
      const result = await entryService.getEntryForExport(entryId, userId);

      // Verify result
      expect(result).toEqual(testEntry);
    });

    test('should handle errors when exporting', async () => {
      // Configure mock to throw error
      const errorMsg = 'Database error';
      (prisma.entry.findFirst as jest.Mock).mockRejectedValue(new Error(errorMsg));

      // Execute and verify error
      await expect(entryService.getEntryForExport(entryId, userId)).rejects.toThrow(
        'Error exporting entry'
      );

      // Verify logger was called with error
      expect(logger.error).toHaveBeenCalledWith(
        'Error exporting entry in service',
        expect.objectContaining({
          error: errorMsg,
          entryId,
          userId
        })
      );
    });
  });
});
