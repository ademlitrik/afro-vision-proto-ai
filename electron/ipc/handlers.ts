import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from './channels';
import { SystemHandler } from './systemHandler';
import { ProjectHandler } from './projectHandler';
import { PhotoHandler } from './photoHandler';
import { CacheHandler } from './cacheHandler';
import { AIHandler } from './aiHandler';
import { PresetHandler } from './presetHandler';
import { WorkerPool } from '../workers/workerPool';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // System
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_INFO, () => {
    return SystemHandler.handleGetInfo();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SELECT_FILES, () => {
    return SystemHandler.handleSelectFiles(mainWindow);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SELECT_FOLDER, () => {
    return SystemHandler.handleSelectFolder(mainWindow);
  });

  // Projects
  ipcMain.handle(IPC_CHANNELS.PROJECT_LIST, () => {
    return ProjectHandler.handleList();
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_GET_ACTIVE, () => {
    return ProjectHandler.handleGetActive();
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_CREATE, (_event, payload) => {
    return ProjectHandler.handleCreate(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_SET_ACTIVE, (_event, payload) => {
    return ProjectHandler.handleSetActive(payload);
  });

  // Photos
  ipcMain.handle(IPC_CHANNELS.PHOTO_LIST, (_event, payload) => {
    return PhotoHandler.handleList(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_GET_COUNTS, (_event, payload) => {
    return PhotoHandler.handleGetCounts(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_UPDATE_RATING, (_event, payload) => {
    return PhotoHandler.handleUpdateRating(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_UPDATE_RATING_BATCH, (_event, payload) => {
    return PhotoHandler.handleUpdateRatingBatch(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_UPDATE_FLAG, (_event, payload) => {
    return PhotoHandler.handleUpdateFlag(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_UPDATE_FLAG_BATCH, (_event, payload) => {
    return PhotoHandler.handleUpdateFlagBatch(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_TOGGLE_FAVORITE, (_event, payload) => {
    return PhotoHandler.handleToggleFavorite(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_UPDATE_FAVORITE_BATCH, (_event, payload) => {
    return PhotoHandler.handleUpdateFavoriteBatch(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_GET_METADATA, (_event, payload) => {
    return PhotoHandler.handleGetMetadata(payload);
  });

  // Import Engine
  ipcMain.handle(IPC_CHANNELS.PHOTO_IMPORT_FILES, (_event, payload) => {
    return PhotoHandler.handleImportFiles(payload, mainWindow);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_IMPORT_CANCEL, (_event, payload) => {
    return PhotoHandler.handleCancelImport(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_LOAD_SAMPLES, (_event, payload) => {
    return PhotoHandler.handleLoadSamples(payload, mainWindow);
  });

  // Export Engine
  ipcMain.handle(IPC_CHANNELS.PHOTO_EXPORT_BATCH, (_event, payload) => {
    return PhotoHandler.handleExportBatch(payload);
  });

  // Delete / Duplicate Photos
  ipcMain.handle(IPC_CHANNELS.PHOTO_DELETE, (_event, payload) => {
    return PhotoHandler.handleDeletePhoto(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_DELETE_BATCH, (_event, payload) => {
    return PhotoHandler.handleDeletePhotosBatch(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_DUPLICATE, (_event, payload) => {
    return PhotoHandler.handleDuplicatePhoto(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_MOVE_BATCH, (_event, payload) => {
    return PhotoHandler.handleMovePhotosBatch(payload);
  });

  // Cache
  ipcMain.handle(IPC_CHANNELS.CACHE_GET_STATS, () => {
    return CacheHandler.handleGetStats();
  });

  ipcMain.handle(IPC_CHANNELS.CACHE_CLEAN, () => {
    return CacheHandler.handleClean();
  });

  // Non-Destructive Edits
  ipcMain.handle(IPC_CHANNELS.PHOTO_GET_EDITS, (_event, payload) => {
    return AIHandler.handleGetEdits(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_SAVE_EDITS, (_event, payload) => {
    return AIHandler.handleSaveEdits(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PHOTO_RESET_EDITS, (_event, payload) => {
    return AIHandler.handleResetEdits(payload);
  });

  // Real Image Analysis Engine (Stage 4)
  ipcMain.handle(IPC_CHANNELS.AI_ANALYZE_PHOTO, (_event, payload) => {
    return AIHandler.handleAnalyzePhoto(payload);
  });

  ipcMain.handle(IPC_CHANNELS.AI_GET_ANALYSIS, (_event, payload) => {
    return AIHandler.handleGetAnalysis(payload);
  });

  // Presets & Batch Processing (Stage 7)
  ipcMain.handle(IPC_CHANNELS.PRESET_LIST, (_event, payload) => {
    return PresetHandler.handleList(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PRESET_GET, (_event, payload) => {
    return PresetHandler.handleGet(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PRESET_SAVE, (_event, payload) => {
    return PresetHandler.handleSave(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PRESET_DELETE, (_event, payload) => {
    return PresetHandler.handleDelete(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PRESET_APPLY, (_event, payload) => {
    return PresetHandler.handleApply(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PRESET_APPLY_BATCH, (_event, payload) => {
    return PresetHandler.handleApplyBatch(payload);
  });

  ipcMain.handle(IPC_CHANNELS.BATCH_APPLY_AI_CORRECTIONS, (_event, payload) => {
    return PresetHandler.handleApplyBatchAiCorrections(payload);
  });

  // Workers
  ipcMain.handle(IPC_CHANNELS.WORKER_GET_STATUS, () => {
    const pool = WorkerPool.getInstance();
    return {
      poolSize: pool.getPoolSize(),
      activeWorkers: pool.getActiveWorkerCount(),
      queueLength: pool.getQueueLength()
    };
  });
}
