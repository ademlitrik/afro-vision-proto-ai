import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrator';

let dbInstance: Database.Database | null = null;

export interface DatabaseConfig {
  dbPath?: string;
  verbose?: boolean;
}

export function initDatabase(config: DatabaseConfig = {}): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  let dbPath = config.dbPath;
  if (!dbPath) {
    // Default location: AppData or local storage directory
    const baseDir = process.env.AFRO_VISION_DATA_DIR || path.join(process.cwd(), 'data');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    dbPath = path.join(baseDir, 'afro_vision.db');
  }

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath, {
    verbose: config.verbose ? console.log : undefined
  });

  // Performance and durability pragmas for desktop photography catalogs
  db.pragma('busy_timeout = 5000');
  try {
    db.pragma('journal_mode = WAL');
  } catch (err) {
    console.warn('[DB] WAL journal_mode warning:', err);
  }
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  // Run schema migrations
  runMigrations(db);

  dbInstance = db;
  return dbInstance;
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database has not been initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.pragma('wal_checkpoint(TRUNCATE)');
      dbInstance.close();
    } catch (err) {
      console.error('[DB] Error during database shutdown:', err);
    } finally {
      dbInstance = null;
    }
  }
}
