import app from './app.js';
import { initializeDatabase } from './config/database.js';
import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize database
try {
  initializeDatabase();
  console.log('Database initialized');
} catch (error: any) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve frontend build files
  let clientPath = path.join(__dirname, '../../client/dist');

  // Handle nested build structure in production (e.g. dist/server/src)
  if (!fs.existsSync(clientPath)) {
    clientPath = path.join(__dirname, '../../../../client/dist');
  }

  console.log('Serving static files from:', clientPath);
  app.use(express.static(clientPath));

  // Handle SPA routing - send all non-API requests to index.html
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    } else {
      next();
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
