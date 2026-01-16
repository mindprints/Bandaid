import { Dropbox } from 'dropbox';
import db from '../config/database.js';
import { DropboxSyncResult, Notification } from '../../../shared/src/types.js';

export class DropboxSyncService {
  private static dbx: Dropbox | null = null;

  // Initialize Dropbox client
  private static getDropboxClient(): Dropbox {
    const clientId = process.env.DROPBOX_APP_KEY;
    const clientSecret = process.env.DROPBOX_APP_SECRET;

    // Try to specific metadata keys
    try {
      const stmt = db.prepare('SELECT key, value FROM metadata WHERE key IN (?, ?, ?)');
      const rows = stmt.all('dropbox_access_token', 'dropbox_refresh_token', 'dropbox_token_expires_at') as any[];

      const tokens = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});

      if (tokens.dropbox_access_token) {
        // If we have a refresh token and app keys, provide them to allow auto-refresh
        if (tokens.dropbox_refresh_token && clientId && clientSecret) {
          return new Dropbox({
            accessToken: tokens.dropbox_access_token,
            refreshToken: tokens.dropbox_refresh_token,
            clientId,
            clientSecret
          });
        }
        return new Dropbox({ accessToken: tokens.dropbox_access_token });
      }
    } catch (e) {
      console.warn('Failed to fetch Dropbox tokens from DB, falling back to env:', e);
    }

    // Fallback to env var
    const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      // If we have clientId and clientSecret but no access token, we might still return a client 
      // but it won't be able to make calls until auth.
      // For now, keep throwing if truly nothing is configured.
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Dropbox credentials not configured');
      }
      console.warn('Dropbox access token missing');
    }

    return new Dropbox({ accessToken: accessToken || '' });
  }

  // Main sync method
  static async syncFromDropbox(): Promise<DropboxSyncResult> {
    const dbx = this.getDropboxClient();
    const folderPath = process.env.DROPBOX_FOLDER_PATH || '';

    console.log('Attempting to sync from Dropbox folder:', folderPath || '(root)');

    try {
      // List all folders and files from /BandAid
      const response = await dbx.filesListFolder({
        path: folderPath,
        recursive: true
      });

      console.log('Found', response.result.entries.length, 'total entries in Dropbox');

      // Parse the folder structure
      const { songs, versions } = this.parseDropboxStructure(response.result.entries);

      console.log('Parsed results:', songs.length, 'songs,', versions.length, 'versions');

      // Sync to database (in transaction)
      const result = this.syncToDatabase(songs, versions);

      // Update last sync time
      this.updateLastSyncTime();

      return result;
    } catch (error: any) {
      console.error('Dropbox API Error Details:', {
        status: error.status,
        statusText: error.statusText,
        errorMessage: error.error?.error_summary || error.message,
        errorDetails: error.error
      });

      if (error.status === 401) {
        throw new Error('Invalid access token');
      }
      if (error.status === 409 && error.error?.error?.['.tag'] === 'path') {
        throw new Error('Folder not found');
      }
      if (error.message?.includes('ENOTFOUND') || error.message?.includes('ETIMEDOUT')) {
        throw new Error('Network error');
      }
      throw error;
    }
  }

  // Extract base song name by removing version-specific info
  private static extractBaseSongName(filename: string): string {
    // Remove file extension first
    let name = filename.substring(0, filename.lastIndexOf('.'));

    // Check for underscore as explicit separator (User convention: "Song_Version")
    const underscoreIndex = name.indexOf('_');
    if (underscoreIndex !== -1) {
      return name.substring(0, underscoreIndex).trim();
    }

    // Remove special characters like extra spaces
    name = name.replace(/\s+/g, ' ').trim();

    // If starts with numbers (like "10010"), use just the number part
    const startsWithNumber = name.match(/^(\d+)/);
    if (startsWithNumber) {
      return startsWithNumber[1];
    }

    // List of keywords that indicate version-specific info (everything after these should be removed)
    // List of keywords that indicate version-specific info
    // Only use words that strongly imply a version, not common words
    const stopWords = [
      'wip', 'demo', 'final', 'mix', 'master', 'rough', 'draft',
      'backing', 'vocal', 'instrumental', 'remix', 'upskruvad', 'steady',
      'alternate', 'alt'
    ];

    // Create a regex to find any stop word with word boundaries
    // matches: (start or space) + word + (end or space or non-word)
    const pattern = new RegExp(`\\b(${stopWords.join('|')})\\b`, 'i');
    const match = name.match(pattern);

    let cutIndex = name.length;
    if (match && match.index !== undefined) {
      cutIndex = match.index;
    }

    // Also cut at year patterns (2020-2099)
    const yearMatch = name.match(/\b(20\d{2})\b/);
    if (yearMatch && yearMatch.index !== undefined && yearMatch.index < cutIndex) {
      cutIndex = yearMatch.index;
    }

    // Also cut at standalone numbers (like "251220")
    const numberMatch = name.match(/\b(\d{4,})\b/);
    if (numberMatch && numberMatch.index !== undefined && numberMatch.index < cutIndex) {
      cutIndex = numberMatch.index;
    }

    name = name.substring(0, cutIndex).trim();

    // If nothing left, use original filename without extension
    if (!name) {
      name = filename.substring(0, filename.lastIndexOf('.'));
    }

    return name;
  }

  // Parse Dropbox file structure into songs and versions
  private static parseDropboxStructure(entries: any[]) {
    const songs = new Map<string, { title: string; folderPath: string }>();
    const versions: Array<{ songTitle: string; versionName: string; filePath: string; fileSize: number }> = [];

    const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg'];

    let skippedNonFiles = 0;
    let skippedNonAudio = 0;
    let skippedWrongDepth = 0;

    for (const entry of entries) {
      // Skip non-files
      if (entry['.tag'] !== 'file') {
        skippedNonFiles++;
        continue;
      }

      const path = entry.path_display; // e.g., "/AF_SHOW_2026/file1.mp3" or "/AF_SHOW_2026/SongName/file1.mp3"
      const fileSize = entry.size;

      // Check if it's an audio file
      const isAudio = AUDIO_EXTENSIONS.some(ext =>
        path.toLowerCase().endsWith(ext)
      );

      if (!isAudio) {
        skippedNonAudio++;
        continue;
      }

      // Parse path
      const pathParts = path.split('/').filter(Boolean);

      let songName: string;
      let versionName: string;
      let songFolderPath: string;

      if (pathParts.length === 1) {
        // Root level: /file.mp3
        const fileName = pathParts[0];
        songName = this.extractBaseSongName(fileName); // Extract base name for grouping
        versionName = fileName; // Use full filename including extension
        // Create virtual folder path to ensure uniqueness
        songFolderPath = `/${songName}`;
      } else if (pathParts.length === 2) {
        // Flat structure: /FolderName/file.mp3
        const fileName = pathParts[1];
        songName = this.extractBaseSongName(fileName); // Extract base name for grouping
        versionName = fileName; // Use full filename including extension
        // Create virtual folder path to ensure uniqueness
        songFolderPath = `/${pathParts[0]}/${songName}`;
      } else if (pathParts.length === 3) {
        // Nested structure: /FolderName/SongName/file.mp3
        songName = pathParts[1]; // Use folder name as-is for nested structure
        const fileName = pathParts[2];
        versionName = fileName; // Use full filename including extension
        songFolderPath = `/${pathParts[0]}/${songName}`;
      } else {
        // Skip deeply nested files
        skippedWrongDepth++;
        continue;
      }

      // Add song to map
      if (!songs.has(songName)) {
        songs.set(songName, {
          title: songName,
          folderPath: songFolderPath
        });
      }

      // Add version
      versions.push({
        songTitle: songName,
        versionName,
        filePath: path,
        fileSize
      });
    }

    console.log('Parse summary:', {
      totalEntries: entries.length,
      skippedNonFiles,
      skippedNonAudio,
      skippedWrongDepth,
      songsFound: songs.size,
      versionsFound: versions.length
    });

    return {
      songs: Array.from(songs.values()),
      versions
    };
  }

  // Sync parsed data to database
  private static syncToDatabase(
    songs: Array<{ title: string; folderPath: string }>,
    versions: Array<{ songTitle: string; versionName: string; filePath: string; fileSize: number }>
  ): DropboxSyncResult {
    let newSongs = 0;
    let newVersions = 0;
    const notifications: Notification[] = [];

    // Use transaction for atomicity
    const transaction = db.transaction(() => {
      const songMap = new Map<string, number>(); // title -> song_id

      // Insert songs
      // Statements
      const insertSongStmt = db.prepare(`
        INSERT INTO songs (title, dropbox_folder_path, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);

      const updateSongStmt = db.prepare(`
        UPDATE songs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `);

      const getSongStmt = db.prepare(`
        SELECT id FROM songs WHERE dropbox_folder_path = ?
      `);

      for (const song of songs) {
        const existing = getSongStmt.get(song.folderPath) as any;
        let id: number;

        if (existing) {
          id = existing.id;
          updateSongStmt.run(id);
        } else {
          const info = insertSongStmt.run(song.title, song.folderPath);
          id = info.lastInsertRowid as number;
          newSongs++;
        }
        songMap.set(song.title, id);
      }

      // Insert versions
      const insertVersionStmt = db.prepare(`
        INSERT INTO versions (song_id, version_name, dropbox_file_path, file_size)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (dropbox_file_path) DO UPDATE SET 
          song_id = excluded.song_id,
          file_size = excluded.file_size
      `);

      for (const version of versions) {
        const songId = songMap.get(version.songTitle);
        if (!songId) continue; // Skip if song wasn't created

        const info = insertVersionStmt.run(
          songId,
          version.versionName,
          version.filePath,
          version.fileSize
        );

        if (info.changes > 0) {
          newVersions++;
        }
      }

      // Create notifications for all users if new content was added
      if (newSongs > 0 || newVersions > 0) {
        const getAllUsersStmt = db.prepare('SELECT id FROM users');
        const users = getAllUsersStmt.all() as Array<{ id: number }>;

        const insertNotificationStmt = db.prepare(`
          INSERT INTO notifications (user_id, type, title, message, related_id)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const user of users) {
          if (newSongs > 0) {
            const info = insertNotificationStmt.run(
              user.id,
              'new_song',
              'New Songs Added',
              `${newSongs} new song(s) synced from Dropbox`,
              null
            );

            notifications.push({
              id: info.lastInsertRowid as number,
              userId: user.id,
              type: 'new_song',
              title: 'New Songs Added',
              message: `${newSongs} new song(s) synced from Dropbox`,
              relatedId: 0,
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }

          if (newVersions > 0) {
            const info = insertNotificationStmt.run(
              user.id,
              'new_version',
              'New Versions Added',
              `${newVersions} new version(s) synced from Dropbox`,
              null
            );

            notifications.push({
              id: info.lastInsertRowid as number,
              userId: user.id,
              type: 'new_version',
              title: 'New Versions Added',
              message: `${newVersions} new version(s) synced from Dropbox`,
              relatedId: 0,
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
      // Cleanup stale versions (not in the current sync)
      const allVersionsStmt = db.prepare('SELECT dropbox_file_path FROM versions');
      const existingVersions = allVersionsStmt.all() as { dropbox_file_path: string }[];
      const newPaths = new Set(versions.map(v => v.filePath));
      const pathsToDelete = existingVersions.filter(v => !newPaths.has(v.dropbox_file_path));

      const deleteVersionStmt = db.prepare('DELETE FROM versions WHERE dropbox_file_path = ?');
      let deletedVersions = 0;
      for (const v of pathsToDelete) {
        deleteVersionStmt.run(v.dropbox_file_path);
        deletedVersions++;
      }
      if (deletedVersions > 0) console.log(`Cleaned up ${deletedVersions} stale versions.`);

      // Cleanup stale songs (not in the current sync)
      const allSongsStmt = db.prepare('SELECT dropbox_folder_path FROM songs');
      const existingSongs = allSongsStmt.all() as { dropbox_folder_path: string }[];
      const newDbFolderPaths = new Set(songs.map(s => s.folderPath));
      const foldersToDelete = existingSongs.filter(s => !newDbFolderPaths.has(s.dropbox_folder_path));

      const deleteSongStmt = db.prepare('DELETE FROM songs WHERE dropbox_folder_path = ?');
      let deletedSongs = 0;
      for (const s of foldersToDelete) {
        deleteSongStmt.run(s.dropbox_folder_path);
        deletedSongs++;
      }
      if (deletedSongs > 0) console.log(`Cleaned up ${deletedSongs} stale songs.`);
    });

    // Execute transaction
    transaction();

    // Get last sync time
    const lastSync = this.getLastSyncTime();

    return {
      newSongs,
      newVersions,
      notifications,
      lastSync
    };
  }

  // Update last sync timestamp in metadata table
  private static updateLastSyncTime(): void {
    const stmt = db.prepare(`
      INSERT INTO metadata (key, value, updated_at)
      VALUES ('last_dropbox_sync', ?, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);

    const timestamp = new Date().toISOString();
    stmt.run(timestamp, timestamp);
  }

  // Get last sync timestamp
  private static getLastSyncTime(): string {
    const stmt = db.prepare(`
      SELECT value FROM metadata WHERE key = 'last_dropbox_sync'
    `);

    const result = stmt.get() as any;
    return result?.value || new Date().toISOString();
  }

  // Cache for temporary links
  private static readonly TEMP_LINK_TTL_MS = 12600000; // 3.5 hours
  private static readonly MAX_CACHE_SIZE = 1000;
  private static linkCache = new Map<string, { link: string; expiresAt: number }>();

  private static pruneCache() {
    const now = Date.now();
    for (const [key, value] of this.linkCache.entries()) {
      if (value.expiresAt <= now) {
        this.linkCache.delete(key);
      }
    }
    // If still too big, remove oldest
    if (this.linkCache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.linkCache.entries()).sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      // Remove oldest 10%
      const toRemove = Math.ceil(this.MAX_CACHE_SIZE * 0.1);
      for (let i = 0; i < toRemove; i++) {
        if (sortedEntries[i]) this.linkCache.delete(sortedEntries[i][0]);
      }
    }
  }

  // Get temporary download link via cache or API
  static async getTemporaryDownloadLink(filePath: string): Promise<string> {
    if (!filePath) {
      throw new Error('No Dropbox file path associated with this version');
    }

    console.log(`Generating temporary link for path: "${filePath}"`);

    const now = Date.now();
    const cached = this.linkCache.get(filePath);

    // Return cached link if valid (links valid for 4h, we cache for 3.5h)
    if (cached && cached.expiresAt > now) {
      return cached.link;
    }

    const dbx = this.getDropboxClient();

    try {
      const response = await dbx.filesGetTemporaryLink({ path: filePath });
      const link = response.result.link;

      // Cache for 3.5 hours
      this.linkCache.set(filePath, {
        link,
        expiresAt: now + this.TEMP_LINK_TTL_MS
      });

      // Prune cache occasionally (e.g., on every update, or if size grows)
      if (this.linkCache.size % 10 === 0) { // Prune every 10 additions
        this.pruneCache();
      }

      return link;
    } catch (error: any) {
      console.error('Get temporary link error:', JSON.stringify(error, null, 2));
      const dropboxError = error?.error?.error_summary || error.message || 'Unknown Dropbox error';
      throw new Error(`Dropbox API Error: ${dropboxError}`);
    }
  }
}
