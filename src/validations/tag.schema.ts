import { z } from 'zod';

export const tagSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Tag name is required')
      .max(50, 'Tag name must be maximum 50 characters'),
    color: z
      .string()
      .regex(
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        'Color must be a valid hexadecimal value, e.g.: #FF0000'
      )
      .optional()
  })
});
