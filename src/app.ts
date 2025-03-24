import express from 'express';
  import cors from 'cors';
  import morgan from 'morgan';
  import helmet from 'helmet';
  import authRoutes from './routes/auth.routes';
  import entryRoutes from './routes/entry.routes';
  import tagRoutes from './routes/tag.routes';
  import { errorHandler } from './middlewares/error.middleware';
  import logger from './utils/logger';

  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration with specific options
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || '*'
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  };
  app.use(cors(corsOptions));

  // Request parsing middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // HTTP request logging
  const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim())
    }
  }));

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/entries', entryRoutes);
  app.use('/api/tags', tagRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'up',
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Not found handler
  app.use((req, res) => {
    logger.warn(`Route not found: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      ip: req.ip
    });
    res.status(404).json({
      success: false,
      error: 'Route not found'
    });
  });

  export default app;