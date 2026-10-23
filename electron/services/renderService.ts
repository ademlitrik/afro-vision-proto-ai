import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { EditRecord, PhotoRecord } from '../database/schema';
import { StorageService } from './storageService';
import { getDatabase } from '../database/connection';

export interface RenderPreviewResult {
  photoId: string;
  previewPath: string;
  renderedAt: number;
}

export interface ExportBatchOptions {
  outputFolder: string;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
  maxDimension?: number;
}

export interface ExportBatchResult {
  total: number;
  exported: number;
  failed: number;
  destination: string;
  files: string[];
  errors: string[];
}

/**
 * RenderService
 * 
 * Generates non-destructive rendered image buffers from original RAW/JPEG photographs
 * using Sharp image processing pipeline without EVER altering the original file.
 */
export class RenderService {
  private static storage = StorageService.getInstance();

  /**
   * Renders a high-resolution edited preview using Sharp.
   */
  public static async renderPreview(
    photoId: string,
    originalPath: string,
    edits: Partial<EditRecord>,
    maxDimension: number = 1920
  ): Promise<RenderPreviewResult> {
    if (!fs.existsSync(originalPath)) {
      throw new Error(`Cannot render preview: source file does not exist at ${originalPath}`);
    }

    const previewOutDir = path.join(this.storage.getPreviewsDir(), 'rendered');
    if (!fs.existsSync(previewOutDir)) {
      fs.mkdirSync(previewOutDir, { recursive: true });
    }

    const outPath = path.join(previewOutDir, `${photoId}_preview.jpg`);

    let pipeline = sharp(originalPath, { failOnError: false })
      .rotate() // auto-orient
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true
      });

    // 1. Exposure & Saturation modulation
    const exposureEV = edits.exposure || 0;
    const brightness = Math.max(0.1, Math.min(3.0, Math.pow(2, exposureEV)));
    const saturation = Math.max(0, Math.min(3.0, 1.0 + ((edits.saturation || 0) + (edits.vibrance || 0) * 0.7) / 100));

    pipeline = pipeline.modulate({
      brightness,
      saturation
    });

    // 2. Linear Contrast
    const contrast = edits.contrast || 0;
    if (contrast !== 0) {
      const a = 1.0 + (contrast / 100) * 0.5;
      const b = 128 * (1 - a);
      pipeline = pipeline.linear(a, b);
    }

    // 3. Sharpening
    const sharpening = edits.sharpening || 0;
    if (sharpening > 0) {
      const sigma = 0.5 + (sharpening / 100) * 1.5;
      pipeline = pipeline.sharpen({ sigma, m1: 1.0, m2: 2.0 });
    }

    // 4. Output to JPEG
    await pipeline
      .jpeg({ quality: 85, mozjpeg: false })
      .toFile(outPath);

    return {
      photoId,
      previewPath: outPath,
      renderedAt: Date.now()
    };
  }

  /**
   * Renders and exports a full-quality edited photograph to the destination directory.
   */
  public static async renderExport(
    originalPath: string,
    outPath: string,
    edits: Partial<EditRecord>,
    options: {
      format: 'jpeg' | 'png' | 'webp';
      quality: number;
      maxDimension?: number;
    }
  ): Promise<void> {
    let pipeline = sharp(originalPath, { failOnError: false }).rotate();

    // Rotations & Flips
    if (edits.rotation) {
      pipeline = pipeline.rotate(edits.rotation);
    }
    if (edits.flip_horizontal) {
      pipeline = pipeline.flop();
    }
    if (edits.flip_vertical) {
      pipeline = pipeline.flip();
    }

    if (options.maxDimension && options.maxDimension > 0) {
      pipeline = pipeline.resize({
        width: options.maxDimension,
        height: options.maxDimension,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Exposure EV modulation
    const exposureEV = edits.exposure || 0;
    const brightness = Math.max(0.1, Math.min(3.0, Math.pow(2, exposureEV)));
    const saturation = Math.max(0, Math.min(3.0, 1.0 + ((edits.saturation || 0) + (edits.vibrance || 0) * 0.7) / 100));

    pipeline = pipeline.modulate({
      brightness,
      saturation
    });

    // Contrast
    const contrast = edits.contrast || 0;
    if (contrast !== 0) {
      const a = 1.0 + (contrast / 100) * 0.5;
      const b = 128 * (1 - a);
      pipeline = pipeline.linear(a, b);
    }

    // Sharpening
    const sharpening = edits.sharpening || 0;
    if (sharpening > 0) {
      const sigma = 0.5 + (sharpening / 100) * 1.5;
      pipeline = pipeline.sharpen({ sigma, m1: 1.0, m2: 2.0 });
    }

    if (options.format === 'png') {
      await pipeline.png({ compressionLevel: 8 }).toFile(outPath);
    } else if (options.format === 'webp') {
      await pipeline.webp({ quality: options.quality || 90 }).toFile(outPath);
    } else {
      await pipeline.jpeg({ quality: options.quality || 90, mozjpeg: true }).toFile(outPath);
    }
  }

  /**
   * Batch exports an array of photos with their non-destructive adjustments.
   */
  public static async exportBatch(
    photoIds: string[],
    options: ExportBatchOptions
  ): Promise<ExportBatchResult> {
    if (!fs.existsSync(options.outputFolder)) {
      fs.mkdirSync(options.outputFolder, { recursive: true });
    }

    const format = options.format || 'jpeg';
    const quality = options.quality || 90;
    const maxDimension = options.maxDimension;

    const db = getDatabase();
    let exported = 0;
    let failed = 0;
    const files: string[] = [];
    const errors: string[] = [];

    for (const photoId of photoIds) {
      try {
        const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId) as PhotoRecord | undefined;
        if (!photo || !fs.existsSync(photo.file_path)) {
          failed++;
          errors.push(`Photo ${photoId} not found on disk.`);
          continue;
        }

        const edit = db.prepare('SELECT * FROM edits WHERE photo_id = ?').get(photoId) as EditRecord | undefined;
        const edits: Partial<EditRecord> = edit || {};

        const ext = format === 'jpeg' ? '.jpg' : `.${format}`;
        const baseName = path.parse(photo.file_name).name;
        const outFileName = `${baseName}_afrovision${ext}`;
        const outPath = path.join(options.outputFolder, outFileName);

        await this.renderExport(photo.file_path, outPath, edits, {
          format,
          quality,
          maxDimension
        });

        files.push(outPath);
        exported++;
      } catch (err: any) {
        failed++;
        errors.push(err.message || String(err));
      }
    }

    return {
      total: photoIds.length,
      exported,
      failed,
      destination: options.outputFolder,
      files,
      errors
    };
  }
}
