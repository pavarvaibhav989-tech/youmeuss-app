import pg from 'pg';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeSchema as initSqliteSchema } from './schema.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'youmeuss.db');

let pool = null;
let sqliteDb = null;
let isPostgres = false;

/**
 * Convert SQLite-style ? placeholders to PostgreSQL $1, $2, ... style.
 */
function toPgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/**
 * Save SQLite to disk if using local file storage.
 */
export function saveDb() {
  if (sqliteDb) {
    try {
      const data = sqliteDb.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (err) {
      console.error('Failed to save SQLite DB:', err.message);
    }
  }
}

/**
 * Initialize the database connection.
 * Uses PostgreSQL if DATABASE_URL is configured (Railway production),
 * otherwise falls back seamlessly to SQLite (sql.js) for local development.
 */
export async function initDb() {
  if (pool || sqliteDb) return pool || sqliteDb;

  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      const client = await pool.connect();
      client.release();
      isPostgres = true;
      console.log('✅ PostgreSQL connected');
      await initializePgSchema();
      return pool;
    } catch (err) {
      console.warn('⚠️  PostgreSQL connection failed, falling back to SQLite:', err.message);
      pool = null;
    }
  }

  // SQLite fallback
  console.log('💾 Using SQLite database at', DB_PATH);
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    try {
      const buffer = fs.readFileSync(DB_PATH);
      sqliteDb = new SQL.Database(buffer);
    } catch {
      sqliteDb = new SQL.Database();
    }
  } else {
    sqliteDb = new SQL.Database();
  }

  sqliteDb.run('PRAGMA foreign_keys = ON');
  initSqliteSchema(sqliteDb);
  saveDb();

  // Auto-save every 30 seconds
  setInterval(() => saveDb(), 30000);

  isPostgres = false;
  return sqliteDb;
}

/**
 * Create tables for PostgreSQL if they don't exist.
 */
async function initializePgSchema() {
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
        reset_token TEXT,
        reset_expires TIMESTAMP,
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

    // Password reset columns — safe update
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP');

    // Indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_participants_room ON participants(room_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_videos_room ON videos(room_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)');

    await client.query('COMMIT');
    console.log('✅ PostgreSQL schema initialized');
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
  if (isPostgres && pool) {
    const { rows } = await pool.query(toPgSql(sql), params);
    return rows;
  }

  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  return [];
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
  if (isPostgres && pool) {
    await pool.query(toPgSql(sql), params);
    return;
  }

  if (sqliteDb) {
    sqliteDb.run(sql, params);
    saveDb();
  }
}

/**
 * Close the database connection.
 */
export function closeDb() {
  if (pool) {
    pool.end();
    pool = null;
  }
  if (sqliteDb) {
    saveDb();
    sqliteDb.close();
    sqliteDb = null;
  }
}

export function getDb() {
  return isPostgres ? pool : sqliteDb;
}

export default getDb;
