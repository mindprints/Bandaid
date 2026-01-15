import db from '../config/database.js';
import { Song } from '../../../shared/src/types.js';

export class SongsService {
  static getAllSongs(): Song[] {
    const stmt = db.prepare(`
      SELECT
        s.id,
        s.title,
        s.dropbox_folder_path as dropboxFolderPath,
        s.created_at as createdAt,
        s.updated_at as updatedAt,
        COUNT(DISTINCT v.id) as versionCount,
        AVG(r.score) as avgRating
      FROM songs s
      LEFT JOIN versions v ON s.id = v.song_id
      LEFT JOIN ratings r ON v.id = r.version_id
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `);

    const songs = stmt.all() as Song[];
    return songs;
  }

  static getSongById(id: number): Song | null {
    const stmt = db.prepare(`
      SELECT
        s.id,
        s.title,
        s.dropbox_folder_path as dropboxFolderPath,
        s.created_at as createdAt,
        s.updated_at as updatedAt,
        COUNT(DISTINCT v.id) as versionCount,
        AVG(r.score) as avgRating
      FROM songs s
      LEFT JOIN versions v ON s.id = v.song_id
      LEFT JOIN ratings r ON v.id = r.version_id
      WHERE s.id = ?
      GROUP BY s.id
    `);

    const song = stmt.get(id) as Song | undefined;
    return song || null;
  }
}
