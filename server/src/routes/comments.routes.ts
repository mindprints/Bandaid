import { Router } from 'express';
import { CommentsController } from '../controllers/comments.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// PUT /api/comments/:commentId - Update comment
router.put('/:commentId', authMiddleware, CommentsController.updateComment);

// DELETE /api/comments/:commentId - Delete comment
router.delete('/:commentId', authMiddleware, CommentsController.deleteComment);

export default router;
