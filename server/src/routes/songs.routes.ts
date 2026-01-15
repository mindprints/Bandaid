import { Router } from 'express';
import { SongsController } from '../controllers/songs.controller.js';
import { VersionsController } from '../controllers/versions.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/songs - Get all songs
router.get('/', authMiddleware, SongsController.getAllSongs);

// GET /api/songs/:id - Get song by ID
router.get('/:id', authMiddleware, SongsController.getSongById);

// GET /api/songs/:songId/versions - Get all versions for a song
router.get('/:songId/versions', authMiddleware, VersionsController.getVersionsBySongId);

export default router;
