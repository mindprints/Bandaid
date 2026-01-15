import { Router } from 'express';
import { DropboxAuthController } from '../controllers/dropbox-auth.controller.js';

const router = Router();

// GET /api/dropbox/oauth - Initiate auth flow
router.get('/', DropboxAuthController.initiateAuth);

// GET /api/dropbox/oauth/callback - Handle redirect
router.get('/callback', DropboxAuthController.handleCallback);

export default router;
