import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeSchema } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'youmeuss.db');

let db = null;

/**
 * Initialize and return the database connection.
 * sql.js is a pure JS SQLite — no native compilation needed.
 */
export async function initDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing database file if it exists
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys and WAL mode for concurrent access
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = WAL');

  // Initialize schema
  initializeSchema(db);

  // Auto-save every 60 seconds as a safety net (runSql already saves on each write)
  setInterval(() => saveDb(), 60000);

  console.log('✅ Database schema initialized');
  return db;
}

/**
 * Get the database instance (must call initDb first).
 */
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

/**
 * Save the in-memory database to disk.
 */
export function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * Close the database and save to disk.
 */
export function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

/**
 * Helper: Run a query and return all results as an array of objects.
 */
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Helper: Run a query and return the first result as an object, or null.
 */
export function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Helper: Run a statement (INSERT, UPDATE, DELETE).
 */
export function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb(); // Save after write operations
}

export default getDb;
