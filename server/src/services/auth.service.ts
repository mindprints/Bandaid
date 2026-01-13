import db from '../config/database.js';
import { comparePassword } from '../utils/password.js';
import { User } from '../../../shared/src/types.js';

export class AuthService {
  static async login(username: string, password: string): Promise<User | null> {
    // Find user by username
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as any;

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    // Return user without password hash
    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
    };
  }

  static async getUserById(userId: number): Promise<User | null> {
    const stmt = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?');
    const user = stmt.get(userId) as any;

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
    };
  }
}
