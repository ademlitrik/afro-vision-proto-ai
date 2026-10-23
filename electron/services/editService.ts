import { Worker } from 'worker_threads';
import path from 'path';
import { getDatabase } from '../database/connection';
import { EditRecord, AIAnalysisRecord, PhotoMetadataRecord, PhotoRecord } from '../database/schema';
import { DeterministicAnalysisEngine, ImageAnalysisResult } from './imageAnalysisEngine';
import { AnalysisJob, AnalysisWorkerResult } from '../workers/analysisWorker';

export interface DefaultEditValues {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
  texture: number;
  clarity: number;
  dehaze: number;
  sharpening: number;
  noise_reduction: number;
  lens_profile_enabled: number;
  chromatic_aberration: number;
  distortion: number;
  vignette: number;
  crop_x: number;
  crop_y: number;
  crop_w: number;
  crop_h: number;
  rotate: number;
  flip_h: number;
  flip_v: number;
  skin_protection_enabled: number;
}

export const DEFAULT_EDITS: DefaultEditValues = {
  exposure: 0.0,
  contrast: 0.0,
  highlights: 0.0,
  shadows: 0.0,
  whites: 0.0,
  blacks: 0.0,
  temperature: 0.0,
  tint: 0.0,
  vibrance: 0.0,
  saturation: 0.0,
  texture: 0.0,
  clarity: 0.0,
  dehaze: 0.0,
  sharpening: 0.0,
  noise_reduction: 0.0,
  lens_profile_enabled: 0,
  chromatic_aberration: 0,
  distortion: 0.0,
  vignette: 0.0,
  crop_x: 0.0,
  crop_y: 0.0,
  crop_w: 1.0,
  crop_h: 1.0,
  rotate: 0,
  flip_h: 0,
  flip_v: 0,
  skin_protection_enabled: 1
};

export class EditService {
  private static workerScriptPath = path.resolve(__dirname, 'workers/analysisWorker.js');

  /**
   * Retrieves non-destructive edit parameters for a photo.
   * If no edit record exists yet, returns default baseline.
   */
  public static getEdits(photoId: string): EditRecord {
    const db = getDatabase();
    const existing = db.prepare('SELECT * FROM edits WHERE photo_id = ?').get(photoId) as EditRecord | undefined;
    if (existing) {
      return existing;
    }

    // Insert baseline
    const now = Date.now();
    db.prepare(`
      INSERT INTO edits (
        photo_id, version, exposure, contrast, highlights, shadows, whites, blacks,
        temperature, tint, vibrance, saturation, texture, clarity, dehaze,
        sharpening, noise_reduction, lens_profile_enabled, chromatic_aberration,
        distortion, vignette, crop_x, crop_y, crop_w, crop_h, rotate, flip_h, flip_v,
        skin_protection_enabled, updated_at
      ) VALUES (
        ?, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0, 1, 1, 0, 0, 0,
        1, ?
      )
    `).run(photoId, now);

    return db.prepare('SELECT * FROM edits WHERE photo_id = ?').get(photoId) as EditRecord;
  }

  /**
   * Updates non-destructive edit parameters for a photo.
   */
  public static saveEdits(photoId: string, updates: Partial<DefaultEditValues>): EditRecord {
    const db = getDatabase();
    const current = this.getEdits(photoId);
    const now = Date.now();

    const merged = { ...current, ...updates, updated_at: now, version: (current.version || 1) + 1 };

    db.prepare(`
      UPDATE edits SET
        version = ?,
        exposure = ?,
        contrast = ?,
        highlights = ?,
        shadows = ?,
        whites = ?,
        blacks = ?,
        temperature = ?,
        tint = ?,
        vibrance = ?,
        saturation = ?,
        texture = ?,
        clarity = ?,
        dehaze = ?,
        sharpening = ?,
        noise_reduction = ?,
        lens_profile_enabled = ?,
        chromatic_aberration = ?,
        distortion = ?,
        vignette = ?,
        crop_x = ?,
        crop_y = ?,
        crop_w = ?,
        crop_h = ?,
        rotate = ?,
        flip_h = ?,
        flip_v = ?,
        skin_protection_enabled = ?,
        updated_at = ?
      WHERE photo_id = ?
    `).run(
      merged.version,
      merged.exposure,
      merged.contrast,
      merged.highlights,
      merged.shadows,
      merged.whites,
      merged.blacks,
      merged.temperature,
      merged.tint,
      merged.vibrance,
      merged.saturation,
      merged.texture,
      merged.clarity,
      merged.dehaze,
      merged.sharpening,
      merged.noise_reduction,
      merged.lens_profile_enabled,
      merged.chromatic_aberration,
      merged.distortion,
      merged.vignette,
      merged.crop_x,
      merged.crop_y,
      merged.crop_w,
      merged.crop_h,
      merged.rotate,
      merged.flip_h,
      merged.flip_v,
      merged.skin_protection_enabled,
      merged.updated_at,
      photoId
    );

    // Also update photo updated_at timestamp
    db.prepare('UPDATE photos SET updated_at = ? WHERE id = ?').run(now, photoId);

    return db.prepare('SELECT * FROM edits WHERE photo_id = ?').get(photoId) as EditRecord;
  }

