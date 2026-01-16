import { Request, Response } from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Dropbox } = require('dropbox');

import db from '../config/database.js';

export class DropboxAuthController {
    private static getDropboxClient() {
        const clientId = process.env.DROPBOX_APP_KEY;
        const clientSecret = process.env.DROPBOX_APP_SECRET;
        const redirectUri = process.env.DROPBOX_REDIRECT_URI;

        if (!clientId || !clientSecret) {
            throw new Error('Dropbox App Key/Secret not configured');
        }
        if (!redirectUri) {
            throw new Error('Dropbox Redirect URI not configured');
        }

        return { dbx: new Dropbox({ clientId, clientSecret }), redirectUri };
    }

    static async initiateAuth(req: Request, res: Response) {
        try {
            const { dbx, redirectUri } = DropboxAuthController.getDropboxClient();
            const authUrl = await dbx.auth.getAuthenticationUrl(
                redirectUri,
                null,
                'code',
                'offline',
                ['files.content.read', 'files.metadata.read'],
                'none',
                false
            );
            res.redirect(authUrl as string);
        } catch (error) {
            console.error('Init Auth Error:', error);
            res.status(500).send('Init failed');
        }
    }

    static async handleCallback(req: Request, res: Response) {
        try {
            const { code } = req.query;

            if (!code || typeof code !== 'string') {
                return res.status(400).send('Missing code parameter');
            }

            const { dbx, redirectUri } = DropboxAuthController.getDropboxClient();

            const response = await dbx.auth.getAccessTokenFromCode(redirectUri, code);
            const { access_token, refresh_token, expires_in } = response.result as any;

            console.log('Tokens received. Refresh token:', !!refresh_token);

            // Store tokens in metadata table
            const stmt = db.prepare(`
                INSERT INTO metadata (key, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT (key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
            `);

            const insertMany = db.transaction(() => {
                if (access_token) stmt.run('dropbox_access_token', access_token, access_token);
                if (refresh_token) stmt.run('dropbox_refresh_token', refresh_token, refresh_token);

                // Calculate expiry time
                if (expires_in) {
                    const expiresAt = Date.now() + (expires_in * 1000);
                    stmt.run('dropbox_token_expires_at', expiresAt.toString(), expiresAt.toString());
                }
            });

            insertMany();

            res.send(`
                <html>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: green;">Authentication Successful!</h1>
                        <p>Dropbox connected successfully. You can close this window.</p>
                        <script>setTimeout(() => window.close(), 3000);</script>
                    </body>
                </html>
            `);
        } catch (error) {
            console.error('Callback Error:', error);
            res.status(500).send('Authentication failed');
        }
    }
}
