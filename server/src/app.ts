import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
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
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' http://localhost:5173"
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
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BandAid API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
