import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || join(__dirname, '..', '..', 'database', 'bandaid.db');

// Create database connection
let dbInstance: any;
try {
  // Ensure database directory exists
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    console.log(`Creating database directory at: ${dbDir}`);
    mkdirSync(dbDir, { recursive: true });
  }

  console.log(`Attempting to open database at: ${dbPath}`);
  dbInstance = new Database(dbPath);
} catch (error) {
  console.error('CRITICAL ERROR: Failed to open database connection');
  console.error('Database path:', dbPath);
  console.error('Error details:', error);
  process.exit(1);
}
export const db = dbInstance;

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database with schema
export function initializeDatabase() {
  const schemaPath = join(__dirname, '..', 'database', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute schema
  db.exec(schema);

  console.log('Database initialized successfully');
}

// Close database connection
export function closeDatabase() {
  db.close();
}

export default db;
