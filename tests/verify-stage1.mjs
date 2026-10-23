import Database from 'better-sqlite3';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import os from 'os';

console.log('====================================================');
console.log('AFRO VISION PROTO AI — STAGE 1 VERIFICATION SUITE');
console.log('====================================================\n');

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// TEST 1: SQLite Connection & WAL Pragmas
console.log('1. Database Engine Verification:');
const tempDbPath = path.join(os.tmpdir(), `afro_vision_test_${Date.now()}.db`);
try {
  const db = new Database(tempDbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const journalMode = db.pragma('journal_mode', { simple: true });
  assert(journalMode === 'wal', `SQLite journal_mode is WAL (got: ${journalMode})`);

  // Apply Schema
  const schemaPath = path.resolve('database/migrations/001_initial_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  const requiredTables = [
    'projects', 'photos', 'photo_metadata', 'ai_analyses',
    'edits', 'edit_history', 'presets', 'ratings', 'flags',
    'collections', 'export_jobs', 'processing_jobs', 'app_settings'
  ];

  for (const reqTable of requiredTables) {
    assert(tables.includes(reqTable), `Table '${reqTable}' exists in catalog schema`);
  }

  // Test Project CRUD
  const now = Date.now();
  db.prepare(`
    INSERT INTO projects (id, name, description, created_at, updated_at, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run('proj_test_1', 'Harare Studio Session', 'Stage 1 Verification Catalog', now, now);

  const fetched = db.prepare('SELECT * FROM projects WHERE id = ?').get('proj_test_1');
  assert(fetched && fetched.name === 'Harare Studio Session', 'Project record successfully inserted and queried');

  db.close();
  if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
  const walPath = `${tempDbPath}-wal`;
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  const shmPath = `${tempDbPath}-shm`;
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
} catch (err) {
  assert(false, `Database test encountered error: ${err.message}`);
}

// TEST 2: Sharp Image Processing Engine Verification
console.log('\n2. Native Image Processing Engine (Sharp):');
try {
  assert(typeof sharp === 'function', 'Sharp library loaded successfully');

  // Create a 100x100 test buffer and process it
  const testImgBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 226, g: 164, b: 57, alpha: 1 }
    }
  }).jpeg().toBuffer();

  const meta = await sharp(testImgBuffer).metadata();
  assert(meta.width === 100 && meta.height === 100, `Sharp created and analyzed image buffer (${meta.width}x${meta.height}, format: ${meta.format})`);
} catch (err) {
  assert(false, `Sharp test encountered error: ${err.message}`);
}

// TEST 3: File Structure & Security Audit
console.log('\n3. Architecture & Security Structure Audit:');
const requiredFiles = [
  'electron/main.ts',
  'electron/preload.ts',
  'electron/ipc/channels.ts',
  'electron/ipc/handlers.ts',
  'electron/services/storageService.ts',
  'electron/services/projectService.ts',
  'electron/services/libraryService.ts',
  'electron/workers/workerPool.ts',
  'electron/workers/thumbnailWorker.ts',
  'src/app/App.tsx',
  'src/components/layout/TopAppBar.tsx',
  'src/components/layout/LibraryNav.tsx',
  'src/components/layout/CentralWorkspace.tsx',
  'src/components/layout/EditingPanel.tsx',
  'src/components/layout/BottomStatusBar.tsx',
  'src/state/AppContext.tsx',
  'src/styles/variables.css',
  'src/styles/global.css',
  'database/migrations/001_initial_schema.sql',
  'electron-builder.yml',
  'package.json',
  'tsconfig.json',
  'vite.config.ts'
];

for (const file of requiredFiles) {
  assert(fs.existsSync(path.resolve(file)), `Required file '${file}' exists`);
}

// Security Check: Preload does NOT expose Node APIs
const preloadContent = fs.readFileSync('electron/preload.ts', 'utf8');
assert(!preloadContent.includes("require('fs')"), 'Preload does not leak raw fs to renderer');
assert(!preloadContent.includes("require('child_process')"), 'Preload does not leak child_process to renderer');
assert(preloadContent.includes('contextBridge.exposeInMainWorld'), 'Preload uses secure contextBridge');

// Main Security Check
const mainContent = fs.readFileSync('electron/main.ts', 'utf8');
assert(mainContent.includes('contextIsolation: true'), 'Main process enables contextIsolation');
assert(mainContent.includes('nodeIntegration: false'), 'Main process disables nodeIntegration');

console.log('\n----------------------------------------------------');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('----------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✅ ALL STAGE 1 CHECKS PASSED.');
  process.exit(0);
}
