import { AfroVisionAPI } from '../types/electron';
import {
  Project,
  Photo,
  PhotoMetadata,
  LibraryCounts,
  SystemInfo,
  WorkerStatus,
  FlagType,
  LibraryFilterType,
  ImportResult,
  CacheStats
} from '../types/models';

const mockSystemInfo: SystemInfo = {
  appName: 'AFRO VISION PROTO AI (Web Dev Mode)',
  appVersion: '1.0.0-dev',
  electronVersion: '33.2.1',
  nodeVersion: '24.14.1',
  platform: 'win32',
  arch: 'x64',
  cpuCount: 8,
  totalMemoryGb: 16
};

const mockProject: Project = {
  id: 'proj_default',
  name: 'Studio Session 2026',
  description: 'Default Session',
  created_at: Date.now(),
  updated_at: Date.now(),
  is_active: 1
};

const emptyCounts: LibraryCounts = {
  all: 0,
  picks: 0,
  rejects: 0,
  unflagged: 0,
  favorites: 0,
  rated: 0,
  edited: 0,
  needs_review: 0,
  recent_imports: 0
};

export const apiService: AfroVisionAPI = {
  getPathForFile: (file: File) => {
    if (window.afroVisionAPI?.getPathForFile) {
      return window.afroVisionAPI.getPathForFile(file);
    }
    return (file as unknown as { path?: string }).path || '';
  },
  getSystemInfo: async () => {
    if (window.afroVisionAPI) return window.afroVisionAPI.getSystemInfo();
    return mockSystemInfo;
  },
  selectFiles: async () => {
    if (window.afroVisionAPI) return window.afroVisionAPI.selectFiles();
    return [];
  },
  selectFolder: async () => {
    if (window.afroVisionAPI) return window.afroVisionAPI.selectFolder();
    return null;
  },
  listProjects: async () => {
    if (window.afroVisionAPI) return window.afroVisionAPI.listProjects();
    return [mockProject];
  },
  getActiveProject: async () => {
    if (window.afroVisionAPI) return window.afroVisionAPI.getActiveProject();
    return mockProject;
  },
  createProject: async (payload) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.createProject(payload);
    return {
      id: 'proj_' + Date.now(),
      name: payload.name,
      description: payload.description || null,
      created_at: Date.now(),
      updated_at: Date.now(),
      is_active: 1
    };
  },
  setActiveProject: async (id) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.setActiveProject(id);
    return true;
  },

  // Photos — Stage 3 enhanced with filterType, searchQuery, sortBy, sortOrder
  listPhotos: async (filter) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.listPhotos(filter);
    return [];
  },
  getCounts: async (projectId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.getCounts(projectId);
    return emptyCounts;
  },

  // Single photo operations
  updateRating: async (photoId, rating) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.updateRating(photoId, rating);
    return true;
  },
  updateFlag: async (photoId, flag: FlagType) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.updateFlag(photoId, flag);
    return true;
  },
  toggleFavorite: async (photoId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.toggleFavorite(photoId);
    return true;
  },

  // Batch operations — Stage 3
  updateRatingBatch: async (photoIds, rating) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.updateRatingBatch(photoIds, rating);
    return 0;
  },
  updateFlagBatch: async (photoIds, flag) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.updateFlagBatch(photoIds, flag);
    return 0;
  },
  updateFavoriteBatch: async (photoIds, isFavorite) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.updateFavoriteBatch(photoIds, isFavorite);
    return 0;
  },
  deletePhoto: async (photoId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.deletePhoto(photoId);
    return false;
  },
  deletePhotosBatch: async (photoIds) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.deletePhotosBatch(photoIds);
    return 0;
  },
  duplicatePhoto: async (photoId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.duplicatePhoto(photoId);
    throw new Error('Duplicate only available in Electron desktop runtime');
  },
  movePhotosBatch: async (photoIds, targetProjectId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.movePhotosBatch(photoIds, targetProjectId);
    return 0;
  },

  getPhotoMetadata: async (photoId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.getPhotoMetadata(photoId);
    return null;
  },
  importFiles: async (sources, projectId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.importFiles(sources, projectId);
    return {
      jobId: 'mock_import',
      totalFound: sources.length,
      importedCount: sources.length,
      duplicateCount: 0,
      failedCount: 0,
      failures: [],
      cancelled: false
    };
  },
  loadSamplePhotos: async (projectId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.loadSamplePhotos(projectId);
    return {
      jobId: 'mock_sample_import',
      totalFound: 4,
      importedCount: 4,
      duplicateCount: 0,
      failedCount: 0,
      failures: [],
      cancelled: false
    };
  },
  cancelImport: async (jobId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.cancelImport(jobId);
    return true;
  },
  onImportProgress: (callback) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.onImportProgress(callback);
    return () => {};
  },
  getCacheStats: async () => {
    if (window.afroVisionAPI) return window.afroVisionAPI.getCacheStats();
    return { thumbnailCount: 0, previewCount: 0, totalSizeBytes: 0 };
  },
  cleanCache: async () => {
    if (window.afroVisionAPI) return window.afroVisionAPI.cleanCache();
    return { removedCount: 0, reclaimedBytes: 0 };
  },

  // Non-Destructive Edits
  getPhotoEdits: async (photoId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.getPhotoEdits(photoId);
    return {
      photo_id: photoId,
      version: 1,
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      temperature: 0,
      tint: 0,
      vibrance: 0,
      saturation: 0,
      texture: 0,
      clarity: 0,
      dehaze: 0,
      sharpening: 0,
      noise_reduction: 0,
      lens_profile_enabled: 0,
      chromatic_aberration: 0,
      distortion: 0,
      vignette: 0,
      crop_x: 0,
      crop_y: 0,
      crop_w: 1,
      crop_h: 1,
      rotate: 0,
      flip_h: 0,
      flip_v: 0,
      skin_protection_enabled: 1,
      updated_at: Date.now()
    };
  },
  savePhotoEdits: async (photoId, edits) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.savePhotoEdits(photoId, edits);
    return {
      photo_id: photoId,
      version: 1,
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      temperature: 0,
      tint: 0,
      vibrance: 0,
      saturation: 0,
      texture: 0,
      clarity: 0,
      dehaze: 0,
      sharpening: 0,
      noise_reduction: 0,
      lens_profile_enabled: 0,
      chromatic_aberration: 0,
      distortion: 0,
      vignette: 0,
      crop_x: 0,
      crop_y: 0,
      crop_w: 1,
      crop_h: 1,
      rotate: 0,
      flip_h: 0,
      flip_v: 0,
      skin_protection_enabled: 1,
      updated_at: Date.now(),
      ...edits
    };
  },
  resetPhotoEdits: async (photoId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.resetPhotoEdits(photoId);
    return {
      photo_id: photoId,
      version: 1,
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      temperature: 0,
      tint: 0,
      vibrance: 0,
      saturation: 0,
      texture: 0,
      clarity: 0,
      dehaze: 0,
      sharpening: 0,
      noise_reduction: 0,
      lens_profile_enabled: 0,
      chromatic_aberration: 0,
      distortion: 0,
      vignette: 0,
      crop_x: 0,
      crop_y: 0,
      crop_w: 1,
      crop_h: 1,
      rotate: 0,
      flip_h: 0,
      flip_v: 0,
      skin_protection_enabled: 1,
      updated_at: Date.now()
    };
  },

  // Real Image Analysis Engine (Stage 4)
  analyzePhoto: async (photoId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.analyzePhoto(photoId);
    throw new Error('Analysis only available in Electron desktop runtime');
  },
  getPhotoAnalysis: async (photoId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.getPhotoAnalysis(photoId);
    return null;
  },

  // Presets & Batch Processing (Stage 7)
  listPresets: async (category) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.listPresets(category);
    return [];
  },
  getPreset: async (id) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.getPreset(id);
    return null;
  },
  savePreset: async (payload) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.savePreset(payload);
    throw new Error('Presets require Electron desktop runtime');
  },
  deletePreset: async (id) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.deletePreset(id);
    return false;
  },
  applyPreset: async (photoId, presetId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.applyPreset(photoId, presetId);
    throw new Error('Presets require Electron desktop runtime');
  },
  applyPresetBatch: async (photoIds, presetId) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.applyPresetBatch(photoIds, presetId);
    return 0;
  },
  applyBatchAiCorrections: async (photoIds) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.applyBatchAiCorrections(photoIds);
    return 0;
  },

  exportPhotos: async (payload) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.exportPhotos(payload);
    throw new Error('Export only available in Electron desktop runtime');
  },
  onMenuAction: (callback) => {
    if (window.afroVisionAPI) return window.afroVisionAPI.onMenuAction(callback);
    return () => {};
  },

  getWorkerStatus: async () => {
    if (window.afroVisionAPI) return window.afroVisionAPI.getWorkerStatus();
    return { poolSize: 4, activeWorkers: 0, queueLength: 0 };
  }
};
