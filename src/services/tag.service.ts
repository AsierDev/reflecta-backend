import logger from '../utils/logger';
import prisma from '../lib/prisma';

class TagService {
  /**
   * Create a new tag
   */
  async createTag(data: { name: string; color?: string; userId: string }) {
    try {
      const tag = await prisma.tag.create({
        data: {
          name: data.name,
          color: data.color || '#808080', // Default color if not provided
          userId: data.userId
        }
      });

      return tag;
    } catch (error) {
      logger.error('Error creating tag in service', { error });
      throw new Error('Error creating tag');
    }
  }

  /**
   * Get all tags for a user
   */
  async getTags(userId: string) {
    try {
      const tags = await prisma.tag.findMany({
        where: {
          userId
        },
        orderBy: {
          name: 'asc'
        }
      });

      return tags;
    } catch (error) {
      logger.error('Error getting tags in service', { error });
      throw new Error('Error getting tags');
    }
  }

  /**
   * Get a tag by ID
   */
  async getTagById(tagId: string, userId: string) {
    try {
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          userId
        }
      });

      if (!tag) {
        throw new Error('Tag not found');
      }

      return tag;
    } catch (error) {
      logger.error('Error getting tag by ID in service', { error, tagId });
      throw new Error('Error getting tag');
    }
  }

  /**
   * Update a tag
   */
  async updateTag(
    tagId: string,
    userId: string,
    data: {
      name: string;
      color?: string;
    }
  ) {
    try {
      // Verify that the tag exists and belongs to the user
      const existingTag = await this.getTagById(tagId, userId);

      // Update the tag
      const updatedTag = await prisma.tag.update({
        where: { id: tagId },
        data: {
          name: data.name,
          color: data.color
        }
      });

      return updatedTag;
    } catch (error) {
      logger.error('Error updating tag in service', { error, tagId });
      if (error instanceof Error && error.message === 'Tag not found') {
        throw error; // Reuse original error
      }
      throw new Error('Error updating tag');
    }
  }

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string, userId: string) {
    try {
      // Verify that the tag exists and belongs to the user
      const existingTag = await this.getTagById(tagId, userId);

      // Delete the tag
      await prisma.tag.delete({
        where: { id: tagId }
      });

      return true;
    } catch (error) {
      logger.error('Error deleting tag in service', { error, tagId });
      if (error instanceof Error && error.message === 'Tag not found') {
        throw error; // Reuse original error
      }
      throw new Error('Error deleting tag');
    }
  }
}

export default new TagService();
