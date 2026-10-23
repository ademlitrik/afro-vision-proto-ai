export const IPC_CHANNELS = {
  // System
  SYSTEM_GET_INFO: 'system:getInfo',
  SYSTEM_SELECT_FILES: 'system:selectFiles',
  SYSTEM_SELECT_FOLDER: 'system:selectFolder',

  // Projects
  PROJECT_LIST: 'project:list',
  PROJECT_GET_ACTIVE: 'project:getActive',
  PROJECT_CREATE: 'project:create',
  PROJECT_SET_ACTIVE: 'project:setActive',

  // Photos
  PHOTO_LIST: 'photo:list',
  PHOTO_GET_COUNTS: 'photo:getCounts',
  PHOTO_UPDATE_RATING: 'photo:updateRating',
  PHOTO_UPDATE_RATING_BATCH: 'photo:updateRatingBatch',
  PHOTO_UPDATE_FLAG: 'photo:updateFlag',
  PHOTO_UPDATE_FLAG_BATCH: 'photo:updateFlagBatch',
  PHOTO_TOGGLE_FAVORITE: 'photo:toggleFavorite',
  PHOTO_UPDATE_FAVORITE_BATCH: 'photo:updateFavoriteBatch',
  PHOTO_GET_METADATA: 'photo:getMetadata',

  // Import Engine
  PHOTO_IMPORT_FILES: 'photo:importFiles',
  PHOTO_IMPORT_CANCEL: 'photo:importCancel',
  PHOTO_IMPORT_PROGRESS: 'photo:importProgress',
  PHOTO_LOAD_SAMPLES: 'photo:loadSamples',

  // Export Engine
  PHOTO_EXPORT_BATCH: 'photo:exportBatch',

  // Cache
  CACHE_GET_STATS: 'cache:getStats',
  CACHE_CLEAN: 'cache:clean',

  // Non-Destructive Edits
  PHOTO_GET_EDITS: 'photo:getEdits',
  PHOTO_SAVE_EDITS: 'photo:saveEdits',
  PHOTO_RESET_EDITS: 'photo:resetEdits',

  // Real Image Analysis Engine (Stage 4)
  AI_ANALYZE_PHOTO: 'ai:analyzePhoto',
  AI_GET_ANALYSIS: 'ai:getAnalysis',

  // Presets & Batch Processing (Stage 7)
  PRESET_LIST: 'preset:list',
  PRESET_GET: 'preset:get',
  PRESET_SAVE: 'preset:save',
  PRESET_DELETE: 'preset:delete',
  PRESET_APPLY: 'preset:apply',
  PRESET_APPLY_BATCH: 'preset:applyBatch',
  BATCH_APPLY_AI_CORRECTIONS: 'batch:applyAiCorrections',

  // Worker status
  WORKER_GET_STATUS: 'worker:getStatus'
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
