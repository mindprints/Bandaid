import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/leaderboard - Get leaderboard data
router.get('/', authMiddleware, LeaderboardController.getLeaderboard);

export default router;
