import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/sync/dropbox - Trigger manual Dropbox sync
router.post('/dropbox', authMiddleware, SyncController.syncFromDropbox);

export default router;
