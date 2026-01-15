import db from '../config/database.js';
import { Rating } from '../../../shared/src/types.js';

export class RatingsService {
  static createOrUpdateRating(versionId: number, userId: number, score: number): { rating: Rating; isNew: boolean } {
    // Validate score
    if (score < 1 || score > 10) {
      throw new Error('Score must be between 1 and 10');
    }

    let isNew = false;

    // Use transaction for atomicity
    const transaction = db.transaction(() => {
      // Check if rating already exists
      const existingStmt = db.prepare(`
        SELECT id FROM ratings WHERE version_id = ? AND user_id = ?
      `);
      const existing = existingStmt.get(versionId, userId) as { id: number } | undefined;

      // Insert or update
      const upsertStmt = db.prepare(`
        INSERT INTO ratings (version_id, user_id, score, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (version_id, user_id) DO UPDATE SET
          score = excluded.score,
          updated_at = CURRENT_TIMESTAMP
      `);
      upsertStmt.run(versionId, userId, score);

      if (!existing) {
        isNew = true;
      }

      // Create notifications for other users (only on new rating)
      if (isNew) {
        RatingsService.createRatingNotifications(versionId, userId, score);
      }
    });

    // Execute transaction
    transaction();

    // Get the created/updated rating with user info (after transaction)
    const getRatingStmt = db.prepare(`
      SELECT
        r.id,
        r.version_id as versionId,
        r.user_id as userId,
        u.display_name as userName,
        r.score,
        r.created_at as createdAt,
        r.updated_at as updatedAt
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.version_id = ? AND r.user_id = ?
    `);
    const rating = getRatingStmt.get(versionId, userId) as Rating;

    return { rating, isNew };
  }

  static getRatingsByVersionId(versionId: number): Rating[] {
    const stmt = db.prepare(`
      SELECT
        r.id,
        r.version_id as versionId,
        r.user_id as userId,
        u.display_name as userName,
        r.score,
        r.created_at as createdAt,
        r.updated_at as updatedAt
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.version_id = ?
      ORDER BY r.created_at DESC
    `);

    const ratings = stmt.all(versionId) as Rating[];
    return ratings;
  }

  static getUserRatingForVersion(versionId: number, userId: number): Rating | null {
    const stmt = db.prepare(`
      SELECT
        r.id,
        r.version_id as versionId,
        r.user_id as userId,
        u.display_name as userName,
        r.score,
        r.created_at as createdAt,
        r.updated_at as updatedAt
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.version_id = ? AND r.user_id = ?
    `);

    const rating = stmt.get(versionId, userId) as Rating | undefined;
    return rating || null;
  }

  static deleteRating(versionId: number, userId: number): boolean {
    const stmt = db.prepare(`
      DELETE FROM ratings WHERE version_id = ? AND user_id = ?
    `);

    const info = stmt.run(versionId, userId);
    return info.changes > 0;
  }

  private static createRatingNotifications(versionId: number, ratingUserId: number, score: number): void {
    // Get version and song info
    const versionStmt = db.prepare(`
      SELECT v.version_name, s.title as song_title
      FROM versions v
      JOIN songs s ON v.song_id = s.id
      WHERE v.id = ?
    `);
    const versionInfo = versionStmt.get(versionId) as { version_name: string; song_title: string } | undefined;

    if (!versionInfo) return;

    // Get rating user's display name
    const userStmt = db.prepare(`SELECT display_name FROM users WHERE id = ?`);
    const user = userStmt.get(ratingUserId) as { display_name: string } | undefined;

    if (!user) return;

    // Get all users except the one who created the rating
    const getAllUsersStmt = db.prepare('SELECT id FROM users WHERE id != ?');
    const users = getAllUsersStmt.all(ratingUserId) as Array<{ id: number }>;

    const insertNotificationStmt = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const otherUser of users) {
      insertNotificationStmt.run(
        otherUser.id,
        'new_rating',
        'New Rating',
        `${user.display_name} rated "${versionInfo.version_name}" (${versionInfo.song_title}) ${score}/10`,
        versionId
      );
    }
  }
}