  /**
   * Resets all sliders to pristine zero baseline.
   */
  public static resetEdits(photoId: string): EditRecord {
    return this.saveEdits(photoId, DEFAULT_EDITS);
  }

  /**
   * Retrieves stored AI analysis for a photo, if already computed.
   */
  public static getAnalysis(photoId: string): ImageAnalysisResult | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM ai_analyses WHERE photo_id = ? ORDER BY analyzed_at DESC LIMIT 1').get(photoId) as AIAnalysisRecord | undefined;
    if (!row) return null;

    try {
      const measured = JSON.parse(row.measured_analysis_json);
      const recommendations = JSON.parse(row.ai_recommendations_json);
      const warnings = row.warnings_json ? JSON.parse(row.warnings_json) : [];
      const skin = row.skin_regions_json ? JSON.parse(row.skin_regions_json) : {
        detected: row.skin_detected === 1,
        skinPixelPercentage: 0,
        dominantSpectrum: 'none',
        detectedSpectra: [],
        meanLuminance: 0,
        meanHue: 0,
        meanSaturation: 0,
        skinHighlightClippingPct: 0,
        ashyRiskScore: 0,
        undertoneTendency: 'neutral',
        constraints: {
          maxSafeExposureEV: 2.5,
          minSafeExposureEV: -2.5,
          maxSafeClarity: 50,
          maxSafeSaturation: 50,
          maxSafeHighlights: 0,
          minSafeShadows: 0,
          recommendedVibranceBias: 1.0,
          tempCorrectionDamping: 1.0,
          ashyUndertoneProtection: false
        }
      };

      return {
        photoId: row.photo_id,
        version: row.analysis_version,
        analyzedAt: row.analyzed_at,
        measured,
        skin,
        recommendations,
        warnings
      };
    } catch (err) {
      console.error(`[EDIT SERVICE] Failed to deserialize analysis record for ${photoId}:`, err);
      return null;
    }
  }

  /**
   * Performs real pixel analysis on the photo.
   * Runs in a worker thread so the main/renderer UI never blocks.
   * Saves the result into SQLite and returns the result.
   */
  public static async analyzePhoto(photoId: string): Promise<ImageAnalysisResult> {
    const db = getDatabase();
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId) as PhotoRecord | undefined;
    if (!photo) {
      throw new Error(`Photo not found: ${photoId}`);
    }

    const metadata = db.prepare('SELECT * FROM photo_metadata WHERE photo_id = ?').get(photoId) as PhotoMetadataRecord | undefined;

    // Run analysis via Worker Thread
    const analysisResult = await this.runWorkerAnalysis({
      photoId: photo.id,
      imagePath: photo.file_path,
      metadata: metadata || null
    });

    // Save into SQLite ai_analyses table
    const id = `analysis_${photo.id}_${Date.now()}`;
    const m = analysisResult.measured;
    const rec = analysisResult.recommendations;

    db.prepare(`
      INSERT OR REPLACE INTO ai_analyses (
        id, photo_id, analysis_version, analyzed_at,
        exposure_value, exposure_confidence, luminance_median,
        contrast_ratio, dynamic_range_ev, highlight_clipping_pct,
        shadow_clipping_pct, estimated_color_temp_k, estimated_tint,
        skin_detected, skin_regions_json, sharpness_score, noise_score,
        measured_analysis_json, ai_recommendations_json, warnings_json
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
    `).run(
      id,
      photo.id,
      analysisResult.version,
      analysisResult.analyzedAt,
      rec.exposure.value,
      rec.exposure.confidence,
      m.luminanceMedian,
      m.contrastRatio,
      m.dynamicRangeEV,
      m.highlightClippingPct,
      m.shadowClippingPct,
      m.estimatedColorTempK,
      m.estimatedTint,
      analysisResult.skin?.detected ? 1 : 0,
      analysisResult.skin ? JSON.stringify(analysisResult.skin) : null,
      m.sharpnessScore,
      m.noiseScore,
      JSON.stringify(m),
      JSON.stringify(rec),
      JSON.stringify(analysisResult.warnings)
    );

    return analysisResult;
  }

  /**
   * Spawns worker thread or falls back to direct execution if worker script is unavailable
   */
  private static runWorkerAnalysis(job: AnalysisJob): Promise<ImageAnalysisResult> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(this.workerScriptPath);

        worker.on('message', (msg: AnalysisWorkerResult) => {
          worker.terminate();
          if (msg.success && msg.result) {
            resolve(msg.result);
          } else {
            reject(new Error(msg.error || 'Worker analysis failed'));
          }
        });

        worker.on('error', (err) => {
          worker.terminate();
          // Fallback to direct thread if worker script fails
          console.warn('[EDIT SERVICE] Worker error, falling back to direct thread execution:', err.message);
          const directEngine = new DeterministicAnalysisEngine();
          directEngine.analyzeImage(job.photoId, job.imagePath, job.metadata)
            .then(resolve)
            .catch(reject);
        });

        worker.postMessage(job);
      } catch (err) {
        console.warn('[EDIT SERVICE] Could not spawn worker, executing directly:', err);
        const directEngine = new DeterministicAnalysisEngine();
        directEngine.analyzeImage(job.photoId, job.imagePath, job.metadata)
          .then(resolve)
          .catch(reject);
      }
    });
  }
}
