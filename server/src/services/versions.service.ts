import db from '../config/database.js';
import { Version } from '../../../shared/src/types.js';

export class VersionsService {
  static getVersionsBySongId(songId: number): Version[] {
    const stmt = db.prepare(`
      SELECT
        v.id,
        v.song_id as songId,
        v.version_name as versionName,
        v.dropbox_file_path as dropboxFilePath,
        v.file_size as fileSize,
        v.created_at as createdAt,
        AVG(r.score) as avgRating,
        COUNT(DISTINCT c.id) as commentCount
      FROM versions v
      LEFT JOIN ratings r ON v.id = r.version_id
      LEFT JOIN comments c ON v.id = c.version_id
      WHERE v.song_id = ?
      GROUP BY v.id
      ORDER BY v.created_at DESC
    `);

    const versions = stmt.all(songId) as Version[];
    return versions;
  }

  static getVersionById(versionId: number): Version | null {
    const stmt = db.prepare(`
      SELECT
        v.id,
        v.song_id as songId,
        v.version_name as versionName,
        v.dropbox_file_path as dropboxFilePath,
        v.file_size as fileSize,
        v.created_at as createdAt,
        AVG(r.score) as avgRating,
        COUNT(DISTINCT c.id) as commentCount
      FROM versions v
      LEFT JOIN ratings r ON v.id = r.version_id
      LEFT JOIN comments c ON v.id = c.version_id
      WHERE v.id = ?
      GROUP BY v.id
    `);

    const version = stmt.get(versionId) as Version | undefined;
    return version || null;
  }
}
