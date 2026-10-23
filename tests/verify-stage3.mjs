import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

console.log('====================================================');
console.log('AFRO VISION PROTO AI — STAGE 3 VERIFICATION SUITE');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// Setup isolated in-memory or temp SQLite database with full schema
const testDbDir = path.join(os.tmpdir(), `afro_stage3_test_${Date.now()}`);
fs.mkdirSync(testDbDir, { recursive: true });
const dbPath = path.join(testDbDir, 'test.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Create required tables
db.exec(`
  CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE photos (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_format TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    aspect_ratio REAL NOT NULL,
    color_space TEXT,
    orientation INTEGER DEFAULT 1,
    checksum TEXT NOT NULL,
    import_date INTEGER NOT NULL,
    rating INTEGER DEFAULT 0,
    flag TEXT DEFAULT 'unflagged',
    is_favorite INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE edits (
    id TEXT PRIMARY KEY,
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    exposure REAL DEFAULT 0.0,
    contrast REAL DEFAULT 0.0,
    highlights REAL DEFAULT 0.0,
    shadows REAL DEFAULT 0.0,
    whites REAL DEFAULT 0.0,
    blacks REAL DEFAULT 0.0,
    temperature REAL DEFAULT 0.0,
    tint REAL DEFAULT 0.0,
    vibrance REAL DEFAULT 0.0,
    saturation REAL DEFAULT 0.0,
    clarity REAL DEFAULT 0.0,
    dehaze REAL DEFAULT 0.0,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE ai_analyses (
    id TEXT PRIMARY KEY,
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  );
`);

// Seed project and photos
const projectId = 'proj-001';
const now = Date.now();
db.prepare('INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
  projectId, 'Stage 3 Test Project', now, now
);

const insertPhoto = db.prepare(`
  INSERT INTO photos (
    id, project_id, file_path, file_name, file_size, file_format,
    width, height, aspect_ratio, checksum, import_date, rating, flag, is_favorite,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Insert 10 test photos with distinct attributes
for (let i = 1; i <= 10; i++) {
  const photoId = `photo-${String(i).padStart(3, '0')}`;
  const fileName = `DSC_${1000 + i}.jpg`;
  const fileSize = 1000000 + i * 50000;
  const rating = i <= 3 ? i : 0; // photo 1: 1 star, photo 2: 2 stars, photo 3: 3 stars
  const flag = i === 1 ? 'pick' : i === 2 ? 'reject' : 'unflagged';
  const isFavorite = i === 1 ? 1 : 0;
  const importDate = i === 10 ? now - (48 * 60 * 60 * 1000) : now; // photo 10 was imported 2 days ago

  insertPhoto.run(
    photoId, projectId, `C:/photos/${fileName}`, fileName, fileSize, 'image/jpeg',
    6000, 4000, 1.5, `checksum-${i}`, importDate, rating, flag, isFavorite,
    now + i * 1000, now + i * 1000
  );
}

console.log('1. Batch Rating Operations:');
try {
  const photoIds = ['photo-004', 'photo-005', 'photo-006'];
  const updateStmt = db.prepare('UPDATE photos SET rating = ?, updated_at = ? WHERE id = ?');
  const batchRating = db.transaction((ids, rating) => {
    let count = 0;
    for (const id of ids) {
      count += updateStmt.run(rating, Date.now(), id).changes;
    }
    return count;
  });

  const updated = batchRating(photoIds, 5);
  assert(updated === 3, 'Batch rating updated 3 photo records successfully');

  const ratedPhotos = db.prepare('SELECT id, rating FROM photos WHERE id IN (?, ?, ?)').all(...photoIds);
  assert(ratedPhotos.every(p => p.rating === 5), 'All targeted photos have rating = 5');
} catch (err) {
  assert(false, `Batch rating failed: ${err.message}`);
}

console.log('\n2. Batch Flag Operations:');
try {
  const photoIds = ['photo-007', 'photo-008'];
  const updateFlagStmt = db.prepare('UPDATE photos SET flag = ?, updated_at = ? WHERE id = ?');
  const batchFlag = db.transaction((ids, flag) => {
    let count = 0;
    for (const id of ids) {
      count += updateFlagStmt.run(flag, Date.now(), id).changes;
    }
    return count;
  });

  const updated = batchFlag(photoIds, 'pick');
  assert(updated === 2, 'Batch flag updated 2 photo records to pick');

  const flagged = db.prepare('SELECT flag FROM photos WHERE id IN (?, ?)').all(...photoIds);
  assert(flagged.every(p => p.flag === 'pick'), 'Targeted photos have flag = "pick"');
} catch (err) {
  assert(false, `Batch flag failed: ${err.message}`);
}

console.log('\n3. Batch Favorite Operations:');
try {
  const photoIds = ['photo-002', 'photo-003'];
  const updateFavStmt = db.prepare('UPDATE photos SET is_favorite = ?, updated_at = ? WHERE id = ?');
  const batchFav = db.transaction((ids, isFav) => {
    let count = 0;
    for (const id of ids) {
      count += updateFavStmt.run(isFav ? 1 : 0, Date.now(), id).changes;
    }
    return count;
  });

  const updated = batchFav(photoIds, true);
  assert(updated === 2, 'Batch favorite updated 2 photo records');

  const favorites = db.prepare('SELECT is_favorite FROM photos WHERE id IN (?, ?)').all(...photoIds);
  assert(favorites.every(p => p.is_favorite === 1), 'Targeted photos marked as favorites');
} catch (err) {
  assert(false, `Batch favorite failed: ${err.message}`);
}

console.log('\n4. Search Query Filtering:');
try {
  const searchQuery = '1005';
  const results = db.prepare('SELECT file_name FROM photos WHERE file_name LIKE ?').all(`%${searchQuery}%`);
  assert(results.length === 1 && results[0].file_name === 'DSC_1005.jpg', 'Search query finds exact matching photo by filename');

  const searchDsc = db.prepare('SELECT file_name FROM photos WHERE file_name LIKE ?').all('%DSC%');
  assert(searchDsc.length === 10, 'Search query "%DSC%" matches all 10 photos');
} catch (err) {
  assert(false, `Search query test failed: ${err.message}`);
}

console.log('\n5. Sorting Verification:');
try {
  const byNameAsc = db.prepare('SELECT file_name FROM photos ORDER BY file_name ASC').all();
  assert(byNameAsc[0].file_name === 'DSC_1001.jpg' && byNameAsc[9].file_name === 'DSC_1010.jpg', 'Sort by file_name ASC produces correct order');

  const bySizeDesc = db.prepare('SELECT file_size FROM photos ORDER BY file_size DESC').all();
  assert(bySizeDesc[0].file_size > bySizeDesc[9].file_size, 'Sort by file_size DESC produces correct order');

  const byRatingDesc = db.prepare('SELECT rating FROM photos ORDER BY rating DESC').all();
  assert(byRatingDesc[0].rating === 5 && byRatingDesc[9].rating === 0, 'Sort by rating DESC produces correct order');
} catch (err) {
  assert(false, `Sorting verification failed: ${err.message}`);
}

console.log('\n6. Joined Edits & AI Analysis Status:');
try {
  // Add edit for photo-001 (non-zero exposure)
  db.prepare(`
    INSERT INTO edits (id, photo_id, exposure, updated_at) VALUES ('edit-001', 'photo-001', 0.5, ?)
  `).run(Date.now());

  // Add neutral edit for photo-002 (all zeros)
  db.prepare(`
    INSERT INTO edits (id, photo_id, exposure, contrast, updated_at) VALUES ('edit-002', 'photo-002', 0.0, 0.0, ?)
  `).run(Date.now());

  // Add AI analysis for photo-003
  db.prepare(`
    INSERT INTO ai_analyses (id, photo_id, created_at) VALUES ('ai-003', 'photo-003', ?)
  `).run(Date.now());

  const testQuery = `
    SELECT 
      photos.id,
      CASE 
        WHEN edits.exposure != 0 
          OR edits.contrast != 0 
          OR edits.highlights != 0 
          OR edits.shadows != 0 
          OR edits.whites != 0
          OR edits.blacks != 0
          OR edits.temperature != 0
          OR edits.tint != 0
          OR edits.vibrance != 0
          OR edits.saturation != 0
          OR edits.clarity != 0
          OR edits.dehaze != 0
        THEN 1 
        ELSE 0 
      END AS is_edited,
      CASE 
        WHEN ai_analyses.id IS NOT NULL THEN 1 
        ELSE 0 
      END AS has_ai_analysis
    FROM photos
    LEFT JOIN edits ON photos.id = edits.photo_id
    LEFT JOIN ai_analyses ON photos.id = ai_analyses.photo_id
    WHERE photos.id IN ('photo-001', 'photo-002', 'photo-003', 'photo-004')
    ORDER BY photos.id ASC
  `;

  const rows = db.prepare(testQuery).all();
  const p1 = rows.find(r => r.id === 'photo-001');
  const p2 = rows.find(r => r.id === 'photo-002');
  const p3 = rows.find(r => r.id === 'photo-003');
  const p4 = rows.find(r => r.id === 'photo-004');

  assert(p1.is_edited === 1, 'Photo 1 with exposure adjustment correctly marked is_edited = 1');
  assert(p2.is_edited === 0, 'Photo 2 with neutral edit values correctly marked is_edited = 0');
  assert(p3.has_ai_analysis === 1, 'Photo 3 with AI analysis record correctly marked has_ai_analysis = 1');
  assert(p4.is_edited === 0 && p4.has_ai_analysis === 0, 'Photo 4 without edits or AI analysis correctly marked 0/0');
} catch (err) {
  assert(false, `Joined edits & AI status verification failed: ${err.message}`);
}

console.log('\n7. Library Counts Aggregations:');
try {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const total = db.prepare('SELECT COUNT(*) as count FROM photos').get().count;
  const picks = db.prepare("SELECT COUNT(*) as count FROM photos WHERE flag = 'pick'").get().count;
  const rejects = db.prepare("SELECT COUNT(*) as count FROM photos WHERE flag = 'reject'").get().count;
  const unflagged = db.prepare("SELECT COUNT(*) as count FROM photos WHERE flag = 'unflagged'").get().count;
  const favorites = db.prepare('SELECT COUNT(*) as count FROM photos WHERE is_favorite = 1').get().count;
  const rated = db.prepare('SELECT COUNT(*) as count FROM photos WHERE rating > 0').get().count;
  const recent = db.prepare('SELECT COUNT(*) as count FROM photos WHERE import_date >= ?').get(oneDayAgo).count;

  assert(total === 10, `Total photo count matches (10)`);
  assert(picks === 3, `Picks count matches expected (3: photo-001, photo-007, photo-008)`);
  assert(rejects === 1, `Rejects count matches expected (1: photo-002)`);
  assert(unflagged === 6, `Unflagged count matches expected (6)`);
  assert(favorites === 3, `Favorites count matches expected (3: photo-001, photo-002, photo-003)`);
  assert(rated === 6, `Rated count matches expected (6: photo-001, photo-002, photo-003, photo-004, photo-005, photo-006)`);
  assert(recent === 9, `Recent imports count matches expected (9 within last 24h, 1 older)`);
} catch (err) {
  assert(false, `Library counts verification failed: ${err.message}`);
}

// Cleanup test db
db.close();
try {
  fs.rmSync(testDbDir, { recursive: true, force: true });
} catch {}

console.log('\n====================================================');
console.log(`STAGE 3 VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
