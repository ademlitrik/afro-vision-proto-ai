import {
  SystemInfo,
  Project,
  Photo,
  PhotoMetadata,
  LibraryCounts,
  WorkerStatus,
  FlagType,
  LibraryFilterType,
  ImportResult,
  ImportProgressEvent,
  CacheStats,
  EditParameters,
  ImageAnalysisResult,
  Preset
} from './models';

export interface AfroVisionAPI {
  getPathForFile?: (file: File) => string;
  getSystemInfo: () => Promise<SystemInfo>;
  selectFiles: () => Promise<string[]>;
  selectFolder: () => Promise<string | null>;

  listProjects: () => Promise<Project[]>;
  getActiveProject: () => Promise<Project | null>;
  createProject: (payload: { name: string; description?: string }) => Promise<Project>;
  setActiveProject: (id: string) => Promise<boolean>;

  listPhotos: (filter?: {
    projectId?: string;
    filterType?: LibraryFilterType;
    ratingMin?: number;
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }) => Promise<Photo[]>;
  getCounts: (projectId?: string) => Promise<LibraryCounts>;
  updateRating: (photoId: string, rating: number) => Promise<boolean>;
  updateRatingBatch: (photoIds: string[], rating: number) => Promise<number>;
  updateFlag: (photoId: string, flag: FlagType) => Promise<boolean>;
  updateFlagBatch: (photoIds: string[], flag: FlagType) => Promise<number>;
  toggleFavorite: (photoId: string) => Promise<boolean>;
  updateFavoriteBatch: (photoIds: string[], isFavorite: boolean) => Promise<number>;
  getPhotoMetadata: (photoId: string) => Promise<PhotoMetadata | null>;

  // Import Engine
  importFiles: (sources: string[], projectId: string) => Promise<ImportResult>;
  loadSamplePhotos: (projectId: string) => Promise<ImportResult>;
  cancelImport: (jobId: string) => Promise<boolean>;
  onImportProgress: (callback: (progress: ImportProgressEvent) => void) => () => void;

  // Cache
  getCacheStats: () => Promise<CacheStats>;
  cleanCache: () => Promise<{ removedCount: number; reclaimedBytes: number }>;

  // Non-Destructive Edits
  getPhotoEdits: (photoId: string) => Promise<EditParameters>;
  savePhotoEdits: (photoId: string, edits: Partial<EditParameters>) => Promise<EditParameters>;
  resetPhotoEdits: (photoId: string) => Promise<EditParameters>;

  // Real Image Analysis Engine (Stage 4)
  analyzePhoto: (photoId: string) => Promise<ImageAnalysisResult>;
  getPhotoAnalysis: (photoId: string) => Promise<ImageAnalysisResult | null>;

  // Presets & Batch Processing (Stage 7)
  listPresets: (category?: string) => Promise<Preset[]>;
  getPreset: (id: string) => Promise<Preset | null>;
  savePreset: (payload: { name: string; category?: string; parameters: Partial<EditParameters> }) => Promise<Preset>;
  deletePreset: (id: string) => Promise<boolean>;
  applyPreset: (photoId: string, presetId: string) => Promise<EditParameters>;
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

  getWorkerStatus: () => Promise<WorkerStatus>;
}

declare global {
  interface Window {
    afroVisionAPI: AfroVisionAPI;
  }
}
