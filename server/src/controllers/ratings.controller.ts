import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { RatingsService } from '../services/ratings.service.js';

export class RatingsController {
  static async createOrUpdateRating(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) {
        return res.status(400).json({ message: 'Invalid version ID' });
      }

      const { score } = req.body;
      if (typeof score !== 'number' || score < 1 || score > 10) {
        return res.status(400).json({ message: 'Score must be a number between 1 and 10' });
      }

      const result = RatingsService.createOrUpdateRating(versionId, req.user.userId, score);

      res.status(result.isNew ? 201 : 200).json({
        message: result.isNew ? 'Rating created' : 'Rating updated',
        rating: result.rating
      });
    } catch (error: any) {
      console.error('Create/update rating error:', error);
      res.status(500).json({
        message: 'Failed to save rating',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getRatingsByVersionId(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) {
        return res.status(400).json({ message: 'Invalid version ID' });
      }

      const ratings = RatingsService.getRatingsByVersionId(versionId);

      // Also get the current user's rating separately for convenience
      const userRating = RatingsService.getUserRatingForVersion(versionId, req.user.userId);

      res.json({ ratings, userRating });
    } catch (error) {
      console.error('Get ratings error:', error);
      res.status(500).json({ message: 'Failed to fetch ratings' });
    }
  }

  static async deleteRating(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) {
        return res.status(400).json({ message: 'Invalid version ID' });
      }

      const deleted = RatingsService.deleteRating(versionId, req.user.userId);

      if (!deleted) {
        return res.status(404).json({ message: 'Rating not found' });
      }

      res.json({ message: 'Rating deleted successfully' });
    } catch (error) {
      console.error('Delete rating error:', error);
      res.status(500).json({ message: 'Failed to delete rating' });
    }
  }
}
