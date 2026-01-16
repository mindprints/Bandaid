import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import syncRoutes from './routes/sync.routes.js';
import songsRoutes from './routes/songs.routes.js';
import versionsRoutes from './routes/versions.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import dropboxOAuthRoutes from './routes/dropboxOAuth.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// CORS configuration - must be first
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// Body parser and cookie parser
app.use(express.json());
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  // Content Security Policy
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; connect-src 'self' ${clientUrl} https://*.dropboxusercontent.com; media-src 'self' https://*.dropboxusercontent.com`
  );
  next();
});

// Root endpoint - helpful message
app.get('/', (req, res) => {
  res.json({
    name: 'BandAid API',
    version: '1.0.0',
    message: 'Backend API is running. Frontend is at http://localhost:5173',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      sync: '/api/sync/*',
      songs: '/api/songs/*',
      versions: '/api/versions/*',
      comments: '/api/comments/*',
      leaderboard: '/api/leaderboard',
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/dropbox/oauth', dropboxOAuthRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BandAid API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
