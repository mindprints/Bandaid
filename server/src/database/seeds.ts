import db, { initializeDatabase } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  try {
    console.log('Initializing database...');
    initializeDatabase();

    console.log('Seeding database...');

    // Check if users already exist
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (existingUsers.count > 0) {
      console.log('Users already exist. Skipping seed.');
      return;
    }

    // Create 5 band member accounts
    const members = [
      { username: 'john_guitar', displayName: 'John (Guitar)', password: 'password123' },
      { username: 'sarah_vocals', displayName: 'Sarah (Vocals)', password: 'password123' },
      { username: 'mike_drums', displayName: 'Mike (Drums)', password: 'password123' },
      { username: 'lisa_bass', displayName: 'Lisa (Bass)', password: 'password123' },
      { username: 'tom_keys', displayName: 'Tom (Keys)', password: 'password123' },
    ];

    const insertStmt = db.prepare(
      'INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)'
    );

    for (const member of members) {
      const passwordHash = await hashPassword(member.password);
      insertStmt.run(member.username, member.displayName, passwordHash);
      console.log(`Created user: ${member.username}`);
    }

    console.log('Seeding completed successfully!');
    console.log('\nDefault credentials:');
    console.log('Username: john_guitar | Password: password123');
    console.log('Username: sarah_vocals | Password: password123');
    console.log('Username: mike_drums | Password: password123');
    console.log('Username: lisa_bass | Password: password123');
    console.log('Username: tom_keys | Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
