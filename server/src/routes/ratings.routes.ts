import { Router } from 'express';
import { RatingsController } from '../controllers/ratings.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/versions/:versionId/ratings - Create or update rating
router.post('/:versionId/ratings', authMiddleware, RatingsController.createOrUpdateRating);

// GET /api/versions/:versionId/ratings - Get all ratings for a version
router.get('/:versionId/ratings', authMiddleware, RatingsController.getRatingsByVersionId);

// DELETE /api/versions/:versionId/ratings - Delete user's rating
router.delete('/:versionId/ratings', authMiddleware, RatingsController.deleteRating);

export default router;
