import { Dropbox } from 'dropbox';
import db from '../config/database.js';
import { DropboxSyncResult, Notification } from '../../../shared/src/types.js';

export class DropboxSyncService {
  private static dbx: Dropbox | null = null;

  // Initialize Dropbox client
  private static getDropboxClient(): Dropbox {
    if (!this.dbx) {
      const accessToken = process.env.DROPBOX_ACCESS_TOKEN;

      if (!accessToken) {
        throw new Error('DROPBOX_ACCESS_TOKEN not configured');
      }

      this.dbx = new Dropbox({ accessToken });
    }
    return this.dbx;
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

    // Remove special characters like underscores, extra spaces
    name = name.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();

    // If starts with numbers (like "10010"), use just the number part
    const startsWithNumber = name.match(/^(\d+)/);
    if (startsWithNumber) {
      return startsWithNumber[1];
    }

    // List of keywords that indicate version-specific info (everything after these should be removed)
    const stopWords = [
      'wip', 'demo', 'final', 'mix', 'master', 'rough', 'draft',
      'backing', 'vocal', 'instrumental', 'af', 'also', 'first',
      'test', 'alt', 'alternate', 'remix', 'upskruvad', 'steady',
      'new', 'with', 'without', 'w', 'm'
    ];

    // Find the first occurrence of any stop word and cut there
    let cutIndex = name.length;
    const lowerName = name.toLowerCase();

    for (const word of stopWords) {
      const index = lowerName.indexOf(word);
      if (index !== -1 && index < cutIndex) {
        cutIndex = index;
      }
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
      const insertSongStmt = db.prepare(`
        INSERT INTO songs (title, dropbox_folder_path, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (dropbox_folder_path) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      `);

      const getSongIdStmt = db.prepare(`
        SELECT id FROM songs WHERE dropbox_folder_path = ?
      `);

      for (const song of songs) {
        const info = insertSongStmt.run(song.title, song.folderPath);

        // If inserted (not updated), increment counter
        if (info.changes > 0 && info.lastInsertRowid) {
          newSongs++;
          songMap.set(song.title, info.lastInsertRowid as number);
        } else {
          // Get existing song ID
          const existing = getSongIdStmt.get(song.folderPath) as any;
          songMap.set(song.title, existing.id);
        }
      }

      // Insert versions
      const insertVersionStmt = db.prepare(`
        INSERT INTO versions (song_id, version_name, dropbox_file_path, file_size)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (dropbox_file_path) DO NOTHING
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

  // Get temporary download link for audio streaming
  static async getTemporaryDownloadLink(filePath: string): Promise<string> {
    const dbx = this.getDropboxClient();

    try {
      const response = await dbx.filesGetTemporaryLink({ path: filePath });
      return response.result.link;
    } catch (error: any) {
      console.error('Get temporary link error:', error);
      throw new Error('Failed to generate download link');
    }
  }
}
