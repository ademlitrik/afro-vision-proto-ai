import { BrowserWindow } from 'electron';
import { LibraryService, LibraryFilterOptions, LibraryFilterType } from '../services/libraryService';
import { ImportEngine } from '../services/importEngine';
import { SamplePhotoService } from '../services/samplePhotoService';
import { RenderService, ExportBatchOptions } from '../services/renderService';
import { getDatabase } from '../database/connection';
import { PhotoMetadataRecord } from '../database/schema';

export class PhotoHandler {
  public static handleList(payload: unknown) {
    const options: LibraryFilterOptions = {};
    if (typeof payload === 'object' && payload !== null) {
      const p = payload as Record<string, unknown>;
      if (typeof p.projectId === 'string') options.projectId = p.projectId;
      if (typeof p.filterType === 'string') {
        options.filterType = p.filterType as LibraryFilterType;
      }
      if (typeof p.ratingMin === 'number') options.ratingMin = p.ratingMin;
      if (typeof p.searchQuery === 'string') options.searchQuery = p.searchQuery;
      if (typeof p.sortBy === 'string' && ['created_at', 'file_name', 'rating', 'file_size'].includes(p.sortBy)) {
        options.sortBy = p.sortBy as 'created_at' | 'file_name' | 'rating' | 'file_size';
      }
      if (typeof p.sortOrder === 'string' && ['ASC', 'DESC'].includes(p.sortOrder)) {
        options.sortOrder = p.sortOrder as 'ASC' | 'DESC';
      }
      if (typeof p.limit === 'number') options.limit = p.limit;
      if (typeof p.offset === 'number') options.offset = p.offset;
    }

    return LibraryService.getPhotos(options);
  }

  public static handleGetCounts(payload: unknown) {
    let projectId: string | undefined;
    if (typeof payload === 'object' && payload !== null) {
      const p = payload as Record<string, unknown>;
      if (typeof p.projectId === 'string') projectId = p.projectId;
    }

    return LibraryService.getCounts(projectId);
  }

  public static handleUpdateRating(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid update rating payload');
    }
    const { photoId, rating } = payload as { photoId?: unknown; rating?: unknown };
    if (typeof photoId !== 'string' || typeof rating !== 'number') {
      throw new Error('Photo ID and rating number are required');
    }

