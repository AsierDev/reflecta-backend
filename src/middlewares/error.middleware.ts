import { Request, Response } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (err: AppError, req: Request, res: Response) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server error';

  logger.error(`Error: ${message}`, {
    error: err,
    path: req.path,
    method: req.method,
    ip: req.ip,
    statusCode
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
