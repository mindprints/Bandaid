// backend/src/services/dropboxService.ts
// Add these methods to your existing DropboxSyncService class

/**
 * Get a temporary download link for an audio file
 * Links are valid for 4 hours
 */
async getTemporaryLink(filePath: string): Promise<string> {
  try {
    const response = await this.dbx.filesGetTemporaryLink({ 
      path: filePath 
    });
    return response.result.link;
  } catch (error) {
    console.error('Failed to get temporary link:', error);
    throw new Error('Could not generate audio file link');
  }
}

/**
 * Get download link for a version by ID
 */
async getVersionAudioLink(versionId: number): Promise<string | null> {
  // Get the Dropbox path from database
  const version = db.prepare(`
    SELECT dropbox_file_path 
    FROM versions 
    WHERE id = ?
  `).get(versionId) as { dropbox_file_path: string } | undefined;

  if (!version || !version.dropbox_file_path) {
    return null;
  }

  return await this.getTemporaryLink(version.dropbox_file_path);
}

/**
 * Cache for temporary links (prevents regenerating for same file)
 */
private linkCache = new Map<string, { link: string; expiresAt: number }>();

/**
 * Get cached link or generate new one
 * Cache links for 3.5 hours (they expire after 4)
 */
async getCachedLink(filePath: string): Promise<string> {
  const cached = this.linkCache.get(filePath);
  const now = Date.now();

  // Return cached link if still valid (3.5 hours = 12600000ms)
  if (cached && cached.expiresAt > now) {
    return cached.link;
  }

  // Generate new link
  const link = await this.getTemporaryLink(filePath);
  
  // Cache for 3.5 hours
  this.linkCache.set(filePath, {
    link,
    expiresAt: now + 12600000
  });

  return link;
}