import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { DropboxSyncService } from '../services/dropbox-sync.service.js';

export class SyncController {
  static async syncFromDropbox(req: AuthRequest, res: Response) {
    try {
      // Validate user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Perform sync
      const result = await DropboxSyncService.syncFromDropbox();

      // Return sync results
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Dropbox sync error:', error);

      // Handle specific error types
      if (error.message.includes('Invalid access token')) {
        return res.status(503).json({
          message: 'Invalid Dropbox access token. Please check your configuration or generate a new token.'
        });
      }

      if (error.message.includes('Folder not found')) {
        return res.status(404).json({
          message: 'Dropbox folder not found. Please check your DROPBOX_FOLDER_PATH configuration.'
        });
      }

      if (error.message.includes('Network')) {
        return res.status(503).json({
          message: 'Network error connecting to Dropbox. Please try again later.'
        });
      }

      res.status(500).json({
        message: 'Failed to sync from Dropbox',
        // TEMPORARY: Expose error in production to debug 502/500 issues
        error: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}