    return LibraryService.updateRating(photoId, rating);
  }

  public static handleUpdateRatingBatch(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid update rating batch payload');
    }
    const { photoIds, rating } = payload as { photoIds?: unknown; rating?: unknown };
    if (!Array.isArray(photoIds) || typeof rating !== 'number') {
      throw new Error('Photo IDs array and rating number are required');
    }

    return LibraryService.updateRatingBatch(photoIds as string[], rating);
  }

  public static handleUpdateFlag(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid update flag payload');
    }
    const { photoId, flag } = payload as { photoId?: unknown; flag?: unknown };
    if (typeof photoId !== 'string' || !['pick', 'unflagged', 'reject'].includes(String(flag))) {
      throw new Error('Valid photo ID and flag are required');
    }

    return LibraryService.updateFlag(photoId, flag as 'pick' | 'unflagged' | 'reject');
  }

  public static handleUpdateFlagBatch(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid update flag batch payload');
    }
    const { photoIds, flag } = payload as { photoIds?: unknown; flag?: unknown };
    if (!Array.isArray(photoIds) || !['pick', 'unflagged', 'reject'].includes(String(flag))) {
      throw new Error('Valid photo IDs array and flag are required');
    }

    return LibraryService.updateFlagBatch(photoIds as string[], flag as 'pick' | 'unflagged' | 'reject');
  }

  public static handleToggleFavorite(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid toggle favorite payload');
    }
    const { photoId } = payload as { photoId?: unknown };
    if (typeof photoId !== 'string') {
      throw new Error('Valid photo ID is required');
    }

    return LibraryService.toggleFavorite(photoId);
  }

  public static handleUpdateFavoriteBatch(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid update favorite batch payload');
    }
    const { photoIds, isFavorite } = payload as { photoIds?: unknown; isFavorite?: unknown };
    if (!Array.isArray(photoIds) || typeof isFavorite !== 'boolean') {
      throw new Error('Photo IDs array and isFavorite boolean are required');
    }

    return LibraryService.updateFavoriteBatch(photoIds as string[], isFavorite);
  }

  public static handleGetMetadata(payload: unknown): PhotoMetadataRecord | null {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid get metadata payload');
    }
    const { photoId } = payload as { photoId?: unknown };
    if (typeof photoId !== 'string') {
      throw new Error('Photo ID string is required');
    }

    const db = getDatabase();
    const row = db.prepare('SELECT * FROM photo_metadata WHERE photo_id = ?').get(photoId) as PhotoMetadataRecord | undefined;
    return row || null;
  }

  public static async handleImportFiles(payload: unknown, window?: BrowserWindow | null) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid import files payload');
    }
    const { sources, projectId } = payload as { sources?: unknown; projectId?: unknown };

    if (!Array.isArray(sources) || sources.length === 0) {
      throw new Error('Sources array must contain at least one file or folder path');
    }
    if (typeof projectId !== 'string' || !projectId) {
      throw new Error('Valid project ID is required for import');
    }

    const validSources = sources.filter(s => typeof s === 'string') as string[];
    return ImportEngine.importSources(validSources, projectId, window);
  }

  public static handleCancelImport(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid cancel import payload');
    }
    const { jobId } = payload as { jobId?: unknown };
    if (typeof jobId !== 'string') {
      throw new Error('Job ID string is required');
    }

    return ImportEngine.cancelJob(jobId);
  }

  public static async handleLoadSamples(payload: unknown, window?: BrowserWindow | null) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid load samples payload');
    }
    const { projectId } = payload as { projectId?: unknown };
    if (typeof projectId !== 'string' || !projectId) {
      throw new Error('Valid project ID is required to load samples');
    }

    return SamplePhotoService.createAndImportSamples(projectId, window);
  }

  public static async handleExportBatch(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid export batch payload');
    }
    const { photoIds, outputFolder, format, quality, maxDimension } = payload as {
      photoIds?: string[];
      outputFolder?: string;
      format?: 'jpeg' | 'png' | 'webp';
      quality?: number;
      maxDimension?: number;
    };
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      throw new Error('No photos selected for export');
    }
    if (!outputFolder) {
      throw new Error('Destination folder is required');
    }

    return RenderService.exportBatch(photoIds, {
      outputFolder,
      format: format || 'jpeg',
      quality: quality || 90,
      maxDimension
    });
  }

  public static handleDeletePhoto(payload: unknown): boolean {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid delete photo payload');
    }
    const { photoId } = payload as { photoId?: unknown };
    if (typeof photoId !== 'string') {
      throw new Error('Valid photo ID is required');
    }
    return LibraryService.deletePhoto(photoId);
  }

  public static handleDeletePhotosBatch(payload: unknown): number {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid delete photos batch payload');
    }
    const { photoIds } = payload as { photoIds?: unknown };
    if (!Array.isArray(photoIds)) {
      throw new Error('Photo IDs array is required');
    }
    return LibraryService.deletePhotosBatch(photoIds as string[]);
  }

  public static handleDuplicatePhoto(payload: unknown) {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid duplicate photo payload');
    }
    const { photoId } = payload as { photoId?: unknown };
    if (typeof photoId !== 'string') {
      throw new Error('Valid photo ID is required');
    }
    return LibraryService.duplicatePhoto(photoId);
  }

  public static handleMovePhotosBatch(payload: unknown): number {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid move photos payload');
    }
    const { photoIds, targetProjectId } = payload as { photoIds?: unknown; targetProjectId?: unknown };
    if (!Array.isArray(photoIds) || typeof targetProjectId !== 'string') {
      throw new Error('Photo IDs array and targetProjectId string are required');
    }
    return LibraryService.movePhotosBatch(photoIds as string[], targetProjectId);
  }
}
