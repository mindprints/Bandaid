import db from '../config/database.js';
import { Comment } from '../../../shared/src/types.js';

export class CommentsService {
  static createComment(versionId: number, userId: number, content: string): Comment {
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    let commentId = 0;

    const transaction = db.transaction(() => {
      // Insert comment
      const insertStmt = db.prepare(`
        INSERT INTO comments (version_id, user_id, content)
        VALUES (?, ?, ?)
      `);

      const info = insertStmt.run(versionId, userId, content.trim());
      commentId = info.lastInsertRowid as number;

      // Create notifications for other users
      CommentsService.createCommentNotifications(versionId, userId, content.trim());
    });

    // Execute transaction
    transaction();

    // Get the created comment with user info (after transaction)
    const getCommentStmt = db.prepare(`
      SELECT
        c.id,
        c.version_id as versionId,
        c.user_id as userId,
        u.display_name as userName,
        c.content,
        c.created_at as createdAt,
        c.updated_at as updatedAt
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);

    const comment = getCommentStmt.get(commentId) as Comment;
    return comment;
  }

  static getCommentsByVersionId(versionId: number): Comment[] {
    const stmt = db.prepare(`
      SELECT
        c.id,
        c.version_id as versionId,
        c.user_id as userId,
        u.display_name as userName,
        c.content,
        c.created_at as createdAt,
        c.updated_at as updatedAt
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.version_id = ?
      ORDER BY c.created_at DESC
    `);

    const comments = stmt.all(versionId) as Comment[];
    return comments;
  }

  static updateComment(commentId: number, userId: number, content: string): Comment {
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    // Verify ownership
    const checkStmt = db.prepare(`
      SELECT user_id FROM comments WHERE id = ?
    `);
    const existing = checkStmt.get(commentId) as { user_id: number } | undefined;

    if (!existing) {
      throw new Error('Comment not found');
    }

    if (existing.user_id !== userId) {
      throw new Error('Unauthorized: You can only edit your own comments');
    }

    // Update comment
    const updateStmt = db.prepare(`
      UPDATE comments
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(content.trim(), commentId);

    // Get updated comment
    const getCommentStmt = db.prepare(`
      SELECT
        c.id,
        c.version_id as versionId,
        c.user_id as userId,
        u.display_name as userName,
        c.content,
        c.created_at as createdAt,
        c.updated_at as updatedAt
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);

    const comment = getCommentStmt.get(commentId) as Comment;
    return comment;
  }

  static deleteComment(commentId: number, userId: number): boolean {
    // Verify ownership
    const checkStmt = db.prepare(`
      SELECT user_id FROM comments WHERE id = ?
    `);
    const existing = checkStmt.get(commentId) as { user_id: number } | undefined;

    if (!existing) {
      throw new Error('Comment not found');
    }

    if (existing.user_id !== userId) {
      throw new Error('Unauthorized: You can only delete your own comments');
    }

    // Delete comment
    const deleteStmt = db.prepare(`
      DELETE FROM comments WHERE id = ?
    `);

    const info = deleteStmt.run(commentId);
    return info.changes > 0;
  }

  private static createCommentNotifications(versionId: number, commentUserId: number, content: string): void {
    // Get version and song info
    const versionStmt = db.prepare(`
      SELECT v.version_name, s.title as song_title
      FROM versions v
      JOIN songs s ON v.song_id = s.id
      WHERE v.id = ?
    `);
    const versionInfo = versionStmt.get(versionId) as { version_name: string; song_title: string } | undefined;

    if (!versionInfo) return;

    // Get comment user's display name
    const userStmt = db.prepare(`SELECT display_name FROM users WHERE id = ?`);
    const user = userStmt.get(commentUserId) as { display_name: string } | undefined;

    if (!user) return;

    // Get all users except the one who created the comment
    const getAllUsersStmt = db.prepare('SELECT id FROM users WHERE id != ?');
    const users = getAllUsersStmt.all(commentUserId) as Array<{ id: number }>;

    const insertNotificationStmt = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Truncate content for notification message
    const shortContent = content.length > 50 ? content.substring(0, 50) + '...' : content;

    for (const otherUser of users) {
      insertNotificationStmt.run(
        otherUser.id,
        'new_comment',
        'New Comment',
        `${user.display_name} commented on "${versionInfo.version_name}" (${versionInfo.song_title}): "${shortContent}"`,
        versionId
      );
    }
  }
}
