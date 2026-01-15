import { Router } from 'express';
import { VersionsController } from '../controllers/versions.controller.js';
import { RatingsController } from '../controllers/ratings.controller.js';
import { CommentsController } from '../controllers/comments.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/versions/:id - Get version by ID
router.get('/:id', authMiddleware, VersionsController.getVersionById);

// GET /api/versions/:versionId/audio - Stream audio file
router.get('/:versionId/audio', authMiddleware, VersionsController.streamAudio);

// Ratings routes
// POST /api/versions/:versionId/ratings - Create or update rating
router.post('/:versionId/ratings', authMiddleware, RatingsController.createOrUpdateRating);

// GET /api/versions/:versionId/ratings - Get all ratings for a version
router.get('/:versionId/ratings', authMiddleware, RatingsController.getRatingsByVersionId);

// DELETE /api/versions/:versionId/ratings - Delete user's rating
router.delete('/:versionId/ratings', authMiddleware, RatingsController.deleteRating);

// Comments routes
// POST /api/versions/:versionId/comments - Create comment
router.post('/:versionId/comments', authMiddleware, CommentsController.createComment);

// GET /api/versions/:versionId/comments - Get all comments for a version
router.get('/:versionId/comments', authMiddleware, CommentsController.getCommentsByVersionId);

export default router;
