import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { CommentsService } from '../services/comments.service.js';

export class CommentsController {
  static async createComment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) {
        return res.status(400).json({ message: 'Invalid version ID' });
      }

      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Comment content is required' });
      }

      const comment = CommentsService.createComment(versionId, req.user.userId, content);

      res.status(201).json({
        message: 'Comment created',
        comment
      });
    } catch (error: any) {
      console.error('Create comment error:', error);
      res.status(500).json({
        message: 'Failed to create comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getCommentsByVersionId(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) {
        return res.status(400).json({ message: 'Invalid version ID' });
      }

      const comments = CommentsService.getCommentsByVersionId(versionId);

      res.json({ comments });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  }

  static async updateComment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const commentId = parseInt(req.params.commentId, 10);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: 'Invalid comment ID' });
      }

      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Comment content is required' });
      }

      const comment = CommentsService.updateComment(commentId, req.user.userId, content);

      res.json({
        message: 'Comment updated',
        comment
      });
    } catch (error: any) {
      console.error('Update comment error:', error);

      if (error.message === 'Comment not found') {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }

      res.status(500).json({
        message: 'Failed to update comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async deleteComment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const commentId = parseInt(req.params.commentId, 10);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: 'Invalid comment ID' });
      }

      CommentsService.deleteComment(commentId, req.user.userId);

      res.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
      console.error('Delete comment error:', error);

      if (error.message === 'Comment not found') {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ message: error.message });
      }

      res.status(500).json({
        message: 'Failed to delete comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
