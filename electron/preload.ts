import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { IPC_CHANNELS } from './ipc/channels';

export interface AfroVisionAPI {
  // Utilities
  getPathForFile: (file: File) => string;

  // System
  getSystemInfo: () => Promise<{
    appName: string;
    appVersion: string;
    electronVersion: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    cpuCount: number;
    totalMemoryGb: number;
  }>;
  selectFiles: () => Promise<string[]>;
  selectFolder: () => Promise<string | null>;

  // Projects
  listProjects: () => Promise<Array<{
    id: string;
    name: string;
    description: string | null;
    created_at: number;
    updated_at: number;
    is_active: number;
  }>>;
  getActiveProject: () => Promise<{
    id: string;
    name: string;
    description: string | null;
    created_at: number;
    updated_at: number;
    is_active: number;
  } | null>;
  createProject: (payload: { name: string; description?: string }) => Promise<{
    id: string;
    name: string;
    description: string | null;
    created_at: number;
    updated_at: number;
    is_active: number;
  }>;
  setActiveProject: (id: string) => Promise<boolean>;

  // Photos & Culling
  listPhotos: (filter?: {
    projectId?: string;
    filterType?: string;
    ratingMin?: number;
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }) => Promise<Array<{
    id: string;
    project_id: string;
    file_path: string;
    file_name: string;
    file_size: number;
    file_format: string;
    file_hash: string | null;
    width: number;
    height: number;
    thumbnail_path: string | null;
    preview_path: string | null;
    rating: number;
    flag: 'pick' | 'unflagged' | 'reject';
    is_favorite: number;
    is_edited?: number;
    has_ai_analysis?: number;
    import_date: number;
    created_at: number;
    updated_at: number;
  }>>;
  getCounts: (projectId?: string) => Promise<{
    all: number;
    picks: number;
    rejects: number;
    unflagged: number;
    favorites: number;
    rated: number;
    edited: number;
    needs_review: number;
    recent_imports: number;
  }>;
  updateRating: (photoId: string, rating: number) => Promise<boolean>;
  updateRatingBatch: (photoIds: string[], rating: number) => Promise<number>;
  updateFlag: (photoId: string, flag: 'pick' | 'unflagged' | 'reject') => Promise<boolean>;
  updateFlagBatch: (photoIds: string[], flag: 'pick' | 'unflagged' | 'reject') => Promise<number>;
  toggleFavorite: (photoId: string) => Promise<boolean>;
  updateFavoriteBatch: (photoIds: string[], isFavorite: boolean) => Promise<number>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  deletePhotosBatch: (photoIds: string[]) => Promise<number>;
  duplicatePhoto: (photoId: string) => Promise<any>;
  movePhotosBatch: (photoIds: string[], targetProjectId: string) => Promise<number>;
  getPhotoMetadata: (photoId: string) => Promise<{    photo_id: string;
    camera_make: string | null;
    camera_model: string | null;
    lens_model: string | null;
    focal_length: number | null;
    iso: number | null;
    aperture: number | null;
    shutter_speed: string | null;
    exposure_bias: number | null;
    white_balance: string | null;
    color_space: string | null;
    date_taken: number | null;
    raw_exif_json: string | null;
  } | null>;

  // Import Engine
  importFiles: (sources: string[], projectId: string) => Promise<{
    jobId: string;
    totalFound: number;
    importedCount: number;
    duplicateCount: number;
    failedCount: number;
    failures: Array<{ filePath: string; fileName: string; reason: string }>;
    cancelled: boolean;
  }>;
  loadSamplePhotos: (projectId: string) => Promise<{
    jobId: string;
    totalFound: number;
    importedCount: number;
    duplicateCount: number;
    failedCount: number;
    failures: Array<{ filePath: string; fileName: string; reason: string }>;
    cancelled: boolean;
  }>;
  cancelImport: (jobId: string) => Promise<boolean>;
  onImportProgress: (callback: (progress: {
    jobId: string;
    total: number;
    current: number;
    percentage: number;
    currentFileName: string;
    importedCount: number;
    duplicateCount: number;
    failedCount: number;
    status: 'scanning' | 'processing' | 'completed' | 'cancelled' | 'failed';
  }) => void) => () => void;

  // Cache
  getCacheStats: () => Promise<{
    thumbnailCount: number;
    previewCount: number;
    totalSizeBytes: number;
  }>;
  cleanCache: () => Promise<{ removedCount: number; reclaimedBytes: number }>;

  // Non-Destructive Edits
  getPhotoEdits: (photoId: string) => Promise<any>;
  savePhotoEdits: (photoId: string, edits: Record<string, number>) => Promise<any>;
  resetPhotoEdits: (photoId: string) => Promise<any>;

  // Real Image Analysis Engine (Stage 4)
  analyzePhoto: (photoId: string) => Promise<any>;
  getPhotoAnalysis: (photoId: string) => Promise<any>;

  // Presets & Batch Processing (Stage 7)
  listPresets: (category?: string) => Promise<any[]>;
  getPreset: (id: string) => Promise<any>;
  savePreset: (payload: { name: string; category?: string; parameters: Record<string, number> }) => Promise<any>;
  deletePreset: (id: string) => Promise<boolean>;
  applyPreset: (photoId: string, presetId: string) => Promise<any>;
  applyPresetBatch: (photoIds: string[], presetId: string) => Promise<number>;
  applyBatchAiCorrections: (photoIds: string[]) => Promise<number>;

