import pg from 'pg';
const { Pool } = pg;

let pool = null;

/**
 * Convert SQLite-style ? placeholders to PostgreSQL $1, $2, ... style.
 * This lets all existing queries work without changes.
 */
function toPgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/**
 * Initialize the PostgreSQL connection pool.
 * Reads DATABASE_URL from environment (set automatically by Railway Postgres plugin).
 * Falls back gracefully if DATABASE_URL is missing (dev without Postgres).
 */
export async function initDb() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('⚠️  DATABASE_URL not set — using in-memory fallback (data will not persist)');
    // Graceful fallback: use a mock that logs but doesn't crash
    pool = { query: async () => ({ rows: [] }), end: () => {} };
    return pool;
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Test the connection
  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    throw err;
  }

  await initializeSchema();
  return pool;
}

/**
 * Create tables if they don't exist.
 */
async function initializeSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        room_code TEXT UNIQUE NOT NULL,
        host_user_id TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_user_id) REFERENCES users(id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(room_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        storage_url TEXT NOT NULL,
        original_name TEXT,
        duration REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    // Indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_participants_room ON participants(room_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_videos_room ON videos(room_id)');

    await client.query('COMMIT');
    console.log('✅ Database schema initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Run a SELECT query and return all rows as an array of objects.
 */
export async function queryAll(sql, params = []) {
  const { rows } = await pool.query(toPgSql(sql), params);
  return rows;
}

/**
 * Run a SELECT query and return the first row, or null.
 */
export async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Run an INSERT / UPDATE / DELETE statement.
 */
export async function runSql(sql, params = []) {
  await pool.query(toPgSql(sql), params);
}

/**
 * Close the pool (called on shutdown).
 */
export function closeDb() {
  if (pool) {
    pool.end();
    pool = null;
  }
}

// No-op — kept for compatibility
export function saveDb() {}
export function getDb() { return pool; }

export default getDb;
