import { Router } from 'express';
import {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  exportEntry
} from '../controllers/entry.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { entrySchema } from '../validations/entry.schema';

const router = Router();

// Every route in this file requires authentication
router.use(authMiddleware);

// Entry routes
router.post('/', validate(entrySchema), createEntry);
router.get('/', getEntries);
router.get('/:id', getEntryById);
router.put('/:id', validate(entrySchema), updateEntry);
router.delete('/:id', deleteEntry);
router.get('/:id/export/:format', exportEntry);

export default router;
