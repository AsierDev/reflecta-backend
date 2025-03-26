import { z } from 'zod';

export const entrySchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(100, 'Title must be a maximum of 100 characters'),
    content: z.string().min(1, 'Content is required'),
    tags: z.array(z.string().uuid('Invalid tag ID')).optional()
  })
});