import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

// Constants for status codes
export const STATUS_CODES = {
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500
};

// Constants for error messages
export const ERROR_MESSAGES = {
  NO_TOKEN: 'Unauthorized - Token not provided',
  INVALID_TOKEN: 'Unauthorized - Invalid token',
  EXPIRED_TOKEN: 'Unauthorized - Token expired',
  SERVER_CONFIG: 'Server configuration error'
};

// Interface for JWT payload
interface JwtPayload {
  userId: string;
  email?: string;
}

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Access attempt without authorization token', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.NO_TOKEN
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT_SECRET existence
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not defined in environment variables');
      return res.status(STATUS_CODES.SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.SERVER_CONFIG
      });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Add user to request
    req.user = { userId: decoded.userId };
    if (decoded.email) {
      req.user.email = decoded.email;
    }

    next();
  } catch (error) {
    logger.error('Authentication error', {
      error,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    // Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.EXPIRED_TOKEN
      });
    }

    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.INVALID_TOKEN
    });
  }
};
