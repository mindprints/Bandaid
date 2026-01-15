import app from './app.js';
import { initializeDatabase } from './config/database.js';
import dotenv from 'dotenv';
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
