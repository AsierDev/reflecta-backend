import logger from '../utils/logger';
import prisma from '../lib/prisma';

class EntryService {
  /**
   * Create a new entry
   */
  async createEntry(data: { title: string; content: string; userId: string; tags?: string[] }) {
    try {
      // Create entry
      const entry = await prisma.entry.create({
        data: {
          title: data.title,
          content: data.content,
          userId: data.userId,
          tags: {
            connect: data.tags?.map(tagId => ({ id: tagId })) || []
          }
        },
        include: {
          tags: true
        }
      });

      return entry;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating entry in service', {
          error: error.message,
          userId: data.userId
        });
      } else {
        logger.error('Error creating entry in service', {
          error: String(error),
          userId: data.userId
        });
      }
      throw new Error('Error creating entry');
    }
  }

  /**
   * Get entries with pagination and filters
   */
  async getEntries(params: {
    userId: string;
    search?: string;
    tagId?: string;
    sort?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    try {
      const { userId, search, tagId, sort = 'desc', page = 1, limit = 10 } = params;

      // Set up pagination
      const skip = (page - 1) * limit;

      // Build query
      const where: any = { userId };

      // Filter by search
      if (search) {
        where.OR = [{ title: { contains: search } }, { content: { contains: search } }];
      }

      // Filter by tag
      if (tagId) {
        where.tags = {
          some: {
            id: tagId
          }
        };
      }

      // Count total for pagination
      const total = await prisma.entry.count({ where });

      // Get entries
      const entries = await prisma.entry.findMany({
        where,
        include: {
          tags: true
        },
        orderBy: {
          createdAt: sort === 'asc' ? 'asc' : 'desc'
        },
        skip,
        take: limit
      });

      // Pagination data
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        entries,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting entries in service', {
          error: error.message,
          userId: params.userId
        });
      } else {
        logger.error('Error getting entries in service', {
          error: String(error),
          userId: params.userId
        });
      }
      throw new Error('Error getting entries');
    }
  }

  /**
   * Get an entry by ID
   */
  async getEntryById(entryId: string, userId: string) {
    try {
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          userId
        },
        include: {
          tags: true
        }
      });

      if (!entry) {
        throw new Error('Entry not found');
      }

      return entry;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting entry by ID in service', {
          error: error.message,
          entryId,
          userId
        });
      } else {
        logger.error('Error getting entry by ID in service', {
          error: String(error),
          entryId,
          userId
        });
      }
      throw new Error('Error getting entry');
    }
  }

  /**
   * Update an entry
   */
  async updateEntry(
    entryId: string,
    userId: string,
    data: {
      title: string;
      content: string;
      tags?: string[];
    }
  ) {
    try {
      // Verify that the entry exists and belongs to the user
      const existingEntry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          userId
        }
      });

      if (!existingEntry) {
        throw new Error('Entry not found');
      }

      // Update the entry
      const updatedEntry = await prisma.entry.update({
        where: { id: entryId },
        data: {
          title: data.title,
          content: data.content,
          tags: {
            set: [], // Remove all existing relationships
            connect: data.tags?.map(tagId => ({ id: tagId })) || []
          }
        },
        include: {
          tags: true
        }
      });

      return updatedEntry;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating entry in service', { error: error.message, entryId, userId });
      } else {
        logger.error('Error updating entry in service', { error: String(error), entryId, userId });
      }
      throw new Error('Error updating entry');
    }
  }

  /**
   * Delete an entry
   */
  async deleteEntry(entryId: string, userId: string) {
    try {
      // Verify that the entry exists and belongs to the user
      const existingEntry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          userId
        }
      });

      if (!existingEntry) {
        throw new Error('Entry not found');
      }

      // Delete the entry
      await prisma.entry.delete({
        where: { id: entryId }
      });

      return true;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting entry in service', { error: error.message, entryId, userId });
      } else {
        logger.error('Error deleting entry in service', { error: String(error), entryId, userId });
      }
      throw new Error('Error deleting entry');
    }
  }

  /**
   * Export an entry
   */
  async getEntryForExport(entryId: string, userId: string) {
    try {
      const entry = await this.getEntryById(entryId, userId);
      return entry;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error exporting entry in service', { error: error.message, entryId, userId });
      } else {
        logger.error('Error exporting entry in service', { error: String(error), entryId, userId });
      }
      throw new Error('Error exporting entry');
    }
  }
}

export default new EntryService();
