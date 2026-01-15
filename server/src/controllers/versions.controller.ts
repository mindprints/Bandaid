import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { VersionsService } from '../services/versions.service.js';
import { DropboxSyncService } from '../services/dropbox-sync.service.js';

export class VersionsController {
  static async getVersionsBySongId(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const songId = parseInt(req.params.songId, 10);
      if (isNaN(songId)) {
        return res.status(400).json({ message: 'Invalid song ID' });
      }

      const versions = VersionsService.getVersionsBySongId(songId);
      res.json({ versions });
    } catch (error) {
      console.error('Get versions error:', error);
      res.status(500).json({ message: 'Failed to fetch versions' });
    }
  }

  static async getVersionById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const versionId = parseInt(req.params.id, 10);
      if (isNaN(versionId)) {
        return res.status(400).json({ message: 'Invalid version ID' });
      }

      const version = VersionsService.getVersionById(versionId);
      if (!version) {
        return res.status(404).json({ message: 'Version not found' });
      }

      res.json({ version });
    } catch (error) {
      console.error('Get version error:', error);
      res.status(500).json({ message: 'Failed to fetch version' });
    }
  }

  static async streamAudio(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const versionId = parseInt(req.params.versionId, 10);
      if (isNaN(versionId)) {
        return res.status(400).json({ message: 'Invalid version ID' });
      }

      const version = VersionsService.getVersionById(versionId);
      if (!version) {
        return res.status(404).json({ message: 'Version not found' });
      }

      // Get temporary download link from Dropbox
      const downloadLink = await DropboxSyncService.getTemporaryDownloadLink(
        version.dropboxFilePath
      );

      // Redirect to Dropbox temporary link
      res.redirect(downloadLink);
    } catch (error) {
      console.error('Stream audio error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        message: 'Failed to stream audio',
        error: errorMessage
      });
    }
  }
}
