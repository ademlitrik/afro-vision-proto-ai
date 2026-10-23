import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BrowserWindow } from 'electron';
import { getDatabase } from '../database/connection';
import { FormatDetector } from './formatDetector';
import { MetadataService } from './metadataService';
import { CacheManager } from './cacheManager';
import { WorkerPool } from '../workers/workerPool';
import { IPC_CHANNELS } from '../ipc/channels';

export interface ImportProgressEvent {
  jobId: string;
  total: number;
  current: number;
  percentage: number;
  currentFileName: string;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
  status: 'scanning' | 'processing' | 'completed' | 'cancelled' | 'failed';
}

export interface ImportFailure {
  filePath: string;
  fileName: string;
  reason: string;
}

export interface ImportResult {
  jobId: string;
  totalFound: number;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
  failures: ImportFailure[];
  cancelled: boolean;
}

export class ImportEngine {
  private static activeJobs: Map<string, { isCancelled: boolean }> = new Map();

  public static cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.isCancelled = true;
      return true;
    }
    return false;
  }

  public static async importSources(
    sources: string[],
    projectId: string,
    window?: BrowserWindow | null
  ): Promise<ImportResult> {
    const jobId = 'import_' + Date.now();
    this.activeJobs.set(jobId, { isCancelled: false });

    const jobState = this.activeJobs.get(jobId)!;
    const db = getDatabase();

    // 1. Log job in processing_jobs table
    db.prepare(`
      INSERT INTO processing_jobs (id, job_type, status, total_items, processed_items, failed_items, created_at, started_at)
      VALUES (?, 'photo_import', 'processing', 0, 0, 0, ?, ?)
    `).run(jobId, Date.now(), Date.now());

    // Send scanning progress
    this.emitProgress(window, {
      jobId,
      total: 0,
      current: 0,
      percentage: 0,
      currentFileName: 'Scanning source paths...',
      importedCount: 0,
      duplicateCount: 0,
      failedCount: 0,
      status: 'scanning'
    });

    // 2. Discover all files (expanding folders recursively)
    const discoveredFiles: string[] = [];
    for (const src of sources) {
      if (jobState.isCancelled) break;
      this.collectFilesRecursive(src, discoveredFiles);
    }

    const total = discoveredFiles.length;
    let current = 0;
    let importedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const failures: ImportFailure[] = [];

    // Pre-fetch existing paths and hashes for duplicate detection in project
    const existingRows = db.prepare(
      'SELECT file_path, file_hash FROM photos WHERE project_id = ?'
    ).all(projectId) as { file_path: string; file_hash: string | null }[];

    const existingPaths = new Set(existingRows.map(r => path.resolve(r.file_path)));
    const existingHashes = new Set(existingRows.map(r => r.file_hash).filter(Boolean) as string[]);

    const workerPool = WorkerPool.getInstance();

    // 3. Process discovered files
    for (const filePath of discoveredFiles) {
      if (jobState.isCancelled) {
        break;
      }

      current++;
      const fileName = path.basename(filePath);
      const absPath = path.resolve(filePath);

      this.emitProgress(window, {
        jobId,
        total,
        current,
        percentage: Math.round((current / (total || 1)) * 100),
        currentFileName: fileName,
        importedCount,
        duplicateCount,
        failedCount,
        status: 'processing'
      });

      // Duplicate Check 1: File path
      if (existingPaths.has(absPath)) {
        duplicateCount++;
        continue;
      }

      // Check format support
      const formatInfo = FormatDetector.detect(filePath);
      if (formatInfo.supportStatus === 'UNSUPPORTED') {
        failedCount++;
        failures.push({
          filePath,
          fileName,
          reason: `Unsupported format (${formatInfo.extension})`
        });
        continue;
      }

      if (formatInfo.supportStatus === 'RAW_REQUIRES_EXT_DECODER') {
        failedCount++;
        failures.push({
          filePath,
          fileName,
          reason: `${formatInfo.description}`
        });
        continue;
      }

      try {
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        // Generate fast file hash (sample first 64KB + size for speed on large RAWs)
        const fileHash = this.computeFastHash(filePath, fileSize);

        // Duplicate Check 2: Hash
        if (existingHashes.has(fileHash)) {
          duplicateCount++;
          continue;
        }

        const photoId = 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const thumbnailPath = CacheManager.getThumbnailPath(photoId);
        const previewPath = CacheManager.getPreviewPath(photoId);

        // Offload thumbnail & preview generation to WorkerPool (Sharp)
        const workerResult = await workerPool.enqueueThumbnailJob({
          id: photoId,
          filePath,
          thumbnailPath,
          previewPath,
          maxThumbSize: 400,
          maxPreviewSize: 1920
        });

        if (!workerResult.success) {
          failedCount++;
          failures.push({
            filePath,
            fileName,
            reason: workerResult.error || 'Failed to decode image in worker thread'
          });
          continue;
        }

        // Extract detailed EXIF metadata
        const metaResult = await MetadataService.extract(filePath);
        const now = Date.now();

        // Transactional insert into catalog
        db.transaction(() => {
          // Insert photo
          db.prepare(`
            INSERT INTO photos (
              id, project_id, file_path, file_name, file_size, file_format, file_hash,
              width, height, thumbnail_path, preview_path, rating, flag, is_favorite,
              import_date, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'unflagged', 0, ?, ?, ?)
          `).run(
            photoId,
            projectId,
            absPath,
            fileName,
            fileSize,
            metaResult.format || formatInfo.extension.replace('.', ''),
            fileHash,
            workerResult.width || metaResult.width,
            workerResult.height || metaResult.height,
            thumbnailPath,
            previewPath,
            now,
            now,
            now
          );

          // Insert photo metadata
          const p = metaResult.parsed;
          db.prepare(`
            INSERT INTO photo_metadata (
              photo_id, camera_make, camera_model, lens_model, focal_length, iso,
              aperture, shutter_speed, exposure_bias, white_balance, color_space,
              date_taken, raw_exif_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            photoId,
            p.cameraMake,
            p.cameraModel,
            p.lensModel,
            p.focalLength,
            p.iso,
            p.aperture,
            p.shutterSpeed,
            p.exposureBias,
            p.whiteBalance,
            p.colorSpace,
            p.dateTaken || stats.mtimeMs,
            p.rawExifJson
          );

          // Insert default non-destructive edit baseline
          db.prepare(`
            INSERT INTO edits (
              photo_id, version, exposure, contrast, highlights, shadows, whites, blacks,
              temperature, tint, vibrance, saturation, texture, clarity, dehaze,
              sharpening, noise_reduction, lens_profile_enabled, chromatic_aberration,
              distortion, vignette, crop_x, crop_y, crop_w, crop_h, rotate, flip_h,
              flip_v, skin_protection_enabled, updated_at
            ) VALUES (?, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, ?)
          `).run(photoId, now);
        })();

        existingPaths.add(absPath);
        existingHashes.add(fileHash);
        importedCount++;
      } catch (err: unknown) {
        failedCount++;
        const msg = err instanceof Error ? err.message : String(err);
        failures.push({ filePath, fileName, reason: msg });
      }
    }

    const isCancelled = jobState.isCancelled;
    const finalStatus = isCancelled ? 'cancelled' : failedCount > 0 && importedCount === 0 ? 'failed' : 'completed';

    // Update processing_jobs
    db.prepare(`
      UPDATE processing_jobs
      SET status = ?, processed_items = ?, failed_items = ?, completed_at = ?, error_message = ?
      WHERE id = ?
    `).run(
      finalStatus,
      importedCount,
      failedCount,
      Date.now(),
      failures.length > 0 ? JSON.stringify(failures) : null,
      jobId
    );

    this.activeJobs.delete(jobId);

    const result: ImportResult = {
      jobId,
      totalFound: total,
      importedCount,
      duplicateCount,
      failedCount,
      failures,
      cancelled: isCancelled
    };

    this.emitProgress(window, {
      jobId,
      total,
      current,
      percentage: 100,
      currentFileName: isCancelled ? 'Import cancelled' : 'Import complete',
      importedCount,
      duplicateCount,
      failedCount,
      status: finalStatus
    });

    return result;
  }

  private static collectFilesRecursive(targetPath: string, resultList: string[]): void {
    try {
      if (!fs.existsSync(targetPath)) return;
      const stats = fs.statSync(targetPath);

      if (stats.isFile()) {
        if (FormatDetector.isSupportedExtension(targetPath)) {
          resultList.push(targetPath);
        }
      } else if (stats.isDirectory()) {
        const entries = fs.readdirSync(targetPath);
        for (const entry of entries) {
          if (entry.startsWith('.')) continue; // skip hidden dirs
          this.collectFilesRecursive(path.join(targetPath, entry), resultList);
        }
      }
    } catch (err) {
      console.warn(`[IMPORT] Error accessing path ${targetPath}:`, err);
    }
  }

  private static computeFastHash(filePath: string, fileSize: number): string {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buffer = Buffer.alloc(Math.min(65536, fileSize));
      fs.readSync(fd, buffer, 0, buffer.length, 0);
      const hash = crypto.createHash('sha256');
      hash.update(buffer);
      hash.update(fileSize.toString());
      return hash.digest('hex');
    } finally {
      fs.closeSync(fd);
    }
  }

  private static emitProgress(window: BrowserWindow | null | undefined, progress: ImportProgressEvent): void {
    if (window && !window.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.PHOTO_IMPORT_PROGRESS, progress);
    }
  }
}
