import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { LeaderboardService } from '../services/leaderboard.service.js';

export class LeaderboardController {
  static async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const leaderboardData = LeaderboardService.getLeaderboardData();

      res.json(leaderboardData);
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ message: 'Failed to fetch leaderboard data' });
    }
  }
}
