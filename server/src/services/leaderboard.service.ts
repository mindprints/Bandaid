import db from '../config/database.js';
import { LeaderboardData } from '../../../shared/src/types.js';

export class LeaderboardService {
  static getLeaderboardData(): LeaderboardData {
    // Query 1: Get all versions with ratings
    const versionsStmt = db.prepare(`
      SELECT
        v.id as versionId,
        s.title as songTitle,
        v.version_name as versionName,
        AVG(r.score) as avgRating,
        COUNT(r.id) as ratingCount
      FROM versions v
      JOIN songs s ON v.song_id = s.id
      LEFT JOIN ratings r ON v.id = r.version_id
      GROUP BY v.id
      HAVING COUNT(r.id) > 0
      ORDER BY avgRating DESC, ratingCount DESC
    `);

    const versionsData = versionsStmt.all() as Array<{
      versionId: number;
      songTitle: string;
      versionName: string;
      avgRating: number;
      ratingCount: number;
    }>;

    // Query 2: Get all individual ratings grouped by version
    const ratingsStmt = db.prepare(`
      SELECT
        r.version_id as versionId,
        r.user_id as userId,
        u.display_name as userName,
        r.score
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.version_id, r.score DESC
    `);

    const allRatings = ratingsStmt.all() as Array<{
      versionId: number;
      userId: number;
      userName: string;
      score: number;
    }>;

    // Group ratings by version
    const ratingsByVersion = new Map<number, Array<{ userId: number; userName: string; score: number }>>();
    for (const rating of allRatings) {
      if (!ratingsByVersion.has(rating.versionId)) {
        ratingsByVersion.set(rating.versionId, []);
      }
      ratingsByVersion.get(rating.versionId)!.push({
        userId: rating.userId,
        userName: rating.userName,
        score: rating.score
      });
    }

    // Build versions array with ratings
    const versions = versionsData.map(v => ({
      versionId: v.versionId,
      songTitle: v.songTitle,
      versionName: v.versionName,
      avgRating: v.avgRating,
      ratings: ratingsByVersion.get(v.versionId) || []
    }));

    // Query 3: Get user averages
    const userAveragesStmt = db.prepare(`
      SELECT
        u.id as userId,
        u.display_name as userName,
        AVG(r.score) as avgScore,
        COUNT(r.id) as totalRatings
      FROM users u
      LEFT JOIN ratings r ON u.id = r.user_id
      GROUP BY u.id
      HAVING COUNT(r.id) > 0
      ORDER BY avgScore DESC
    `);

    const userAverages = userAveragesStmt.all() as Array<{
      userId: number;
      userName: string;
      avgScore: number;
      totalRatings: number;
    }>;

    return {
      versions,
      userAverages
    };
  }
}
