/**
 * Database schema initialization for YouMeUss (SQLite / sql.js).
 * Creates all required tables and runs safe migrations.
 */
export function initializeSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      reset_token TEXT,
      reset_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate existing tables if reset columns don't exist yet
  try {
    db.run('ALTER TABLE users ADD COLUMN reset_token TEXT');
  } catch {
    // Column already exists
  }
  try {
    db.run('ALTER TABLE users ADD COLUMN reset_expires DATETIME');
  } catch {
    // Column already exists
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      room_code TEXT UNIQUE NOT NULL,
      host_user_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(room_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      storage_url TEXT NOT NULL,
      original_name TEXT,
      duration REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // Indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code)');
  db.run('CREATE INDEX IF NOT EXISTS idx_participants_room ON participants(room_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_videos_room ON videos(room_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)');

  console.log('✅ SQLite database schema initialized');
}
