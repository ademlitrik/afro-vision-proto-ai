import path from 'path';
import fs from 'fs';
import { StorageService } from './storageService';
import { getDatabase } from '../database/connection';

export interface CacheStats {
  thumbnailCount: number;
  previewCount: number;
  totalSizeBytes: number;
}

export class CacheManager {
  private static storage = StorageService.getInstance();

  public static getThumbnailPath(photoId: string): string {
    return path.join(this.storage.getThumbnailsDir(), `${photoId}.jpg`);
  }

  public static getPreviewPath(photoId: string): string {
    return path.join(this.storage.getPreviewsDir(), `${photoId}.jpg`);
  }

  public static hasValidThumbnail(photoId: string): boolean {
    const thumbPath = this.getThumbnailPath(photoId);
    try {
      if (fs.existsSync(thumbPath)) {
        const stats = fs.statSync(thumbPath);
        return stats.size > 0;
      }
    } catch {
      return false;
    }
    return false;
  }

  public static getCacheStats(): CacheStats {
    let thumbnailCount = 0;
    let previewCount = 0;
    let totalSizeBytes = 0;

    const thumbDir = this.storage.getThumbnailsDir();
    if (fs.existsSync(thumbDir)) {
      const files = fs.readdirSync(thumbDir);
      thumbnailCount = files.length;
      for (const file of files) {
        try {
          const stats = fs.statSync(path.join(thumbDir, file));
          totalSizeBytes += stats.size;
        } catch {
          // ignore concurrent file changes
        }
      }
    }

    const prevDir = this.storage.getPreviewsDir();
    if (fs.existsSync(prevDir)) {
      const files = fs.readdirSync(prevDir);
      previewCount = files.length;
      for (const file of files) {
        try {
          const stats = fs.statSync(path.join(prevDir, file));
          totalSizeBytes += stats.size;
        } catch {
          // ignore concurrent file changes
        }
      }
    }

    return {
      thumbnailCount,
      previewCount,
      totalSizeBytes
    };
  }

  public static cleanOrphanedCache(): { removedCount: number; reclaimedBytes: number } {
    const db = getDatabase();
    const rows = db.prepare('SELECT id FROM photos').all() as { id: string }[];
    const activeIds = new Set(rows.map(r => r.id));

    let removedCount = 0;
    let reclaimedBytes = 0;

    const dirs = [this.storage.getThumbnailsDir(), this.storage.getPreviewsDir()];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const photoId = path.basename(file, path.extname(file));
        if (!activeIds.has(photoId)) {
          const fullPath = path.join(dir, file);
          try {
            const stats = fs.statSync(fullPath);
            reclaimedBytes += stats.size;
            fs.unlinkSync(fullPath);
            removedCount++;
          } catch (err) {
            console.warn(`[CACHE] Failed to remove orphaned file ${fullPath}:`, err);
          }
        }
      }
    }

    return { removedCount, reclaimedBytes };
  }

  public static clearAllCache(): void {
    const dirs = [this.storage.getThumbnailsDir(), this.storage.getPreviewsDir()];
    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(dir, file));
          } catch {
            // ignore
          }
        }
      }
    }
  }
}
