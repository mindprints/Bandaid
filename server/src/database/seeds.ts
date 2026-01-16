import db, { initializeDatabase } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  try {
    console.log('Initializing database...');
    initializeDatabase();

    console.log('Seeding database...');

    // Create 5 band member accounts
    const members = [
      { username: 'Anders', displayName: 'Anders', password: 'password123' },
      { username: 'Tomas', displayName: 'Tomas', password: 'password123' },
      { username: 'Dagge', displayName: 'Dagge', password: 'password123' },
      { username: 'Greg', displayName: 'Greg', password: 'password123' },
      { username: 'Admin', displayName: 'Admin', password: 'password123' },
    ];

    const insertStmt = db.prepare(
      'INSERT OR REPLACE INTO users (id, username, display_name, password_hash) VALUES ((SELECT id FROM users WHERE username = ?), ?, ?, ?)'
    );

    for (const member of members) {
      const passwordHash = await hashPassword(member.password);
      insertStmt.run(member.username, member.username, member.displayName, passwordHash);
      console.log(`Created/Updated user: ${member.username}`);
    }

    console.log('Seeding completed successfully!');
    console.log('\nDefault credentials:');
    console.log('Username: Anders | Password: password123');
    console.log('Username: Tomas | Password: password123');
    console.log('Username: Dagge | Password: password123');
    console.log('Username: Greg | Password: password123');
    console.log('Username: Admin | Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
