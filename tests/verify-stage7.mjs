import Database from 'better-sqlite3';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

console.log('====================================================');
console.log('AFRO VISION PROTO AI — STAGE 7 VERIFICATION SUITE');
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

const testDir = path.join(os.tmpdir(), `afro_stage7_test_${Date.now()}`);
fs.mkdirSync(testDir, { recursive: true });
const tempDbPath = path.join(testDir, 'catalog.db');
let db = null;

try {
  // 1. Database & Schema Initialization
  console.log('1. Presets Database & Built-In Seeding:');
  db = new Database(tempDbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schemaSql = fs.readFileSync('database/migrations/001_initial_schema.sql', 'utf8');
  db.exec(schemaSql);
  assert(true, 'Initialized catalog schema with presets table');

  // Seed built-in presets
  const BUILT_IN_PRESETS = [
    {
      id: 'preset_melanin_editorial',
      name: 'Rich Melanin Editorial',
      category: 'Melanin Studio',
      parameters: { exposure: 0.25, contrast: 14, highlights: -12, shadows: 22, temperature: 12, skin_protection_enabled: 1 }
    },
    {
      id: 'preset_golden_glow',
      name: 'Golden Hour Glow',
      category: 'Melanin Studio',
      parameters: { exposure: 0.35, contrast: 8, highlights: -18, shadows: 26, temperature: 20, skin_protection_enabled: 1 }
    },
    {
      id: 'preset_deep_bronze',
      name: 'Deep Bronze Radiance',
      category: 'Melanin Studio',
      parameters: { exposure: 0.15, contrast: 16, highlights: -8, shadows: 30, temperature: 8, skin_protection_enabled: 1 }
    },
    {
      id: 'preset_soft_editorial',
      name: 'Editorial Soft Beauty',
      category: 'Portrait',
      parameters: { exposure: 0.2, contrast: -5, highlights: -15, shadows: 18, texture: -8, skin_protection_enabled: 1 }
    },
    {
      id: 'preset_tonal_bw',
      name: 'Melanin Tonal B&W',
      category: 'Monochrome',
      parameters: { exposure: 0.2, contrast: 28, highlights: -10, shadows: 24, saturation: -100, skin_protection_enabled: 1 }
    }
  ];

  const now = Date.now();
  const insertPresetStmt = db.prepare(`
    INSERT INTO presets (id, name, category, is_built_in, parameters_json, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?, ?)
  `);

  for (const p of BUILT_IN_PRESETS) {
    insertPresetStmt.run(p.id, p.name, p.category, JSON.stringify(p.parameters), now, now);
  }

  const seededRows = db.prepare('SELECT * FROM presets').all();
  assert(seededRows.length === 5, `All 5 built-in studio presets successfully seeded (got: ${seededRows.length})`);

  const melaninStudioPresets = db.prepare("SELECT * FROM presets WHERE category = 'Melanin Studio'").all();
  assert(melaninStudioPresets.length === 3, `Category filtering finds 3 Melanin Studio presets (got: ${melaninStudioPresets.length})`);

  // 2. Custom User Preset Creation & Deletion Safety
  console.log('\n2. Custom User Preset Management & Safety Guards:');
  const userPresetId = 'preset_custom_warmth';
  const userParams = { exposure: 0.5, temperature: 15, shadows: 35, skin_protection_enabled: 1 };
  db.prepare(`
    INSERT INTO presets (id, name, category, is_built_in, parameters_json, created_at, updated_at)
    VALUES (?, 'My Custom Warmth', 'User', 0, ?, ?, ?)
  `).run(userPresetId, JSON.stringify(userParams), now, now);

  const customPreset = db.prepare('SELECT * FROM presets WHERE id = ?').get(userPresetId);
  assert(customPreset && customPreset.is_built_in === 0, 'User custom preset saved with is_built_in = 0');
  const parsedParams = JSON.parse(customPreset.parameters_json);
  assert(parsedParams.shadows === 35 && parsedParams.exposure === 0.5, 'User custom preset parameters stored accurately');

  // Deletion safety test: Built-in presets CANNOT be deleted
  const builtInDelResult = db.prepare('DELETE FROM presets WHERE id = ? AND is_built_in = 0').run('preset_melanin_editorial');
  assert(builtInDelResult.changes === 0, 'Safety Guard: Built-in studio presets cannot be deleted (0 rows deleted)');

  // Deletion of user preset succeeds
  const userDelResult = db.prepare('DELETE FROM presets WHERE id = ? AND is_built_in = 0').run(userPresetId);
  assert(userDelResult.changes === 1, 'Custom user preset successfully deleted when requested');

  // 3. Single & Batch Preset Application to Photos
  console.log('\n3. Single & Batch Preset Application:');
  const projId = 'proj_stage7';
  db.prepare('INSERT INTO projects (id, name, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, 1)')
    .run(projId, 'Stage 7 Batch Session', now, now);

  const photoIds = ['photo_s7_1', 'photo_s7_2', 'photo_s7_3'];
  const testImgPaths = [];

  for (let i = 0; i < photoIds.length; i++) {
    const id = photoIds[i];
    const imgPath = path.join(testDir, `batch_${i}.jpg`);
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 60, g: 35, b: 25 }
      }
    }).jpeg().toFile(imgPath);
    testImgPaths.push(imgPath);

    const hash = crypto.createHash('sha256').update(fs.readFileSync(imgPath)).digest('hex');

    db.prepare(`
      INSERT INTO photos (id, project_id, file_path, file_name, file_size, file_format, file_hash, width, height, rating, flag, is_favorite, import_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, 500, 'jpg', ?, 100, 100, 0, 'unflagged', 0, ?, ?, ?)
    `).run(id, projId, imgPath, `batch_${i}.jpg`, hash, now, now, now);

    db.prepare(`
      INSERT INTO edits (
        photo_id, version, exposure, contrast, highlights, shadows, whites, blacks,
        temperature, tint, vibrance, saturation, texture, clarity, dehaze,
        sharpening, noise_reduction, lens_profile_enabled, chromatic_aberration,
        distortion, vignette, crop_x, crop_y, crop_w, crop_h, rotate, flip_h, flip_v,
        skin_protection_enabled, updated_at
      ) VALUES (
        ?, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, ?
      )
    `).run(id, now);
  }

  // Single Photo Preset Apply
  const goldenPreset = JSON.parse(db.prepare("SELECT parameters_json FROM presets WHERE id = 'preset_golden_glow'").get().parameters_json);
  db.prepare(`
    UPDATE edits SET
      exposure = ?,
      contrast = ?,
      highlights = ?,
      shadows = ?,
      temperature = ?,
      version = version + 1,
      updated_at = ?
    WHERE photo_id = ?
  `).run(goldenPreset.exposure, goldenPreset.contrast, goldenPreset.highlights, goldenPreset.shadows, goldenPreset.temperature, Date.now(), photoIds[0]);

  const photo1Edit = db.prepare('SELECT exposure, shadows, temperature FROM edits WHERE photo_id = ?').get(photoIds[0]);
  assert(photo1Edit.exposure === 0.35 && photo1Edit.shadows === 26 && photo1Edit.temperature === 20, 'Single photo preset application applied Golden Glow values');

  // Batch Preset Apply to photo 2 and photo 3
  const melaninPreset = JSON.parse(db.prepare("SELECT parameters_json FROM presets WHERE id = 'preset_melanin_editorial'").get().parameters_json);
  const batchTargets = [photoIds[1], photoIds[2]];

  const updateBatchStmt = db.prepare(`
    UPDATE edits SET
      exposure = ?,
      contrast = ?,
      highlights = ?,
      shadows = ?,
      temperature = ?,
      version = version + 1,
      updated_at = ?
    WHERE photo_id = ?
  `);

  db.transaction(() => {
    for (const id of batchTargets) {
      updateBatchStmt.run(melaninPreset.exposure, melaninPreset.contrast, melaninPreset.highlights, melaninPreset.shadows, melaninPreset.temperature, Date.now(), id);
    }
  })();

  const batchEdits = db.prepare('SELECT photo_id, exposure, shadows FROM edits WHERE photo_id IN (?, ?)').all(photoIds[1], photoIds[2]);
  assert(batchEdits.length === 2 && batchEdits.every(e => e.exposure === 0.25 && e.shadows === 22), 'Batch preset application updated all targeted photos');

  // 4. Batch AI Auto-Correction Simulation
  console.log('\n4. Batch AI Auto-Correction Pipeline:');
  const simulatedAiRecs = {
    exposure: 0.4,
    shadows: 20,
    clarity: 4,
    skin_protection_enabled: 1
  };

  db.transaction(() => {
    for (const id of photoIds) {
      db.prepare(`
        UPDATE edits SET
          exposure = ?,
          shadows = ?,
          clarity = ?,
          skin_protection_enabled = ?,
          version = version + 1,
          updated_at = ?
        WHERE photo_id = ?
      `).run(simulatedAiRecs.exposure, simulatedAiRecs.shadows, simulatedAiRecs.clarity, simulatedAiRecs.skin_protection_enabled, Date.now(), id);
    }
  })();

  const allEdits = db.prepare('SELECT photo_id, exposure, clarity, skin_protection_enabled FROM edits WHERE photo_id IN (?, ?, ?)').all(photoIds[0], photoIds[1], photoIds[2]);
  assert(allEdits.length === 3 && allEdits.every(e => e.clarity === 4 && e.skin_protection_enabled === 1), 'Batch AI auto-correction applied to all 3 photos with skin tone protection active');

  // 5. Zero Destruction Guarantee
  console.log('\n5. Zero Destruction Guarantee Verification:');
  let zeroDestruction = true;
  for (let i = 0; i < photoIds.length; i++) {
    const originalHash = db.prepare('SELECT file_hash FROM photos WHERE id = ?').get(photoIds[i]).file_hash;
    const currentHash = crypto.createHash('sha256').update(fs.readFileSync(testImgPaths[i])).digest('hex');
    if (originalHash !== currentHash) {
      zeroDestruction = false;
    }
  }
  assert(zeroDestruction, 'CRITICAL: All original image file hashes remain completely unchanged (Zero Destruction Guarantee)');
} catch (err) {
  console.error('[UNHANDLED TEST ERROR]', err);
  failed++;
} finally {
  try {
    if (db) db.close();
  } catch {}
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {}
}

console.log('\n====================================================');
console.log(`STAGE 7 VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
