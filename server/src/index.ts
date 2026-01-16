import app from './app.js';
import { initializeDatabase } from './config/database.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const PORT = process.env.PORT || 3001;

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
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));

  // Handle SPA routing - send all non-API requests to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
