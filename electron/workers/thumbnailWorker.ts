import { parentPort } from 'worker_threads';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface ThumbnailJob {
  id: string;
  filePath: string;
  thumbnailPath: string;
  previewPath?: string;
  maxThumbSize?: number;
  maxPreviewSize?: number;
}

export interface ThumbnailResult {
  id: string;
  success: boolean;
  width?: number;
  height?: number;
  format?: string;
  thumbnailPath?: string;
  previewPath?: string;
  error?: string;
}

if (parentPort) {
  parentPort.on('message', async (job: ThumbnailJob) => {
    try {
      if (!fs.existsSync(job.filePath)) {
        throw new Error(`File does not exist: ${job.filePath}`);
      }

      const maxThumbSize = job.maxThumbSize || 400;
      const maxPreviewSize = job.maxPreviewSize || 1920;

      // Ensure destination directory exists
      const thumbDir = path.dirname(job.thumbnailPath);
      if (!fs.existsSync(thumbDir)) {
        fs.mkdirSync(thumbDir, { recursive: true });
      }

      const instance = sharp(job.filePath, { failOnError: false });
      const metadata = await instance.metadata();

      const origWidth = metadata.width || 0;
      const origHeight = metadata.height || 0;
      const format = metadata.format || 'unknown';

      // Generate fast thumbnail
      await instance
        .clone()
        .rotate() // auto-orient via EXIF
        .resize({
          width: maxThumbSize,
          height: maxThumbSize,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80, mozjpeg: false })
        .toFile(job.thumbnailPath);

      // Generate preview if requested
      if (job.previewPath) {
        const previewDir = path.dirname(job.previewPath);
        if (!fs.existsSync(previewDir)) {
          fs.mkdirSync(previewDir, { recursive: true });
        }

        await instance
          .clone()
          .rotate()
          .resize({
            width: maxPreviewSize,
            height: maxPreviewSize,
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toFile(job.previewPath);
      }

      const result: ThumbnailResult = {
        id: job.id,
        success: true,
        width: origWidth,
        height: origHeight,
        format,
        thumbnailPath: job.thumbnailPath,
        previewPath: job.previewPath
      };

      parentPort.postMessage(result);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      parentPort.postMessage({
        id: job.id,
        success: false,
        error: errorMsg
      } as ThumbnailResult);
    }
  });
}