  // Export Engine
  exportPhotos: (payload: {
    photoIds: string[];
    outputFolder: string;
    format?: 'jpeg' | 'png' | 'webp';
    quality?: number;
    maxDimension?: number;
  }) => Promise<{
    total: number;
    exported: number;
    failed: number;
    destination: string;
    files: string[];
    errors: string[];
  }>;

  // Menu Bridge
  onMenuAction: (callback: (action: string) => void) => () => void;

  // Workers
  getWorkerStatus: () => Promise<{
    poolSize: number;
    activeWorkers: number;
    queueLength: number;
  }>;
}

const api: AfroVisionAPI = {
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  getSystemInfo: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_INFO),
  selectFiles: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SELECT_FILES),
  selectFolder: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SELECT_FOLDER),

  listProjects: () => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_LIST),
  getActiveProject: () => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET_ACTIVE),
  createProject: (payload) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_CREATE, payload),
  setActiveProject: (id) => ipcRenderer.invoke(IPC_CHANNELS.PROJECT_SET_ACTIVE, { id }),

  listPhotos: (filter) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_LIST, filter),
  getCounts: (projectId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_GET_COUNTS, { projectId }),
  updateRating: (photoId, rating) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_UPDATE_RATING, { photoId, rating }),
  updateRatingBatch: (photoIds, rating) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_UPDATE_RATING_BATCH, { photoIds, rating }),
  updateFlag: (photoId, flag) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_UPDATE_FLAG, { photoId, flag }),
  updateFlagBatch: (photoIds, flag) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_UPDATE_FLAG_BATCH, { photoIds, flag }),
  toggleFavorite: (photoId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_TOGGLE_FAVORITE, { photoId }),
  updateFavoriteBatch: (photoIds, isFavorite) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_UPDATE_FAVORITE_BATCH, { photoIds, isFavorite }),
  deletePhoto: (photoId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_DELETE, { photoId }),
  deletePhotosBatch: (photoIds) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_DELETE_BATCH, { photoIds }),
  duplicatePhoto: (photoId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_DUPLICATE, { photoId }),
  movePhotosBatch: (photoIds, targetProjectId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_MOVE_BATCH, { photoIds, targetProjectId }),
  getPhotoMetadata: (photoId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_GET_METADATA, { photoId }),

  importFiles: (sources, projectId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_IMPORT_FILES, { sources, projectId }),
  loadSamplePhotos: (projectId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_LOAD_SAMPLES, { projectId }),
  cancelImport: (jobId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_IMPORT_CANCEL, { jobId }),
  onImportProgress: (callback) => {
    const subscription = (_event: Electron.IpcRendererEvent, progress: Parameters<typeof callback>[0]) => {
      callback(progress);
    };
    ipcRenderer.on(IPC_CHANNELS.PHOTO_IMPORT_PROGRESS, subscription);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.PHOTO_IMPORT_PROGRESS, subscription);
    };
  },

  getCacheStats: () => ipcRenderer.invoke(IPC_CHANNELS.CACHE_GET_STATS),
  cleanCache: () => ipcRenderer.invoke(IPC_CHANNELS.CACHE_CLEAN),

  getPhotoEdits: (photoId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_GET_EDITS, { photoId }),
  savePhotoEdits: (photoId, edits) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_SAVE_EDITS, { photoId, edits }),
  resetPhotoEdits: (photoId) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_RESET_EDITS, { photoId }),

  analyzePhoto: (photoId) => ipcRenderer.invoke(IPC_CHANNELS.AI_ANALYZE_PHOTO, { photoId }),
  getPhotoAnalysis: (photoId) => ipcRenderer.invoke(IPC_CHANNELS.AI_GET_ANALYSIS, { photoId }),

  listPresets: (category) => ipcRenderer.invoke(IPC_CHANNELS.PRESET_LIST, { category }),
  getPreset: (id) => ipcRenderer.invoke(IPC_CHANNELS.PRESET_GET, { id }),
  savePreset: (payload) => ipcRenderer.invoke(IPC_CHANNELS.PRESET_SAVE, payload),
  deletePreset: (id) => ipcRenderer.invoke(IPC_CHANNELS.PRESET_DELETE, { id }),
  applyPreset: (photoId, presetId) => ipcRenderer.invoke(IPC_CHANNELS.PRESET_APPLY, { photoId, presetId }),
  applyPresetBatch: (photoIds, presetId) => ipcRenderer.invoke(IPC_CHANNELS.PRESET_APPLY_BATCH, { photoIds, presetId }),
  applyBatchAiCorrections: (photoIds) => ipcRenderer.invoke(IPC_CHANNELS.BATCH_APPLY_AI_CORRECTIONS, { photoIds }),

  exportPhotos: (payload) => ipcRenderer.invoke(IPC_CHANNELS.PHOTO_EXPORT_BATCH, payload),
  onMenuAction: (callback) => {
    const subscription = (_event: Electron.IpcRendererEvent, action: string) => {
      callback(action);
    };
    ipcRenderer.on('menu:action', subscription);
    return () => {
      ipcRenderer.removeListener('menu:action', subscription);
    };
  },

  getWorkerStatus: () => ipcRenderer.invoke(IPC_CHANNELS.WORKER_GET_STATUS)
};

contextBridge.exposeInMainWorld('afroVisionAPI', api);
