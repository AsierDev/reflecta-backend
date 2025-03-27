import { Router } from 'express';
import { createTag, getTags, updateTag, deleteTag } from '../controllers/tag.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { tagSchema } from '../validations/tag.schema';

const router = Router();

// All tag routes require authentication
router.use(authMiddleware);

// Tag routes
router.post('/', validate(tagSchema), createTag);
router.get('/', getTags);
router.put('/:id', validate(tagSchema), updateTag);
router.delete('/:id', deleteTag);

export default router;
