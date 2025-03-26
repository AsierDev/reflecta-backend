import { Request, Response } from 'express';
  import entryService from '../services/entry.service';
  import logger from '../utils/logger';

  // Create a new entry
  export const createEntry = async (req: Request, res: Response) => {
    try {
      const { title, content, tags } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Create the entry using the service
      const entry = await entryService.createEntry({
        title,
        content,
        userId,
        tags
      });

      logger.info(`Entry created: ${entry.id}`, { userId });

      res.status(201).json({
        success: true,
        data: entry
      });
    } catch (error: any) {
      logger.error('Error creating the entry', { error });
      res.status(500).json({
        success: false,
        error: error.message || 'Error creating the entry'
      });
    }
  };

  // Get all user entries with pagination
  export const getEntries = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { search, tagId, sort = 'desc', page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Get entries using the service
      const result = await entryService.getEntries({
        userId,
        search: search as string,
        tagId: tagId as string,
        sort: sort as 'asc' | 'desc',
        page: parseInt(page as string, 10) || 1,
        limit: parseInt(limit as string, 10) || 10
      });

      res.json({
        success: true,
        data: result.entries,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Error getting the entries', { error });
      res.status(500).json({
        success: false,
        error: error.message || 'Error getting the entries'
      });
    }
  };

  // Get an entry by ID
  export const getEntryById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Get entry by ID using the service
      const entry = await entryService.getEntryById(id, userId);

      res.json({
        success: true,
        data: entry
      });
    } catch (error: any) {
      logger.error('Error getting the entry', { error, entryId: req.params.id });
      res.status(error.message === 'Entry not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Error getting the entry'
      });
    }
  };

  // Update an entry
  export const updateEntry = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, content, tags } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Update entry using the service
      const updatedEntry = await entryService.updateEntry(id, userId, {
        title,
        content,
        tags
      });

      logger.info(`Entry updated: ${id}`, { userId });

      res.json({
        success: true,
        data: updatedEntry
      });
    } catch (error: any) {
      logger.error('Error updating the entry', { error, entryId: req.params.id });
      res.status(error.message === 'Entry not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Error updating the entry'
      });
    }
  };

  // Delete an entry
  export const deleteEntry = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Delete entry using the service
      await entryService.deleteEntry(id, userId);

      logger.info(`Entry deleted: ${id}`, { userId });

      res.json({
        success: true,
        data: null
      });
    } catch (error: any) {
      logger.error('Error deleting the entry', { error, entryId: req.params.id });
      res.status(error.message === 'Entry not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Error deleting the entry'
      });
    }
  };

  // Export an entry
  export const exportEntry = async (req: Request, res: Response) => {
    try {
      const { id, format } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Get the entry for export
      const entry = await entryService.getEntryForExport(id, userId);

      // Export according to the requested format
      switch (format) {
        case 'txt':
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', `attachment; filename="entry-${id}.txt"`);
          return res.send(`${entry.title}\n\n${entry.content}`);

        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="entry-${id}.json"`);
          return res.send(JSON.stringify(entry, null, 2));

        case 'html':
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Content-Disposition', `attachment; filename="entry-${id}.html"`);
          return res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${entry.title}</title>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #333; }
                  .tags { display: flex; flex-wrap: wrap; margin-bottom: 20px; }
                  .tag { background: #eee; border-radius: 3px; padding: 2px 8px; margin-right: 5px; font-size: 14px; }
                  .content { line-height: 1.8; }
                  .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
                </style>
              </head>
              <body>
                <h1>${entry.title}</h1>
                <div class="meta">Created: ${new Date(entry.createdAt).toLocaleString()}</div>
                <div class="tags">
                  ${entry.tags.map((tag: any) => `<span class="tag">${tag.name}</span>`).join('')}
                </div>
                <div class="content">${entry.content}</div>
              </body>
            </html>
          `);

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid export format'
          });
      }
    } catch (error: any) {
      logger.error('Error exporting the entry', {
        error,
        entryId: req.params.id,
        format: req.params.format
      });
      res.status(error.message === 'Entry not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Error exporting the entry'
      });
    }
  };