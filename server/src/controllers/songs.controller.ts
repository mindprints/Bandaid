import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SongsService } from '../services/songs.service.js';

export class SongsController {
  static async getAllSongs(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const songs = SongsService.getAllSongs();
      res.json({ songs });
    } catch (error) {
      console.error('Get songs error:', error);
      res.status(500).json({ message: 'Failed to fetch songs' });
    }
  }

  static async getSongById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const songId = parseInt(req.params.id, 10);
      if (isNaN(songId)) {
        return res.status(400).json({ message: 'Invalid song ID' });
      }

      const song = SongsService.getSongById(songId);
      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }

      res.json({ song });
    } catch (error) {
      console.error('Get song error:', error);
      res.status(500).json({ message: 'Failed to fetch song' });
    }
  }
}
