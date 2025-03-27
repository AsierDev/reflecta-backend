import { Request, Response } from 'express';
import tagService from '../services/tag.service';
import logger from '../utils/logger';

// Create a new tag
export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Create the tag using the service
    const tag = await tagService.createTag({
      name,
      color,
      userId
    });

    logger.info(`Tag created: ${tag.id}`, { userId });

    res.status(201).json({
      success: true,
      data: tag
    });
  } catch (error: any) {
    logger.error('Error creating tag', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Error creating tag'
    });
  }
};

// Get all user's tags
export const getTags = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Get the tags using the service
    const tags = await tagService.getTags(userId);

    res.json({
      success: true,
      data: tags
    });
  } catch (error: any) {
    logger.error('Error getting tags', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Error getting tags'
    });
  }
};

// Update a tag
export const updateTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Update the tag using the service
    const updatedTag = await tagService.updateTag(id, userId, {
      name,
      color
    });

    logger.info(`Tag updated: ${id}`, { userId });

    res.json({
      success: true,
      data: updatedTag
    });
  } catch (error: any) {
    logger.error('Error updating tag', { error, tagId: req.params.id });
    res.status(error.message === 'Tag not found' ? 404 : 500).json({
      success: false,
      error: error.message || 'Error updating tag'
    });
  }
};

// Delete a tag
export const deleteTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Delete the tag using the service
    await tagService.deleteTag(id, userId);

    logger.info(`Tag deleted: ${id}`, { userId });

    res.json({
      success: true,
      data: null
    });
  } catch (error: any) {
    logger.error('Error deleting tag', { error, tagId: req.params.id });
    res.status(error.message === 'Tag not found' ? 404 : 500).json({
      success: false,
      error: error.message || 'Error deleting tag'
    });
  }
};
