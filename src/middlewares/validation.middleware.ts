import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import logger from '../utils/logger';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      next();
    } catch (error: any) {
      logger.error('Validation error', {
        path: req.path,
        errors: error.errors
      });

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
  };
};
