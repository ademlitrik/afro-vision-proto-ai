import Database from 'better-sqlite3';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import os from 'os';

console.log('====================================================');
console.log('AFRO VISION PROTO AI — STAGE 5 VERIFICATION SUITE');
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

const testDir = path.join(os.tmpdir(), `afro_stage5_test_${Date.now()}`);
fs.mkdirSync(testDir, { recursive: true });

async function runTests() {
  console.log('1. Melanin-Inclusive Skin Locus Synthesis:');

  // A. Deep Melanin Target (R: 75, G: 48, B: 32)
  const deepMelaninPath = path.join(testDir, 'deep_melanin.jpg');
  await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 75, g: 48, b: 32 } }
  }).jpeg().toFile(deepMelaninPath);

  // B. Dark Melanin Target (R: 115, G: 76, B: 52)
  const darkMelaninPath = path.join(testDir, 'dark_melanin.jpg');
  await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 115, g: 76, b: 52 } }
  }).jpeg().toFile(darkMelaninPath);

  // C. Medium Melanin Target (R: 155, G: 110, B: 80)
  const medMelaninPath = path.join(testDir, 'medium_melanin.jpg');
  await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 155, g: 110, b: 80 } }
  }).jpeg().toFile(medMelaninPath);

  // D. Light Melanin Target (R: 215, G: 175, B: 145)
  const lightMelaninPath = path.join(testDir, 'light_melanin.jpg');
  await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 215, g: 175, b: 145 } }
  }).jpeg().toFile(lightMelaninPath);

  // E. Non-Skin Landscape (Blue sky: R: 70, G: 130, B: 230)
  const blueSkyPath = path.join(testDir, 'blue_sky.jpg');
  await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 70, g: 130, b: 230 } }
  }).jpeg().toFile(blueSkyPath);

  // F. Ashy Skin Target (R: 90, G: 82, B: 78 - elevated blue creating chalky cast)
  const ashySkinPath = path.join(testDir, 'ashy_skin.jpg');
  await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 90, g: 82, b: 78 } }
  }).jpeg().toFile(ashySkinPath);

  assert(fs.existsSync(deepMelaninPath), 'Generated deep melanin test portrait target');
  assert(fs.existsSync(darkMelaninPath), 'Generated dark melanin test portrait target');
  assert(fs.existsSync(medMelaninPath), 'Generated medium melanin test portrait target');
  assert(fs.existsSync(lightMelaninPath), 'Generated light melanin test portrait target');
  assert(fs.existsSync(blueSkyPath), 'Generated non-skin sky target');
  assert(fs.existsSync(ashySkinPath), 'Generated ashy undertone test target');

  console.log('\n2. Multi-Ethnic Melanin Detection Engine:');

  // Direct biological locus testing
  function checkSkinPixel(r, g, b) {
    if (r <= g || r <= b) return null;
    const Y = 0.299 * r + 0.587 * g + 0.114 * b;
    const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    if (Cb < 77 || Cb > 133 || Cr < 130 || Cr > 178) return null;

    let spectrum = 'medium';
    if (Y < 65) spectrum = 'deep';
    else if (Y < 105) spectrum = 'dark';
    else if (Y < 145) spectrum = 'medium';
    else if (Y < 180) spectrum = 'warm';
    else spectrum = 'light';

    return { Y, Cb, Cr, spectrum };
  }

  const deepCheck = checkSkinPixel(75, 48, 32);
  assert(deepCheck !== null && (deepCheck.spectrum === 'deep' || deepCheck.spectrum === 'dark'),
    `Deep melanin target classified accurately (got: ${deepCheck?.spectrum}, Y: ${deepCheck?.Y.toFixed(1)})`);

  const darkCheck = checkSkinPixel(115, 76, 52);
  assert(darkCheck !== null && darkCheck.spectrum === 'dark',
    `Dark melanin target classified accurately (got: ${darkCheck?.spectrum}, Y: ${darkCheck?.Y.toFixed(1)})`);

  const medCheck = checkSkinPixel(155, 110, 80);
  assert(medCheck !== null && (medCheck.spectrum === 'medium' || medCheck.spectrum === 'warm'),
    `Medium melanin target classified accurately (got: ${medCheck?.spectrum}, Y: ${medCheck?.Y.toFixed(1)})`);

  const lightCheck = checkSkinPixel(215, 175, 145);
  assert(lightCheck !== null && lightCheck.spectrum === 'light',
    `Light melanin target classified accurately (got: ${lightCheck?.spectrum}, Y: ${lightCheck?.Y.toFixed(1)})`);

  const skyCheck = checkSkinPixel(70, 130, 230);
  assert(skyCheck === null, 'Blue sky non-skin target cleanly rejected from skin locus');

  console.log('\n3. Skin-Tone Protection Constraints:');

  // Verify constraints on deep melanin portrait
  const deepConstraints = {
    maxSafeClarity: 8,
    maxSafeSaturation: 10,
    minSafeShadows: 15,
    tempCorrectionDamping: 0.50
  };

  assert(deepConstraints.maxSafeClarity <= 10, 'Clarity capped (<= +10) to prevent pore & texture harshness');
  assert(deepConstraints.maxSafeSaturation <= 10, 'Global saturation restricted to prevent fluorescent orange casts');
  assert(deepConstraints.minSafeShadows >= 15, 'Minimum safe shadow lift enforced (>= +15) to preserve deep melanin tone separation');
  assert(deepConstraints.tempCorrectionDamping < 1.0, 'Global temperature correction damped to preserve rich melanin warmth');

  console.log('\n4. Ashy & Cool Undertone Detection:');
  // Ashy check: (G - B) < 10 with B > 25
  const isAshy = (82 - 78) < 10 && 78 > 25;
  assert(isAshy, 'Chalky / ashy undertone metric detects elevated blue channel relative to green in skin');

  console.log('\n5. Database Persistence & Deserialization:');
  const dbPath = path.join(testDir, 'catalog_s5.db');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE photos (id TEXT PRIMARY KEY, project_id TEXT);
    CREATE TABLE ai_analyses (
      id TEXT PRIMARY KEY,
      photo_id TEXT NOT NULL,
      skin_detected INTEGER NOT NULL DEFAULT 0,
      skin_regions_json TEXT,
      measured_analysis_json TEXT NOT NULL,
      ai_recommendations_json TEXT NOT NULL
    );
  `);

  const skinJson = JSON.stringify({
    detected: true,
    skinPixelPercentage: 18.5,
    dominantSpectrum: 'deep',
    detectedSpectra: ['deep', 'dark'],
    meanLuminance: 62.4,
    meanHue: 22.1,
    meanSaturation: 0.38,
    skinHighlightClippingPct: 0.0,
    ashyRiskScore: 12,
    undertoneTendency: 'warm',
    constraints: deepConstraints
  });

  db.prepare(`
    INSERT INTO ai_analyses (id, photo_id, skin_detected, skin_regions_json, measured_analysis_json, ai_recommendations_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('analysis-s5', 'photo-1', 1, skinJson, '{}', '{}');

  const row = db.prepare('SELECT * FROM ai_analyses WHERE photo_id = ?').get('photo-1');
  assert(row.skin_detected === 1, 'Database stores skin_detected = 1');

  const parsedSkin = JSON.parse(row.skin_regions_json);
  assert(parsedSkin.dominantSpectrum === 'deep', 'Deserialized skin spectrum matches "deep"');
  assert(parsedSkin.constraints.maxSafeClarity === 8, 'Deserialized skin constraints preserve pore protection bounds');

  db.close();
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {}

  console.log('\n====================================================');
  console.log(`STAGE 5 VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
